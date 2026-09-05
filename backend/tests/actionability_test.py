import asyncio
import sys
import os
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, init_db
from app.models.database import ReconciliationRun, Match, Transaction
from app.services.reporting.actionability import ExceptionActionabilityService

async def test_actionability():
    print("--- Testing Actionable Intelligence Logic ---")
    init_db()
    db = SessionLocal()
    
    # 1. Create a run with a high-value merchant variation
    run = ReconciliationRun(status="COMPLETED", total_bank_records=10)
    db.add(run); db.commit(); db.refresh(run)
    
    # High value item
    btx = Transaction(run_id=run.id, source="BANK", original_date="2026-01-01", original_description="Amazon Mktp", amount=60000.0)
    db.add(btx); db.commit()
    
    match = Match(
        run_id=run.id, 
        bank_transaction_id=btx.id, 
        ledger_transaction_id=999, 
        status='POSSIBLE_MATCH', 
        confidence=0.8,
        matching_signals={'amount_match': True, 'merchant_match': 'partial', 'date_match': 'exact'},
        explanation=""
    )
    db.add(match); db.commit()
    
    # 2. Get actionability
    result = ExceptionActionabilityService.get_run_actionability(db, run.id)
    
    print(f"Total Actions: {result['summary']['total_actions']}")
    print(f"High Priority Actions: {result['summary']['high_priority_count']}")
    
    assert result['summary']['total_actions'] >= 1
    assert result['summary']['high_priority_count'] == 1
    
    top_action = result['actions'][0]
    print(f"Top Action: {top_action['title']} - Priority: {top_action['priority']}")
    assert top_action['priority'] == "HIGH"
    assert top_action['pattern_type'] == "MERCHANT_VARIATION"
    assert "Standardize Data Mapping" in top_action['title']
    
    print("PASS: Actionability classification and prioritization verified.")
    db.close()

if __name__ == "__main__":
    asyncio.run(test_actionability())
