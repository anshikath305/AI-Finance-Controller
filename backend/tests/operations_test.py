import asyncio
import sys
import os
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, init_db
from app.models.database import ReconciliationRun, Match, Transaction, ReviewDecision, ExceptionRecord, AuditLog
from app.services.reporting.operations import OperationsCenterService

async def test_operations_aggregation():
    print("--- Testing Operations Center Aggregation ---")
    init_db()
    db = SessionLocal()
    
    # 0. Precise Cleanup
    db.query(ReviewDecision).delete()
    db.query(AuditLog).delete()
    db.query(ExceptionRecord).delete()
    db.query(Match).delete()
    db.query(Transaction).delete()
    db.query(ReconciliationRun).delete()
    db.commit()
    
    # 1. Create mock data
    import datetime
    run = ReconciliationRun(status="COMPLETED", total_bank_records=10, created_at=datetime.datetime.utcnow())
    db.add(run); db.commit(); db.refresh(run)
    
    btx = Transaction(run_id=run.id, source="BANK", original_date="2026-09-01", original_description="High Value", amount=75000.0)
    db.add(btx); db.commit(); db.refresh(btx)
    
    m = Match(run_id=run.id, bank_transaction_id=btx.id, status='UNRESOLVED', confidence=0.0, created_at=datetime.datetime.utcnow())
    db.add(m); db.commit(); db.refresh(m)
    
    # 2. Get operations context
    ctx = OperationsCenterService.get_operations_context(db, run_id=run.id)
    
    # 3. Assertions
    print(f"Pending Review Total: {ctx['summary']['pending_review_total']}")
    assert ctx['summary']['pending_review_total'] == 1
    assert ctx['summary']['value_at_risk_total'] == 75000.0
    
    # Queue Prioritization check
    print(f"Top Queue Item Priority: {ctx['work_queue'][0]['priority']}")
    assert ctx['work_queue'][0]['priority'] == "HIGH"
    assert ctx['work_queue'][0]['amount'] == 75000.0
    
    # Next Best Review check
    assert ctx['next_best_review']['match_id'] == m.id
    print(f"Next Best Review: {ctx['next_best_review']['description']}")
    
    # Aging check
    assert ctx['aging'][0]['count'] == 1 # < 1 day bucket
    
    print("PASS: Operations Center context correctly synthesized.")
    db.close()

if __name__ == "__main__":
    asyncio.run(test_operations_aggregation())
