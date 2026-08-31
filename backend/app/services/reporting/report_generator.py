from sqlalchemy.orm import Session
from app.models.database import ReconciliationRun, Match, Transaction, ExceptionRecord
from typing import Dict, Any

class ReportGenerator:
    @staticmethod
    def sanitize_for_csv(value: Any) -> Any:
        """
        Prevent CSV Formula Injection by prefixing values starting with dangerous characters.
        """
        if isinstance(value, str) and value and value[0] in ['=', '+', '-', '@']:
            return "'" + value
        return value

    @staticmethod
    def generate_summary(db: Session, run_id: int) -> Dict[str, Any]:
        run = db.query(ReconciliationRun).filter(ReconciliationRun.id == run_id).first()
        if not run: return {}

        matches = db.query(Match).filter(Match.run_id == run_id).all()
        exceptions = db.query(ExceptionRecord).filter(ExceptionRecord.run_id == run_id).all()

        bank_txs = db.query(Transaction).filter(Transaction.run_id == run_id, Transaction.source == 'BANK').all()
        ledger_txs = db.query(Transaction).filter(Transaction.run_id == run_id, Transaction.source == 'LEDGER').all()

        bank_total = sum([tx.amount for tx in bank_txs])
        ledger_total = sum([tx.amount for tx in ledger_txs])

        reconciled_amt = sum([db.query(Transaction.amount).filter(Transaction.id == m.bank_transaction_id).scalar() or 0 for m in matches if m.status == 'MATCHED'])

        # Detailed breakdown
        auto_matches = [m for m in matches if m.status == 'MATCHED' and (m.confidence or 0) >= 0.95 and not (m.matching_signals or {}).get('ai_evidence')]
        ai_matches = [m for m in matches if m.status == 'MATCHED' and (m.matching_signals or {}).get('ai_evidence')]
        human_matches = [m for m in matches if m.status == 'MATCHED' and (m.confidence or 0) == 1.0 and (m.matching_signals or {}).get('human_review')]

        return {
            "metadata": {
                "run_id": run_id,
                "status": run.status,
                "created_at": run.created_at.isoformat() if run.created_at else None,
                "processing_time": run.processing_time
            },
            "counts": {
                "total_bank": run.total_bank_records,
                "total_ledger": run.total_ledger_records,
                "matched": run.matched_records,
                "unresolved": len([m for m in matches if m.status == 'UNRESOLVED']),
                "possible_matches": len([m for m in matches if m.status == 'POSSIBLE_MATCH']),
                "exceptions": len(exceptions)
            },
            "financials": {
                "bank_total": round(float(bank_total), 2),
                "ledger_total": round(float(ledger_total), 2),
                "reconciled_amount": round(float(reconciled_amt), 2),
                "unreconciled_amount": round(float(bank_total - reconciled_amt), 2)
            },
            "provenance": {
                "deterministic": len(auto_matches),
                "ai_assisted": len(ai_matches),
                "human_reviewed": len(human_matches)
            }
        }
