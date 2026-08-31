import pandas as pd
from typing import Dict, Any, List, Optional
import numpy as np

class ReconciliationEvaluator:
    @staticmethod
    def evaluate(
        predictions: List[Dict[str, Any]],
        ground_truth: pd.DataFrame,
        bank_df: pd.DataFrame,
        ledger_df: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Evaluate reconciliation results against ground truth.
        """
        # Map indices to IDs for comparison
        pred_map = {} # bank_id -> (ledger_id, status, confidence, signals)
        for p in predictions:
            b_idx = p['bank_index']
            b_id = str(bank_df.iloc[b_idx].get('bank_id', bank_df.iloc[b_idx].get('id')))

            l_id = None
            if p.get('ledger_index') is not None:
                l_idx = p['ledger_index']
                l_id = str(ledger_df.iloc[l_idx].get('ledger_id', ledger_df.iloc[l_idx].get('id')))

            pred_map[b_id] = {
                "ledger_id": l_id if p['status'] == 'MATCHED' else None,
                "status": p['status'],
                "confidence": p.get('confidence', 0),
                "signals": p.get('signals', {})
            }

        tp, fp, tn, fn = 0, 0, 0, 0
        errors = []
        confidence_buckets = {f"{i*10}-{(i+1)*10}%": {"total": 0, "correct": 0} for i in range(10)}
        provenance = {
            "deterministic": {"tp": 0, "fp": 0},
            "ai_assisted": {"tp": 0, "fp": 0},
            "human_reviewed": {"tp": 0, "fp": 0} # Future use
        }

        # Compare with Ground Truth
        for _, row in ground_truth.iterrows():
            b_id = str(row['bank_tx'])
            true_l_id = str(row['ledger_tx']) if not pd.isna(row['ledger_tx']) else None

            p = pred_map.get(b_id)
            if not p: continue

            pred_l_id = p['ledger_id']
            status = p['status']
            conf = p['confidence']
            signals = p['signals']

            # Bucket confidence
            bucket_idx = int(conf * 9.99) if conf < 1.0 else 9
            bucket_key = list(confidence_buckets.keys())[bucket_idx]
            confidence_buckets[bucket_key]["total"] += 1

            # Match Provenance
            prov_key = "ai_assisted" if signals.get('ai_evidence') else "deterministic"

            if true_l_id:
                if pred_l_id == true_l_id:
                    tp += 1
                    confidence_buckets[bucket_key]["correct"] += 1
                    provenance[prov_key]["tp"] += 1
                elif pred_l_id is None:
                    # System failed to match or sent to review
                    fn += 1
                else:
                    # Incorrect match (False Positive)
                    fp += 1
                    provenance[prov_key]["fp"] += 1
                    errors.append({"bank_id": b_id, "pred": pred_l_id, "actual": true_l_id, "type": "incorrect_match", "status": status})
            else:
                if pred_l_id is None:
                    tn += 1
                else:
                    # Matched when should not (False Positive)
                    fp += 1
                    provenance[prov_key]["fp"] += 1
                    errors.append({"bank_id": b_id, "pred": pred_l_id, "actual": None, "type": "ghost_match", "status": status})

        # Calculations
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

        review_count = len([p for p in predictions if p['status'] == 'POSSIBLE_MATCH'])
        review_rate = review_count / len(predictions) if len(predictions) > 0 else 0

        # Confidence Calibration (Precision per bucket)
        for k in confidence_buckets:
            total = confidence_buckets[k]["total"]
            confidence_buckets[k]["precision"] = round(confidence_buckets[k]["correct"] / total, 2) if total > 0 else 0

        return {
            "overall": {
                "precision": round(precision, 4),
                "recall": round(recall, 4),
                "f1_score": round(f1, 4),
                "false_match_rate": round(fp / len(ground_truth), 4),
                "review_rate": round(review_rate, 4),
                "tp": tp, "fp": fp, "tn": tn, "fn": fn
            },
            "provenance": provenance,
            "confidence_calibration": confidence_buckets,
            "error_analysis": errors[:20] # Limit for report
        }
