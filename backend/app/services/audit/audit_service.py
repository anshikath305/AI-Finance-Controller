from sqlalchemy.orm import Session
from app.models.database import AuditLog, Match, Transaction, ReconciliationRun, ReviewDecision
from app.services.reconciliation.evidence import EvidenceService
from typing import Dict, Any, List, Optional
import datetime

class AuditService:
    @staticmethod
    def log_event(
        db: Session, 
        event_type: str, 
        description: str, 
        actor_type: str = "SYSTEM", 
        run_id: Optional[int] = None, 
        match_id: Optional[int] = None, 
        metadata: Optional[Dict[str, Any]] = None
    ):
        log = AuditLog(
            run_id=run_id,
            match_id=match_id,
            event_type=event_type,
            actor_type=actor_type,
            description=description,
            metadata_json=metadata,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(log)
        db.commit()

    @staticmethod
    def get_run_audit(db: Session, run_id: int) -> Dict[str, Any]:
        # Fetch explicit logs
        logs = db.query(AuditLog).filter(AuditLog.run_id == run_id).order_by(AuditLog.timestamp.asc()).all()
        
        # Derive human actions from ReviewDecision if logs are missing (for backward compatibility)
        human_actions = db.query(ReviewDecision).join(Match).filter(Match.run_id == run_id).count()
        system_actions = len([l for l in logs if l.actor_type == "SYSTEM"])
        
        # Evidence coverage: matches with signals / total matches
        total_matches = db.query(Match).filter(Match.run_id == run_id).count()
        matches_with_evidence = db.query(Match).filter(
            Match.run_id == run_id, 
            Match.matching_signals != None
        ).count()
        
        coverage = (matches_with_evidence / total_matches * 100) if total_matches > 0 else 0.0

        return {
            "run_id": run_id,
            "summary": {
                "total_events": len(logs),
                "human_actions": human_actions,
                "system_actions": system_actions,
                "evidence_coverage": round(coverage, 1)
            },
            "timeline": logs
        }

    @staticmethod
    def get_decision_trace(db: Session, match_id: int) -> Dict[str, Any]:
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match: return {}
        
        run = db.query(ReconciliationRun).filter(ReconciliationRun.id == match.run_id).first()
        btx = db.query(Transaction).filter(Transaction.id == match.bank_transaction_id).first()
        ltx = db.query(Transaction).filter(Transaction.id == match.ledger_transaction_id).first() if match.ledger_transaction_id else None
        
        evidence = EvidenceService.get_match_evidence(db, match.id)
        
        # Fetch specific logs for this match
        logs = db.query(AuditLog).filter(AuditLog.match_id == match_id).order_by(AuditLog.timestamp.asc()).all()

        return {
            "match_id": match_id,
            "status": match.status,
            "confidence": round(match.confidence * 100, 1),
            "method": evidence.get("decision", {}).get("method", "Unknown"),
            "explanation": evidence.get("decision", {}).get("explanation", match.explanation),
            "bank_tx": btx.raw_data if btx else {},
            "ledger_tx": ltx.raw_data if ltx else None,
            "policy": run.policy_config or {},
            "timeline": logs,
            "ai_analysis": evidence.get("ai_interpretation")
        }
