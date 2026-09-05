import asyncio
import sys
import os
import pandas as pd
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, init_db
from app.models.database import ReconciliationRun, Transaction
from app.services.onboarding.column_detector import ColumnDetector
from app.services.onboarding.readiness import ReadinessChecker

async def test_column_detection():
    print("--- Testing Column Detection ---")
    cols = ["Transaction Date", "Narration", "Txn Amount", "UTR No."]
    mapping = ColumnDetector.detect_mapping(cols)
    print(f"Detected: {mapping}")
    assert mapping['date'] == "Transaction Date"
    assert mapping['description'] == "Narration"
    assert mapping['amount'] == "Txn Amount"
    assert mapping['id'] == "UTR No."
    assert ColumnDetector.is_mapping_complete(mapping)
    print("PASS: Column detection accurate.")

async def test_readiness_checks():
    print("\n--- Testing Readiness Checks ---")
    df = pd.DataFrame([
        {'date': '2026-01-01', 'desc': 'Test 1', 'amount': '₹1,200.50'},
        {'date': '2026-01-02', 'desc': 'Test 2', 'amount': '2,400.00'},
        {'date': 'INVALID', 'desc': 'Test 3', 'amount': 'XYZ'}
    ])
    mapping = {'amount': 'amount', 'date': 'date', 'description': 'desc'}
    
    res = ReadinessChecker.check_file(df, mapping)
    print(f"Overall Status: {res['status']}")
    
    check_names = [c['name'] for c in res['checks']]
    print(f"Checks performed: {check_names}")
    
    # Expect warnings for invalid date/amount (Indian format should pass for first two)
    assert res['status'] == "READY_WITH_WARNINGS"
    
    temporal_check = next(c for c in res['checks'] if c['name'] == "Temporal Integrity")
    assert temporal_check['status'] == "WARNING"
    
    monetary_check = next(c for c in res['checks'] if c['name'] == "Monetary Integrity")
    assert monetary_check['status'] == "WARNING"
    
    print("PASS: Readiness identified structural and formatting issues.")

async def test_demo_flow_logic():
    print("\n--- Testing Demo Flow Integration ---")
    from app.api.endpoints import get_project_root
    root = get_project_root()
    bank_path = os.path.join(root, "data", "synthetic", "bank_medium.csv")
    
    if os.path.exists(bank_path):
        bank_df = pd.read_csv(bank_path)
        mapping = {'amount': 'amount', 'date': 'date', 'description': 'desc'}
        res = ReadinessChecker.check_file(bank_df, mapping)
        assert res['status'] == "READY"
        print("PASS: Demo data is valid for reconciliation.")

if __name__ == "__main__":
    asyncio.run(test_column_detection())
    asyncio.run(test_readiness_checks())
    asyncio.run(test_demo_flow_logic())
