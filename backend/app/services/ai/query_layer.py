from sqlalchemy.orm import Session
from app.models.database import ReconciliationRun, Match, Transaction, ExceptionRecord, AuditLog
from app.services.reconciliation.evidence import EvidenceService
from app.services.reporting.operations import OperationsCenterService
from app.services.audit.audit_service import AuditService
from typing import Dict, Any, List, Optional
from sqlalchemy import desc

class CopilotQueryLayer:
    def __init__(self):
        self.evidence_service = EvidenceService()
        self.ops_service = OperationsCenterService()
        self.audit_service = AuditService()

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

    def get_operations_summary(self, db: Session) -> Dict[str, Any]:
        return self.ops_service.get_operations_context(db)

    def get_audit_summary(self, db: Session, run_id: int) -> Dict[str, Any]:
        return self.audit_service.get_run_audit(db, run_id)

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

    def get_transaction_investigation(self, db: Session, run_id: int, query_text: str) -> Optional[Dict[str, Any]]:
        # Simple search for a transaction by description in the query
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

        return self.evidence_service.get_match_evidence(db, match.id)
