from sqlalchemy.orm import Session
from app.models.database import Match, Transaction, ReviewDecision
from typing import Dict, Any, List, Optional
import datetime

class EvidenceService:
    @staticmethod
    def get_match_evidence(db: Session, match_id: int) -> Dict[str, Any]:
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            return {}

        btx = db.query(Transaction).filter(Transaction.id == match.bank_transaction_id).first()
        ltx = db.query(Transaction).filter(Transaction.id == match.ledger_transaction_id).first() if match.ledger_transaction_id else None

        signals = match.matching_signals or {}
        ai_evidence = signals.get('ai_evidence', {})
        
        # 1. Facts
        facts = [
            {"label": "Amount", "bank_value": f"₹{btx.amount:,.2f}", "ledger_value": f"₹{ltx.amount:,.2f}" if ltx else None},
            {"label": "Date", "bank_value": btx.original_date, "ledger_value": ltx.original_date if ltx else None},
            {"label": "Description", "bank_value": btx.original_description, "ledger_value": ltx.original_description if ltx else None}
        ]

        # 2. Deterministic Signals
        evidence_signals = []
        
        # Amount Signal
        amt_status = "aligned" if signals.get('amount_match') else "conflict"
        if not ltx: amt_status = "missing"
        evidence_signals.append({
            "type": "amount",
            "label": "Monetary Value",
            "status": amt_status,
            "message": "Amounts match exactly." if amt_status == "aligned" else "Amount mismatch detected." if amt_status == "conflict" else "No ledger record for amount comparison."
        })

        # Date Signal
        date_match = signals.get('date_match')
        date_status = "aligned" if date_match == 'exact' else "difference" if date_match == 'near' else "conflict"
        if not ltx: date_status = "missing"
        
        date_msg = "Dates are identical."
        if date_match == 'near': date_msg = "Dates differ by 1-2 days (settlement delay)."
        elif date_status == 'conflict': date_msg = "Dates are outside supported tolerance."
        elif date_status == 'missing': date_msg = "No counterpart date to compare."

        evidence_signals.append({
            "type": "date",
            "label": "Transaction Date",
            "status": date_status,
            "message": date_msg
        })

        # Merchant Signal
        merchant_match = signals.get('merchant_match')
        merc_status = "aligned" if merchant_match == 'exact' else "difference" if merchant_match in ['partial', 'weak'] else "conflict"
        if not ltx: merc_status = "missing"
        
        merc_msg = "Merchant descriptions are identical."
        if merchant_match in ['partial', 'weak']: merc_msg = "Merchant descriptions show high semantic similarity."
        elif merc_status == 'conflict': merc_msg = "Merchant descriptions appear unrelated."
        elif merc_status == 'missing': merc_msg = "No counterpart description to compare."

        evidence_signals.append({
            "type": "merchant",
            "label": "Merchant Identity",
            "status": merc_status,
            "message": merc_msg
        })

        # 3. Decision
        method = "Deterministic"
        if ai_evidence: method = "AI-Assisted"
        
        # Check for human review
        review = db.query(ReviewDecision).filter(ReviewDecision.match_id == match_id).first()
        if review: method = f"Human-Reviewed ({review.user_action})"

        decision = {
            "status": match.status,
            "method": method,
            "confidence": round(match.confidence * 100, 0),
            "explanation": EvidenceService._generate_why_not_matched(match, signals) if match.status in ['UNRESOLVED', 'POSSIBLE_MATCH'] else match.explanation
        }

        # 4. AI Interpretation
        ai_interpretation = {
            "available": bool(ai_evidence),
            "reasoning": ai_evidence.get('reasoning'),
            "relationship": ai_evidence.get('relationship'),
            "supporting_evidence": ai_evidence.get('supporting_evidence', [])
        }

        return {
            "match_id": match.id,
            "decision": decision,
            "facts": facts,
            "signals": evidence_signals,
            "ai_interpretation": ai_interpretation
        }

    @staticmethod
    def _generate_why_not_matched(match: Match, signals: Dict[str, Any]) -> str:
        if not match.ledger_transaction_id:
            return "No suitable ledger counterpart was found within the defined date and amount tolerances."
        
        if signals.get('amount_match') is False:
            return "Financial safety constraint: Refused automatic match due to amount discrepancy."
        
        if signals.get('date_match') == 'near' and signals.get('merchant_match') != 'exact':
            return "Multiple acceptable variances (date shift + merchant variation) required human oversight."
            
        if match.status == 'POSSIBLE_MATCH' and match.confidence < 0.85:
            return "Similarity signals were positive but fell below the 100% precision automation threshold."
            
        return "Manual verification recommended to ensure audit trail integrity."
