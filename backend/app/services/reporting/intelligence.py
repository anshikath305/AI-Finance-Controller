from sqlalchemy.orm import Session
from app.models.database import Match, Transaction, ExceptionRecord, ReviewDecision, ReconciliationRun
from typing import Dict, Any, List

class ExceptionIntelligenceService:
    @staticmethod
    def get_run_intelligence(db: Session, run_id: int) -> Dict[str, Any]:
        # 1. Fetch all unresolved/reviewable matches
        matches = db.query(Match).filter(
            Match.run_id == run_id,
            Match.status.in_(['POSSIBLE_MATCH', 'UNRESOLVED'])
        ).all()
        
        # Filter for only those not reviewed (canonical state)
        reviewed_ids = {d.match_id for d in db.query(ReviewDecision.match_id).join(Match).filter(Match.run_id == run_id).all()}
        pending_matches = [m for m in matches if m.id not in reviewed_ids]
        
        # 2. Classify into patterns
        # Using a dict to aggregate
        patterns_map = {
            "MERCHANT_VARIATION": {"label": "Merchant Description Variation", "items": [], "total_value": 0.0},
            "DATE_DIFFERENCE": {"label": "Date Difference", "items": [], "total_value": 0.0},
            "AMOUNT_MISMATCH": {"label": "Amount Mismatch", "items": [], "total_value": 0.0},
            "MISSING_COUNTERPART": {"label": "Missing Counterpart", "items": [], "total_value": 0.0},
            "AMBIGUOUS_MATCH": {"label": "Multiple Possible Matches", "items": [], "total_value": 0.0},
            "OTHER": {"label": "Other Reconciliation Reasons", "items": [], "total_value": 0.0}
        }
        
        for m in pending_matches:
            signals = m.matching_signals or {}
            bank_tx = db.query(Transaction).filter(Transaction.id == m.bank_transaction_id).first()
            amt = float(bank_tx.amount) if bank_tx else 0.0
            
            category = "OTHER"
            
            # Classification Logic
            if not m.ledger_transaction_id:
                category = "MISSING_COUNTERPART"
            elif signals.get('amount_match') is False: # Explicit false
                category = "AMOUNT_MISMATCH"
            elif signals.get('merchant_match') in ['partial', 'weak']:
                category = "MERCHANT_VARIATION"
            elif signals.get('date_match') == 'near':
                category = "DATE_DIFFERENCE"
            elif m.status == 'POSSIBLE_MATCH' and signals.get('amount_match') and signals.get('merchant_match') == 'exact':
                # If everything matches but it's still POSSIBLE_MATCH, it might be ambiguity or threshold
                category = "AMBIGUOUS_MATCH"
                
            patterns_map[category]["items"].append(m)
            patterns_map[category]["total_value"] += amt

        # 3. Aggregate results
        result_patterns = []
        total_pending_count = len(pending_matches)
        
        for p_key, p_data in patterns_map.items():
            if not p_data["items"]: continue
            
            count = len(p_data["items"])
            result_patterns.append({
                "type": p_key,
                "label": p_data["label"],
                "case_count": count,
                "total_value": round(p_data["total_value"], 2),
                "workload_percentage": round((count / total_pending_count * 100), 1) if total_pending_count > 0 else 0,
                "explanation": ExceptionIntelligenceService._get_deterministic_explanation(p_key),
                "examples": ExceptionIntelligenceService._get_examples(db, p_data["items"][:3])
            })
            
        # Sort by impact (count)
        result_patterns.sort(key=lambda x: x["case_count"], reverse=True)
        
        total_value = sum([p["total_value"] for p in result_patterns])
        
        return {
            "summary": {
                "total_exceptions": total_pending_count,
                "total_value": round(total_value, 2),
                "pattern_count": len(result_patterns)
            },
            "patterns": result_patterns
        }

    @staticmethod
    def _get_deterministic_explanation(pattern_type: str) -> str:
        explanations = {
            "MERCHANT_VARIATION": "Bank transaction descriptions contain merchant suffixes or processing codes not present in your ledger.",
            "DATE_DIFFERENCE": "Transactions are aligned by amount and merchant, but occur 1-2 days apart due to banking settlement cycles.",
            "AMOUNT_MISMATCH": "System identified a likely candidate based on date and merchant, but the financial amounts do not align.",
            "MISSING_COUNTERPART": "No record with a similar amount or date was found in the corresponding source file.",
            "AMBIGUOUS_MATCH": "Multiple transactions share identical dates and amounts, preventing unique automatic assignment.",
            "OTHER": "Unclassified uncertainty requiring manual inspection of metadata signals."
        }
        return explanations.get(pattern_type, "")

    @staticmethod
    def _get_examples(db: Session, matches: List[Match]) -> List[Dict[str, Any]]:
        examples = []
        for m in matches:
            btx = db.query(Transaction).filter(Transaction.id == m.bank_transaction_id).first()
            ltx = db.query(Transaction).filter(Transaction.id == m.ledger_transaction_id).first() if m.ledger_transaction_id else None
            examples.append({
                "bank_desc": btx.original_description if btx else "Unknown",
                "ledger_desc": ltx.original_description if ltx else None,
                "amount": btx.amount if btx else 0,
                "date": btx.original_date if btx else ""
            })
        return examples
