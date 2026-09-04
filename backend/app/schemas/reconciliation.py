from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class TransactionBase(BaseModel):
    source_transaction_id: Optional[str] = None
    original_date: str
    original_description: str
    amount: float
    currency: str = "INR"
    raw_data: Dict[str, Any]

class ReconciliationRun(BaseModel):
    id: int
    created_at: datetime
    status: str
    total_bank_records: int
    total_ledger_records: int
    matched_records: int
    processing_time: Optional[float]

    class Config:
        from_attributes = True

class FileUploadResponse(BaseModel):
    run_id: int
    bank_columns: List[str]
    ledger_columns: List[str]
    bank_record_count: int
    ledger_record_count: int

class MatchSchema(BaseModel):
    id: int
    bank_transaction_id: int
    ledger_transaction_id: Optional[int]
    status: str
    confidence: float
    explanation: str
    matching_signals: Dict[str, Any]
    bank_detail: Dict[str, Any]
    ledger_detail: Optional[Dict[str, Any]]
    is_reviewed: bool = False # New field

    class Config:
        from_attributes = True

class DashboardMetrics(BaseModel):
    operational: Dict[str, Any]
    financial: Dict[str, Any]
    automation: Dict[str, Any]

class ReviewAction(BaseModel):
    action: str  # ACCEPT, REJECT, MARK_EXCEPTION
    comment: Optional[str] = None
