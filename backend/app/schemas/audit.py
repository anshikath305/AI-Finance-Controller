from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class AuditLogItem(BaseModel):
    id: int
    run_id: Optional[int]
    match_id: Optional[int]
    event_type: str
    actor_type: str
    description: str
    metadata_json: Optional[Dict[str, Any]]
    timestamp: datetime

    class Config:
        from_attributes = True

class AuditSummary(BaseModel):
    total_events: int
    human_actions: int
    system_actions: int
    evidence_coverage: float

class DecisionTrace(BaseModel):
    match_id: int
    status: str
    confidence: float
    method: str
    explanation: str
    bank_tx: Dict[str, Any]
    ledger_tx: Optional[Dict[str, Any]]
    policy: Dict[str, Any]
    timeline: List[AuditLogItem]
    ai_analysis: Optional[Dict[str, Any]]

class RunAuditResponse(BaseModel):
    run_id: int
    summary: AuditSummary
    timeline: List[AuditLogItem]
