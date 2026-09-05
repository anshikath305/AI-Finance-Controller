from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class CalibrationBucket(BaseModel):
    range: str
    count: int
    acceptance_rate: float

class ReviewPattern(BaseModel):
    label: str
    count: int
    insight: str

class ReviewIntelligenceSummary(BaseModel):
    total_reviewed: int
    accepted: int
    rejected: int
    exceptions: int
    override_rate: float

class ReviewIntelligenceResponse(BaseModel):
    run_id: int
    summary: ReviewIntelligenceSummary
    confidence_calibration: List[CalibrationBucket]
    patterns: List[ReviewPattern]

class HistoricalPrecedent(BaseModel):
    sample_size: int
    acceptance_rate: float
    primary_action: str
