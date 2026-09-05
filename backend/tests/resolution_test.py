import asyncio
import sys
import os
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, init_db
from app.models.database import ReconciliationRun, ExceptionRecord, Transaction, Match
from app.services.reconciliation.resolution_service import ResolutionService

async def test_exception_lifecycle():
    print("--- Testing Exception Resolution Lifecycle ---")
    init_db()
    db = SessionLocal()
    
    # 0. Cleanup
    db.query(ExceptionRecord).delete()
    db.query(Match).delete()
    db.query(Transaction).delete()
    db.query(ReconciliationRun).delete()
    db.commit()

    # 1. Create mock exception
    run = ReconciliationRun(status="COMPLETED", total_bank_records=1)
    db.add(run); db.commit(); db.refresh(run)
    
    btx = Transaction(run_id=run.id, source="BANK", original_date="2026-01-01", original_description="Unknown", amount=500.0)
    db.add(btx); db.commit()
    
    exc = ExceptionRecord(
        run_id=run.id, transaction_id=btx.id, type="MISSING_LEDGER", 
        description="No match", severity="MEDIUM", status="OPEN"
    )
    db.add(exc); db.commit(); db.refresh(exc)
    
    # 2. Transition to INVESTIGATING
    updated = ResolutionService.update_exception(db, exc.id, status="INVESTIGATING", owner="Operator Alpha")
    print(f"Status: {updated.status}, Owner: {updated.owner}")
    assert updated.status == "INVESTIGATING"
    assert updated.owner == "Operator Alpha"
    
    # 3. Transition to RESOLVED
    resolved = ResolutionService.update_exception(
        db, exc.id, status="RESOLVED", 
        resolution_type="MISSING_RECORD", 
        resolution_reason="Confirmed as bank charge with no internal record.",
        notes="Audit complete."
    )
    print(f"Status: {resolved.status}, Type: {resolved.resolution_type}")
    assert resolved.status == "RESOLVED"
    assert resolved.resolved_at is not None
    
    # 4. REOPEN
    reopened = ResolutionService.update_exception(db, exc.id, status="OPEN")
    print(f"Status: {reopened.status}, Reopened at: {reopened.reopened_at}")
    assert reopened.status == "OPEN"
    assert reopened.reopened_at is not None
    
    print("PASS: Exception lifecycle and audit triggers verified.")
    db.close()

if __name__ == "__main__":
    asyncio.run(test_exception_lifecycle())
