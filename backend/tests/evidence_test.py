import asyncio
import sys
import os
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, init_db
from app.models.database import ReconciliationRun, Match, Transaction
from app.services.reconciliation.evidence import EvidenceService

async def test_evidence_generation():
    print("--- Testing Evidence Service Generation ---")
    init_db()
    db = SessionLocal()
    
    # 1. Create mock data
    run = ReconciliationRun(status="COMPLETED", total_bank_records=2)
    db.add(run); db.commit(); db.refresh(run)
    
    btx = Transaction(run_id=run.id, source="BANK", original_date="2026-09-01", original_description="Amazon Mktp", amount=1200.50)
    ltx = Transaction(run_id=run.id, source="LEDGER", original_date="2026-09-02", original_description="Amazon", amount=1200.50)
    db.add_all([btx, ltx]); db.commit()
    
    match = Match(
        run_id=run.id, 
        bank_transaction_id=btx.id, 
        ledger_transaction_id=ltx.id, 
        status='POSSIBLE_MATCH', 
        confidence=0.85,
        matching_signals={
            'amount_match': True, 
            'merchant_match': 'partial', 
            'date_match': 'near',
            'ai_evidence': {
                'reasoning': 'Descriptions are semantically similar.',
                'relationship': 'Merchant variation',
                'supporting_evidence': ['Pattern AMZN -> Amazon', 'Amount match exact']
            }
        },
        explanation="Possible match."
    )
    db.add(match); db.commit()
    
    # 2. Generate Evidence
    evidence = EvidenceService.get_match_evidence(db, match.id)
    
    # 3. Assertions
    print(f"Match Status: {evidence['decision']['status']}")
    assert evidence['decision']['status'] == 'POSSIBLE_MATCH'
    assert evidence['decision']['method'] == 'AI-Assisted'
    
    # Facts check
    print(f"Facts Count: {len(evidence['facts'])}")
    assert len(evidence['facts']) == 3
    
    # Signals check
    print(f"Signals Count: {len(evidence['signals'])}")
    assert len(evidence['signals']) == 3
    for sig in evidence['signals']:
        if sig['type'] == 'amount': assert sig['status'] == 'aligned'
        if sig['type'] == 'date': assert sig['status'] == 'difference'
        if sig['type'] == 'merchant': assert sig['status'] == 'difference'

    # AI Interpretation
    assert evidence['ai_interpretation']['available'] is True
    assert 'semantically similar' in evidence['ai_interpretation']['reasoning']
    
    print("PASS: Evidence correctly structured.")
    
    # Test Unresolved logic
    match_unres = Match(
        run_id=run.id, 
        bank_transaction_id=btx.id, 
        ledger_transaction_id=None, 
        status='UNRESOLVED', 
        confidence=0,
        matching_signals={},
        explanation="No candidate."
    )
    db.add(match_unres); db.commit()
    
    evidence_unres = EvidenceService.get_match_evidence(db, match_unres.id)
    print(f"Unresolved explanation: {evidence_unres['decision']['explanation']}")
    assert "No suitable ledger counterpart" in evidence_unres['decision']['explanation']
    
    db.close()

if __name__ == "__main__":
    asyncio.run(test_evidence_generation())
