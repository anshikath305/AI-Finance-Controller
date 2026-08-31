import asyncio
import sys
import os
import pandas as pd
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, init_db
from app.services.ai.copilot import ReconciliationCopilot
from app.services.reconciliation.orchestrator import ReconciliationOrchestrator
from data.synthetic_generator import SyntheticGenerator

async def test_copilot_grounding():
    # 1. Setup Data
    gen = SyntheticGenerator()
    init_db()
    db = SessionLocal()

    # Create a small run
    bank_p, ledger_p, _ = gen.generate(10, "EASY", "copilot_test")
    bank_df = pd.read_csv(bank_p)
    ledger_df = pd.read_csv(ledger_p)

    orchestrator = ReconciliationOrchestrator()
    copilot = ReconciliationCopilot(orchestrator.ai_service)

    # We need a real run_id in the DB for the query layer to work
    # For test simplicity, let's assume run_id=1 exists or just use the QueryLayer directly
    # Actually, we can just run the real orchestrator through the API if we had a server
    # But let's mock the run_id in the DB
    from app.models.database import ReconciliationRun, Transaction, Match
    run = ReconciliationRun(status="COMPLETED", total_bank_records=10)
    db.add(run)
    db.commit()
    db.refresh(run)

    # Run reconciliation (this part is usually in the endpoint)
    # Mapping
    mapping = {'bank': {'date': 'date', 'amount': 'amount', 'description': 'desc', 'id': 'bank_id'},
               'ledger': {'date': 'date', 'amount': 'amount', 'description': 'desc', 'id': 'id'}}
    results = await orchestrator.run_reconciliation(bank_df, ledger_df, mapping)

    # Manually save to DB for grounding test
    for idx, res in enumerate(results):
        tx = Transaction(run_id=run.id, source="BANK", original_description=bank_df.iloc[res['bank_index']]['desc'], amount=bank_df.iloc[res['bank_index']]['amount'])
        db.add(tx)
        db.flush()
        match = Match(run_id=run.id, bank_transaction_id=tx.id, status=res['status'], confidence=res['confidence'], explanation=res['explanation'])
        db.add(match)
    db.commit()

    print("--- Running Copilot Grounding Tests ---")

    # Test 1: Summary
    q1 = "Give me a summary of this run"
    res1 = await copilot.answer_query(q1, run.id, db)
    print(f"Q: {q1}")
    print(f"Intent: {res1['intent']}")
    print(f"Answer: {res1['answer']}")
    assert "10" in str(res1['facts'].get('total_bank'))

    # Test 2: Hallucination (GST)
    q2 = "What is the total GST amount?"
    res2 = await copilot.answer_query(q2, run.id, db)
    print(f"\nQ: {q2}")
    # Since we have no GST fact, it should fallback or say don't know
    print(f"Answer: {res2['answer']}")

    db.close()

if __name__ == "__main__":
    asyncio.run(test_copilot_grounding())
