import asyncio
import sys
import os
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, init_db
from app.models.database import ReconciliationRun, Match, Transaction, AuditLog, ReviewDecision
from app.services.audit.audit_service import AuditService

async def test_audit_lifecycle():
    print("--- Testing Audit Lifecycle Traceability ---")
    init_db()
    db = SessionLocal()
    
    # 1. Clear previous logs for this test
    db.query(AuditLog).delete()
    db.commit()
    
    # 2. Simulate Run Lifecycle
    run = ReconciliationRun(status="PENDING", total_bank_records=1)
    db.add(run); db.commit(); db.refresh(run)
    
    AuditService.log_event(db, "RUN_CREATED", "Run initialized.", run_id=run.id)
    AuditService.log_event(db, "FILE_INGESTED", "Files parsed.", run_id=run.id)
    
    # 3. Simulate Match & Review
    btx = Transaction(run_id=run.id, source="BANK", original_date="2026-01-01", amount=100.0)
    db.add(btx); db.commit()
    
    match = Match(run_id=run.id, bank_transaction_id=btx.id, status='POSSIBLE_MATCH', confidence=0.7)
    db.add(match); db.commit(); db.refresh(match)
    
    # 4. Simulate human action
    decision = ReviewDecision(match_id=match.id, user_action='ACCEPT', previous_status='POSSIBLE_MATCH', final_status='MATCHED')
    db.add(decision); db.commit()

    AuditService.log_event(
        db, "REVIEW_ACCEPTED", "Operator accepted match.", 
        actor_type="HUMAN", run_id=run.id, match_id=match.id
    )
    
    # 5. Verify Audit Summary
    audit = AuditService.get_run_audit(db, run.id)
    print(f"Total Events: {audit['summary']['total_events']}")
    assert audit['summary']['total_events'] == 3
    assert audit['summary']['human_actions'] >= 1
    
    # 6. Verify Decision Trace
    trace = AuditService.get_decision_trace(db, match.id)
    print(f"Match Trace ID: {trace['match_id']}")
    assert trace['match_id'] == match.id
    assert len(trace['timeline']) == 1 # Just the review event
    assert trace['timeline'][0].event_type == "REVIEW_ACCEPTED"
    
    print("PASS: Audit trail correctly constructed and isolated.")
    db.close()

if __name__ == "__main__":
    asyncio.run(test_audit_lifecycle())
