import pandas as pd
import io
import logging
from typing import List, Dict, Any, Tuple
from fastapi import UploadFile, HTTPException

logger = logging.getLogger(__name__)

class CSVProcessor:
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    MAX_ROWS = 10000

    @staticmethod
    def parse_csv(file: UploadFile) -> pd.DataFrame:
        # Validate file extension
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")

        try:
            content = file.file.read()

            # Resource Exhaustion: Check file size
            if len(content) > CSVProcessor.MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")

            df = pd.read_csv(io.BytesIO(content))

            # Resource Exhaustion: Check row count
            if len(df) > CSVProcessor.MAX_ROWS:
                raise HTTPException(status_code=400, detail=f"File exceeds maximum of {CSVProcessor.MAX_ROWS} rows")

            return df
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error parsing CSV: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid CSV format")

    @staticmethod
    def detect_columns(df: pd.DataFrame) -> Dict[str, str]:
        columns = df.columns.tolist()
        mapping = {}

        date_keywords = ['date', 'time', 'timestamp', 'txn_date']
        amount_keywords = ['amount', 'value', 'debit', 'credit', 'balance', 'price']
        desc_keywords = ['description', 'memo', 'narration', 'particulars', 'payee', 'merchant']
        id_keywords = ['id', 'ref', 'reference', 'transaction_id', 'txn_id']

        for col in columns:
            col_lower = col.lower()
            if any(k in col_lower for k in date_keywords) and 'date' not in mapping:
                mapping['date'] = col
            elif any(k in col_lower for k in amount_keywords) and 'amount' not in mapping:
                mapping['amount'] = col
            elif any(k in col_lower for k in desc_keywords) and 'description' not in mapping:
                mapping['description'] = col
            elif any(k in col_lower for k in id_keywords) and 'id' not in mapping:
                mapping['id'] = col

        return mapping

    @staticmethod
    def validate_structure(df: pd.DataFrame, required_fields: List[str]) -> List[str]:
        missing = [field for field in required_fields if field not in df.columns]
        return missing
