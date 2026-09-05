from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class MetricComparison(BaseModel):
    label: str
    current_value: Any
    previous_value: Any
    change: Any
    direction: str  # up, down, neutral
    unit: str  # absolute, currency, percentage_points

class ExceptionPatternComparison(BaseModel):
    label: str
    current_count: int
    previous_count: int
    change: int
    current_value_at_risk: float
    previous_value_at_risk: float
    value_change: float

class RunComparisonResponse(BaseModel):
    current_run_id: int
    previous_run_id: int
    metrics: List[MetricComparison]
    exceptions: List[ExceptionPatternComparison]
    summary_text: List[str]
