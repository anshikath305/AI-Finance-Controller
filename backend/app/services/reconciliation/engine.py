import pandas as pd
from typing import List, Dict, Any, Tuple
from datetime import timedelta

class MatchingEngine:
    def __init__(
        self, 
        date_tolerance_days: int = 3, 
        amount_tolerance: float = 0.01,
        match_threshold: float = 0.85,
        review_threshold: float = 0.6
    ):
        self.date_tolerance = timedelta(days=date_tolerance_days)
        self.amount_tolerance = amount_tolerance
        self.MATCH_THRESHOLD = match_threshold
        self.REVIEW_THRESHOLD = review_threshold

    def reconcile(self, bank_df: pd.DataFrame, ledger_df: pd.DataFrame) -> List[Dict[str, Any]]:
        matched_bank_indices = set()
        matched_ledger_indices = set()
        final_matches = {}

        # --- PASS 1: Exact Matches (Deterministic) ---
        for b_idx, b_row in bank_df.iterrows():
            candidates = self.find_candidates(b_row, ledger_df)
            best_pass1 = None
            best_score = 0

            for l_idx, l_row in candidates:
                if l_idx in matched_ledger_indices: continue
                score, signals = self.calculate_score(b_row, l_row)
                if signals.get('amount_match') and signals.get('date_match') == 'exact' and signals.get('merchant_match') == 'exact':
                    if score > best_score:
                        best_score = score
                        best_pass1 = (l_idx, score, signals)

            if best_pass1:
                l_idx, score, signals = best_pass1
                final_matches[b_idx] = {'bank_index': b_idx, 'ledger_index': l_idx, 'status': 'MATCHED', 'confidence': score, 'signals': signals, 'explanation': self.generate_explanation(signals)}
                matched_bank_indices.add(b_idx); matched_ledger_indices.add(l_idx)

        # --- PASS 2: Fuzzy Matches (Rule-based) ---
        remaining_candidates = []
        for b_idx, b_row in bank_df.iterrows():
            if b_idx in matched_bank_indices: continue
            candidates = self.find_candidates(b_row, ledger_df)
            for l_idx, l_row in candidates:
                if l_idx in matched_ledger_indices: continue
                score, signals = self.calculate_score(b_row, l_row)
                if score >= self.REVIEW_THRESHOLD or signals.get('amount_match'):
                    remaining_candidates.append({'bank_index': b_idx, 'ledger_index': l_idx, 'score': score, 'signals': signals})

        remaining_candidates.sort(key=lambda x: x['score'], reverse=True)

        for cand in remaining_candidates:
            b_idx, l_idx = cand['bank_index'], cand['ledger_index']
            if b_idx in matched_bank_indices or l_idx in matched_ledger_indices: continue
            score, signals = cand['score'], cand['signals']

            # Automated match only if amount matches and score is high
            status = 'MATCHED' if (score >= self.MATCH_THRESHOLD and signals.get('amount_match')) else 'POSSIBLE_MATCH'
            if not signals.get('amount_match'):
                status = 'POSSIBLE_MATCH' if score >= self.REVIEW_THRESHOLD else 'UNRESOLVED'

            final_matches[b_idx] = {'bank_index': b_idx, 'ledger_index': l_idx, 'status': status, 'confidence': score, 'signals': signals, 'explanation': self.generate_explanation(signals)}
            matched_bank_indices.add(b_idx); matched_ledger_indices.add(l_idx)

        results = []
        for b_idx in bank_df.index:
            if b_idx in final_matches: results.append(final_matches[b_idx])
            else: results.append({'bank_index': b_idx, 'ledger_index': None, 'status': 'UNRESOLVED', 'confidence': 0, 'signals': {}, 'explanation': 'No candidate found.'})
        return results

    def find_candidates(self, bank_row: pd.Series, ledger_df: pd.DataFrame) -> List[Tuple[int, pd.Series]]:
        if 'norm_date' not in bank_row or pd.isna(bank_row['norm_date']): return []
        b_date = bank_row['norm_date']
        return list(ledger_df[(ledger_df['norm_date'] >= b_date - self.date_tolerance) & (ledger_df['norm_date'] <= b_date + self.date_tolerance)].iterrows())

    def calculate_score(self, bank_row: pd.Series, ledger_row: pd.Series) -> Tuple[float, Dict[str, Any]]:
        signals = {}; score = 0.0
        # Amount (0.6)
        b_amt, l_amt = bank_row.get('norm_amount', 0), ledger_row.get('norm_amount', 0)
        if abs(b_amt - l_amt) <= self.amount_tolerance:
            signals['amount_match'], score = True, 0.6
        else:
            signals['amount_match'], score = False, -1.0
        # Date (0.2)
        b_dt, l_dt = bank_row.get('norm_date'), ledger_row.get('norm_date')
        if b_dt and l_dt:
            diff = abs((b_dt - l_dt).days)
            if diff == 0: signals['date_match'], score = 'exact', score + 0.2
            elif diff <= 2: signals['date_match'], score = 'near', score + 0.1 # Extended to 2 days
        # Merchant (0.2)
        b_m, l_m = str(bank_row.get('norm_merchant', '')), str(ledger_row.get('norm_merchant', ''))
        if b_m and l_m:
            if b_m == l_m: signals['merchant_match'], score = 'exact', score + 0.2
            else:
                bw, lw = set(b_m.split()), set(l_m.split())
                intersect = bw.intersection(lw)
                if intersect:
                    overlap = len(intersect) / max(len(bw), len(lw))
                    if overlap >= 0.5: signals['merchant_match'], score = 'partial', score + 0.15
                    else: signals['merchant_match'], score = 'weak', score + 0.05
                else: signals['merchant_match'] = 'none'
        return max(0.0, round(score, 2)), signals

    def generate_explanation(self, signals: Dict[str, Any]) -> str:
        res = []
        if signals.get('amount_match'): res.append("Amount matches.")
        else: res.append("Amount mismatch.")
        if signals.get('date_match') == 'exact': res.append("Date exact.")
        elif signals.get('date_match') == 'near': res.append("Date near.")
        if signals.get('merchant_match') == 'exact': res.append("Merchant exact.")
        elif signals.get('merchant_match') in ['partial', 'weak']: res.append("Merchant partial.")
        return " ".join(res)
