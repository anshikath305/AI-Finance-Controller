import asyncio
import sys
import os
import pandas as pd
import numpy as np

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.normalization.normalizer import DataNormalizer
from app.services.onboarding.column_detector import ColumnDetector
from app.services.onboarding.readiness import ReadinessChecker

async def test_indian_amount_parsing():
    print("--- Testing Indian Amount Normalization ---")
    n = DataNormalizer()
    assert n.normalize_amount("₹1,25,000.50") == 125000.50
    assert n.normalize_amount("1,25,000") == 125000.0
    assert n.normalize_amount("-₹500.00") == -500.0
    assert n.normalize_amount("   12,34.56  ") == 1234.56
    print("PASS: Indian amounts correctly normalized.")

async def test_robust_column_detection():
    print("\n--- Testing Robust Column Detection ---")
    cols = ["UTR No.", "Value Date", "Transaction Amount", "Remarks"]
    mapping = ColumnDetector.detect_mapping(cols)
    print(f"Detected: {mapping}")
    assert mapping['id'] == "UTR No."
    assert mapping['date'] == "Value Date"
    assert mapping['amount'] == "Transaction Amount"
    assert mapping['description'] == "Remarks"
    print("PASS: Column detection handles finance aliases.")

async def test_dangerous_normalization_collision():
    print("\n--- Testing Normalization Safety (No False Equivalence) ---")
    n = DataNormalizer()
    m1 = n.normalize_merchant("Amazon Fresh")
    m2 = n.normalize_merchant("Amazon Prime")
    print(f"M1: {m1}, M2: {m2}")
    assert m1 != m2, "Amazon Fresh and Prime should remain distinct."
    
    m3 = n.normalize_merchant("Reliance Retail")
    m4 = n.normalize_merchant("Reliance Digital")
    print(f"M3: {m3}, M4: {m4}")
    assert m3 != m4, "Reliance Retail and Digital should remain distinct."
    print("PASS: Normalization preserves distinct brand identities.")

async def test_readiness_blockers():
    print("\n--- Testing Readiness Blockers ---")
    df = pd.DataFrame({'a': [1], 'b': [2]})
    mapping = {'amount': 'amount', 'date': 'date', 'description': 'desc'}
    res = ReadinessChecker.check_file(df, mapping)
    print(f"Status: {res['status']}")
    assert res['status'] == "ACTION_REQUIRED"
    assert any(c['status'] == 'BLOCKED' for c in res['checks'])
    print("PASS: Readiness correctly identifies blocking issues.")

if __name__ == "__main__":
    asyncio.run(test_indian_amount_parsing())
    asyncio.run(test_robust_column_detection())
    asyncio.run(test_dangerous_normalization_collision())
    asyncio.run(test_readiness_blockers())
