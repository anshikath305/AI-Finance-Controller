import pandas as pd
import numpy as np
import random
import os
from datetime import datetime, timedelta

class SyntheticGenerator:
    def __init__(self):
        self.merchants = [
            ("Amazon Marketplace", "AMZN MKTP IN"),
            ("Uber Technologies", "UBER TRIP HELP.UBER.COM"),
            ("Starbucks Coffee", "STARBUCKS #1234"),
            ("Apple.com/Bill", "APPLE.COM/BILL CUPERTINO"),
            ("Google Cloud", "GOOGLE *CLOUD_12345"),
            ("Reliance Retail", "RELIANCE SMART STORE"),
            ("Zomato", "ZOMATO*ORDER_5678"),
            ("Netflix", "NETFLIX.COM"),
        ]

    def generate(self, n_records=100, difficulty="MIXED", name="default"):
        start_date = datetime(2026, 1, 1)
        ledger_data, bank_data, ground_truth = [], [], []

        count = 0
        while count < n_records:
            tx_id = f"TXN_{name}_{count:04d}"
            merchant_pair = random.choice(self.merchants)
            merchant_name, bank_desc = merchant_pair
            amount = round(random.uniform(10.0, 5000.0), 2)
            date = start_date + timedelta(days=random.randint(0, 30))
            
            if difficulty == "EASY":
                scenario = "exact"
            elif difficulty == "ADVERSARIAL":
                scenario = random.choice(['amount_mismatch', 'duplicate_bank', 'date_trap', 'similar_merchant_trap'])
            else:
                scenario = random.choice(['exact', 'fuzzy_date', 'fuzzy_desc', 'missing_bank', 'missing_ledger', 'amount_mismatch'])

            b_id = f"B_{name}_{count:04d}"

            if scenario == 'exact':
                ledger_data.append({'id': tx_id, 'date': date.strftime('%Y-%m-%d'), 'desc': merchant_name, 'amount': amount})
                bank_data.append({'bank_id': b_id, 'date': date.strftime('%Y-%m-%d'), 'desc': bank_desc, 'amount': amount})
                ground_truth.append({'bank_tx': b_id, 'ledger_tx': tx_id, 'match': True, 'scenario': 'exact'})
                count += 1

            elif scenario == 'fuzzy_date':
                ledger_data.append({'id': tx_id, 'date': date.strftime('%Y-%m-%d'), 'desc': merchant_name, 'amount': amount})
                b_date = date + timedelta(days=random.choice([-2, -1, 1, 2]))
                bank_data.append({'bank_id': b_id, 'date': b_date.strftime('%Y-%m-%d'), 'desc': bank_desc, 'amount': amount})
                ground_truth.append({'bank_tx': b_id, 'ledger_tx': tx_id, 'match': True, 'scenario': 'fuzzy_date'})
                count += 1

            elif scenario == 'fuzzy_desc':
                ledger_data.append({'id': tx_id, 'date': date.strftime('%Y-%m-%d'), 'desc': merchant_name, 'amount': amount})
                f_desc = bank_desc + " " + "".join(random.choices("0123456789", k=5))
                bank_data.append({'bank_id': b_id, 'date': date.strftime('%Y-%m-%d'), 'desc': f_desc, 'amount': amount})
                ground_truth.append({'bank_tx': b_id, 'ledger_tx': tx_id, 'match': True, 'scenario': 'fuzzy_desc'})
                count += 1

            elif scenario == 'amount_mismatch':
                ledger_data.append({'id': tx_id, 'date': date.strftime('%Y-%m-%d'), 'desc': merchant_name, 'amount': amount})
                b_amount = round(amount + 10.0, 2)
                bank_data.append({'bank_id': b_id, 'date': date.strftime('%Y-%m-%d'), 'desc': bank_desc, 'amount': b_amount})
                ground_truth.append({'bank_tx': b_id, 'ledger_tx': tx_id, 'match': False, 'scenario': 'amount_mismatch'})
                count += 1

            elif scenario == 'missing_bank':
                ledger_data.append({'id': tx_id, 'date': date.strftime('%Y-%m-%d'), 'desc': merchant_name, 'amount': amount})
                ground_truth.append({'bank_tx': None, 'ledger_tx': tx_id, 'match': False, 'scenario': 'missing_bank'})
                count += 1

            elif scenario == 'missing_ledger':
                bank_data.append({'bank_id': b_id, 'date': date.strftime('%Y-%m-%d'), 'desc': bank_desc, 'amount': amount})
                ground_truth.append({'bank_tx': b_id, 'ledger_tx': None, 'match': False, 'scenario': 'missing_ledger'})
                count += 1

            elif scenario == 'duplicate_bank':
                ledger_data.append({'id': tx_id, 'date': date.strftime('%Y-%m-%d'), 'desc': merchant_name, 'amount': amount})
                bank_data.append({'bank_id': b_id, 'date': date.strftime('%Y-%m-%d'), 'desc': bank_desc, 'amount': amount})
                b_id_2 = f"{b_id}_dup"
                bank_data.append({'bank_id': b_id_2, 'date': date.strftime('%Y-%m-%d'), 'desc': bank_desc, 'amount': amount})
                ground_truth.append({'bank_tx': b_id, 'ledger_tx': tx_id, 'match': True, 'scenario': 'duplicate'})
                ground_truth.append({'bank_tx': b_id_2, 'ledger_tx': None, 'match': False, 'scenario': 'duplicate'})
                count += 1

            elif scenario == 'date_trap':
                ledger_data.append({'id': tx_id, 'date': date.strftime('%Y-%m-%d'), 'desc': merchant_name, 'amount': amount})
                b_date = date + timedelta(days=10) 
                bank_data.append({'bank_id': b_id, 'date': b_date.strftime('%Y-%m-%d'), 'desc': bank_desc, 'amount': amount})
                ground_truth.append({'bank_tx': b_id, 'ledger_tx': tx_id, 'match': False, 'scenario': 'date_trap'})
                count += 1
            
            elif scenario == 'similar_merchant_trap':
                ledger_data.append({'id': tx_id, 'date': date.strftime('%Y-%m-%d'), 'desc': "Amazon Retail", 'amount': 500.0})
                bank_data.append({'bank_id': b_id, 'date': date.strftime('%Y-%m-%d'), 'desc': "Amazon Prime", 'amount': 1500.0})
                ground_truth.append({'bank_tx': b_id, 'ledger_tx': None, 'match': False, 'scenario': 'similar_merchant_trap'})
                count += 1

        os.makedirs('data/synthetic', exist_ok=True)
        os.makedirs('data/ground_truth', exist_ok=True)
        
        bank_path, ledger_path, gt_path = f'data/synthetic/bank_{name}.csv', f'data/synthetic/ledger_{name}.csv', f'data/ground_truth/gt_{name}.csv'
        pd.DataFrame(ledger_data).to_csv(ledger_path, index=False); pd.DataFrame(bank_data).to_csv(bank_path, index=False); pd.DataFrame(ground_truth).to_csv(gt_path, index=False)
        return bank_path, ledger_path, gt_path

if __name__ == "__main__":
    gen = SyntheticGenerator()
    gen.generate(100, "EASY", "easy")
    gen.generate(200, "MIXED", "medium")
    gen.generate(300, "ADVERSARIAL", "hard")
    print("Benchmark datasets updated.")
