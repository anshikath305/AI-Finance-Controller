import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime

class ReadinessChecker:
    """
    Analyzes uploaded data for reconciliation readiness and quality.
    """
    
    @staticmethod
    def check_file(df: pd.DataFrame, mapping: Dict[str, str]) -> Dict[str, Any]:
        checks = []
        status = "READY"
        
        # 1. Required Columns
        required = ['amount', 'date', 'description']
        missing_cols = [c for c in required if not mapping.get(c) or mapping.get(c) not in df.columns]
        
        if missing_cols:
            checks.append({
                "name": "Required Columns", 
                "status": "BLOCKED", 
                "message": f"Critical fields missing: {', '.join(missing_cols)}. Manual mapping required."
            })
            status = "ACTION_REQUIRED"
        else:
            checks.append({
                "name": "Required Columns", 
                "status": "PASS", 
                "message": "All mandatory reconciliation fields identified."
            })

        if status == "ACTION_REQUIRED":
            return {"status": status, "checks": checks, "stats": ReadinessChecker._get_basic_stats(df)}

        # 2. Empty/Small Check
        if len(df) == 0:
            checks.append({"name": "File Content", "status": "BLOCKED", "message": "The CSV contains zero records."})
            status = "ACTION_REQUIRED"
            return {"status": status, "checks": checks, "stats": ReadinessChecker._get_basic_stats(df)}
        
        # 3. Data Completeness (Missing values in mapped columns)
        null_issues = []
        for canonical in ['amount', 'date', 'description']:
            actual = mapping[canonical]
            nulls = df[actual].isna().sum()
            if nulls > 0:
                null_issues.append(f"{nulls} missing {canonical}s")
        
        if null_issues:
            checks.append({
                "name": "Data Completeness", 
                "status": "WARNING", 
                "message": f"Partial data detected: {', '.join(null_issues)}."
            })
            if status != "ACTION_REQUIRED": status = "READY_WITH_WARNINGS"
        else:
            checks.append({"name": "Data Completeness", "status": "PASS", "message": "No missing values in primary fields."})

        # 4. Amount Structural Integrity
        amt_col = mapping['amount']
        try:
            # Handle Indian formatting by stripping commas and symbols if needed
            def clean_amt(v):
                if pd.isna(v): return np.nan
                s = str(v).replace('₹', '').replace(',', '').strip()
                try: return float(s)
                except: return np.nan
            
            cleaned_amounts = df[amt_col].apply(clean_amt)
            invalid_amounts = cleaned_amounts.isna().sum()
            
            if invalid_amounts > 0:
                checks.append({
                    "name": "Monetary Integrity", 
                    "status": "WARNING", 
                    "message": f"{invalid_amounts} records have non-numeric amount formats."
                })
                if status != "ACTION_REQUIRED": status = "READY_WITH_WARNINGS"
            else:
                checks.append({"name": "Monetary Integrity", "status": "PASS", "message": "All financial values are valid."})
        except:
             checks.append({"name": "Monetary Integrity", "status": "WARNING", "message": "Validation failed for amount column."})

        # 5. Date Structural Integrity
        date_col = mapping['date']
        try:
            dates = pd.to_datetime(df[date_col], errors='coerce')
            invalid_dates = dates.isna().sum()
            if invalid_dates > 0:
                checks.append({
                    "name": "Temporal Integrity", 
                    "status": "WARNING", 
                    "message": f"{invalid_dates} records have unrecognizable date formats."
                })
                if status != "ACTION_REQUIRED": status = "READY_WITH_WARNINGS"
            else:
                checks.append({"name": "Temporal Integrity", "status": "PASS", "message": "All transaction dates are valid."})
        except:
            checks.append({"name": "Temporal Integrity", "status": "WARNING", "message": "Validation failed for date column."})

        # 6. ID Uniqueness (if ID column mapped)
        id_col = mapping.get('id')
        if id_col and id_col in df.columns:
            dupes = df[id_col].duplicated().sum()
            if dupes > 0:
                checks.append({
                    "name": "ID Uniqueness", 
                    "status": "WARNING", 
                    "message": f"Found {dupes} duplicate transaction identifiers."
                })
                if status != "ACTION_REQUIRED": status = "READY_WITH_WARNINGS"
            else:
                checks.append({"name": "ID Uniqueness", "status": "PASS", "message": "All transaction IDs are unique."})

        # 7. Row Duplicates
        full_dupes = df.duplicated().sum()
        if full_dupes > 0:
            checks.append({
                "name": "Audit Safety", 
                "status": "WARNING", 
                "message": f"Detected {full_dupes} identical duplicate rows."
            })
            if status != "ACTION_REQUIRED": status = "READY_WITH_WARNINGS"
        else:
            checks.append({"name": "Audit Safety", "status": "PASS", "message": "No full row duplicates detected."})

        # Final stats
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
    def _get_basic_stats(df: pd.DataFrame) -> Dict[str, Any]:
        return {
            "row_count": len(df),
            "date_range": "Unknown",
            "total_amount": 0.0
        }

    @staticmethod
    def check_overlap(bank_df: pd.DataFrame, ledger_df: pd.DataFrame, bank_map: Dict[str, str], ledger_map: Dict[str, str]) -> Dict[str, Any]:
        try:
            b_dates = pd.to_datetime(bank_df[bank_map['date']], errors='coerce').dropna()
            l_dates = pd.to_datetime(ledger_df[ledger_map['date']], errors='coerce').dropna()
            
            if b_dates.empty or l_dates.empty:
                return {"status": "WARNING", "message": "Unable to calculate temporal overlap between sources."}
                
            b_min, b_max = b_dates.min(), b_dates.max()
            l_min, l_max = l_dates.min(), l_dates.max()
            
            overlap_start = max(b_min, l_min)
            overlap_end = min(b_max, l_max)
            
            if overlap_start <= overlap_end:
                return {
                    "status": "PASS", 
                    "message": f"Date ranges align from {overlap_start.strftime('%d %b %Y')} to {overlap_end.strftime('%d %b %Y')}."
                }
            else:
                return {
                    "status": "WARNING", 
                    "message": f"Mismatching date windows. Bank: {b_min.strftime('%Y-%m-%d')} to {b_max.strftime('%Y-%m-%d')}. Ledger: {l_min.strftime('%Y-%m-%d')} to {l_max.strftime('%Y-%m-%d')}."
                }
        except:
            return {"status": "WARNING", "message": "Cross-source validation error."}

    @staticmethod
    def _get_date_range(df: pd.DataFrame, date_col: str) -> str:
        try:
            dates = pd.to_datetime(df[date_col], errors='coerce').dropna()
            if dates.empty: return "Unknown Range"
            return f"{dates.min().strftime('%d %b')} – {dates.max().strftime('%d %b %Y')}"
        except: return "Unknown Range"

    @staticmethod
    def _get_total_amount(df: pd.DataFrame, amt_col: str) -> float:
        try:
            def clean(v):
                if pd.isna(v): return 0.0
                s = str(v).replace('₹', '').replace(',', '').strip()
                try: return float(s)
                except: return 0.0
            return float(df[amt_col].apply(clean).sum())
        except: return 0.0
