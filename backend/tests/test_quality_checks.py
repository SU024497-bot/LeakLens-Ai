import pandas as pd
import numpy as np
from backend.app.services.audit_engine.profiler import profile_dataset, infer_column_type
from backend.app.services.audit_engine.quality_checker import run_quality_checks
from backend.app.schemas.audit import CheckStatus, FindingSeverity

def test_infer_column_type():
    assert infer_column_type(pd.Series([1, 2, 3, 4, 5]), "num") == "numeric"
    assert infer_column_type(pd.Series([True, False, True]), "flag") == "boolean"
    assert infer_column_type(pd.Series(["A"] * 10), "const") == "constant"
    assert infer_column_type(pd.Series([f"user_{i}" for i in range(100)]), "user_id") == "id_candidate"

def test_profiler_summary():
    df = pd.DataFrame({
        "id": [1, 2, 3, 4],
        "val": [10.0, np.nan, 30.0, 40.0],
        "category": ["A", "B", "A", "B"]
    })
    summary, profiles, correlations = profile_dataset(df, "test.csv", "csv")
    assert summary.row_count == 4
    assert summary.column_count == 3
    assert summary.total_missing_cells == 1
    assert len(profiles) == 3

def test_quality_checks_detects_duplicates_and_constants():
    # Dataset with 1 duplicate row and 1 constant column
    df = pd.DataFrame({
        "feature_a": [1, 2, 3, 1],
        "feature_b": ["x", "y", "z", "x"],
        "constant_col": ["STATIC", "STATIC", "STATIC", "STATIC"]
    })
    findings = run_quality_checks(df, {"raw_headers": list(df.columns)})
    
    rule_ids = [f.rule_id for f in findings]
    assert "DQ_DUPLICATE_ROWS" in rule_ids
    assert "DQ_CONSTANT_COLUMNS" in rule_ids
    
    dup_finding = next(f for f in findings if f.rule_id == "DQ_DUPLICATE_ROWS")
    assert dup_finding.status == CheckStatus.DETECTED
    assert dup_finding.evidence["duplicate_count"] == 1
    
    const_finding = next(f for f in findings if f.rule_id == "DQ_CONSTANT_COLUMNS")
    assert const_finding.status == CheckStatus.DETECTED
    assert "constant_col" in const_finding.affected_columns

def test_quality_checks_duplicate_headers():
    df = pd.DataFrame([[1, 2]], columns=["col1", "col1.1"])
    findings = run_quality_checks(df, {"raw_headers": ["col1", "col1"]})
    header_finding = next(f for f in findings if f.rule_id == "SCHEMA_DUPLICATE_COLUMNS")
    assert header_finding.status == CheckStatus.DETECTED
    assert "col1" in header_finding.affected_columns
