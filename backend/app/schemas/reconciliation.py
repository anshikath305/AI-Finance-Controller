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

class ExceptionPatternExample(BaseModel):
    bank_desc: str
    ledger_desc: Optional[str]
    amount: float
    date: str

class ExceptionPattern(BaseModel):
    type: str
    label: str
    case_count: int
    total_value: float
    workload_percentage: float
    explanation: str
    examples: List[ExceptionPatternExample]

class IntelligenceSummary(BaseModel):
    total_exceptions: int
    total_value: float
    pattern_count: int

class RunIntelligence(BaseModel):
    summary: IntelligenceSummary
    patterns: List[ExceptionPattern]

class EvidenceFact(BaseModel):
    label: str
    bank_value: str
    ledger_value: Optional[str]

class EvidenceSignal(BaseModel):
    type: str # amount, date, merchant, etc
    label: str
    status: str # aligned, difference, conflict, missing
    message: str
    details: Optional[str] = None

class AIInterpretation(BaseModel):
    available: bool
    reasoning: Optional[str] = None
    relationship: Optional[str] = None
    supporting_evidence: List[str] = []

class MatchEvidence(BaseModel):
    match_id: int
    decision: Dict[str, Any] # status, method, confidence, explanation
    facts: List[EvidenceFact]
    signals: List[EvidenceSignal]
    ai_interpretation: AIInterpretation

class ReconciliationProfile(BaseModel):
    profile_name: str = "STANDARD" # STRICT, STANDARD
    date_tolerance: int = 3
    amount_tolerance: float = 0.01
    currency: str = "INR"

class RunHistoryItem(BaseModel):
    id: int
    created_at: datetime
    status: str
    bank_count: int
    ledger_count: int
    matched_count: int
    match_rate: float
    reconciled_amount: float
    unreconciled_amount: float
    pending_review: int
    exception_count: int
