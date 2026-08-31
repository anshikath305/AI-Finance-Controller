import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.benchmarking.runner import BenchmarkRunner

async def reproduce():
    runner = BenchmarkRunner()
    benchmark_id = "easy"
    bank = f"data/synthetic/bank_{benchmark_id}.csv"
    ledger = f"data/synthetic/ledger_{benchmark_id}.csv"
    gt = f"data/ground_truth/gt_{benchmark_id}.csv"
    
    print(f"Checking files for {benchmark_id}...")
    print(f"Bank: {os.path.exists(bank)}")
    print(f"Ledger: {os.path.exists(ledger)}")
    print(f"GT: {os.path.exists(gt)}")
    
    try:
        print("Running benchmark...")
        result = await runner.run_benchmark(bank, ledger, gt, benchmark_id)
        print("Success!")
        print(result['evaluation']['overall'])
    except Exception as e:
        print(f"FAILED with error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(reproduce())
