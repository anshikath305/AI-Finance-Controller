import asyncio
import sys
import os
import time
import pandas as pd
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from app.core.database import SessionLocal, init_db
from app.models.database import ReconciliationRun, Match, Transaction
from app.services.reconciliation.orchestrator import ReconciliationOrchestrator
from data.synthetic_generator import SyntheticGenerator

async def run_performance_test(n_records: int):
    print(f"\n--- Testing Performance for {n_records} records ---")
    
    init_db()
    db = SessionLocal()
    gen = SyntheticGenerator()
    orchestrator = ReconciliationOrchestrator()
    
    name = f"perf_{n_records}"
    bank_path, ledger_path, gt_path = gen.generate(n_records, "MIXED", name)
    
    bank_df = pd.read_csv(bank_path)
    ledger_df = pd.read_csv(ledger_path)
    
    mapping = {
        'bank': {'date': 'date', 'amount': 'amount', 'description': 'desc', 'id': 'bank_id'},
        'ledger': {'date': 'date', 'amount': 'amount', 'description': 'desc', 'id': 'id'}
    }
    
    start_time = time.time()
    results = await orchestrator.run_reconciliation(bank_df, ledger_df, mapping)
    reco_time = time.time() - start_time
    
    print(f"Reconciliation Time: {reco_time:.2f}s")
    print(f"Records/Second: {n_records/reco_time:.2f}")
    
    db.close()
    os.remove(bank_path); os.remove(ledger_path); os.remove(gt_path)

if __name__ == "__main__":
    async def main():
        await run_performance_test(1000)
    asyncio.run(main())
