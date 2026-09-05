from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ActionEvidence(BaseModel):
    label: str
    value: str

class ExceptionAction(BaseModel):
    priority: str  # HIGH, MEDIUM, LOW
    pattern_type: str
    title: str
    insight: str
    affected_records: int
    affected_amount: float
    recommended_action: str
    reason: str
    evidence: List[ActionEvidence]
    link_pattern: Optional[str] = None

class ActionabilitySummary(BaseModel):
    total_actions: int
    high_priority_count: int
    value_at_risk: float

class ActionabilityResponse(BaseModel):
    run_id: int
    summary: ActionabilitySummary
    actions: List[ExceptionAction]
