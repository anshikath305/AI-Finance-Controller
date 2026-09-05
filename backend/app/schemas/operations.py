from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class OpSummary(BaseModel):
    total_active_runs: int
    pending_review_total: int
    value_at_risk_total: float
    exception_count_total: int
    avg_match_rate: float
    override_rate: float
    resolved_total: int
    resolution_rate: float
    overdue_count: int
    due_today_count: int

class OpQueueItem(BaseModel):
    run_id: int
    match_id: int
    description: str
    amount: float
    confidence: float
    priority: str # HIGH, MEDIUM, LOW
    pattern: str
    age_days: int
    evidence_available: bool

class NextBestReview(BaseModel):
    match_id: int
    run_id: int
    description: str
    amount: float
    reason: str
    confidence: float
    evidence_summary: List[str]

class AgingBucket(BaseModel):
    label: str # < 1 day, 1-3 days, etc
    count: int
    value_at_risk: float

class RunHealth(BaseModel):
    run_id: int
    match_rate: float
    review_rate: float
    exception_rate: float
    value_at_risk: float
    policy_profile: str
    trend: Optional[str] = None # Improving, Declining

class OperationsResponse(BaseModel):
    summary: OpSummary
    work_queue: List[OpQueueItem]
    next_best_review: Optional[NextBestReview]
    aging: List[AgingBucket]
    recent_runs: List[RunHealth]
    recommendations: List[str]
