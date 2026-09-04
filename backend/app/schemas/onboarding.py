from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ColumnMapping(BaseModel):
    amount: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None

class ReadinessCheck(BaseModel):
    name: str
    status: str # PASS, WARNING, BLOCKED
    message: str

class FileStats(BaseModel):
    row_count: int
    date_range: str
    total_amount: float

class FileReadiness(BaseModel):
    status: str
    checks: List[ReadinessCheck]
    stats: Optional[FileStats] = None

class DataReadinessResponse(BaseModel):
    status: str # READY, READY_WITH_WARNINGS, ACTION_REQUIRED
    bank: FileReadiness
    ledger: FileReadiness
    overlap: Optional[Dict[str, Any]] = None
    bank_mapping: ColumnMapping
    ledger_mapping: ColumnMapping
