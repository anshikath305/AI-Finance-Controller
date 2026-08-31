import asyncio
import pandas as pd
import sys
import os

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.reconciliation.orchestrator import ReconciliationOrchestrator

async def diagnose_recall():
    orchestrator = ReconciliationOrchestrator()
    b_name = 'medium'
    bank_path = f"data/synthetic/bank_{b_name}.csv"
    ledger_path = f"data/synthetic/ledger_{b_name}.csv"
    gt_path = f"data/ground_truth/gt_{b_name}.csv"

    bank_df = pd.read_csv(bank_path)
    ledger_df = pd.read_csv(ledger_path)
    gt_df = pd.read_csv(gt_path)

    print(f"Match value counts:\n{gt_df['match'].value_counts()}")

    mapping = {
        'bank': {'date': 'date', 'amount': 'amount', 'description': 'desc', 'id': 'bank_id'},
        'ledger': {'date': 'date', 'amount': 'amount', 'description': 'desc', 'id': 'id'}
    }

    results = await orchestrator.run_reconciliation(bank_df, ledger_df, mapping)
    pred_map = {str(bank_df.iloc[r['bank_index']]['bank_id']): r for r in results}

    fn_count = 0
    for _, row in gt_df.iterrows():
        if row['match'] != True and row['match'] != 'True': continue

        b_id = str(row['bank_tx'])
        if b_id == 'nan' or b_id == '': continue # Skip missing bank records

        p = pred_map.get(b_id)
        if not p or p['status'] != 'MATCHED':
            fn_count += 1
            print(f"FN {fn_count}: {b_id} Scenario: {row['scenario']}")

if __name__ == "__main__":
    asyncio.run(diagnose_recall())
