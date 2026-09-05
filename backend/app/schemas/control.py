from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class ControlAlert(BaseModel):
    id: str
    run_id: int
    baseline_run_id: Optional[int]
    alert_type: str # MATCH_RATE_DROP, VAR_SPIKE, EXCEPTION_SURGE, AGING_BACKLOG, etc.
    severity: str # CRITICAL, ATTENTION, HEALTHY
    title: str
    summary: str
    current_value: Any
    baseline_value: Any
    delta: Any
    impact_value: float # Monetary value if applicable
    evidence: str
    recommended_action: str
    link_workflow: Optional[str] = None # exceptions, review, resolution, comparison

class ControlMetric(BaseModel):
    label: str
    value: Any
    status: str # PASS, WARNING, FAIL
    message: str

class ControlMonitorResponse(BaseModel):
    run_id: int
    overall_health: str # HEALTHY, ATTENTION, CRITICAL
    health_reasons: List[str]
    alerts: List[ControlAlert]
    key_metrics: List[ControlMetric]
    baseline_context: Optional[Dict[str, Any]] = None
