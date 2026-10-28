export type CheckStatus = 'PASSED' | 'DETECTED' | 'WARNING' | 'UNAVAILABLE';

export type FindingCategory = 'QUALITY' | 'LEAKAGE' | 'SCHEMA' | 'SPLIT';

export type FindingSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Finding {
  id: string;
  rule_id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  status: CheckStatus;
  title: string;
  explanation: string;
  affected_columns: string[];
  evidence: Record<string, any>;
  recommended_action: string;
  confidence?: number | null;
  limitations: string;
}

export interface ColumnProfile {
  name: string;
  inferred_type: string;
  total_count: number;
  null_count: number;
  null_percentage: number;
  unique_count: number;
  unique_percentage: number;
  sample_values: any[];
  stats: Record<string, any>;
  suspicious_flags: string[];
}

export interface CorrelationInfo {
  column1: string;
  column2: string;
  metric_name: string;
  value: number;
  interpretation: string;
}

export interface DatasetSummary {
  filename: string;
  file_format: string;
  sheet_name?: string | null;
  row_count: number;
  column_count: number;
  memory_usage_mb: number;
  duplicate_row_count: number;
  duplicate_row_percentage: number;
  total_missing_cells: number;
  total_missing_percentage: number;
  target_column?: string | null;
  target_type?: string | null;
  split_mode: string;
}

export interface AuditRiskSummary {
  overall_risk_level: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  overall_risk_score: number;
  score_calculation_rationale: string;
  critical_findings_count: number;
  high_findings_count: number;
  medium_findings_count: number;
  low_findings_count: number;
  passed_checks_count: number;
  unavailable_checks_count: number;
}

export interface AuditResponse {
  audit_id: string;
  timestamp: string;
  summary: DatasetSummary;
  risk_summary: AuditRiskSummary;
  column_profiles: ColumnProfile[];
  correlations: CorrelationInfo[];
  findings: Finding[];
  target_analysis?: Record<string, any> | null;
  limitations_summary: string[];
}

export interface SampleDatasetInfo {
  id: string;
  name: string;
  filename: string;
  format: string;
  recommended_target: string;
  description: string;
}
