import pandas as pd
import time
import asyncio
from typing import Dict, Any, List
from app.services.reconciliation.orchestrator import ReconciliationOrchestrator
from app.services.evaluation.evaluator import ReconciliationEvaluator

class BenchmarkRunner:
    def __init__(self):
        self.orchestrator = ReconciliationOrchestrator()
        self.evaluator = ReconciliationEvaluator()

    async def run_benchmark(self, bank_path: str, ledger_path: str, gt_path: str, name: str) -> Dict[str, Any]:
        """
        Run a full reconciliation on a benchmark dataset and evaluate it.
        """
        bank_df = pd.read_csv(bank_path)
        ledger_df = pd.read_csv(ledger_path)
        gt_df = pd.read_csv(gt_path)

        mapping = {
            'bank': {'date': 'date', 'amount': 'amount', 'description': 'desc', 'id': 'bank_id'},
            'ledger': {'date': 'date', 'amount': 'amount', 'description': 'desc', 'id': 'id'}
        }

        start_time = time.time()
        results = await self.orchestrator.run_reconciliation(bank_df, ledger_df, mapping)
        processing_time = time.time() - start_time

        evaluation = self.evaluator.evaluate(results, gt_df, bank_df, ledger_df)

        return {
            "benchmark_name": name,
            "dataset_size": len(bank_df),
            "processing_time": round(processing_time, 2),
            "timestamp": time.time(),
            "evaluation": evaluation
        }

    async def compare_runs(self, run_a: Dict[str, Any], run_b: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compare two benchmark runs to detect regressions.
        """
        metrics = ["precision", "recall", "f1_score", "false_match_rate", "review_rate"]
        diff = {}

        a = run_a["evaluation"]["overall"]
        b = run_b["evaluation"]["overall"]

        for m in metrics:
            val_a = a.get(m, 0)
            val_b = b.get(m, 0)
            diff[m] = {
                "before": val_a,
                "after": val_b,
                "change": round(val_b - val_a, 4),
                "is_regression": (val_b < val_a if m in ["precision", "recall", "f1_score"] else val_b > val_a)
            }

        return diff
