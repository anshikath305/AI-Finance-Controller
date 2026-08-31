from sqlalchemy.orm import Session
from app.models.database import ReconciliationRun, Match, ExceptionRecord, Transaction
from typing import Dict, Any

class DashboardService:
    @staticmethod
    def get_summary_metrics(db: Session, run_id: int) -> Dict[str, Any]:
        run = db.query(ReconciliationRun).filter(ReconciliationRun.id == run_id).first()
        if not run: return {}

        matches = db.query(Match).filter(Match.run_id == run_id).all()
        exceptions = db.query(ExceptionRecord).filter(ExceptionRecord.run_id == run_id).all()

        # Operational Metrics
        total_matches = len([m for m in matches if m.status == 'MATCHED'])
        # CANONICAL DEFINITION: Review Queue includes both POSSIBLE_MATCH and UNRESOLVED records.
        review_required = [m for m in matches if m.status in ['POSSIBLE_MATCH', 'UNRESOLVED']]
        review_required_count = len(review_required)
        
        exceptions_count = len(exceptions)
        
        match_rate = (total_matches / run.total_bank_records * 100) if run.total_bank_records > 0 else 0
        review_rate = (review_required_count / run.total_bank_records * 100) if run.total_bank_records > 0 else 0

        # Financial Metrics
        bank_total = db.query(Transaction.amount).filter(Transaction.run_id == run_id, Transaction.source == 'BANK').all()
        bank_sum = sum([t[0] for t in bank_total])

        reconciled_total = sum([db.query(Transaction.amount).filter(Transaction.id == m.bank_transaction_id).scalar() or 0 for m in matches if m.status == 'MATCHED'])

        # Automation Impact
        auto_matches = len([m for m in matches if m.status == 'MATCHED' and (m.confidence or 0) >= 0.95 and not (m.matching_signals or {}).get('ai_evidence')])
        ai_matches = len([m for m in matches if m.status == 'MATCHED' and (m.matching_signals or {}).get('ai_evidence')])

        return {
            "operational": {
                "total_bank_records": run.total_bank_records,
                "total_ledger_records": run.total_ledger_records,
                "matched": total_matches,
                "possible_matches": review_required_count, # Unified for frontend
                "unresolved": len([m for m in matches if m.status == 'UNRESOLVED']),
                "exceptions": exceptions_count,
                "match_rate": round(match_rate, 2),
                "review_rate": round(review_rate, 2)
            },
            "financial": {
                "total_bank_amount": round(float(bank_sum), 2),
                "reconciled_amount": round(float(reconciled_total), 2),
                "unreconciled_amount": round(float(bank_sum - reconciled_total), 2),
                "discrepancy_amount": round(float(bank_sum - reconciled_total), 2)
            },
            "automation": {
                "auto_resolved_count": auto_matches,
                "ai_assisted_count": ai_matches,
                "manual_review_required": review_required_count
            }
        }
