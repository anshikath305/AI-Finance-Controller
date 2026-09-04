import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from datetime import datetime

class ReadinessChecker:
    """
    Analyzes uploaded data for reconciliation readiness.
    """
    
    @staticmethod
    def check_file(df: pd.DataFrame, mapping: Dict[str, str]) -> Dict[str, Any]:
        checks = []
        status = "READY"
        
        # 1. Required Columns
        missing_cols = [c for c, m in mapping.items() if not m or m not in df.columns]
        if missing_cols:
            checks.append({"name": "Required Columns", "status": "BLOCKED", "message": f"Missing columns: {', '.join(missing_cols)}"})
            status = "ACTION_REQUIRED"
        else:
            checks.append({"name": "Required Columns", "status": "PASS", "message": "All required columns identified."})

        if status == "BLOCKED":
            return {"status": status, "checks": checks}

        # 2. Empty Check
        if len(df) == 0:
            checks.append({"name": "File Content", "status": "BLOCKED", "message": "The CSV contains no transaction data."})
            status = "ACTION_REQUIRED"
            return {"status": status, "checks": checks}
        
        # 3. Missing Values in key columns
        null_counts = {}
        for canonical, actual in mapping.items():
            nulls = df[actual].isna().sum()
            if nulls > 0:
                null_counts[canonical] = int(nulls)
        
        if null_counts:
            msg = ", ".join([f"{v} in {k}" for k, v in null_counts.items()])
            checks.append({"name": "Data Integrity", "status": "WARNING", "message": f"Found missing values: {msg}"})
            if status != "ACTION_REQUIRED": status = "READY_WITH_WARNINGS"
        else:
            checks.append({"name": "Data Integrity", "status": "PASS", "message": "No missing values in key columns."})

        # 4. Amount Validity
        try:
            amounts = pd.to_numeric(df[mapping['amount']], errors='coerce')
            invalid_amounts = amounts.isna().sum()
            if invalid_amounts > 0:
                checks.append({"name": "Amount Validity", "status": "WARNING", "message": f"{invalid_amounts} rows have invalid amount formats."})
                if status != "ACTION_REQUIRED": status = "READY_WITH_WARNINGS"
            else:
                checks.append({"name": "Amount Validity", "status": "PASS", "message": "All amounts are valid numeric values."})
        except:
             checks.append({"name": "Amount Validity", "status": "WARNING", "message": "Could not validate amount formats."})

        # 5. Date Validity
        try:
            dates = pd.to_datetime(df[mapping['date']], errors='coerce')
            invalid_dates = dates.isna().sum()
            if invalid_dates > 0:
                checks.append({"name": "Date Validity", "status": "WARNING", "message": f"{invalid_dates} rows have invalid date formats."})
                if status != "ACTION_REQUIRED": status = "READY_WITH_WARNINGS"
            else:
                checks.append({"name": "Date Validity", "status": "PASS", "message": "All dates are valid."})
        except:
            checks.append({"name": "Date Validity", "status": "WARNING", "message": "Could not validate date formats."})

        # 6. Duplicates
        duplicates = df.duplicated().sum()
        if duplicates > 0:
            checks.append({"name": "Duplicates", "status": "WARNING", "message": f"Found {duplicates} identical rows."})
            if status != "ACTION_REQUIRED": status = "READY_WITH_WARNINGS"
        else:
            checks.append({"name": "Duplicates", "status": "PASS", "message": "No duplicate rows detected."})

        # Summary Stats
        stats = {
            "row_count": len(df),
            "date_range": ReadinessChecker._get_date_range(df, mapping['date']),
            "total_amount": ReadinessChecker._get_total_amount(df, mapping['amount'])
        }

        return {
            "status": status,
            "checks": checks,
            "stats": stats
        }

    @staticmethod
    def check_overlap(bank_df: pd.DataFrame, ledger_df: pd.DataFrame, bank_map: Dict[str, str], ledger_map: Dict[str, str]) -> Dict[str, Any]:
        try:
            b_dates = pd.to_datetime(bank_df[bank_map['date']], errors='coerce').dropna()
            l_dates = pd.to_datetime(ledger_df[ledger_map['date']], errors='coerce').dropna()
            
            if b_dates.empty or l_dates.empty:
                return {"status": "WARNING", "message": "Could not determine date range overlap."}
                
            b_min, b_max = b_dates.min(), b_dates.max()
            l_min, l_max = l_dates.min(), l_dates.max()
            
            overlap_start = max(b_min, l_min)
            overlap_end = min(b_max, l_max)
            
            if overlap_start <= overlap_end:
                return {
                    "status": "PASS", 
                    "message": f"Date ranges overlap from {overlap_start.strftime('%Y-%m-%d')} to {overlap_end.strftime('%Y-%m-%d')}."
                }
            else:
                return {
                    "status": "WARNING", 
                    "message": f"No date overlap. Bank: {b_min.strftime('%Y-%m-%d')} - {b_max.strftime('%Y-%m-%d')}, Ledger: {l_min.strftime('%Y-%m-%d')} - {l_max.strftime('%Y-%m-%d')}"
                }
        except:
            return {"status": "WARNING", "message": "Error calculating date overlap."}

    @staticmethod
    def _get_date_range(df: pd.DataFrame, date_col: str) -> str:
        try:
            dates = pd.to_datetime(df[date_col], errors='coerce').dropna()
            if dates.empty: return "Unknown"
            return f"{dates.min().strftime('%d %b')} – {dates.max().strftime('%d %b %Y')}"
        except: return "Unknown"

    @staticmethod
    def _get_total_amount(df: pd.DataFrame, amt_col: str) -> float:
        try:
            return float(pd.to_numeric(df[amt_col], errors='coerce').sum())
        except: return 0.0
