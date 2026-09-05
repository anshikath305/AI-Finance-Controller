from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import Match, ReviewDecision, Transaction, ReconciliationRun
from typing import Dict, Any, List, Optional
import collections
import json

class ReviewLearningService:
    @staticmethod
    def get_review_insights(db: Session, run_id: int) -> Dict[str, Any]:
        # 1. Fetch all decisions for the current run
        decisions = db.query(ReviewDecision).join(Match).filter(Match.run_id == run_id).all()
        
        if not decisions:
            return {
                "run_id": run_id,
                "summary": {"total_reviewed": 0, "accepted": 0, "rejected": 0, "exceptions": 0, "override_rate": 0.0},
                "confidence_calibration": [],
                "patterns": []
            }

        total = len(decisions)
        accepted = len([d for d in decisions if d.user_action == 'ACCEPT'])
        rejected = len([d for d in decisions if d.user_action == 'REJECT'])
        exceptions = len([d for d in decisions if d.user_action == 'MARK_EXCEPTION'])
        
        overrides = [d for d in decisions if d.user_action in ['REJECT', 'MARK_EXCEPTION']]
        override_rate = round((len(overrides) / total * 100), 1) if total > 0 else 0.0

        # 2. Confidence Calibration
        buckets = collections.defaultdict(lambda: {"total": 0, "accepted": 0})
        for d in decisions:
            match = db.query(Match).filter(Match.id == d.match_id).first()
            if match:
                conf = int(match.confidence * 10) * 10
                key = f"{conf}-{conf+10}%"
                buckets[key]["total"] += 1
                if d.user_action == 'ACCEPT':
                    buckets[key]["accepted"] += 1
        
        calibration = []
        for range_key in sorted(buckets.keys()):
            b = buckets[range_key]
            calibration.append({
                "range": range_key,
                "count": b["total"],
                "acceptance_rate": round((b["accepted"] / b["total"] * 100), 1) if b["total"] > 0 else 0.0
            })

        # 3. Pattern Recognition
        patterns = []
        rejected_matches = [db.query(Match).filter(Match.id == d.match_id).first() for d in decisions if d.user_action == 'REJECT']
        rejected_matches = [m for m in rejected_matches if m]
        
        if rejected_matches:
            signal_counts = collections.Counter()
            for m in rejected_matches:
                sig = m.matching_signals or {}
                if sig.get('merchant_match') in ['partial', 'weak']:
                    signal_counts['merchant_variation_rejected'] += 1
                if sig.get('date_match') == 'near':
                    signal_counts['date_shift_rejected'] += 1
                if sig.get('amount_match') is False:
                    signal_counts['amount_mismatch_rejected'] += 1
            
            for p_type, count in signal_counts.items():
                label = p_type.replace('_', ' ').title()
                patterns.append({
                    "label": label,
                    "count": count,
                    "insight": f"Operators rejected {count} cases matching this profile."
                })

        return {
            "run_id": run_id,
            "summary": {
                "total_reviewed": total,
                "accepted": accepted,
                "rejected": rejected,
                "exceptions": exceptions,
                "override_rate": override_rate
            },
            "confidence_calibration": calibration,
            "patterns": patterns
        }

    @staticmethod
    def get_historical_precedent(db: Session, match_id: int) -> Optional[Dict[str, Any]]:
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match: return None
        
        sig = match.matching_signals or {}
        amt_match = sig.get('amount_match')
        date_match = sig.get('date_match')
        merc_match = sig.get('merchant_match')
        
        # Cross-run analysis
        # Since SQLite JSON querying is tricky across versions, we'll fetch recently reviewed matches 
        # and filter in memory for this phase's analytical requirement.
        recent_decisions = db.query(ReviewDecision).join(Match).all()
        
        similar_decisions = []
        for d in recent_decisions:
            # Get the match associated with the decision
            m = db.query(Match).filter(Match.id == d.match_id).first()
            if not m or m.id == match_id: continue
            
            ms = m.matching_signals or {}
            if (ms.get('amount_match') == amt_match and 
                ms.get('date_match') == date_match and 
                ms.get('merchant_match') == merc_match):
                similar_decisions.append(d)
        
        if not similar_decisions: return None
        
        total = len(similar_decisions)
        accepted = len([d for d in similar_decisions if d.user_action == 'ACCEPT'])
        rate = round((accepted / total * 100), 1)
        
        return {
            "sample_size": total,
            "acceptance_rate": rate,
            "primary_action": "ACCEPT" if rate >= 50 else "REJECT"
        }
