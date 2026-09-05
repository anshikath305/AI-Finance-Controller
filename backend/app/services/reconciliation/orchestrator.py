import pandas as pd
import os
import logging
from typing import List, Dict, Any, Optional
from app.services.ingestion.processor import CSVProcessor
from app.services.normalization.normalizer import DataNormalizer
from app.services.reconciliation.engine import MatchingEngine
from app.services.ai.service import AIService

logger = logging.getLogger(__name__)

class ReconciliationOrchestrator:
    def __init__(self):
        self.processor = CSVProcessor()
        self.normalizer = DataNormalizer()
        api_key = os.getenv("OPENAI_API_KEY")
        self.ai_service = AIService(api_key=api_key)

    async def run_reconciliation(
        self, 
        bank_df: pd.DataFrame, 
        ledger_df: pd.DataFrame, 
        mapping: Dict[str, Dict[str, str]],
        date_tolerance: int = 3,
        amount_tolerance: float = 0.01
    ):
        bank_norm = self.normalizer.normalize_dataframe(bank_df, mapping['bank'])
        ledger_norm = self.normalizer.normalize_dataframe(ledger_df, mapping['ledger'])

        # Initialize engine with configured tolerances
        engine = MatchingEngine(date_tolerance_days=date_tolerance, amount_tolerance=amount_tolerance)
        results = engine.reconcile(bank_norm, ledger_norm)

        for res in results:
            if res['status'] in ['POSSIBLE_MATCH', 'UNRESOLVED'] and res.get('ledger_index') is not None:
                b_row = bank_norm.loc[res['bank_index']]
                l_row = ledger_norm.loc[res['ledger_index']]

                # Prepare AI Input
                b_ai = {
                    "date": b_row.get('norm_date'),
                    "amount": b_row.get('norm_amount'),
                    "description": b_row.get('norm_description'),
                    "original_description": b_row.get(mapping['bank'].get('description', ''), '')
                }
                l_ai = {
                    "date": l_row.get('norm_date'),
                    "amount": l_row.get('norm_amount'),
                    "description": l_row.get('norm_description'),
                    "original_description": l_row.get(mapping['ledger'].get('description', ''), '')
                }

                evidence = res.get('signals', {})

                # AI only assists if amount is already aligned (Safety baseline)
                if not evidence.get('amount_match'):
                    continue

                ai_eval = await self.ai_service.evaluate_candidate(b_ai, l_ai, evidence)

                # Add AI evidence to signals
                res['signals']['ai_evidence'] = {
                    "decision": ai_eval['match_recommendation'],
                    "confidence": ai_eval['confidence'],
                    "reasoning": ai_eval['reasoning'],
                    "relationship": ai_eval.get('semantic_relationship'),
                    "supporting_evidence": ai_eval.get('evidence', [])
                }

                if ai_eval['match_recommendation'] == 'MATCH' and ai_eval['confidence'] >= 0.8:
                    res['status'] = 'MATCHED'
                    res['confidence'] = max(res['confidence'], ai_eval['confidence'])
                    res['explanation'] += f" (AI confirmed: {ai_eval['reasoning']})"
        
        return results
