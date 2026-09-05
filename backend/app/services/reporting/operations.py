from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import ReconciliationRun, Match, Transaction, ReviewDecision, ExceptionRecord
from app.services.reporting.dashboard import DashboardService
from app.services.reporting.intelligence import ExceptionIntelligenceService
from app.services.learning.review_learning import ReviewLearningService
from typing import Dict, Any, List, Optional
import datetime

class OperationsCenterService:
    @staticmethod
    def get_operations_context(db: Session, run_id: Optional[int] = None) -> Dict[str, Any]:
        # 1. Fetch relevant runs
        if run_id:
            active_runs = db.query(ReconciliationRun).filter(ReconciliationRun.id == run_id).all()
        else:
            # Last 5 runs for global overview
            active_runs = db.query(ReconciliationRun).order_by(ReconciliationRun.created_at.desc()).limit(5).all()

        if not active_runs:
            return OperationsCenterService._empty_response()

        run_ids = [r.id for r in active_runs]
        
        # 2. Global Metrics Aggregation
        total_pending = 0
        total_var = 0.0
        total_exceptions = 0
        match_rates = []
        
        for r in active_runs:
            metrics = DashboardService.get_summary_metrics(db, r.id)
            total_pending += metrics["operational"]["possible_matches"]
            total_var += metrics["financial"]["discrepancy_amount"]
            total_exceptions += metrics["operational"]["exceptions"]
            match_rates.append(metrics["operational"]["match_rate"])

        # Latest run for override rate and specific insights
        latest_run = active_runs[0]
        learning = ReviewLearningService.get_review_insights(db, latest_run.id)

        # 3. Work Queue (Prioritized)
        reviewed_ids = {d.match_id for d in db.query(ReviewDecision.match_id).join(Match).filter(Match.run_id.in_(run_ids)).all()}
        
        pending_matches = db.query(Match).filter(
            Match.run_id.in_(run_ids),
            Match.status.in_(['POSSIBLE_MATCH', 'UNRESOLVED'])
        ).all()
        
        queue_items = []
        now = datetime.datetime.utcnow()
        
        for m in pending_matches:
            if m.id in reviewed_ids: continue
            
            btx = db.query(Transaction).filter(Transaction.id == m.bank_transaction_id).first()
            amt = float(btx.amount) if btx else 0.0
            age = (now - m.created_at).days
            
            priority = "LOW"
            if amt > 50000 or m.status == 'UNRESOLVED':
                priority = "HIGH"
            elif amt > 10000 or age > 2:
                priority = "MEDIUM"
                
            queue_items.append({
                "run_id": m.run_id,
                "match_id": m.id,
                "description": btx.original_description if btx else "Unknown",
                "amount": amt,
                "confidence": round(m.confidence * 100, 1),
                "priority": priority,
                "pattern": m.status,
                "age_days": age,
                "evidence_available": bool(m.matching_signals)
            })

        priority_map = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        queue_items.sort(key=lambda x: (priority_map[x["priority"]], -x["amount"]))

        # 4. Next Best Review
        next_best = None
        if queue_items:
            top = queue_items[0]
            m_obj = db.query(Match).filter(Match.id == top["match_id"]).first()
            next_best = {
                "match_id": top["match_id"],
                "run_id": top["run_id"],
                "description": top["description"],
                "amount": top["amount"],
                "reason": "Highest financial exposure in pending queue." if top["priority"] == "HIGH" else "Prioritized for review based on age and uncertainty.",
                "confidence": top["confidence"],
                "evidence_summary": m_obj.explanation.split('.') if m_obj.explanation else []
            }

        # 5. Aging Analysis
        aging = [
            {"label": "< 1 day", "count": 0, "value_at_risk": 0.0},
            {"label": "1-3 days", "count": 0, "value_at_risk": 0.0},
            {"label": "3-7 days", "count": 0, "value_at_risk": 0.0},
            {"label": "7+ days", "count": 0, "value_at_risk": 0.0}
        ]
        
        for item in queue_items:
            idx = 0
            if item["age_days"] >= 7: idx = 3
            elif item["age_days"] >= 3: idx = 2
            elif item["age_days"] >= 1: idx = 1
            
            aging[idx]["count"] += 1
            aging[idx]["value_at_risk"] += item["amount"]

        # 6. Run Health
        recent_health = []
        for r in active_runs:
            m = DashboardService.get_summary_metrics(db, r.id)
            policy = r.policy_config or {}
            recent_health.append({
                "run_id": r.id,
                "match_rate": m["operational"]["match_rate"],
                "review_rate": m["operational"]["review_rate"],
                "exception_rate": round((m["operational"]["exceptions"] / r.total_bank_records * 100), 2) if r.total_bank_records > 0 else 0,
                "value_at_risk": m["financial"]["discrepancy_amount"],
                "policy_profile": policy.get("profile_name", "STANDARD"),
                "trend": "Stable"
            })

        # 7. Recommendations
        recommendations = []
        if total_pending > 10:
            recommendations.append("Review high-value exceptions to reduce immediate Value at Risk.")
        if any(a["count"] > 0 for a in aging[2:]):
            recommendations.append("Address aging unresolved items to maintain audit trail velocity.")
        if learning["summary"]["override_rate"] > 20:
            recommendations.append("High operator override rate detected. Review strictness parameters.")

        return {
            "summary": {
                "total_active_runs": len(active_runs),
                "pending_review_total": total_pending,
                "value_at_risk_total": round(total_var, 2),
                "exception_count_total": total_exceptions,
                "avg_match_rate": round(sum(match_rates)/len(match_rates), 2) if match_rates else 0,
                "override_rate": learning["summary"]["override_rate"]
            },
            "work_queue": queue_items[:15],
            "next_best_review": next_best,
            "aging": aging,
            "recent_runs": recent_health,
            "recommendations": recommendations
        }

    @staticmethod
    def _empty_response():
        return {
            "summary": {"total_active_runs": 0, "pending_review_total": 0, "value_at_risk_total": 0.0, "exception_count_total": 0, "avg_match_rate": 0, "override_rate": 0},
            "work_queue": [],
            "next_best_review": None,
            "aging": [],
            "recent_runs": [],
            "recommendations": []
        }
