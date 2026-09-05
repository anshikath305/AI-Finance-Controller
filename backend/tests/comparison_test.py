import asyncio
import sys
import os
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, init_db
from app.models.database import ReconciliationRun, Match, Transaction
from app.services.reporting.comparison import ComparisonService

async def test_run_comparison():
    print("--- Testing Run Comparison Logic ---")
    init_db()
    db = SessionLocal()
    
    # 1. Create two runs
    # Run 1 (Baseline): 10 records, 5 matched (50%)
    r1 = ReconciliationRun(status="COMPLETED", total_bank_records=10, matched_records=5)
    # Run 2 (Current): 10 records, 8 matched (80%)
    r2 = ReconciliationRun(status="COMPLETED", total_bank_records=10, matched_records=8)
    db.add_all([r1, r2]); db.commit()
    
    # Add transactions and matches for R1
    # We need 5 matches to get 50% match rate (total_bank_records=10)
    for i in range(5):
        btx = Transaction(run_id=r1.id, source="BANK", amount=100.0 * (i+1))
        db.add(btx); db.commit()
        m = Match(run_id=r1.id, bank_transaction_id=btx.id, status='MATCHED', confidence=1.0)
        db.add(m); db.commit()
    
    # Add transactions and matches for R2
    # We need 8 matches to get 80% match rate (total_bank_records=10)
    for i in range(8):
        btx = Transaction(run_id=r2.id, source="BANK", amount=100.0 * (i+1))
        db.add(btx); db.commit()
        m = Match(run_id=r2.id, bank_transaction_id=btx.id, status='MATCHED', confidence=1.0)
        db.add(m); db.commit()
    
    # 2. Compare
    comparison = ComparisonService.compare_runs(db, r2.id, r1.id)
    
    # 3. Assertions
    print(f"Current Run: {comparison['current_run_id']}, Baseline: {comparison['previous_run_id']}")
    assert comparison['current_run_id'] == r2.id
    
    # Match Rate check
    mr = next(m for m in comparison['metrics'] if m['label'] == "Match Rate")
    print(f"Match Rate Baseline: {mr['previous_value']}%, Current: {mr['current_value']}%")
    print(f"Match Rate Change: {mr['change']}pp, Direction: {mr['direction']}")
    
    assert mr['current_value'] == 80.0
    assert mr['previous_value'] == 50.0
    assert mr['change'] == 30.0
    assert mr['direction'] == 'up'
    
    # Summary text check
    print(f"Summary: {comparison['summary_text']}")
    assert any("increased by 30.0" in s for s in comparison['summary_text'])
    
    print("PASS: Comparison logic verified.")
    db.close()

if __name__ == "__main__":
    asyncio.run(test_run_comparison())
