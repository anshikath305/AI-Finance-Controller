from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import ReconciliationRun, Match, ExceptionRecord, Transaction, ReviewDecision
from typing import Dict, Any, List

class DashboardService:
    @staticmethod
    def get_summary_metrics(db: Session, run_id: int) -> Dict[str, Any]:
        run = db.query(ReconciliationRun).filter(ReconciliationRun.id == run_id).first()
        if not run: return {}

        matches = db.query(Match).filter(Match.run_id == run_id).all()
        reviewed_match_ids = {d.match_id for d in db.query(ReviewDecision.match_id).join(Match).filter(Match.run_id == run_id).all()}

        total_matches = len([m for m in matches if m.status == 'MATCHED'])
        review_required = [m for m in matches if m.status in ['POSSIBLE_MATCH', 'UNRESOLVED'] and m.id not in reviewed_match_ids]
        review_required_count = len(review_required)
        
        exceptions_count = db.query(ExceptionRecord).filter(ExceptionRecord.run_id == run_id).count()
        
        match_rate = (total_matches / run.total_bank_records * 100) if run.total_bank_records > 0 else 0
        review_rate = (review_required_count / run.total_bank_records * 100) if run.total_bank_records > 0 else 0

        # Financial Metrics
        bank_sum = db.query(func.sum(Transaction.amount)).filter(Transaction.run_id == run_id, Transaction.source == 'BANK').scalar() or 0.0
        ledger_sum = db.query(func.sum(Transaction.amount)).filter(Transaction.run_id == run_id, Transaction.source == 'LEDGER').scalar() or 0.0
        
        reconciled_total = db.query(func.sum(Transaction.amount))\
            .join(Match, Transaction.id == Match.bank_transaction_id)\
            .filter(Match.run_id == run_id, Match.status == 'MATCHED')\
            .scalar() or 0.0

        # Automation Impact
        auto_matches = len([m for m in matches if m.status == 'MATCHED' and (m.confidence or 0) >= 0.95 and not (m.matching_signals or {}).get('ai_evidence')])
        ai_matches = len([m for m in matches if m.status == 'MATCHED' and (m.matching_signals or {}).get('ai_evidence')])

        return {
            "metadata": {
                "run_id": run_id,
                "status": run.status,
                "created_at": run.created_at.isoformat() if run.created_at else None,
                "policy_config": run.policy_config
            },
            "operational": {
                "total_bank_records": run.total_bank_records,
                "total_ledger_records": run.total_ledger_records,
                "matched": total_matches,
                "possible_matches": review_required_count, 
                "unresolved": len([m for m in matches if m.status == 'UNRESOLVED']),
                "exceptions": exceptions_count,
                "match_rate": round(float(match_rate), 2),
                "review_rate": round(float(review_rate), 2)
            },
            "financial": {
                "total_bank_amount": round(float(bank_sum), 2),
                "total_ledger_amount": round(float(ledger_sum), 2),
                "reconciled_amount": round(float(reconciled_total), 2),
                "unreconciled_bank_amount": round(float(bank_sum - reconciled_total), 2),
                "unreconciled_ledger_amount": round(float(ledger_sum - reconciled_total), 2), # Assumes 1-to-1 exact amount
                "discrepancy_amount": round(float(bank_sum - reconciled_total), 2)
            },
            "automation": {
                "auto_resolved_count": auto_matches,
                "ai_assisted_count": ai_matches,
                "manual_review_required": review_required_count
            }
        }

    @staticmethod
    def get_run_history(db: Session) -> List[Dict[str, Any]]:
        runs = db.query(ReconciliationRun).order_by(ReconciliationRun.created_at.desc()).all()
        history = []
        
        for run in runs:
            # We want key metrics for the list view. 
            # To avoid N+1 transaction sums, we could optimize this, but for the MVP 
            # history list, let's use what we have or do efficient counts.
            
            # Canonical pending review logic
            reviewed_match_ids = {d.match_id for d in db.query(ReviewDecision.match_id).join(Match).filter(Match.run_id == run.id).all()}
            pending_review = db.query(Match).filter(
                Match.run_id == run.id,
                Match.status.in_(['POSSIBLE_MATCH', 'UNRESOLVED'])
            ).all()
            pending_count = len([m for m in pending_review if m.id not in reviewed_match_ids])
            
            # Financials (Efficient scalar queries)
            bank_sum = db.query(func.sum(Transaction.amount)).filter(Transaction.run_id == run.id, Transaction.source == 'BANK').scalar() or 0.0
            reconciled_total = db.query(func.sum(Transaction.amount))\
                .join(Match, Transaction.id == Match.bank_transaction_id)\
                .filter(Match.run_id == run.id, Match.status == 'MATCHED')\
                .scalar() or 0.0
                
            history.append({
                "id": run.id,
                "created_at": run.created_at,
                "status": run.status,
                "bank_count": run.total_bank_records,
                "ledger_count": run.total_ledger_records,
                "matched_count": run.matched_records,
                "match_rate": round((run.matched_records / run.total_bank_records * 100), 2) if run.total_bank_records > 0 else 0,
                "reconciled_amount": round(float(reconciled_total), 2),
                "unreconciled_amount": round(float(bank_sum - reconciled_total), 2),
                "pending_review": pending_count,
                "exception_count": db.query(ExceptionRecord).filter(ExceptionRecord.run_id == run.id).count(),
                "policy_config": run.policy_config
            })
            
        return history
