import asyncio
import sys
import os
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, init_db
from app.models.database import ReconciliationRun, Match, Transaction
from app.services.reporting.dashboard import DashboardService

async def test_run_history():
    print("--- Testing Run History Logic ---")
    init_db()
    db = SessionLocal()
    
    # 1. Create multiple runs
    r1 = ReconciliationRun(status="COMPLETED", total_bank_records=10, matched_records=8)
    r2 = ReconciliationRun(status="COMPLETED", total_bank_records=5, matched_records=2)
    db.add_all([r1, r2]); db.commit()
    
    # 2. Add some transactions for r2
    t1 = Transaction(run_id=r2.id, source="BANK", original_date="2026-01-01", original_description="Test", amount=100.0)
    db.add(t1); db.commit()
    
    # 3. Retrieve history
    history = DashboardService.get_run_history(db)
    
    print(f"Total runs in history: {len(history)}")
    assert len(history) >= 2
    
    # 4. Check ordering (should be descending by created_at)
    print(f"Run 1 ID: {history[0]['id']}, Run 2 ID: {history[1]['id']}")
    assert history[0]['id'] == r2.id
    
    # 5. Check isolation (basic check that r2 metrics don't leak into r1 summary in history list)
    # This is handled by the run_id filter in scalar queries.
    r2_item = next(h for h in history if h['id'] == r2.id)
    print(f"Run 2 bank_count: {r2_item['bank_count']}")
    assert r2_item['bank_count'] == 5
    
    print("PASS: Run history retrieval and summary metrics verified.")
    db.close()

if __name__ == "__main__":
    asyncio.run(test_run_history())
