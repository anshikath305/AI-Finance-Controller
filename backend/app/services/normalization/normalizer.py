import pandas as pd
import re
from datetime import datetime
from typing import Optional, Any

class DataNormalizer:
    @staticmethod
    def normalize_date(date_val: Any) -> Optional[datetime]:
        if pd.isna(date_val): return None
        try: return pd.to_datetime(date_val)
        except: return None

    @staticmethod
    def normalize_amount(amount_val: Any) -> float:
        if pd.isna(amount_val): return 0.0
        if isinstance(amount_val, (int, float)): return float(amount_val)
        clean_val = re.sub(r'[^\d.-]', '', str(amount_val))
        try: return float(clean_val)
        except: return 0.0

    @staticmethod
    def normalize_text(text: Any) -> str:
        if pd.isna(text): return ""
        text = str(text).lower()
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        return re.sub(r'\s+', ' ', text).strip()

    @staticmethod
    def normalize_merchant(description: str) -> str:
        text = DataNormalizer.normalize_text(description)
        # Remove common noise, corporate suffixes, and common locations
        noise = {
            'pvt', 'ltd', 'inc', 'corp', 'co', 'llp', 'limited', 'private',
            'cupertino', 'mountain view', 'bangalore', 'mumbai', 'delhi', 'gurgaon',
            'india', 'usa', 'com', 'bill', 'pos', 'purchase', 'order', 'trip'
        }
        words = text.split()
        return " ".join([w for w in words if w not in noise])

    def normalize_dataframe(self, df: pd.DataFrame, mapping: dict) -> pd.DataFrame:
        ndf = df.copy()
        if 'date' in mapping: ndf['norm_date'] = ndf[mapping['date']].apply(self.normalize_date)
        if 'amount' in mapping: ndf['norm_amount'] = ndf[mapping['amount']].apply(self.normalize_amount)
        if 'description' in mapping:
            ndf['norm_description'] = ndf[mapping['description']].apply(self.normalize_text)
            ndf['norm_merchant'] = ndf[mapping['description']].apply(self.normalize_merchant)
        if 'id' in mapping: ndf['norm_id'] = ndf[mapping['id']].apply(str).str.strip().str.lower()
        return ndf
