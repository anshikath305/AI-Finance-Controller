import pandas as pd
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.evaluation.evaluator import ReconciliationEvaluator

def test_evaluator_logic():
    evaluator = ReconciliationEvaluator()

    # Ground Truth: A->X, B->Y, C->None
    gt = pd.DataFrame([
        {'bank_tx': 'A', 'ledger_tx': 'X'},
        {'bank_tx': 'B', 'ledger_tx': 'Y'},
        {'bank_tx': 'C', 'ledger_tx': None},
    ])

    # Predictions: A->X (Correct), B->None (FN), C->Y (Incorrect FP)
    # Mapping indices back to IDs
    bank_df = pd.DataFrame([{'bank_id': 'A'}, {'bank_id': 'B'}, {'bank_id': 'C'}])
    ledger_df = pd.DataFrame([{'ledger_id': 'X'}, {'ledger_id': 'Y'}])

    predictions = [
        {'bank_index': 0, 'ledger_index': 0, 'status': 'MATCHED', 'confidence': 1.0, 'signals': {}}, # A->X
        {'bank_index': 1, 'ledger_index': None, 'status': 'UNRESOLVED', 'confidence': 0, 'signals': {}}, # B->None
        {'bank_index': 2, 'ledger_index': 1, 'status': 'MATCHED', 'confidence': 0.9, 'signals': {}}, # C->Y
    ]

    results = evaluator.evaluate(predictions, gt, bank_df, ledger_df)
    ov = results['overall']

    print("--- Evaluator Logic Test ---")
    print(f"TP: {ov['tp']} (Expected: 1)")
    print(f"FP: {ov['fp']} (Expected: 1)")
    print(f"FN: {ov['fn']} (Expected: 1)")
    print(f"Precision: {ov['precision']} (Expected: 0.5)")
    print(f"Recall: {ov['recall']} (Expected: 0.5)")

    assert ov['tp'] == 1
    assert ov['fp'] == 1
    assert ov['fn'] == 1
    print("PASS")

if __name__ == "__main__":
    test_evaluator_logic()
