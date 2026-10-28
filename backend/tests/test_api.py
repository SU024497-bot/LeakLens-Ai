import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Neural Nexus" in data["team"]

def test_api_sample_datasets():
    res = client.get("/api/sample-datasets")
    assert res.status_code == 200
    samples = res.json()
    assert len(samples) >= 3
    sample_ids = [s["id"] for s in samples]
    assert "clean_customer_churn" in sample_ids
    assert "leaky_credit_risk" in sample_ids

def test_api_audit_clean_sample():
    res = client.post("/api/audit-sample/clean_customer_churn")
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["filename"] == "sample_clean_churn.csv"
    assert data["risk_summary"]["overall_risk_level"] in ("LOW", "MODERATE")
    assert len(data["column_profiles"]) > 0

def test_api_audit_leaky_sample():
    res = client.post("/api/audit-sample/leaky_credit_risk")
    assert res.status_code == 200
    data = res.json()
    assert data["risk_summary"]["overall_risk_level"] == "CRITICAL"
    # Find direct duplicate finding
    rule_ids = [f["rule_id"] for f in data["findings"]]
    assert "LEAK_EXACT_TARGET_DUPLICATION" in rule_ids
    assert "LEAK_POST_OUTCOME_FEATURE_NAMES" in rule_ids

def test_api_upload_csv_audit():
    csv_bytes = b"id,age,income,defaulted\n1,25,50000,0\n2,35,75000,1\n3,45,120000,0\n"
    files = {"file": ("test_upload.csv", io.BytesIO(csv_bytes), "text/csv")}
    data = {"target_column": "defaulted"}
    
    res = client.post("/api/audit", files=files, data=data)
    assert res.status_code == 200
    body = res.json()
    assert body["summary"]["row_count"] == 3
    assert body["summary"]["target_column"] == "defaulted"

def test_api_reports_endpoints():
    # Audit sample first
    audit_res = client.post("/api/audit-sample/clean_customer_churn")
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    
    # Test HTML report
    html_res = client.post("/api/reports/html", json=audit_data)
    assert html_res.status_code == 200
    assert "text/html" in html_res.headers["content-type"]
    assert "LeakLens AI — Audit Report" in html_res.text
    assert "#282B4A" in html_res.text  # Brand Midnight Indigo check!
    
    # Test CSV report
    csv_res = client.post("/api/reports/csv", json=audit_data)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Finding ID,Rule ID" in csv_res.text
    
    # Test JSON report
    json_res = client.post("/api/reports/json", json=audit_data)
    assert json_res.status_code == 200
    assert "application/json" in json_res.headers["content-type"]
