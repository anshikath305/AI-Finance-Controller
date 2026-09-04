import asyncio
import sys
import os
import io
import pandas as pd

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, init_db
from app.models.database import ReconciliationRun, Match, Transaction, ReviewDecision
from app.services.reporting.report_generator import ReportGenerator

async def test_report_generation():
    print("--- Testing Professional Reporting Layer ---")
    init_db()
    db = SessionLocal()
    
    # 1. Setup mock data
    run = ReconciliationRun(status="COMPLETED", total_bank_records=2, matched_records=1)
    db.add(run); db.commit(); db.refresh(run)
    
    # Transactions with potential formula injection
    btx = Transaction(run_id=run.id, source="BANK", original_date="2026-09-01", original_description="=SUM(A1:A10)", amount=5000.00)
    ltx = Transaction(run_id=run.id, source="LEDGER", original_date="2026-09-01", original_description="Ledger Entry", amount=5000.00)
    db.add_all([btx, ltx]); db.commit()
    
    match = Match(
        run_id=run.id, 
        bank_transaction_id=btx.id, 
        ledger_transaction_id=ltx.id, 
        status='MATCHED', 
        confidence=1.0,
        matching_signals={'amount_match': True, 'merchant_match': 'exact', 'date_match': 'exact'},
        explanation="Deterministic match."
    )
    db.add(match); db.commit()

    # 2. Test Executive Summary
    summary = ReportGenerator.generate_summary(db, run.id)
    print(f"Summary total bank: {summary['financials']['bank_total']}")
    assert summary['financials']['bank_total'] == 5000.0
    assert summary['counts']['matched'] == 1
    
    # 3. Test XLSX Generation
    xlsx_stream = ReportGenerator.generate_xlsx(db, run.id)
    assert isinstance(xlsx_stream, io.BytesIO)
    
    # Verify Content & Security
    df_reco = pd.read_excel(xlsx_stream, sheet_name='Detailed Reconciliation')
    desc = df_reco.iloc[0]['Bank Description']
    print(f"Sanitized description: {desc}")
    assert desc.startswith("'"), "Formula injection protection failed in XLSX"
    
    # 4. Test PDF Generation
    pdf_stream = ReportGenerator.generate_pdf(db, run.id)
    assert isinstance(pdf_stream, io.BytesIO)
    assert pdf_stream.getbuffer().nbytes > 0
    
    print("PASS: All reports generated successfully with security protections.")
    db.close()

if __name__ == "__main__":
    asyncio.run(test_report_generation())
