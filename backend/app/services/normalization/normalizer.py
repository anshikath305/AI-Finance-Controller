import pandas as pd
import re
from datetime import datetime
from typing import Optional, Any

class DataNormalizer:
    @staticmethod
    def normalize_date(date_val: Any) -> Optional[datetime]:
        if pd.isna(date_val): return None
        if isinstance(date_val, datetime): return date_val
        
        s = str(date_val).strip()
        try: 
            # Try ISO format first (unambiguous)
            return pd.to_datetime(s, format='%Y-%m-%d', errors='raise')
        except:
            try:
                # Try with dayfirst=True for Indian/UK contexts
                return pd.to_datetime(s, dayfirst=True)
            except: 
                return None

    @staticmethod
    def normalize_amount(amount_val: Any) -> float:
        if pd.isna(amount_val): return 0.0
        if isinstance(amount_val, (int, float)): return float(amount_val)
        
        # Robust Indian number cleanup
        s = str(amount_val)
        # Remove currency symbols and other noise, keep digits, dots, commas, and minus
        s = re.sub(r'[^\d.,-]', '', s)
        
        if not s: return 0.0

        # If there are both commas and dots, commas are likely thousands separators
        if ',' in s and '.' in s:
            s = s.replace(',', '')
        # Multiple commas: e.g. 1,25,000
        elif s.count(',') > 1:
            s = s.replace(',', '')
        # One comma, no dot: e.g. 1,000 or 12,34
        elif ',' in s and '.' not in s:
            # If it's a thousand separator (3 digits follow)
            if re.search(r',\d{3}$', s):
                 s = s.replace(',', '')
            # Otherwise we'll assume dot as decimal for safety in India context
            # unless we want to support European comma decimal
            else:
                 s = s.replace(',', '')
                 
        try: return float(s)
        except: return 0.0

    @staticmethod
    def normalize_text(text: Any) -> str:
        if pd.isna(text): return ""
        text = str(text).lower()
        # Preserve common alphanumeric descriptors but remove special char noise
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        return re.sub(r'\s+', ' ', text).strip()

    @staticmethod
    def normalize_merchant(description: str) -> str:
        text = DataNormalizer.normalize_text(description)
        # Remove common operational noise, corporate suffixes, and common locations
        # but keep fresh, store, retail etc if they are part of brand
        noise = {
            'pvt', 'ltd', 'inc', 'corp', 'co', 'llp', 'limited', 'private',
            'cupertino', 'mountain view', 'bangalore', 'mumbai', 'delhi', 'gurgaon',
            'india', 'usa', 'com', 'bill', 'pos', 'purchase', 'order', 'trip'
        }
        # Note: I removed payment, transfer, imps etc from noise as they might be 
        # the only identifiers in some banking rows.
        
        words = text.split()
        filtered = [w for w in words if w not in noise]
        return " ".join(filtered) if filtered else text

    def normalize_dataframe(self, df: pd.DataFrame, mapping: dict) -> pd.DataFrame:
        ndf = df.copy()
        if 'date' in mapping and mapping['date'] in df.columns: 
            ndf['norm_date'] = ndf[mapping['date']].apply(self.normalize_date)
        if 'amount' in mapping and mapping['amount'] in df.columns: 
            ndf['norm_amount'] = ndf[mapping['amount']].apply(self.normalize_amount)
        if 'description' in mapping and mapping['description'] in df.columns:
            ndf['norm_description'] = ndf[mapping['description']].apply(self.normalize_text)
            ndf['norm_merchant'] = ndf[mapping['description']].apply(self.normalize_merchant)
        if 'id' in mapping and mapping['id'] in df.columns: 
            ndf['norm_id'] = ndf[mapping['id']].apply(str).str.strip().str.lower()
        return ndf
