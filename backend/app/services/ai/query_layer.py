from sqlalchemy.orm import Session
from app.models.database import ReconciliationRun, Match, Transaction, ExceptionRecord
from typing import Dict, Any, List, Optional
from sqlalchemy import desc

class CopilotQueryLayer:
    @staticmethod
    def get_run_summary(db: Session, run_id: int) -> Dict[str, Any]:
        run = db.query(ReconciliationRun).filter(ReconciliationRun.id == run_id).first()
        if not run: return {"error": "Run not found"}

        matches = db.query(Match).filter(Match.run_id == run_id).all()
        return {
            "total_bank": run.total_bank_records,
            "total_ledger": run.total_ledger_records,
            "matched": run.matched_records,
            "unresolved": len([m for m in matches if m.status == 'UNRESOLVED']),
            "possible_matches": len([m for m in matches if m.status == 'POSSIBLE_MATCH']),
            "exceptions": len(db.query(ExceptionRecord).filter(ExceptionRecord.run_id == run_id).all())
        }

    @staticmethod
    def get_high_value_unresolved(db: Session, run_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        # Find bank transactions that are unresolved, sorted by amount
        unresolved_bank_ids = db.query(Match.bank_transaction_id).filter(
            Match.run_id == run_id,
            Match.status == 'UNRESOLVED'
        ).all()

        ids = [i[0] for i in unresolved_bank_ids]
        txs = db.query(Transaction).filter(Transaction.id.in_(ids)).order_by(desc(Transaction.amount)).limit(limit).all()

        return [{
            "id": tx.id,
            "date": tx.original_date,
            "description": tx.original_description,
            "amount": tx.amount
        } for tx in txs]

    @staticmethod
    def get_exception_summary(db: Session, run_id: int) -> List[Dict[str, Any]]:
        exceptions = db.query(ExceptionRecord).filter(ExceptionRecord.run_id == run_id).all()
        summary = {}
        for e in exceptions:
            summary[e.type] = summary.get(e.type, 0) + 1
        return [{"type": k, "count": v} for k, v in summary.items()]

    @staticmethod
    def get_transaction_investigation(db: Session, run_id: int, query_text: str) -> Optional[Dict[str, Any]]:
        # Simple search for a transaction by description in the query
        # This is a heuristic for "Why was Amazon not matched?"
        tx = db.query(Transaction).filter(
            Transaction.run_id == run_id,
            Transaction.original_description.ilike(f"%{query_text}%")
        ).first()

        if not tx: return None

        match = db.query(Match).filter(
            Match.run_id == run_id,
            Match.bank_transaction_id == tx.id
        ).first()

        if not match: return {"transaction": tx.original_description, "status": "No match record"}

        ledger_tx = None
        if match.ledger_transaction_id:
            ledger_tx = db.query(Transaction).filter(Transaction.id == match.ledger_transaction_id).first()

        return {
            "bank_tx": {"desc": tx.original_description, "amount": tx.amount, "date": tx.original_date},
            "ledger_tx": {"desc": ledger_tx.original_description, "amount": ledger_tx.amount, "date": ledger_tx.original_date} if ledger_tx else None,
            "status": match.status,
            "confidence": match.confidence,
            "explanation": match.explanation,
            "signals": match.matching_signals
        }
