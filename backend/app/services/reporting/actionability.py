from sqlalchemy.orm import Session
from app.services.reporting.intelligence import ExceptionIntelligenceService
from app.services.reporting.comparison import ComparisonService
from typing import Dict, Any, List, Optional

class ExceptionActionabilityService:
    @staticmethod
    def get_run_actionability(db: Session, run_id: int, baseline_id: Optional[int] = None) -> Dict[str, Any]:
        # 1. Get current intelligence patterns
        intel = ExceptionIntelligenceService.get_run_intelligence(db, run_id)
        if not intel or not intel.get("patterns"):
            return {
                "run_id": run_id,
                "summary": {"total_actions": 0, "high_priority_count": 0, "value_at_risk": 0.0},
                "actions": []
            }

        # 2. Optionally get comparison data
        comparison = None
        if baseline_id:
            comparison = ComparisonService.compare_runs(db, run_id, baseline_id)

        actions = []
        high_priority_count = 0
        total_value_at_risk = intel["summary"]["total_value"]

        # 3. Transform patterns into actionable items
        for pattern in intel["patterns"]:
            p_type = pattern["type"]
            count = pattern["case_count"]
            amount = pattern["total_value"]
            workload = pattern["workload_percentage"]

            # Determine Priority (Deterministic)
            priority = "LOW"
            if amount > 50000 or count > 20 or workload > 30:
                priority = "HIGH"
                high_priority_count += 1
            elif amount > 10000 or count > 5 or workload > 15:
                priority = "MEDIUM"

            # Historical trend if available
            trend_msg = ""
            if comparison:
                matching_exc = next((e for e in comparison["exceptions"] if e["label"] == pattern["label"]), None)
                if matching_exc:
                    change = matching_exc["change"]
                    if change > 0:
                        trend_msg = f" (Increased by {change} from baseline)"
                    elif change < 0:
                        trend_msg = f" (Decreased by {abs(change)} from baseline)"

            # Map to Taxonomy
            action_config = ExceptionActionabilityService._get_action_config(p_type)
            
            actions.append({
                "priority": priority,
                "pattern_type": p_type,
                "title": action_config["title"],
                "insight": f"{pattern['label']} represents {workload}% of your review workload{trend_msg}.",
                "affected_records": count,
                "affected_amount": amount,
                "recommended_action": action_config["recommendation"],
                "reason": f"Detected recurring {pattern['label'].lower()} pattern affecting financial alignment.",
                "evidence": [
                    {"label": "Instances", "value": str(count)},
                    {"label": "Volume", "value": f"₹{amount:,.2f}"},
                    {"label": "Impact", "value": f"{workload}% of queue"}
                ],
                "link_pattern": p_type
            })

        # Sort actions by priority (HIGH first) then amount
        priority_map = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        actions.sort(key=lambda x: (priority_map[x["priority"]], -x["affected_amount"]))

        return {
            "run_id": run_id,
            "summary": {
                "total_actions": len(actions),
                "high_priority_count": high_priority_count,
                "value_at_risk": total_value_at_risk
            },
            "actions": actions
        }

    @staticmethod
    def _get_action_config(pattern_type: str) -> Dict[str, str]:
        configs = {
            "MERCHANT_VARIATION": {
                "title": "Standardize Data Mapping",
                "recommendation": "Review and update merchant normalization aliases to capture recurring variations."
            },
            "DATE_DIFFERENCE": {
                "title": "Check Settlement Windows",
                "recommendation": "Verify bank settlement delays. If consistent, consider increasing matching date tolerance."
            },
            "AMOUNT_MISMATCH": {
                "title": "Investigate Source Accuracy",
                "recommendation": "Compare original source files. Recurring small differences may indicate rounding or tax-inclusive errors."
            },
            "MISSING_COUNTERPART": {
                "title": "Verify File Completeness",
                "recommendation": "Ensure both CSV files cover the exact same date range and all transaction types are exported."
            },
            "AMBIGUOUS_MATCH": {
                "title": "Resolve Data Collisions",
                "recommendation": "Multiple similar records detected. Manual audit required to prevent one-to-many misassignment."
            }
        }
        return configs.get(pattern_type, {
            "title": "Operational Review",
            "recommendation": "Manual investigation required for unclassified exception patterns."
        })
