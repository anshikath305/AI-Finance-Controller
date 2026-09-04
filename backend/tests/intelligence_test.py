import asyncio
import sys
import os
import pandas as pd
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, init_db
from app.models.database import ReconciliationRun, Match, Transaction, ReviewDecision
from app.services.reporting.intelligence import ExceptionIntelligenceService

async def test_intelligence_classification():
    print("--- Testing Exception Intelligence Classification ---")
    init_db()
    db = SessionLocal()
    
    # 1. Create a mock run
    run = ReconciliationRun(status="COMPLETED", total_bank_records=5)
    db.add(run); db.commit(); db.refresh(run)
    
    # 2. Add Transactions
    txs = []
    for i in range(5):
        tx = Transaction(run_id=run.id, source="BANK", original_date="2026-01-01", original_description=f"Bank Tx {i}", amount=100.0 * (i+1))
        db.add(tx); txs.append(tx)
    db.commit()
    
    # 3. Add Matches with different signals
    matches = [
        # Merchant Variation
        Match(run_id=run.id, bank_transaction_id=txs[0].id, ledger_transaction_id=100, status='POSSIBLE_MATCH', 
              confidence=0.7, matching_signals={'amount_match': True, 'merchant_match': 'partial', 'date_match': 'exact'}, explanation=""),
        # Date Difference
        Match(run_id=run.id, bank_transaction_id=txs[1].id, ledger_transaction_id=101, status='POSSIBLE_MATCH', 
              confidence=0.7, matching_signals={'amount_match': True, 'merchant_match': 'exact', 'date_match': 'near'}, explanation=""),
        # Amount Mismatch
        Match(run_id=run.id, bank_transaction_id=txs[2].id, ledger_transaction_id=102, status='POSSIBLE_MATCH', 
              confidence=0.4, matching_signals={'amount_match': False, 'merchant_match': 'exact', 'date_match': 'exact'}, explanation=""),
        # Missing Counterpart
        Match(run_id=run.id, bank_transaction_id=txs[3].id, ledger_transaction_id=None, status='UNRESOLVED', 
              confidence=0.0, matching_signals={}, explanation=""),
        # Ambiguous Match
        Match(run_id=run.id, bank_transaction_id=txs[4].id, ledger_transaction_id=104, status='POSSIBLE_MATCH', 
              confidence=0.9, matching_signals={'amount_match': True, 'merchant_match': 'exact', 'date_match': 'exact'}, explanation=""),
    ]
    db.add_all(matches); db.commit()
    
    # 4. Run Intelligence
    intel = ExceptionIntelligenceService.get_run_intelligence(db, run.id)
    
    print(f"Total Exceptions: {intel['summary']['total_exceptions']}")
    print(f"Patterns Found: {intel['summary']['pattern_count']}")
    
    pattern_types = [p['type'] for p in intel['patterns']]
    print(f"Detected Types: {pattern_types}")
    
    expected_types = ['MERCHANT_VARIATION', 'DATE_DIFFERENCE', 'AMOUNT_MISMATCH', 'MISSING_COUNTERPART', 'AMBIGUOUS_MATCH']
    for t in expected_types:
        assert t in pattern_types, f"Expected pattern {t} not found"
        
    print("PASS: All exception types correctly classified.")
    
    # 5. Verify Already Reviewed Filter
    # Accept one match
    decision = ReviewDecision(match_id=matches[0].id, user_action='ACCEPT', previous_status='POSSIBLE_MATCH', final_status='MATCHED')
    db.add(decision); db.commit()
    
    intel_after = ExceptionIntelligenceService.get_run_intelligence(db, run.id)
    print(f"Exceptions after review: {intel_after['summary']['total_exceptions']}")
    assert intel_after['summary']['total_exceptions'] == 4, "Should have 4 exceptions after 1 review"
    
    print("PASS: Intelligence respects canonical review state.")
    db.close()

if __name__ == "__main__":
    asyncio.run(test_intelligence_classification())
