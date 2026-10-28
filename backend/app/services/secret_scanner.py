import re
import math
import os
import io
import zipfile
import logging
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger("leaklens.secret_scanner")

class SecretFinding:
    def __init__(
        self,
        file_path: str,
        line_number: int,
        rule_id: str,
        category: str,
        severity: str,
        secret_redacted: str,
        snippet: str,
        remediation: str,
        confidence: str = "High"
    ):
        self.file_path = file_path
        self.line_number = line_number
        self.rule_id = rule_id
        self.category = category
        self.severity = severity
        self.secret_redacted = secret_redacted
        self.snippet = snippet
        self.remediation = remediation
        self.confidence = confidence

    def to_dict(self) -> Dict[str, Any]:
        return {
            "file_path": self.file_path,
            "line_number": self.line_number,
            "rule_id": self.rule_id,
            "category": self.category,
            "severity": self.severity,
            "secret_redacted": self.secret_redacted,
            "snippet": self.snippet,
            "remediation": self.remediation,
            "confidence": self.confidence,
        }

def calculate_shannon_entropy(text: str) -> float:
    """Calculates Shannon entropy to filter low-entropy dummy placeholder strings."""
    if not text:
        return 0.0
    freq: Dict[str, int] = {}
    for char in text:
        freq[char] = freq.get(char, 0) + 1
    entropy = 0.0
    text_len = len(text)
    for count in freq.values():
        p = count / text_len
        entropy -= p * math.log2(p)
    return entropy

def redact_secret(raw_secret: str) -> str:
    """
    Guarantees that sensitive secrets are NEVER shown in plaintext.
    Formats e.g. 'sk-proj-abc1234567' -> 'sk-p****4567' or 'AKIA1234...' -> 'AKIA****...'
    """
    clean = raw_secret.strip()
    length = len(clean)
    if length <= 6:
        return "****"
    if length <= 12:
        return f"{clean[:2]}****{clean[-2:]}"
    if clean.startswith("sk-proj-"):
        return f"sk-proj-****{clean[-4:]}"
    if clean.startswith("sk-ant-"):
        return f"sk-ant-****{clean[-4:]}"
    if clean.startswith("ghp_"):
        return f"ghp_****{clean[-4:]}"
    if clean.startswith("AKIA"):
        return f"AKIA****{clean[-4:]}"
    # General formula: preserve first 4 chars, mask middle, show last 4
    return f"{clean[:4]}****{clean[-4:]}"

# Known placeholder / false-positive tokens
FALSE_POSITIVE_SUBSTRINGS = [
    "example", "placeholder", "dummy", "your_", "your-", "xxx", "insert_", 
    "replace_with", "sample", "test_token", "fake", "mock", "env_var",
    "my_secret", "changeme", "todo", "<api_key>", "[api_key]", "{api_key}"
]

PATTERNS = [
    {
        "id": "SEC_AWS_ACCESS_KEY",
        "category": "Cloud Infrastructure",
        "severity": "CRITICAL",
        "regex": re.compile(r"\b(AKIA[0-9A-Z]{16})\b"),
        "remediation": "Revoke this AWS Access Key immediately in the AWS IAM Console and rotate credentials."
    },
    {
        "id": "SEC_AWS_SECRET_KEY",
        "category": "Cloud Infrastructure",
        "severity": "CRITICAL",
        "regex": re.compile(r"""(?i)(?:aws_secret_access_key|aws_secret_key)\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?"""),
        "remediation": "Immediately revoke and rotate the corresponding AWS secret key."
    },
    {
        "id": "SEC_OPENAI_API_KEY",
        "category": "AI / ML Platforms",
        "severity": "CRITICAL",
        "regex": re.compile(r"\b(sk-(?:proj-)?[a-zA-Z0-9_\-]{20,})\b"),
        "remediation": "Revoke this key in the OpenAI API dashboard and load keys from environment variables or secrets managers."
    },
    {
        "id": "SEC_ANTHROPIC_API_KEY",
        "category": "AI / ML Platforms",
        "severity": "CRITICAL",
        "regex": re.compile(r"\b(sk-ant-[a-zA-Z0-9_\-]{20,})\b"),
        "remediation": "Revoke this Anthropic key in the Anthropic console."
    },
    {
        "id": "SEC_GOOGLE_API_KEY",
        "category": "Cloud / API Services",
        "severity": "HIGH",
        "regex": re.compile(r"\b(AIzaSy[0-9A-Za-z_-]{33})\b"),
        "remediation": "Restrict or delete this Google Cloud API key in the Google Cloud Console."
    },
    {
        "id": "SEC_HUGGINGFACE_TOKEN",
        "category": "AI / ML Platforms",
        "severity": "HIGH",
        "regex": re.compile(r"\b(hf_[a-zA-Z0-9]{34,})\b"),
        "remediation": "Invalidate this HuggingFace Access Token in your HuggingFace user account settings."
    },
    {
        "id": "SEC_GITHUB_TOKEN",
        "category": "Version Control",
        "severity": "CRITICAL",
        "regex": re.compile(r"\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})\b"),
        "remediation": "Revoke this personal access token in GitHub Developer Settings."
    },
    {
        "id": "SEC_GITLAB_TOKEN",
        "category": "Version Control",
        "severity": "CRITICAL",
        "regex": re.compile(r"\b(glpat-[0-9a-zA-Z\-]{20,})\b"),
        "remediation": "Revoke this token in GitLab User Settings > Access Tokens."
    },
    {
        "id": "SEC_SLACK_TOKEN",
        "category": "Communication APIs",
        "severity": "HIGH",
        "regex": re.compile(r"\b(xox[baprs]-[0-9a-zA-Z]{10,48})\b"),
        "remediation": "Revoke this Slack API token in the Slack API App dashboard."
    },
    {
        "id": "SEC_STRIPE_KEY",
        "category": "Payment Services",
        "severity": "CRITICAL",
        "regex": re.compile(r"\b([sr]k_live_[0-9a-zA-Z]{24,})\b"),
        "remediation": "Immediately roll your live Stripe secret API key in the Stripe Dashboard."
    },
    {
        "id": "SEC_PRIVATE_KEY",
        "category": "Cryptographic Keys",
        "severity": "CRITICAL",
        "regex": re.compile(r"(-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----)"),
        "remediation": "Replace this private key pair immediately; never commit raw private keys to source control."
    },
    {
        "id": "SEC_DATABASE_CONNECTION_URI",
        "category": "Databases & Storage",
        "severity": "HIGH",
        "regex": re.compile(r"""\b((?:postgres|postgresql|mysql|mongodb|mongodb\+srv|redis)://[a-zA-Z0-9_]+:([^\s@'"<>]+)@[a-zA-Z0-9.-]+(?::[0-9]+)?/[a-zA-Z0-9_.-]+)\b"""),
        "remediation": "Extract database credentials into protected environment variables or secret vaults."
    },
    {
        "id": "SEC_HIGH_ENTROPY_ASSIGNMENT",
        "category": "Hardcoded Credentials",
        "severity": "MEDIUM",
        "regex": re.compile(r"""(?i)\b(?:api_key|apikey|secret_key|client_secret|auth_token|password|passwd|private_token)\s*[:=]\s*["']([^"'\s]{14,})["']"""),
        "remediation": "Remove hardcoded secret assignments from source files and use .env files included in .gitignore."
    }
]

SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".json", ".yml", ".yaml", 
    ".env", ".toml", ".ini", ".cfg", ".xml", ".html", ".sql", ".sh", 
    ".bash", ".txt", ".md", ".rb", ".go", ".java", ".php", ".c", ".cpp", 
    ".cs", ".dockerfile", "dockerfile"
}

def is_scannable_file(file_name: str) -> bool:
    """Checks whether a file should be scanned based on extension or filename."""
    lower = file_name.lower()
    base = os.path.basename(lower)
    if base.startswith(".env") or base in ("dockerfile", "gemfile", "vagrantfile"):
        return True
    ext = os.path.splitext(lower)[1]
    return ext in SUPPORTED_EXTENSIONS

def scan_text_content(content: str, file_path: str) -> List[SecretFinding]:
    """Scans text content line by line against regex patterns and entropy thresholds."""
    findings: List[SecretFinding] = []
    lines = content.splitlines()

    for line_idx, line in enumerate(lines, start=1):
        # Skip comment headers or huge minified lines
        if len(line) > 2000:
            continue

        for rule in PATTERNS:
            for match in rule["regex"].finditer(line):
                # Target secret is either group 1 or group 2 or whole match
                groups = match.groups()
                secret_str = groups[0] if groups else match.group(0)
                if len(groups) > 1 and groups[1]:
                    secret_str = groups[1]

                lower_sec = secret_str.lower()
                # Check false positive list
                if any(fp in lower_sec for fp in FALSE_POSITIVE_SUBSTRINGS):
                    continue

                # For generic high entropy assignment, verify entropy
                if rule["id"] == "SEC_HIGH_ENTROPY_ASSIGNMENT":
                    ent = calculate_shannon_entropy(secret_str)
                    if ent < 3.2:
                        continue

                # Redact
                redacted = redact_secret(secret_str)

                # Create snippet with secret replaced by redacted value
                start, end = match.span()
                redacted_line = line[:start] + line[start:end].replace(secret_str, redacted) + line[end:]
                snippet = redacted_line.strip()
                if len(snippet) > 140:
                    snippet = snippet[:140] + "..."

                findings.append(SecretFinding(
                    file_path=file_path,
                    line_number=line_idx,
                    rule_id=rule["id"],
                    category=rule["category"],
                    severity=rule["severity"],
                    secret_redacted=redacted,
                    snippet=snippet,
                    remediation=rule["remediation"],
                    confidence="Definite Match" if rule["severity"] == "CRITICAL" else "Heuristic Match"
                ))

    return findings

def validate_zip_safe(zip_file: zipfile.ZipFile, max_files: int = 2000, max_uncompressed_bytes: int = 100 * 1024 * 1024) -> None:
    """
    Prevents Zip-Slip / Path Traversal and Zip-Bomb attacks.
    Ensures no member contains '..', starts with '/', or exceeds uncompressed size limits.
    """
    total_uncompressed = 0
    file_count = 0

    for info in zip_file.infolist():
        # Check path traversal
        norm_name = os.path.normpath(info.filename)
        if norm_name.startswith("..") or os.path.isabs(info.filename) or "/../" in info.filename or "\\..\\" in info.filename:
            raise ValueError(f"Security Alert: Malicious path traversal detected in ZIP entry: '{info.filename}'")

        file_count += 1
        if file_count > max_files:
            raise ValueError(f"ZIP contains too many files (>{max_files}). Aborting extraction for safety.")

        total_uncompressed += info.file_size
        if total_uncompressed > max_uncompressed_bytes:
            raise ValueError(f"ZIP uncompressed payload exceeds safe limit of {max_uncompressed_bytes // (1024*1024)} MB.")

def scan_zip_archive(zip_bytes: bytes, zip_name: str) -> Tuple[List[SecretFinding], int]:
    """
    Safely inspects a ZIP archive in memory without executing code or disk extraction.
    Returns (findings, total_files_scanned).
    """
    findings: List[SecretFinding] = []
    scanned_count = 0

    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
            validate_zip_safe(zf)

            for member in zf.infolist():
                if member.is_dir():
                    continue

                if not is_scannable_file(member.filename):
                    continue

                # Read and decode safely
                try:
                    with zf.open(member) as f:
                        raw_data = f.read(2 * 1024 * 1024) # Cap 2MB per file
                    
                    text = None
                    for enc in ("utf-8", "latin-1", "cp1252"):
                        try:
                            text = raw_data.decode(enc)
                            break
                        except UnicodeDecodeError:
                            continue

                    if text is not None:
                        scanned_count += 1
                        file_findings = scan_text_content(text, f"{zip_name} :: {member.filename}")
                        findings.extend(file_findings)

                except Exception as e:
                    logger.warning(f"Error scanning member {member.filename}: {e}")
                    continue

    except zipfile.BadZipFile:
        raise ValueError("The provided file is not a valid or readable ZIP archive.")

    return findings, scanned_count
