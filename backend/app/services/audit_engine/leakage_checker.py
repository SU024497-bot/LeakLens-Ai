import uuid
import math
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from backend.app.schemas.audit import Finding, FindingCategory, FindingSeverity, CheckStatus

# Known common target tokens
TARGET_NAME_PATTERNS = [
    "target", "label", "churn", "churned", "default", "defaulted", "fraud", 
    "is_fraud", "status", "outcome", "converted", "conversion", "approved", 
    "approval", "decision", "class", "response", "survived", "y", "risk_flag"
]

# Known post-outcome feature patterns
POST_OUTCOME_PATTERNS = [
    "reason", "cancellation", "resolution", "payout", "refund", "discharge",
    "closure", "settlement", "exit_interview", "post_", "after_", "feedback_on_exit",
    "approval_code", "chargeback", "final_status", "closed_date"
]

def calculate_cramers_v(cat1: pd.Series, cat2: pd.Series) -> float:
    """Calculates Cramér's V for two categorical series."""
    try:
        confusion = pd.crosstab(cat1, cat2)
        chi2 = 0.0
        n = confusion.sum().sum()
        if n == 0:
            return 0.0
        row_sums = confusion.sum(axis=1)
        col_sums = confusion.sum(axis=0)
        
        expected = np.outer(row_sums, col_sums) / n
        with np.errstate(divide='ignore', invalid='ignore'):
            chi2 = np.nansum((confusion.values - expected) ** 2 / expected)
            
        r, k = confusion.shape
        if min(r - 1, k - 1) == 0:
            return 0.0
        v = math.sqrt(chi2 / (n * min(r - 1, k - 1)))
        return min(1.0, max(0.0, v))
    except Exception:
        return 0.0

def calculate_correlation_ratio(categories: pd.Series, measurements: pd.Series) -> float:
    """Calculates correlation ratio (eta) between a categorical and continuous series."""
    try:
        clean_df = pd.DataFrame({"cat": categories, "num": measurements}).dropna()
        if clean_df.empty or clean_df["cat"].nunique() <= 1:
            return 0.0
        overall_mean = clean_df["num"].mean()
        group_means = clean_df.groupby("cat")["num"].mean()
        group_counts = clean_df.groupby("cat")["num"].count()
        
        ss_between = np.sum(group_counts * (group_means - overall_mean) ** 2)
        ss_total = np.sum((clean_df["num"] - overall_mean) ** 2)
        
        if ss_total == 0:
            return 0.0
        return min(1.0, max(0.0, math.sqrt(ss_between / ss_total)))
    except Exception:
        return 0.0

def run_leakage_checks(
    df: pd.DataFrame,
    target_column: Optional[str] = None,
    test_df: Optional[pd.DataFrame] = None
) -> List[Finding]:
    """
    Evaluates potential data leakage rules, distinguishing confirmed issues,
    heuristic warnings, and unavailable checks.
    """
    findings: List[Finding] = []
    
    # ----------------------------------------------------
    # 1. Target-Dependent Checks Handling
    # ----------------------------------------------------
    if not target_column or target_column not in df.columns:
        # Identify possible target candidates
        candidates = []
        for col in df.columns:
            lower = col.lower()
            if any(p == lower or f"_{p}" in lower or f"{p}_" in lower for p in TARGET_NAME_PATTERNS):
                candidates.append(col)
                
        candidate_msg = f" Candidate target columns detected: {candidates}." if candidates else ""
        findings.append(Finding(
            id=f"finding_{uuid.uuid4().hex[:8]}",
            rule_id="LEAK_TARGET_UNSPECIFIED",
            category=FindingCategory.LEAKAGE,
            severity=FindingSeverity.INFO,
            status=CheckStatus.UNAVAILABLE,
            title="Target-Dependent Leakage Checks Unavailable",
            explanation=f"No target/label column was specified for this audit.{candidate_msg} Direct target duplication, suspicious target correlations, and proxy feature checks require designating a target variable.",
            affected_columns=candidates,
            evidence={"available_candidates": candidates},
            recommended_action="Specify a target variable during upload to run in-depth target leakage and proxy feature checks.",
            confidence=1.0,
            limitations="Without an identified outcome variable, unsupervised checks cannot distinguish legitimate strong predictors from look-ahead leakage."
        ))
    else:
        # Target IS specified! Run target-dependent checks.
        target_series = df[target_column]
        other_cols = [c for c in df.columns if c != target_column]
        is_target_numeric = pd.api.types.is_numeric_dtype(target_series)
        
        # Check A: Exact Target Duplication
        identical_cols = []
        for col in other_cols:
            if df[col].equals(target_series):
                identical_cols.append(col)
                
        if identical_cols:
            findings.append(Finding(
                id=f"finding_{uuid.uuid4().hex[:8]}",
                rule_id="LEAK_EXACT_TARGET_DUPLICATION",
                category=FindingCategory.LEAKAGE,
                severity=FindingSeverity.CRITICAL,
                status=CheckStatus.DETECTED,
                title=f"Direct Target Duplication Detected in {len(identical_cols)} Column(s)",
                explanation=f"Columns {identical_cols} have identical values to the specified target column '{target_column}'. Including a replica of the target as an input feature creates trivial 100% training accuracy that immediately collapses upon deployment.",
                affected_columns=identical_cols,
                evidence={"identical_columns": identical_cols, "target_column": target_column},
                recommended_action="Immediately drop these duplicate columns from model features.",
                confidence=1.0,
                limitations="Checks exact element-wise equality after handling nulls."
            ))
            
        # Check B: Suspiciously High Target Association
        suspicious_corrs = []
        for col in other_cols:
            if col in identical_cols:
                continue
            series = df[col]
            metric_val = 0.0
            metric_name = "Association"
            
            # Skip high-cardinality ID candidates (where unique ratio > 0.4 and total > 20)
            # because every unique ID trivially yields an eta of 1.0 (overfitting the group mean).
            # These are already caught under DQ_HIGH_CARDINALITY_IDENTIFIERS.
            clean_series = series.dropna()
            if len(clean_series) > 20 and (clean_series.nunique() / len(clean_series) > 0.4):
                continue

            # Numeric - Numeric
            if is_target_numeric and pd.api.types.is_numeric_dtype(series):
                clean_pair = df[[col, target_column]].dropna()
                if len(clean_pair) > 20:
                    val = clean_pair[col].corr(clean_pair[target_column])
                    if not math.isnan(val):
                        metric_val = abs(val)
                        metric_name = "Pearson |r|"
            # Categorical target - Numeric feature
            elif not is_target_numeric and pd.api.types.is_numeric_dtype(series):
                metric_val = calculate_correlation_ratio(target_series, series)
                metric_name = "Correlation Ratio (eta)"
            # Numeric target - Categorical feature
            elif is_target_numeric and not pd.api.types.is_numeric_dtype(series):
                metric_val = calculate_correlation_ratio(series, target_series)
                metric_name = "Correlation Ratio (eta)"
            # Categorical - Categorical
            else:
                # Only if cardinality is reasonable
                if series.nunique() <= 50 and target_series.nunique() <= 50:
                    metric_val = calculate_cramers_v(series.astype(str), target_series.astype(str))
                    metric_name = "Cramer's V"
                
            if metric_val >= 0.88:
                suspicious_corrs.append({
                    "column": col,
                    "metric": metric_name,
                    "value": round(float(metric_val), 4),
                    "is_critical": metric_val >= 0.97
                })
                
        if suspicious_corrs:
            crit_count = sum(1 for c in suspicious_corrs if c["is_critical"])
            severity = FindingSeverity.CRITICAL if crit_count > 0 else FindingSeverity.HIGH
            aff_cols = [c["column"] for c in suspicious_corrs]
            findings.append(Finding(
                id=f"finding_{uuid.uuid4().hex[:8]}",
                rule_id="LEAK_SUSPICIOUS_TARGET_CORRELATION",
                category=FindingCategory.LEAKAGE,
                severity=severity,
                status=CheckStatus.WARNING,
                title=f"Suspicious Target Association in {len(suspicious_corrs)} Feature(s)",
                explanation=f"Features {aff_cols} exhibit near-deterministic statistical association with target '{target_column}' (score >= 0.88). In real-world observational data, near-perfect correlation often signifies a proxy variable, a leaky ID, or a post-event measurement.",
                affected_columns=aff_cols,
                evidence={"suspicious_features": suspicious_corrs, "target_column": target_column},
                recommended_action="Verify with domain experts whether these variables are known at prediction time. If they are recorded during or after the outcome, remove them.",
                confidence=0.88,
                limitations="High correlation can theoretically occur in deterministic physical systems; human review is required to verify the temporal availability of features."
            ))
        else:
            findings.append(Finding(
                id=f"finding_{uuid.uuid4().hex[:8]}",
                rule_id="LEAK_TARGET_ASSOCIATION",
                category=FindingCategory.LEAKAGE,
                severity=FindingSeverity.INFO,
                status=CheckStatus.PASSED,
                title="Target Associations Within Plausible Range",
                explanation=f"No individual feature exhibits implausibly high correlation (>= 0.88) with target '{target_column}'.",
                affected_columns=[],
                evidence={"checked_features": len(other_cols)},
                recommended_action="Proceed to standard feature importance and ablation testing.",
                confidence=0.9,
                limitations="Multivariate non-linear leakage across combinations of 3+ features cannot be ruled out by bivariate checks alone."
            ))

    # ----------------------------------------------------
    # 2. Heuristic Post-Outcome Feature Name Checks
    # ----------------------------------------------------
    post_outcome_cols = []
    for col in df.columns:
        if target_column and col == target_column:
            continue
        lower = col.lower()
        matched_tokens = [tok for tok in POST_OUTCOME_PATTERNS if tok in lower]
        if matched_tokens:
            post_outcome_cols.append({"column": col, "matched_tokens": matched_tokens})
            
    if post_outcome_cols:
        col_names = [p["column"] for p in post_outcome_cols]
        findings.append(Finding(
            id=f"finding_{uuid.uuid4().hex[:8]}",
            rule_id="LEAK_POST_OUTCOME_FEATURE_NAMES",
            category=FindingCategory.LEAKAGE,
            severity=FindingSeverity.HIGH,
            status=CheckStatus.WARNING,
            title=f"Potentially Suspicious Post-Outcome Column Names ({len(col_names)})",
            explanation=f"Features {col_names} contain semantic keywords (e.g., {list(set(sum([p['matched_tokens'] for p in post_outcome_cols], [])))}) indicating information collected after the target event occurs (e.g. cancellation reasons, closure dates, payout amounts).",
            affected_columns=col_names,
            evidence={"flagged_columns": post_outcome_cols},
            recommended_action="Audit the exact point in the business workflow when these fields are populated. Discard any fields populated simultaneously with or after the target event.",
            confidence=0.80,
            limitations="Heuristic based on column nomenclature; features may be pre-event survey responses or harmless historical records."
        ))

    # ----------------------------------------------------
    # 3. Train/Test Contamination Check
    # ----------------------------------------------------
    if test_df is not None and not test_df.empty:
        # Check exact overlap
        try:
            overlap = pd.merge(df, test_df, how="inner")
            overlap_count = len(overlap)
            if overlap_count > 0:
                findings.append(Finding(
                    id=f"finding_{uuid.uuid4().hex[:8]}",
                    rule_id="LEAK_TRAIN_TEST_CONTAMINATION",
                    category=FindingCategory.SPLIT,
                    severity=FindingSeverity.CRITICAL,
                    status=CheckStatus.DETECTED,
                    title=f"Train/Test Contamination Detected ({overlap_count:,} Overlapping Rows)",
                    explanation=f"Found {overlap_count:,} identical rows appearing in both the training set and the test set. Overlapping instances artificially inflate holdout validation metrics.",
                    affected_columns=[],
                    evidence={
                        "overlapping_rows": overlap_count,
                        "train_rows": len(df),
                        "test_rows": len(test_df)
                    },
                    recommended_action="Re-partition datasets using strict disjoint sampling or group-aware cross-validation before training.",
                    confidence=1.0,
                    limitations="Evaluates exact row matches across common columns."
                ))
            else:
                findings.append(Finding(
                    id=f"finding_{uuid.uuid4().hex[:8]}",
                    rule_id="LEAK_TRAIN_TEST_CONTAMINATION",
                    category=FindingCategory.SPLIT,
                    severity=FindingSeverity.INFO,
                    status=CheckStatus.PASSED,
                    title="No Direct Train/Test Record Overlap",
                    explanation="No duplicate rows were found between the provided training and testing partitions.",
                    affected_columns=[],
                    evidence={"train_rows": len(df), "test_rows": len(test_df)},
                    recommended_action="Ensure temporal ordering is preserved if dealing with time-series data.",
                    confidence=1.0,
                    limitations="Does not verify entity-level overlap or latent embeddings."
                ))
        except Exception as e:
            findings.append(Finding(
                id=f"finding_{uuid.uuid4().hex[:8]}",
                rule_id="LEAK_TRAIN_TEST_CONTAMINATION",
                category=FindingCategory.SPLIT,
                severity=FindingSeverity.LOW,
                status=CheckStatus.WARNING,
                title="Could Not Complete Split Overlap Comparison",
                explanation=f"Comparison failed due to mismatched column schemas: {str(e)}",
                affected_columns=[],
                evidence={"error": str(e)},
                recommended_action="Verify both partitions share identical column names.",
                confidence=0.5,
                limitations="Requires matching column sets."
            ))
    else:
        # Single dataset mode
        findings.append(Finding(
            id=f"finding_{uuid.uuid4().hex[:8]}",
            rule_id="LEAK_TRAIN_TEST_CONTAMINATION",
            category=FindingCategory.SPLIT,
            severity=FindingSeverity.INFO,
            status=CheckStatus.UNAVAILABLE,
            title="Train/Test Contamination Check Unavailable (Single Dataset Mode)",
            explanation="Only a single dataset was uploaded. Train/test split contamination checks can only be evaluated when separate training and holdout partitions are supplied.",
            affected_columns=[],
            evidence={"mode": "single_dataset"},
            recommended_action="When evaluating your split pipeline, provide separate training and test sets to detect data leakage across partitions.",
            confidence=1.0,
            limitations="Single-table audits cannot confirm partition hygiene without separate split sets."
        ))
        
    return findings
