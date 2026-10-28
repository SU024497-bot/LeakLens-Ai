import io
import zipfile
import pytest
from backend.app.services.secret_scanner import (
    redact_secret, scan_text_content, scan_zip_archive, validate_zip_safe, SecretFinding
)

def test_redact_secret():
    # OpenAI key
    raw_openai = "sk-proj-1234567890abcdef1234567890abcdef1234"
    redacted = redact_secret(raw_openai)
    assert "sk-proj-****" in redacted
    assert raw_openai not in redacted
    assert redacted.endswith("1234")

    # AWS Key
    raw_aws = "AKIA1234567890ABCDEF"
    redacted_aws = redact_secret(raw_aws)
    assert "AKIA****CDEF" == redacted_aws
    assert raw_aws not in redacted_aws

    # Short secret
    assert redact_secret("short") == "****"

def test_scan_text_detects_secrets():
    content = """
    # Configuration file
    AWS_KEY = "AKIAIOSFODNN7ABCDEFG"
    OPENAI_API_KEY = "sk-proj-abcde1234567890fghij1234567890klmno"
    GITHUB_PAT = "ghp_1234567890abcdefghijklmnopqrstuvwxyz"
    """
    findings = scan_text_content(content, "config.py")
    rule_ids = [f.rule_id for f in findings]
    
    assert "SEC_AWS_ACCESS_KEY" in rule_ids
    assert "SEC_OPENAI_API_KEY" in rule_ids
    assert "SEC_GITHUB_TOKEN" in rule_ids

    for f in findings:
        assert f.secret_redacted.count("****") > 0
        assert f.severity in ("CRITICAL", "HIGH", "MEDIUM")

def test_scan_text_ignores_placeholders():
    content = """
    # Dummy template
    API_KEY = "your_api_key_here"
    OPENAI_KEY = "insert_openai_key_example"
    AWS_ID = "AKIA_PLACEHOLDER_DEMO"
    """
    findings = scan_text_content(content, "template.env")
    assert len(findings) == 0

def test_scan_text_clean_file():
    clean_code = """
    def add(a, b):
        return a + b
    
    print("Clean mathematical script with zero credentials")
    """
    findings = scan_text_content(clean_code, "math_utils.py")
    assert len(findings) == 0

def test_zip_path_traversal_detection():
    # Create malicious ZIP in memory with path traversal ../
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zf:
        zf.writestr("../../etc/passwd", "root:x:0:0:")
        
    zip_bytes = zip_buffer.getvalue()
    with pytest.raises(ValueError) as exc:
        scan_zip_archive(zip_bytes, "malicious.zip")
    assert "path traversal" in str(exc.value).lower()

def test_safe_zip_archive_scanning():
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zf:
        zf.writestr("src/main.py", 'print("Hello world")\n')
        zf.writestr("src/credentials.py", 'SLACK_BOT = "xoxb-1234567890-abcdefghijklm"\n')
        
    zip_bytes = zip_buffer.getvalue()
    findings, count = scan_zip_archive(zip_bytes, "project.zip")
    assert count == 2
    assert len(findings) == 1
    assert findings[0].rule_id == "SEC_SLACK_TOKEN"
    assert "xoxb" in findings[0].secret_redacted
