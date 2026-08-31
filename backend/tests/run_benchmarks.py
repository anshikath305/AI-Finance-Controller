import asyncio
import sys
import os
import pandas as pd

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.benchmarking.runner import BenchmarkRunner

async def main():
    runner = BenchmarkRunner()
    benchmarks = ['easy', 'medium', 'hard']

    print(f"{'Benchmark':<10} | {'TP':<4} | {'FP':<4} | {'TN':<4} | {'FN':<4} | {'Prec':<6} | {'Rec':<6} | {'Review':<6}")
    print("-" * 75)

    for b in benchmarks:
        bank = f"data/synthetic/bank_{b}.csv"
        ledger = f"data/synthetic/ledger_{b}.csv"
        gt = f"data/ground_truth/gt_{b}.csv"

        if not os.path.exists(bank): continue

        res = await runner.run_benchmark(bank, ledger, gt, b)
        ov = res['evaluation']['overall']

        print(f"{b:<10} | {ov['tp']:<4} | {ov['fp']:<4} | {ov['tn']:<4} | {ov['fn']:<4} | {ov['precision']:<6} | {ov['recall']:<6} | {ov['review_rate']:<6}")

if __name__ == "__main__":
    asyncio.run(main())
