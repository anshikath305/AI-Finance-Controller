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
        # Ensure bank_df and ledger_df indices are reliable
        # Map indices to IDs for comparison
        pred_map = {} # bank_id -> (ledger_id, status, confidence, signals)
        for p in predictions:
            b_idx = p['bank_index']
            # Safety: use get() and ensure str
            row = bank_df.iloc[b_idx]
            b_id = str(row.get('bank_id', row.get('id', '')))
            
            l_id = None
            if p.get('ledger_index') is not None:
                l_idx = p['ledger_index']
                l_row = ledger_df.iloc[l_idx]
                l_id = str(l_row.get('ledger_id', l_row.get('id', '')))
            
            pred_map[b_id] = {
                "ledger_id": l_id if p['status'] == 'MATCHED' else None,
                "status": p['status'],
                "confidence": float(p.get('confidence', 0)),
                "signals": p.get('signals') or {}
            }

        tp, fp, tn, fn = 0, 0, 0, 0
        errors = []
        confidence_buckets = {f"{i*10}-{(i+1)*10}%": {"total": 0, "correct": 0} for i in range(10)}
        provenance = {
            "deterministic": {"tp": 0, "fp": 0},
            "ai_assisted": {"tp": 0, "fp": 0},
            "human_reviewed": {"tp": 0, "fp": 0}
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
            bucket_idx = int(min(conf, 0.99) * 10)
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
                    fn += 1
                else:
                    fp += 1
                    provenance[prov_key]["fp"] += 1
                    errors.append({"bank_id": b_id, "pred": pred_l_id, "actual": true_l_id, "type": "incorrect_match", "status": status})
            else:
                if pred_l_id is None:
                    tn += 1
                else:
                    fp += 1
                    provenance[prov_key]["fp"] += 1
                    errors.append({"bank_id": b_id, "pred": pred_l_id, "actual": None, "type": "ghost_match", "status": status})

        # Calculations
        total_gt = len(ground_truth)
        precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        f1 = float(2 * (precision * recall) / (precision + recall)) if (precision + recall) > 0 else 0.0
        
        # Operational Rate
        review_count = len([p for p in predictions if p['status'] in ['POSSIBLE_MATCH', 'UNRESOLVED']])
        review_rate = float(review_count / len(predictions)) if len(predictions) > 0 else 0.0
        
        # Confidence Calibration
        for k in confidence_buckets:
            total = confidence_buckets[k]["total"]
            confidence_buckets[k]["precision"] = float(round(confidence_buckets[k]["correct"] / total, 2)) if total > 0 else 0.0

        return {
            "overall": {
                "precision": round(precision, 4),
                "recall": round(recall, 4),
                "f1_score": round(f1, 4),
                "false_match_rate": round(float(fp / total_gt), 4) if total_gt > 0 else 0.0,
                "review_rate": round(review_rate, 4),
                "tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn)
            },
            "provenance": provenance,
            "confidence_calibration": confidence_buckets,
            "error_analysis": errors[:20]
        }
