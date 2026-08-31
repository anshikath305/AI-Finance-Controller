import asyncio
import sys
import os
import pandas as pd
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, init_db
from app.services.reporting.dashboard import DashboardService
from app.models.database import ReconciliationRun, Match, Transaction
from app.services.benchmarking.runner import BenchmarkRunner

async def test_bug_1_state_consistency():
    print("--- Testing Bug 1: Review Queue Consistency ---")
    init_db()
    db = SessionLocal()
    
    # 1. Create a run with 1 MATCHED, 1 POSSIBLE_MATCH, 1 UNRESOLVED
    run = ReconciliationRun(status="COMPLETED", total_bank_records=3)
    db.add(run)
    db.commit()
    db.refresh(run)
    
    m1 = Match(run_id=run.id, bank_transaction_id=1, status="MATCHED", confidence=1.0, explanation="")
    m2 = Match(run_id=run.id, bank_transaction_id=2, status="POSSIBLE_MATCH", confidence=0.8, explanation="")
    m3 = Match(run_id=run.id, bank_transaction_id=3, status="UNRESOLVED", confidence=0.0, explanation="")
    db.add_all([m1, m2, m3])
    db.commit()
    
    # 2. Check metrics via DashboardService
    metrics = DashboardService.get_summary_metrics(db, run.id)
    review_count = metrics['operational']['possible_matches']
    
    print(f"Review Required Count: {review_count}")
    # EXPECTED: 2 (m2 and m3)
    assert review_count == 2, f"Expected 2 review items, got {review_count}"
    print("PASS: Bug 1 metrics are consistent.")
    db.close()

async def test_bug_2_benchmark_paths():
    print("\n--- Testing Bug 2: Benchmark Path Resolution ---")
    # This test verifies if the get_project_root heuristic works in this environment
    from app.api.endpoints import get_project_root
    root = get_project_root()
    print(f"Project Root Detected: {root}")
    
    bank_path = os.path.join(root, "data", "synthetic", "bank_easy.csv")
    print(f"Checking for easy benchmark: {bank_path}")
    if os.path.exists(bank_path):
        print("PASS: Benchmark data found using path resolution.")
    else:
        print("FAIL: Benchmark data still not found.")
        # Try to find where it is
        os.system("find . -name bank_easy.csv")

if __name__ == "__main__":
    asyncio.run(test_bug_1_state_consistency())
    asyncio.run(test_bug_2_benchmark_paths())
