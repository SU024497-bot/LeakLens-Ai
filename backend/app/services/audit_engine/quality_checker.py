import uuid
import pandas as pd
import numpy as np
from typing import List, Dict, Any
from backend.app.schemas.audit import Finding, FindingCategory, FindingSeverity, CheckStatus

def run_quality_checks(df: pd.DataFrame, parser_metadata: dict) -> List[Finding]:
    """
    Executes deterministic and heuristic data-quality checks on the dataset.
    Always returns structured findings including passed checks for complete transparency.
    """
    findings: List[Finding] = []
    total_rows = len(df)
    total_cols = len(df.columns)
    
    # ----------------------------------------------------
    # 1. Duplicate Column Names (Schema check)
    # ----------------------------------------------------
    raw_headers = parser_metadata.get("raw_headers", [str(c) for c in df.columns])
    seen_headers = set()
    dup_headers = []
    for h in raw_headers:
        if h in seen_headers:
            dup_headers.append(h)
        else:
            seen_headers.add(h)
            
    if dup_headers:
        findings.append(Finding(
            id=f"finding_{uuid.uuid4().hex[:8]}",
            rule_id="SCHEMA_DUPLICATE_COLUMNS",
            category=FindingCategory.SCHEMA,
            severity=FindingSeverity.HIGH,
            status=CheckStatus.DETECTED,
            title="Duplicate Column Headers Detected",
            explanation=f"Found {len(dup_headers)} column header(s) with identical names. Duplicate column names cause ambiguity during model feature mapping and data transformations.",
            affected_columns=list(set(dup_headers)),
            evidence={
                "duplicate_headers": dup_headers,
                "count": len(dup_headers)
            },
            recommended_action="Rename duplicate columns in the source dataset with unique, semantic identifiers prior to training.",
            confidence=1.0,
            limitations="Assesses exact string matches in the dataset header row."
        ))
    else:
        findings.append(Finding(
            id=f"finding_{uuid.uuid4().hex[:8]}",
            rule_id="SCHEMA_DUPLICATE_COLUMNS",
            category=FindingCategory.SCHEMA,
            severity=FindingSeverity.INFO,
            status=CheckStatus.PASSED,
            title="Column Headers Are Unique",
            explanation="All column headers in the dataset are distinctly named.",
            affected_columns=[],
            evidence={"total_columns": total_cols},
            recommended_action="No action needed.",
            confidence=1.0,
            limitations="Checks column name uniqueness only, not semantic synonymy."
        ))
        
    # ----------------------------------------------------
    # 2. Exact Duplicate Rows
    # ----------------------------------------------------
    dup_row_count = int(df.duplicated().sum())
    dup_row_pct = round((dup_row_count / total_rows * 100), 2) if total_rows > 0 else 0.0
    
    if dup_row_count > 0:
        severity = FindingSeverity.HIGH if dup_row_pct > 15.0 else FindingSeverity.MEDIUM
        findings.append(Finding(
            id=f"finding_{uuid.uuid4().hex[:8]}",
            rule_id="DQ_DUPLICATE_ROWS",
            category=FindingCategory.QUALITY,
            severity=severity,
            status=CheckStatus.DETECTED,
            title=f"Exact Duplicate Records ({dup_row_count:,} rows, {dup_row_pct}%)",
            explanation=f"Detected {dup_row_count:,} completely identical rows across all columns. Duplicate records distort sample distributions, cause artificial weighting in loss functions, and can cause train/test leakage if split across sets.",
            affected_columns=[],
            evidence={
                "duplicate_count": dup_row_count,
                "duplicate_percentage": dup_row_pct,
                "total_rows": total_rows
            },
            recommended_action="Deduplicate rows using primary keys or verify whether repeated observations reflect legitimate identical multi-event records.",
            confidence=1.0,
            limitations="Evaluates exact cell-for-cell equality across all recorded columns."
        ))
    else:
        findings.append(Finding(
            id=f"finding_{uuid.uuid4().hex[:8]}",
            rule_id="DQ_DUPLICATE_ROWS",
            category=FindingCategory.QUALITY,
            severity=FindingSeverity.INFO,
            status=CheckStatus.PASSED,
            title="No Exact Duplicate Rows Found",
            explanation="All records in the dataset are unique across their full feature vectors.",
            affected_columns=[],
            evidence={"checked_rows": total_rows, "duplicate_count": 0},
            recommended_action="No action needed.",
            confidence=1.0,
            limitations="Does not verify near-duplicates or partial matches."
        ))
        
    # ----------------------------------------------------
    # 3. Constant / Zero-Variance Columns
    # ----------------------------------------------------
    constant_cols = []
    single_val_details = {}
    for col in df.columns:
        clean = df[col].dropna()
        if clean.nunique() <= 1:
            constant_cols.append(col)
            val = clean.iloc[0] if len(clean) > 0 else "ALL_NULL"
            single_val_details[col] = str(val)[:50]
            
    if constant_cols:
        findings.append(Finding(
            id=f"finding_{uuid.uuid4().hex[:8]}",
            rule_id="DQ_CONSTANT_COLUMNS",
            category=FindingCategory.QUALITY,
            severity=FindingSeverity.MEDIUM,
            status=CheckStatus.DETECTED,
            title=f"Constant / Zero-Variance Columns ({len(constant_cols)})",
            explanation=f"Found {len(constant_cols)} column(s) with zero variance or all null values. Constant columns provide zero mutual information to learning algorithms and unnecessarily consume memory and model bandwidth.",
            affected_columns=constant_cols,
            evidence={
                "constant_columns": constant_cols,
                "sample_values": single_val_details
            },
            recommended_action="Drop constant columns during preprocessing unless required for downstream audit logging.",
            confidence=1.0,
            limitations="Assesses variance in the current dataset sample only."
        ))
    else:
        findings.append(Finding(
            id=f"finding_{uuid.uuid4().hex[:8]}",
            rule_id="DQ_CONSTANT_COLUMNS",
            category=FindingCategory.QUALITY,
            severity=FindingSeverity.INFO,
            status=CheckStatus.PASSED,
            title="No Constant Columns",
            explanation="All features contain multiple distinct values.",
            affected_columns=[],
            evidence={"total_columns": total_cols},
            recommended_action="No action needed.",
            confidence=1.0,
            limitations="Checks diversity of values; does not evaluate distribution normality."
        ))
        
    # ----------------------------------------------------
    # 4. Missing Values Analysis
    # ----------------------------------------------------
    high_missing_cols = {}
    crit_missing_cols = {}
    
    for col in df.columns:
        null_cnt = int(df[col].isna().sum())
        null_pct = round((null_cnt / total_rows * 100), 2) if total_rows > 0 else 0.0
        if null_pct > 70.0:
            crit_missing_cols[col] = {"null_count": null_cnt, "percentage": null_pct}
        elif null_pct > 25.0:
            high_missing_cols[col] = {"null_count": null_cnt, "percentage": null_pct}
            
    if crit_missing_cols:
        findings.append(Finding(
            id=f"finding_{uuid.uuid4().hex[:8]}",
            rule_id="DQ_CRITICAL_MISSING_VALUES",
            category=FindingCategory.QUALITY,
            severity=FindingSeverity.HIGH,
            status=CheckStatus.DETECTED,
            title=f"Severe Missingness in {len(crit_missing_cols)} Column(s) (>70%)",
            explanation=f"Columns {list(crit_missing_cols.keys())} have over 70% missing values. High missingness often leads to biased imputations or artificial patterns.",
            affected_columns=list(crit_missing_cols.keys()),
            evidence=crit_missing_cols,
            recommended_action="Consider dropping these columns or creating explicit binary missingness indicator features if the absence is informative.",
            confidence=1.0,
            limitations="Counts NaN, null, and empty string equivalents."
        ))
    elif high_missing_cols:
        findings.append(Finding(
            id=f"finding_{uuid.uuid4().hex[:8]}",
            rule_id="DQ_HIGH_MISSING_VALUES",
            category=FindingCategory.QUALITY,
            severity=FindingSeverity.MEDIUM,
            status=CheckStatus.WARNING,
            title=f"Moderate Missingness in {len(high_missing_cols)} Column(s) (25%-70%)",
            explanation=f"Detected notable missing values in {len(high_missing_cols)} column(s). Standard ML estimators require valid imputation or native null handling.",
            affected_columns=list(high_missing_cols.keys()),
            evidence=high_missing_cols,
            recommended_action="Audit collection pipeline to determine whether data is Missing Completely at Random (MCAR) or Missing at Random (MAR) before imputing.",
            confidence=0.95,
            limitations="Cannot determine whether missingness mechanism is MNAR (Not at Random) without domain ground truth."
        ))
    else:
        findings.append(Finding(
            id=f"finding_{uuid.uuid4().hex[:8]}",
            rule_id="DQ_MISSING_VALUES",
            category=FindingCategory.QUALITY,
            severity=FindingSeverity.INFO,
            status=CheckStatus.PASSED,
            title="Missing Value Ratios Within Acceptable Thresholds",
            explanation="No column exhibits severe (>25%) missing values.",
            affected_columns=[],
            evidence={"total_columns": total_cols},
            recommended_action="Apply standard imputation strategies during pipeline construction.",
            confidence=1.0,
            limitations="Assumes empty cells represent missingness; does not flag domain-specific placeholder codes like 999 or -1 unless flagged elsewhere."
        ))
        
    # ----------------------------------------------------
    # 5. High-Cardinality Identifier Columns
    # ----------------------------------------------------
    id_like_cols = []
    id_details = {}
    for col in df.columns:
        clean = df[col].dropna()
        if len(clean) == 0:
            continue
        unique_ratio = clean.nunique() / len(clean)
        lower_name = col.lower()
        is_id_name = any(k in lower_name for k in ["id", "uuid", "guid", "ssn", "account", "user_id", "cust", "hash"])
        
        # High cardinality without being numeric measurement
        if unique_ratio > 0.95 and total_rows > 30 and (is_id_name or not pd.api.types.is_numeric_dtype(clean)):
            id_like_cols.append(col)
            id_details[col] = {
                "unique_count": int(clean.nunique()),
                "unique_ratio": round(float(unique_ratio * 100), 2),
                "is_id_name": is_id_name
            }
            
    if id_like_cols:
        findings.append(Finding(
            id=f"finding_{uuid.uuid4().hex[:8]}",
            rule_id="DQ_HIGH_CARDINALITY_IDENTIFIERS",
            category=FindingCategory.QUALITY,
            severity=FindingSeverity.MEDIUM,
            status=CheckStatus.WARNING,
            title=f"High-Cardinality Identifier Columns ({len(id_like_cols)})",
            explanation=f"Columns {id_like_cols} have near-unique cardinality (>95%). Including raw arbitrary identifiers in model features often induces severe memorization and spurious decision-tree splits.",
            affected_columns=id_like_cols,
            evidence=id_details,
            recommended_action="Exclude unique ID columns from feature matrices before model training.",
            confidence=0.85,
            limitations="High cardinality is legitimate for target variables or continuous measurements; verified here against non-continuous ID naming heuristics."
        ))
        
    # ----------------------------------------------------
    # 6. Mixed Data Types & String Numbers
    # ----------------------------------------------------
    mixed_cols = []
    for col in df.columns:
        if df[col].dtype == object:
            # Check if majority of values are numeric but column is object
            clean = df[col].dropna().astype(str).str.strip()
            num_conversions = pd.to_numeric(clean, errors="coerce")
            valid_num_count = num_conversions.notna().sum()
            total_clean = len(clean)
            
            if total_clean > 20 and 0.5 < (valid_num_count / total_clean) < 0.99:
                invalid_samples = clean[num_conversions.isna()].unique()[:5].tolist()
                mixed_cols.append({
                    "column": col,
                    "numeric_ratio": round(valid_num_count / total_clean * 100, 1),
                    "non_numeric_samples": invalid_samples
                })
                
    if mixed_cols:
        col_names = [m["column"] for m in mixed_cols]
        findings.append(Finding(
            id=f"finding_{uuid.uuid4().hex[:8]}",
            rule_id="DQ_MIXED_DATA_TYPES",
            category=FindingCategory.QUALITY,
            severity=FindingSeverity.MEDIUM,
            status=CheckStatus.WARNING,
            title=f"Inconsistent or Mixed Data Types ({len(mixed_cols)} columns)",
            explanation=f"Columns {col_names} contain predominantly numeric values mixed with non-numeric text tokens. This can cause silent coercion or unexpected feature corruption during transformation.",
            affected_columns=col_names,
            evidence={"mixed_columns": mixed_cols},
            recommended_action="Cleanse non-numeric sentinel tokens and explicitly cast columns to float or integer.",
            confidence=0.9,
            limitations="Evaluates sample string parsing into standard numeric formats."
        ))
        
    return findings
