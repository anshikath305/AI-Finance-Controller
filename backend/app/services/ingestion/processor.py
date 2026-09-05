import pandas as pd
import io
import logging
import chardet
from typing import List, Dict, Any, Tuple
from fastapi import UploadFile, HTTPException

logger = logging.getLogger(__name__)

class CSVProcessor:
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    MAX_ROWS = 10000

    @staticmethod
    def parse_file(file: UploadFile) -> pd.DataFrame:
        filename = file.filename.lower()
        
        # Resource Exhaustion: Check file size pre-read if possible
        # However, file.file.read() is needed for content-based detection
        try:
            content = file.file.read()
            if len(content) > CSVProcessor.MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="Financial artifact exceeds 5MB safety limit.")

            if filename.endswith('.csv'):
                return CSVProcessor._parse_csv(content)
            elif filename.endswith('.xlsx') or filename.endswith('.xls'):
                return CSVProcessor._parse_excel(content)
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format. Please provide CSV or Excel.")
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Ingestion Engine Error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Structural analysis failed: {str(e)}")

    @staticmethod
    def _parse_csv(content: bytes) -> pd.DataFrame:
        # Detect encoding
        encoding_result = chardet.detect(content)
        encoding = encoding_result['encoding'] or 'utf-8'
        
        try:
            # Attempt parsing with common delimiters
            for sep in [',', ';', '\t', '|']:
                try:
                    df = pd.read_csv(
                        io.BytesIO(content), 
                        sep=sep, 
                        encoding=encoding,
                        skipinitialspace=True,
                        on_bad_lines='warn'
                    )
                    # If we found at least 2 columns, assume it worked
                    if len(df.columns) >= 2:
                        # Resource Exhaustion: Check row count
                        if len(df) > CSVProcessor.MAX_ROWS:
                            raise HTTPException(status_code=400, detail=f"File exceeds maximum of {CSVProcessor.MAX_ROWS} rows.")
                        
                        # Strip column names
                        df.columns = [str(c).strip() for c in df.columns]
                        return df
                except:
                    continue
            
            # Fallback to default
            df = pd.read_csv(io.BytesIO(content), encoding=encoding)
            if len(df) > CSVProcessor.MAX_ROWS:
                raise HTTPException(status_code=400, detail=f"Dataset exceeds {CSVProcessor.MAX_ROWS} row limit.")
            return df
            
        except Exception as e:
            raise Exception(f"CSV Parsing failure: {str(e)}")

    @staticmethod
    def _parse_excel(content: bytes) -> pd.DataFrame:
        try:
            df = pd.read_excel(io.BytesIO(content), engine='openpyxl')
            if len(df) > CSVProcessor.MAX_ROWS:
                raise HTTPException(status_code=400, detail=f"Excel file exceeds {CSVProcessor.MAX_ROWS} row limit.")
            
            # Clean column names
            df.columns = [str(c).strip() for c in df.columns]
            return df
        except Exception as e:
            raise Exception(f"Excel parsing failure. Ensure valid .xlsx format. Error: {str(e)}")

    @staticmethod
    def detect_columns(df: pd.DataFrame) -> Dict[str, str]:
        # Legacy method kept for backward compatibility if needed, 
        # but ColumnDetector should be preferred.
        from app.services.onboarding.column_detector import ColumnDetector
        return ColumnDetector.detect_mapping(df.columns.tolist())
