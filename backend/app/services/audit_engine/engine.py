import uuid
import datetime
import pandas as pd
from typing import Optional, List, Dict, Any
from backend.app.schemas.audit import (
    AuditResponse, AuditRiskSummary, FindingSeverity, CheckStatus
)
from backend.app.services.audit_engine.profiler import profile_dataset
from backend.app.services.audit_engine.quality_checker import run_quality_checks
from backend.app.services.audit_engine.leakage_checker import run_leakage_checks

def calculate_honest_risk_summary(findings: list) -> AuditRiskSummary:
    """
    Computes an honest, deterministic risk penalty score based on weighted findings.
    Weights:
      CRITICAL: 30 points (e.g. direct target duplication, train/test contamination)
      HIGH: 15 points (e.g. suspicious target association, severe missingness, post-outcome names)
      MEDIUM: 5 points (e.g. constant columns, high-cardinality IDs, moderate missingness)
      LOW: 1 point (minor schema flags)
      PASSED / UNAVAILABLE / INFO: 0 points
    Total penalty score is capped at 100.
    """
    crit_count = 0
    high_count = 0
    med_count = 0
    low_count = 0
    passed_count = 0
    unavail_count = 0
    
    raw_penalty = 0
    for f in findings:
        if f.status == CheckStatus.PASSED:
            passed_count += 1
            continue
        if f.status == CheckStatus.UNAVAILABLE:
            unavail_count += 1
            continue
            
        if f.severity == FindingSeverity.CRITICAL:
            crit_count += 1
            raw_penalty += 30
        elif f.severity == FindingSeverity.HIGH:
            high_count += 1
            raw_penalty += 15
        elif f.severity == FindingSeverity.MEDIUM:
            med_count += 1
            raw_penalty += 5
        elif f.severity == FindingSeverity.LOW:
            low_count += 1
            raw_penalty += 1
            
    final_score = min(100.0, float(raw_penalty))
    
    if final_score >= 65.0 or crit_count > 0:
        risk_level = "CRITICAL"
    elif final_score >= 35.0:
        risk_level = "ELEVATED"
    elif final_score >= 12.0:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"
        
    formula_desc = (
        f"Deterministic risk penalty index calculated as: "
        f"({crit_count} Critical × 30) + ({high_count} High × 15) + ({med_count} Med × 5) + ({low_count} Low × 1) = {raw_penalty} (clamped to {final_score}/100). "
        f"This is an empirical heuristic penalty index, not a calibrated statistical probability."
    )
    
    return AuditRiskSummary(
        overall_risk_level=risk_level,
        overall_risk_score=final_score,
        score_calculation_rationale=formula_desc,
        critical_findings_count=crit_count,
        high_findings_count=high_count,
        medium_findings_count=med_count,
        low_findings_count=low_count,
        passed_checks_count=passed_count,
        unavailable_checks_count=unavail_count
    )

def audit_dataset(
    df: pd.DataFrame,
    parser_metadata: dict,
    target_column: Optional[str] = None,
    test_df: Optional[pd.DataFrame] = None
) -> AuditResponse:
    """
    Executes full dataset audit workflow:
    1. Profiling & summaries
    2. Data-quality rules
    3. Potential leakage rules
    4. Target variable analysis
    5. Synthesis of findings and risk summary
    """
    filename = parser_metadata.get("original_filename", "dataset")
    file_format = parser_metadata.get("format", "csv")
    sheet_name = parser_metadata.get("sheet_name")
    
    # 1. Profile Dataset
    summary, col_profiles, correlations = profile_dataset(
        df=df,
        filename=filename,
        file_format=file_format,
        sheet_name=sheet_name,
        target_column=target_column
    )
    
    # 2. Quality Checks
    quality_findings = run_quality_checks(df, parser_metadata)
    
    # 3. Leakage Checks
    leakage_findings = run_leakage_checks(df, target_column=target_column, test_df=test_df)
    
    all_findings = quality_findings + leakage_findings
    
    # Sort findings by severity: CRITICAL > HIGH > MEDIUM > LOW > INFO
    severity_order = {
        FindingSeverity.CRITICAL: 0,
        FindingSeverity.HIGH: 1,
        FindingSeverity.MEDIUM: 2,
        FindingSeverity.LOW: 3,
        FindingSeverity.INFO: 4
    }
    all_findings.sort(key=lambda f: (0 if f.status != CheckStatus.PASSED else 1, severity_order.get(f.severity, 5)))
    
    # 4. Target variable analysis summary
    target_analysis = None
    if target_column and target_column in df.columns:
        target_series = df[target_column].dropna()
        if pd.api.types.is_numeric_dtype(target_series):
            target_analysis = {
                "name": target_column,
                "type": "numeric",
                "count": len(target_series),
                "mean": round(float(target_series.mean()), 4),
                "min": round(float(target_series.min()), 4),
                "max": round(float(target_series.max()), 4),
                "std": round(float(target_series.std()), 4) if len(target_series) > 1 else 0.0
            }
        else:
            value_counts = target_series.value_counts(normalize=True).head(5)
            target_analysis = {
                "name": target_column,
                "type": "categorical",
                "count": len(target_series),
                "unique_classes": int(target_series.nunique()),
                "class_proportions": {str(k): round(float(v), 4) for k, v in value_counts.items()}
            }
            
    # 5. Risk Summary
    risk_summary = calculate_honest_risk_summary(all_findings)
    
    limitations = [
        "Unsupervised heuristics cannot detect business-logic leakage without target context or timestamp metadata.",
        "High correlation does not guarantee leakage; domain verification of feature collection timing is mandatory.",
        "Single-table audits cannot confirm cross-validation split hygiene without separate partitions."
    ]
    
    return AuditResponse(
        audit_id=f"audit_{uuid.uuid4().hex[:12]}",
        timestamp=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        summary=summary,
        risk_summary=risk_summary,
        column_profiles=col_profiles,
        correlations=correlations,
        findings=all_findings,
        target_analysis=target_analysis,
        limitations_summary=limitations
    )
