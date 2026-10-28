from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field

class CheckStatus(str, Enum):
    PASSED = "PASSED"
    DETECTED = "DETECTED"
    WARNING = "WARNING"
    UNAVAILABLE = "UNAVAILABLE"

class FindingCategory(str, Enum):
    QUALITY = "QUALITY"
    LEAKAGE = "LEAKAGE"
    SCHEMA = "SCHEMA"
    SPLIT = "SPLIT"

class FindingSeverity(str, Enum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Finding(BaseModel):
    id: str
    rule_id: str
    category: FindingCategory
    severity: FindingSeverity
    status: CheckStatus
    title: str
    explanation: str
    affected_columns: list[str] = Field(default_factory=list)
    evidence: dict[str, Any] = Field(default_factory=dict)
    recommended_action: str
    confidence: Optional[float] = None
    limitations: str

class ColumnProfile(BaseModel):
    name: str
    inferred_type: str
    total_count: int
    null_count: int
    null_percentage: float
    unique_count: int
    unique_percentage: float
    sample_values: list[Any] = Field(default_factory=list)
    stats: dict[str, Any] = Field(default_factory=dict)
    suspicious_flags: list[str] = Field(default_factory=list)

class CorrelationInfo(BaseModel):
    column1: str
    column2: str
    metric_name: str
    value: float
    interpretation: str

class DatasetSummary(BaseModel):
    filename: str
    file_format: str
    sheet_name: Optional[str] = None
    row_count: int
    column_count: int
    memory_usage_mb: float
    duplicate_row_count: int
    duplicate_row_percentage: float
    total_missing_cells: int
    total_missing_percentage: float
    target_column: Optional[str] = None
    target_type: Optional[str] = None
    split_mode: str = "single_dataset"

class AuditRiskSummary(BaseModel):
    overall_risk_level: str
    overall_risk_score: float
    score_calculation_rationale: str
    critical_findings_count: int
    high_findings_count: int
    medium_findings_count: int
    low_findings_count: int
    passed_checks_count: int
    unavailable_checks_count: int

class AuditResponse(BaseModel):
    audit_id: str
    timestamp: str
    summary: DatasetSummary
    risk_summary: AuditRiskSummary
    column_profiles: list[ColumnProfile]
    correlations: list[CorrelationInfo] = Field(default_factory=list)
    findings: list[Finding]
    target_analysis: Optional[dict[str, Any]] = None
    limitations_summary: list[str] = Field(default_factory=list)

class WorksheetListResponse(BaseModel):
    filename: str
    worksheets: list[str]
    default_worksheet: str

class ErrorResponse(BaseModel):
    detail: str
    error_code: str
    parameters: Optional[dict[str, Any]] = None
