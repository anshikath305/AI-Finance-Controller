from typing import Dict, List, Optional
import pandas as pd
import re

class ColumnDetector:
    """
    Deterministic column mapping detector for financial CSVs.
    """
    ALIASES = {
        'amount': [
            'amount', 'transactionamount', 'txnamount', 'debit', 'credit', 
            'value', 'total', 'amt', 'transactionvalue', 'amountinr', 'netamount'
        ],
        'date': [
            'date', 'transactiondate', 'txndate', 'posteddate', 'bookingdate', 
            'dt', 'valuedate', 'settlementdate', 'eventdate'
        ],
        'description': [
            'description', 'transactiondescription', 'narration', 'merchant', 
            'merchantname', 'details', 'remarks', 'particulars', 'memo', 
            'desc', 'summary', 'note'
        ],
        'id': [
            'transactionid', 'txnid', 'reference', 'referenceid', 'ref', 
            'utr', 'transactionreference', 'id', 'uuid', 'guid', 'utrno',
            'referenceno', 'referencenumber', 'txnreference'
        ]
    }

    @staticmethod
    def detect_mapping(columns: List[str]) -> Dict[str, Optional[str]]:
        mapping = {'amount': None, 'date': None, 'description': None, 'id': None}
        
        # Normalize columns: lowercase, remove non-alphanumeric characters
        def normalize(s):
            return re.sub(r'[^a-z0-9]', '', str(s).lower())

        cols_norm = [normalize(c) for c in columns]

        # Use a scoring/priority approach for each canonical field
        for canonical in mapping.keys():
            aliases = ColumnDetector.ALIASES.get(canonical, [])
            # Try to find the best match
            for i, c_norm in enumerate(cols_norm):
                if c_norm in aliases:
                    # Prefer exact normalization match
                    if mapping[canonical] is None:
                        mapping[canonical] = columns[i]
                    # If we already have one, but this one is "better" (e.g. shorter or contains canonical name exactly)
                    # For now, just take the first match as per baseline
        
        return mapping

    @staticmethod
    def is_mapping_complete(mapping: Dict[str, Optional[str]]) -> bool:
        # ID is optional for matching but good for audit
        required = ['amount', 'date', 'description']
        return all(mapping.get(k) is not None for k in required)
