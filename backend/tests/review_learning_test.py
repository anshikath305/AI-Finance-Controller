import asyncio
import sys
import os
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, init_db
from app.models.database import ReconciliationRun, Match, ReviewDecision, Transaction
from app.services.learning.review_learning import ReviewLearningService

async def test_review_insights():
    print("--- Testing Review Intelligence Insights ---")
    init_db()
    db = SessionLocal()
    
    # 1. Create a run and some reviewed matches
    run = ReconciliationRun(status="COMPLETED", total_bank_records=2)
    db.add(run); db.commit(); db.refresh(run)
    
    btx1 = Transaction(run_id=run.id, source="BANK", original_date="2026-01-01", amount=100.0)
    btx2 = Transaction(run_id=run.id, source="BANK", original_date="2026-01-01", amount=200.0)
    db.add_all([btx1, btx2]); db.commit()
    
    # Match 1: POSSIBLE_MATCH accepted by human
    m1 = Match(run_id=run.id, bank_transaction_id=btx1.id, status='POSSIBLE_MATCH', confidence=0.7, matching_signals={'amount_match': True, 'merchant_match': 'partial'})
    db.add(m1); db.commit(); db.refresh(m1)
    d1 = ReviewDecision(match_id=m1.id, user_action='ACCEPT', previous_status='POSSIBLE_MATCH', final_status='MATCHED')
    db.add(d1); db.commit()
    
    # Match 2: POSSIBLE_MATCH rejected by human
    m2 = Match(run_id=run.id, bank_transaction_id=btx2.id, status='POSSIBLE_MATCH', confidence=0.8, matching_signals={'amount_match': True, 'merchant_match': 'weak'})
    db.add(m2); db.commit(); db.refresh(m2)
    d2 = ReviewDecision(match_id=m2.id, user_action='REJECT', previous_status='POSSIBLE_MATCH', final_status='UNRESOLVED')
    db.add(d2); db.commit()
    
    # 2. Get Insights
    insights = ReviewLearningService.get_review_insights(db, run.id)
    
    print(f"Total Reviewed: {insights['summary']['total_reviewed']}")
    assert insights['summary']['total_reviewed'] == 2
    assert insights['summary']['accepted'] == 1
    assert insights['summary']['rejected'] == 1
    
    # Confidence Calibration check
    print(f"Calibration Buckets: {[b['range'] for b in insights['confidence_calibration']]}")
    assert len(insights['confidence_calibration']) > 0
    
    # Pattern check
    print(f"Detected Patterns: {[p['label'] for p in insights['patterns']]}")
    assert any("Merchant Variation" in p['label'] for p in insights['patterns'])
    
    print("PASS: Review insights correctly aggregated.")
    
    # 3. Test Precedent
    # Create another match in a DIFFERENT run with SAME signals as m1
    run2 = ReconciliationRun(status="PENDING", total_bank_records=1)
    db.add(run2); db.commit(); db.refresh(run2)
    btx3 = Transaction(run_id=run2.id, source="BANK", original_date="2026-01-02", amount=100.0)
    db.add(btx3); db.commit()
    m3 = Match(run_id=run2.id, bank_transaction_id=btx3.id, status='POSSIBLE_MATCH', confidence=0.7, matching_signals={'amount_match': True, 'merchant_match': 'partial'})
    db.add(m3); db.commit(); db.refresh(m3)
    
    precedent = ReviewLearningService.get_historical_precedent(db, m3.id)
    print(f"Precedent Acceptance Rate: {precedent['acceptance_rate']}%")
    print(f"Sample Size: {precedent['sample_size']}")
    assert precedent['acceptance_rate'] == 100.0 # m1 was accepted
    assert precedent['sample_size'] >= 1
    
    print("PASS: Historical precedent identified cross-run.")
    
    db.close()

if __name__ == "__main__":
    asyncio.run(test_review_insights())
