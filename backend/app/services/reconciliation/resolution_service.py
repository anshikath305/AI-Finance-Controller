from sqlalchemy.orm import Session
from app.models.database import ExceptionRecord, AuditLog
from app.services.audit.audit_service import AuditService
from typing import Dict, Any, Optional, List
import datetime

class ResolutionService:
    @staticmethod
    def update_exception(
        db: Session, 
        exception_id: int, 
        status: str,
        resolution_type: Optional[str] = None,
        resolution_reason: Optional[str] = None,
        notes: Optional[str] = None,
        owner: Optional[str] = None,
        due_date: Optional[datetime.datetime] = None,
        actor: str = "HUMAN"
    ) -> ExceptionRecord:
        exc = db.query(ExceptionRecord).filter(ExceptionRecord.id == exception_id).first()
        if not exc:
            raise ValueError("Exception not found")

        prev_status = exc.status
        
        # Transitions
        if status == "RESOLVED" and prev_status != "RESOLVED":
            exc.resolved_at = datetime.datetime.utcnow()
            exc.resolved_by = actor
            AuditService.log_event(
                db, "EXCEPTION_RESOLVED", 
                f"Exception #{exception_id} resolved as {resolution_type}.",
                actor_type=actor, run_id=exc.run_id,
                metadata={"resolution_type": resolution_type, "reason": resolution_reason}
            )
        elif status == "OPEN" and prev_status == "RESOLVED":
            exc.reopened_at = datetime.datetime.utcnow()
            AuditService.log_event(
                db, "EXCEPTION_REOPENED", 
                f"Exception #{exception_id} reopened for investigation.",
                actor_type=actor, run_id=exc.run_id
            )
        
        if owner != exc.owner:
             AuditService.log_event(
                db, "EXCEPTION_ASSIGNED", 
                f"Exception #{exception_id} assigned to {owner}.",
                actor_type=actor, run_id=exc.run_id
            )

        # Update fields
        exc.status = status
        exc.resolution_type = resolution_type
        exc.resolution_reason = resolution_reason
        exc.notes = notes
        exc.owner = owner
        exc.due_date = due_date
        
        db.commit()
        db.refresh(exc)
        return exc

    @staticmethod
    def get_run_exceptions(db: Session, run_id: int) -> List[ExceptionRecord]:
        return db.query(ExceptionRecord).filter(ExceptionRecord.run_id == run_id).all()
