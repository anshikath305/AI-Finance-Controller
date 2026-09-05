from sqlalchemy.orm import Session
from app.services.reporting.dashboard import DashboardService
from app.services.reporting.intelligence import ExceptionIntelligenceService
from typing import Dict, Any, List

class ComparisonService:
    @staticmethod
    def compare_runs(db: Session, current_id: int, previous_id: int) -> Dict[str, Any]:
        # 1. Get metrics for both runs
        current_metrics = DashboardService.get_summary_metrics(db, current_id)
        previous_metrics = DashboardService.get_summary_metrics(db, previous_id)
        
        if not current_metrics or not previous_metrics:
            return {}

        # 2. Key KPI Comparison
        metrics_to_compare = [
            ("Match Rate", "operational.match_rate", "percentage_points"),
            ("Reconciled Amount", "financial.reconciled_amount", "currency"),
            ("Value at Risk", "financial.unreconciled_amount", "currency"),
            ("Pending Review", "operational.possible_matches", "absolute"),
            ("Exceptions", "operational.exceptions", "absolute"),
            ("Total Bank Records", "operational.total_bank_records", "absolute")
        ]
        
        compared_metrics = []
        for label, path, unit in metrics_to_compare:
            curr_val = ComparisonService._get_path(current_metrics, path)
            prev_val = ComparisonService._get_path(previous_metrics, path)
            
            change = round(curr_val - prev_val, 2)
            direction = "up" if change > 0 else "down" if change < 0 else "neutral"
            
            compared_metrics.append({
                "label": label,
                "current_value": curr_val,
                "previous_value": prev_val,
                "change": abs(change),
                "direction": direction,
                "unit": unit
            })

        # 3. Exception Intelligence Comparison
        curr_intel = ExceptionIntelligenceService.get_run_intelligence(db, current_id)
        prev_intel = ExceptionIntelligenceService.get_run_intelligence(db, previous_id)
        
        compared_exceptions = []
        
        # Flatten intelligence into a comparable map
        curr_patterns = {p['type']: p for p in curr_intel['patterns']}
        prev_patterns = {p['type']: p for p in prev_intel['patterns']}
        
        all_types = set(curr_patterns.keys()) | set(prev_patterns.keys())
        
        for p_type in all_types:
            c = curr_patterns.get(p_type, {"label": p_type, "case_count": 0, "total_value": 0})
            p = prev_patterns.get(p_type, {"label": p_type, "case_count": 0, "total_value": 0})
            
            label = c.get('label') or p.get('label')
            
            compared_exceptions.append({
                "label": label,
                "current_count": c['case_count'],
                "previous_count": p['case_count'],
                "change": c['case_count'] - p['case_count'],
                "current_value_at_risk": c['total_value'],
                "previous_value_at_risk": p['total_value'],
                "value_change": round(c['total_value'] - p['total_value'], 2)
            })

        # 4. Summary Text (Deterministic)
        summary = []
        
        # Policy Difference Check
        # current_metrics uses ReportGenerator.generate_summary which now includes policy_config
        curr_policy = current_metrics["metadata"].get("policy_config") or {}
        prev_policy = previous_metrics["metadata"].get("policy_config") or {}
        
        if curr_policy.get("profile_name") != prev_policy.get("profile_name"):
            summary.append(f"Policy mismatch: {curr_policy.get('profile_name', 'STANDARD')} vs {prev_policy.get('profile_name', 'STANDARD')}.")
        elif curr_policy.get("date_tolerance") != prev_policy.get("date_tolerance"):
            summary.append("Reconciliation date tolerances differ between runs.")

        # Match rate insight
        mr = next(m for m in compared_metrics if m['label'] == "Match Rate")
        if mr['direction'] == 'up':
            summary.append(f"Match rate increased by {mr['change']} percentage points.")
        elif mr['direction'] == 'down':
            summary.append(f"Match rate decreased by {mr['change']} percentage points.")
            
        # Value at Risk insight
        var = next(m for m in compared_metrics if m['label'] == "Value at Risk")
        if var['direction'] == 'down':
            summary.append(f"Value at Risk decreased by ₹{var['change']:,.2f}.")
        elif var['direction'] == 'up':
            summary.append(f"Value at Risk increased by ₹{var['change']:,.2f}.")

        # Pending review insight
        pr = next(m for m in compared_metrics if m['label'] == "Pending Review")
        if pr['direction'] == 'down':
            summary.append(f"Pending review volume decreased by {int(pr['change'])} cases.")
        elif pr['direction'] == 'up':
            summary.append(f"Pending review volume increased by {int(pr['change'])} cases.")

        return {
            "current_run_id": current_id,
            "previous_run_id": previous_id,
            "metrics": compared_metrics,
            "exceptions": compared_exceptions,
            "summary_text": summary
        }

    @staticmethod
    def _get_path(data: Dict[str, Any], path: str) -> Any:
        parts = path.split('.')
        val = data
        for p in parts:
            val = val.get(p, 0)
        return val
