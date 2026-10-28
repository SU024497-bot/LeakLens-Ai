import pandas as pd
import numpy as np
from backend.app.services.audit_engine.leakage_checker import run_leakage_checks
from backend.app.schemas.audit import CheckStatus, FindingSeverity

def test_leakage_target_unspecified():
    df = pd.DataFrame({
        "feature1": [1, 2, 3],
        "churn": [0, 1, 0]
    })
    findings = run_leakage_checks(df, target_column=None)
    unavail = next(f for f in findings if f.rule_id == "LEAK_TARGET_UNSPECIFIED")
    assert unavail.status == CheckStatus.UNAVAILABLE
    assert "churn" in unavail.affected_columns

def test_leakage_exact_target_duplication():
    targets = [0, 1, 0, 1, 0, 1]
    df = pd.DataFrame({
        "user_id": [1, 2, 3, 4, 5, 6],
        "target": targets,
        "target_copy": targets, # exact replica!
        "random_val": [10, 20, 15, 25, 12, 19]
    })
    findings = run_leakage_checks(df, target_column="target")
    dup_leak = next(f for f in findings if f.rule_id == "LEAK_EXACT_TARGET_DUPLICATION")
    assert dup_leak.status == CheckStatus.DETECTED
    assert dup_leak.severity == FindingSeverity.CRITICAL
    assert "target_copy" in dup_leak.affected_columns

def test_leakage_post_outcome_feature_names():
    df = pd.DataFrame({
        "account_id": [1, 2, 3],
        "churn": [0, 1, 0],
        "cancellation_reason": ["None", "Too expensive", "None"],
        "post_resolution_payout": [0, 150, 0]
    })
    findings = run_leakage_checks(df, target_column="churn")
    post_leak = next(f for f in findings if f.rule_id == "LEAK_POST_OUTCOME_FEATURE_NAMES")
    assert post_leak.status == CheckStatus.WARNING
    assert "cancellation_reason" in post_leak.affected_columns
    assert "post_resolution_payout" in post_leak.affected_columns

def test_leakage_train_test_contamination():
    train_df = pd.DataFrame({
        "id": [1, 2, 3, 4],
        "feature": ["a", "b", "c", "d"],
        "target": [0, 1, 0, 1]
    })
    # Overlapping 2 rows
    test_df = pd.DataFrame({
        "id": [3, 4, 5, 6],
        "feature": ["c", "d", "e", "f"],
        "target": [0, 1, 0, 1]
    })
    findings = run_leakage_checks(train_df, target_column="target", test_df=test_df)
    contam = next(f for f in findings if f.rule_id == "LEAK_TRAIN_TEST_CONTAMINATION")
    assert contam.status == CheckStatus.DETECTED
    assert contam.severity == FindingSeverity.CRITICAL
    assert contam.evidence["overlapping_rows"] == 2
