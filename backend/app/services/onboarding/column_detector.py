from typing import Dict, List, Optional
import pandas as pd
import re

class ColumnDetector:
    """
    Deterministic column mapping detector for financial CSVs.
    """
    ALIASES = {
        'amount': ['amount', 'transactionamount', 'txnamount', 'debit', 'credit', 'value', 'total', 'amt'],
        'date': ['date', 'transactiondate', 'txndate', 'posteddate', 'bookingdate', 'dt'],
        'description': ['description', 'merchant', 'narration', 'particulars', 'memo', 'desc', 'remarks']
    }

    @staticmethod
    def detect_mapping(columns: List[str]) -> Dict[str, Optional[str]]:
        mapping = {'amount': None, 'date': None, 'description': None}
        
        # Normalize columns: lowercase, remove spaces, underscores, and dashes
        def normalize(s):
            return re.sub(r'[\s\_\-]', '', s.lower())

        cols_norm = [normalize(c) for c in columns]

        for canonical, aliases in ColumnDetector.ALIASES.items():
            for i, c_norm in enumerate(cols_norm):
                if c_norm in aliases:
                    if mapping[canonical] is None:
                        mapping[canonical] = columns[i]
        
        return mapping

    @staticmethod
    def is_mapping_complete(mapping: Dict[str, Optional[str]]) -> bool:
        return all(v is not None for v in mapping.values())
