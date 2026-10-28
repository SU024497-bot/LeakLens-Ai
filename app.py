import os
import sys
import io
import json
import csv
import zipfile
from pathlib import Path
from typing import List, Dict, Any, Optional

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath("."))

import streamlit as st
import pandas as pd

# Import existing backend modules
from backend.app.services.secret_scanner import (
    scan_text_content, scan_zip_archive, redact_secret, 
    SecretFinding, PATTERNS, SUPPORTED_EXTENSIONS
)
from backend.app.services.parser import (
    parse_dataset_file, discover_excel_sheets, ParsingError
)
from backend.app.services.audit_engine.engine import audit_dataset
from backend.app.services.audit_engine.report_generator import (
    generate_html_report, generate_csv_report, generate_json_report
)

# -----------------------------------------------------------------------------
# Streamlit Page Configuration & Brand Styling
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="LeakLens AI — Security & Data Leakage Lab",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Brand CSS Customization (Midnight Indigo #282B4A & Vanilla #EEEBDA)
st.markdown("""
<style>
    /* Primary brand fonts & palette */
    :root {
        --indigo-brand: #282B4A;
        --indigo-dark: #1F213A;
        --vanilla-bg: #EEEBDA;
        --vanilla-card: #F6F4EB;
        --vanilla-border: #D7D1BA;
    }
    
    .stApp {
        background-color: #EEEBDA;
        color: #282B4A;
    }

    h1, h2, h3 {
        color: #282B4A !important;
        font-weight: 800 !important;
        letter-spacing: -0.5px;
    }

    .stButton>button {
        background-color: #282B4A;
        color: #EEEBDA !important;
        border-radius: 8px;
        font-weight: 700;
        border: none;
        padding: 0.5rem 1.2rem;
        transition: all 0.2s ease;
    }
    .stButton>button:hover {
        background-color: #1F213A;
        color: #FFFFFF !important;
        box-shadow: 0 4px 12px rgba(40, 43, 74, 0.15);
    }

    /* Metric cards */
    div[data-testid="stMetricValue"] {
        color: #282B4A !important;
        font-weight: 800;
    }
    div[data-testid="stMetricLabel"] {
        color: #575A75 !important;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.75rem;
    }

    /* Status Badges */
    .badge-critical {
        background-color: #FEE2E2;
        color: #991B1B;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 0.75rem;
        border: 1px solid #FCA5A5;
    }
    .badge-high {
        background-color: #FFEDD5;
        color: #9A3412;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 0.75rem;
        border: 1px solid #FDBA74;
    }
    .badge-medium {
        background-color: #FEF3C7;
        color: #92400E;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 0.75rem;
        border: 1px solid #FDE68A;
    }
    .badge-success {
        background-color: #D1FAE5;
        color: #065F46;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 0.75rem;
        border: 1px solid #A7F3D0;
    }
</style>
""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Sidebar Configuration & Navigation
# -----------------------------------------------------------------------------
st.sidebar.markdown("""
<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
    <div style="background: #282B4A; color: #EEEBDA; padding: 8px 12px; border-radius: 8px; font-weight: 800; font-size: 1.1rem;">
        🛡️ LL
    </div>
    <div>
        <div style="font-weight: 800; font-size: 1.2rem; color: #282B4A; line-height: 1;">LeakLens AI</div>
        <div style="font-size: 0.65rem; color: #575A75; text-transform: uppercase; font-weight: 700;">Security & Audit Lab</div>
    </div>
</div>
""", unsafe_allow_html=True)

mode = st.sidebar.radio(
    "Select Inspection Mode:",
    ["🔐 Secret & Credential Scanner", "📊 Dataset & ML Data-Leakage Auditor", "ℹ️ Rule Catalog & Security Specs"]
)

st.sidebar.markdown("---")
st.sidebar.markdown("**Team:** Neural Nexus  \n**Authors:** Aayush Varshney & Sonali")
st.sidebar.markdown("**Runtime:** Local-First / Privacy-Preserving")

# -----------------------------------------------------------------------------
# MODE 1: Secret & Credential Leakage Scanner
# -----------------------------------------------------------------------------
if mode == "🔐 Secret & Credential Scanner":
    st.title("🔐 Exposed Secret & Credential Scanner")
    st.markdown(
        "Audit source code files and ZIP repositories for exposed API tokens, cloud infrastructure credentials, "
        "cryptographic private keys, and high-entropy secrets with **guaranteed value redaction**."
    )

    col_bench, col_upload = st.columns([1, 2])

    with col_bench:
        st.markdown("##### 🚀 Quick Demo Benchmarks")
        st.markdown("Test with synthetic sample code:")
        
        btn_vulnerable = st.button("📂 Load Leaky Code File", use_container_width=True)
        btn_zip = st.button("📦 Load Leaky Repo (ZIP)", use_container_width=True)
        btn_clean = st.button("✅ Load Clean Source Code", use_container_width=True)

    with col_upload:
        st.markdown("##### 📤 Upload File or Repository")
        uploaded_file = st.file_uploader(
            "Upload source file (.py, .js, .ts, .env, .json, .yml, .sql, etc.) or a ZIP archive:",
            type=["py", "js", "ts", "tsx", "jsx", "env", "json", "yml", "yaml", "toml", "ini", "sql", "sh", "txt", "md", "zip"],
            help="Files are processed in memory and never stored or transmitted to external AI endpoints."
        )

    # Resolve target to scan
    scan_target_bytes: Optional[bytes] = None
    scan_target_name: Optional[str] = None
    is_zip = False

    sample_dir = Path("backend/sample_data")
    if btn_vulnerable:
        sample_path = sample_dir / "sample_vulnerable_code.py"
        if sample_path.exists():
            scan_target_bytes = sample_path.read_bytes()
            scan_target_name = "sample_vulnerable_code.py"
            is_zip = False
    elif btn_zip:
        sample_path = sample_dir / "sample_leaky_repo.zip"
        if sample_path.exists():
            scan_target_bytes = sample_path.read_bytes()
            scan_target_name = "sample_leaky_repo.zip"
            is_zip = True
    elif btn_clean:
        sample_path = sample_dir / "sample_clean_code.py"
        if sample_path.exists():
            scan_target_bytes = sample_path.read_bytes()
            scan_target_name = "sample_clean_code.py"
            is_zip = False
    elif uploaded_file is not None:
        scan_target_bytes = uploaded_file.getvalue()
        scan_target_name = uploaded_file.name
        is_zip = scan_target_name.lower().endswith(".zip")

    if scan_target_bytes and scan_target_name:
        st.info(f"Target selected: **{scan_target_name}** ({len(scan_target_bytes) / 1024:.1f} KB)")
        
        if st.button("⚡ Execute Security Scan", type="primary", use_container_width=True):
            findings: List[SecretFinding] = []
            files_scanned = 0
            scan_error: Optional[str] = None

            with st.spinner("Analyzing code for hardcoded secrets, API tokens, and credentials..."):
                try:
                    if is_zip:
                        findings, files_scanned = scan_zip_archive(scan_target_bytes, scan_target_name)
                    else:
                        files_scanned = 1
                        text = None
                        for enc in ("utf-8", "latin-1", "cp1252"):
                            try:
                                text = scan_target_bytes.decode(enc)
                                break
                            except UnicodeDecodeError:
                                continue
                        if text is None:
                            scan_error = "Could not decode file contents as valid text."
                        else:
                            findings = scan_text_content(text, scan_target_name)
                except ValueError as ve:
                    scan_error = str(ve)
                except Exception as e:
                    scan_error = f"Unexpected scanning failure: {str(e)}"

            if scan_error:
                st.error(f"⚠️ Scan Blocked: {scan_error}")
            else:
                st.markdown("### 📊 Scan Summary & Findings")
                
                crit_count = sum(1 for f in findings if f.severity == "CRITICAL")
                high_count = sum(1 for f in findings if f.severity == "HIGH")
                med_count = sum(1 for f in findings if f.severity == "MEDIUM")

                m1, m2, m3, m4 = st.columns(4)
                m1.metric("Files Scanned", files_scanned)
                m2.metric("Total Leaks Found", len(findings))
                m3.metric("Critical Leaks", crit_count)
                m4.metric("High Severity", high_count)

                st.markdown("---")

                if len(findings) == 0:
                    st.success("✅ **Zero Exposed Secrets Detected!** All scanned code passed credential-leakage heuristics.")
                else:
                    st.warning(f"⚠️ **Security Alert:** Detected {len(findings)} exposed secret(s) requiring remediation.")

                    # Findings Table Overview
                    table_rows = []
                    for f in findings:
                        table_rows.append({
                            "File": f.file_path,
                            "Line": f.line_number,
                            "Category": f.category,
                            "Severity": f.severity,
                            "Redacted Secret": f.secret_redacted,
                            "Rule ID": f.rule_id,
                            "Confidence": f.confidence
                        })
                    st.dataframe(pd.DataFrame(table_rows), use_container_width=True)

                    # Expandable Detailed Cards
                    st.markdown("#### 🔍 Finding Inspector & Remediation Guidance")
                    for idx, f in enumerate(findings, start=1):
                        with st.expander(f"#{idx} [{f.severity}] {f.category} in `{f.file_path}` (Line {f.line_number})", expanded=(idx <= 3)):
                            col_det1, col_det2 = st.columns([1, 1])
                            with col_det1:
                                st.markdown(f"**Rule Identifier:** `{f.rule_id}`")
                                st.markdown(f"**Confidence Level:** {f.confidence}")
                                st.markdown(f"**Redacted Value:** `{f.secret_redacted}`")
                            with col_det2:
                                st.markdown(f"**Severity:** `{f.severity}`")
                                st.markdown(f"**File Location:** `{f.file_path}:{f.line_number}`")

                            st.markdown("**Context Snippet (Redacted):**")
                            st.code(f.snippet, language="python")

                            st.markdown(f"💡 **Recommended Action:** {f.remediation}")

                    # Downloadable Reports
                    st.markdown("---")
                    st.markdown("#### 📥 Download Security Audit Deliverables")
                    
                    rep_col1, rep_col2 = st.columns(2)
                    
                    # CSV Export
                    csv_io = io.StringIO()
                    writer = csv.writer(csv_io)
                    writer.writerow(["File", "Line", "Rule ID", "Category", "Severity", "Redacted Secret", "Snippet", "Remediation", "Confidence"])
                    for f in findings:
                        writer.writerow([f.file_path, f.line_number, f.rule_id, f.category, f.severity, f.secret_redacted, f.snippet, f.remediation, f.confidence])
                    
                    with rep_col1:
                        st.download_button(
                            label="📄 Download CSV Findings Report",
                            data=csv_io.getvalue(),
                            file_name=f"leaklens_secrets_{scan_target_name}.csv",
                            mime="text/csv",
                            use_container_width=True
                        )

                    # JSON Export
                    json_data = json.dumps([f.to_dict() for f in findings], indent=2)
                    with rep_col2:
                        st.download_button(
                            label="📋 Download JSON Security Audit",
                            data=json_data,
                            file_name=f"leaklens_secrets_{scan_target_name}.json",
                            mime="application/json",
                            use_container_width=True
                        )

# -----------------------------------------------------------------------------
# MODE 2: Dataset Quality & ML Data-Leakage Auditor
# -----------------------------------------------------------------------------
elif mode == "📊 Dataset & ML Data-Leakage Auditor":
    st.title("📊 Dataset Quality & ML Data-Leakage Auditor")
    st.markdown(
        "Inspect tabular CSV & Excel workbooks before machine-learning training. "
        "Detect data quality defects, direct target replicas, post-outcome signals, and correlation anomalies."
    )

    col_d_bench, col_d_upload = st.columns([1, 2])

    with col_d_bench:
        st.markdown("##### 🚀 Preset Benchmarks")
        btn_churn = st.button("📈 Clean Customer Churn (Baseline)", use_container_width=True)
        btn_credit = st.button("🚨 High-Leakage Credit Risk", use_container_width=True)
        btn_excel = st.button("📊 Multi-Sheet Retail Sales", use_container_width=True)

    with col_d_upload:
        st.markdown("##### 📤 Upload Tabular Dataset")
        uploaded_dataset = st.file_uploader(
            "Upload CSV or Excel workbook (.csv, .xlsx):",
            type=["csv", "xlsx"],
            help="Files are processed temporarily in memory with resource limits (50 MB / 250,000 rows)."
        )

    # Resolve dataset to audit
    target_data_bytes: Optional[bytes] = None
    target_data_name: Optional[str] = None
    recommended_target: Optional[str] = None

    sample_dir = Path("backend/sample_data")
    if btn_churn:
        p = sample_dir / "sample_clean_churn.csv"
        if p.exists():
            target_data_bytes = p.read_bytes()
            target_data_name = "sample_clean_churn.csv"
            recommended_target = "churn"
    elif btn_credit:
        p = sample_dir / "sample_leaky_credit.csv"
        if p.exists():
            target_data_bytes = p.read_bytes()
            target_data_name = "sample_leaky_credit.csv"
            recommended_target = "loan_default"
    elif btn_excel:
        p = sample_dir / "sample_multisheet_sales.xlsx"
        if p.exists():
            target_data_bytes = p.read_bytes()
            target_data_name = "sample_multisheet_sales.xlsx"
            recommended_target = "high_value_order"
    elif uploaded_dataset is not None:
        target_data_bytes = uploaded_dataset.getvalue()
        target_data_name = uploaded_dataset.name

    if target_data_bytes and target_data_name:
        st.info(f"Active Dataset: **{target_data_name}** ({len(target_data_bytes) / 1024:.1f} KB)")
        
        col_cfg1, col_cfg2 = st.columns(2)
        with col_cfg1:
            target_col_input = st.text_input(
                "Target / Label Column (Optional):",
                value=recommended_target or "",
                help="Required for target duplication and correlation leakage checks."
            )
        
        selected_sheet = None
        if target_data_name.lower().endswith(".xlsx"):
            # Discover worksheets safely in memory
            with col_cfg2:
                try:
                    tmp_excel_path = Path(f"temp_{target_data_name}")
                    tmp_excel_path.write_bytes(target_data_bytes)
                    sheets = discover_excel_sheets(tmp_excel_path)
                    tmp_excel_path.unlink(missing_ok=True)
                    selected_sheet = st.selectbox("Select Excel Worksheet:", sheets)
                except Exception as e:
                    st.warning(f"Could not read worksheets: {e}")

        if st.button("🔍 Execute Dataset Audit", type="primary", use_container_width=True):
            with st.spinner("Analyzing dataset quality, semantic profiles, and potential leakage..."):
                tmp_path = Path(f"audit_temp_{target_data_name}")
                try:
                    tmp_path.write_bytes(target_data_bytes)
                    df, meta = parse_dataset_file(tmp_path, target_data_name, selected_sheet=selected_sheet)
                    audit_res = audit_dataset(
                        df=df,
                        parser_metadata=meta,
                        target_column=target_col_input.strip() if target_col_input.strip() else None
                    )
                except ParsingError as pe:
                    st.error(f"Parsing Failure: {pe.message}")
                    audit_res = None
                except Exception as e:
                    st.error(f"Audit Failure: {str(e)}")
                    audit_res = None
                finally:
                    tmp_path.unlink(missing_ok=True)

            if audit_res:
                summary = audit_res.summary
                risk = audit_res.risk_summary

                st.markdown("### 📊 Dataset Profiling & Risk Summary")
                
                # Metrics Bar
                m1, m2, m3, m4, m5 = st.columns(5)
                m1.metric("Total Rows", f"{summary.row_count:,}")
                m2.metric("Total Columns", summary.column_count)
                m3.metric("Duplicate Rows", f"{summary.duplicate_row_count:,} ({summary.duplicate_row_percentage}%)")
                m4.metric("Missing Cells", f"{summary.total_missing_cells:,} ({summary.total_missing_percentage}%)")
                m5.metric("Target Variable", summary.target_column or "Unspecified")

                # Risk Gauge Box
                risk_color = (
                    "badge-critical" if risk.overall_risk_level == "CRITICAL" else
                    "badge-high" if risk.overall_risk_level == "ELEVATED" else
                    "badge-medium" if risk.overall_risk_level == "MODERATE" else "badge-success"
                )
                
                st.markdown(f"""
                <div style="background: #FFFFFF; border: 1px solid #D7D1BA; border-radius: 10px; padding: 16px; margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span class="{risk_color}">{risk.overall_risk_level} RISK (Score: {risk.overall_risk_score} / 100)</span>
                            <h4 style="margin: 8px 0 4px 0; color: #282B4A;">Transparent Risk Penalty Index</h4>
                            <p style="font-size: 0.8rem; color: #575A75; margin: 0;">{risk.score_calculation_rationale}</p>
                        </div>
                        <div style="text-align: right; font-size: 0.8rem;">
                            <div>Critical Findings: <strong>{risk.critical_findings_count}</strong></div>
                            <div>High Warnings: <strong>{risk.high_findings_count}</strong></div>
                            <div>Passed Checks: <strong>{risk.passed_checks_count}</strong></div>
                        </div>
                    </div>
                </div>
                """, unsafe_allow_html=True)

                # Column Profiles Table
                st.markdown("#### 📋 Data Dictionary & Semantic Column Profiles")
                col_data = []
                for c in audit_res.column_profiles:
                    col_data.append({
                        "Column": c.name,
                        "Type": c.inferred_type,
                        "Missing (Count / %)": f"{c.null_count:,} ({c.null_percentage}%)",
                        "Unique Values": f"{c.unique_count:,} ({c.unique_percentage}%)",
                        "Flags": ", ".join(c.suspicious_flags) if c.suspicious_flags else "None",
                        "Samples": ", ".join([str(s) for s in c.sample_values[:3]])
                    })
                st.dataframe(pd.DataFrame(col_data), use_container_width=True)

                # Findings Catalog
                st.markdown("#### 🚨 Audit Findings & Heuristic Alerts")
                for f in audit_res.findings:
                    sev_class = (
                        "badge-critical" if f.severity == "CRITICAL" else
                        "badge-high" if f.severity == "HIGH" else
                        "badge-medium" if f.severity == "MEDIUM" else "badge-success"
                    )
                    with st.expander(f"[{f.severity}] {f.title} ({f.rule_id})"):
                        st.markdown(f"**Explanation:** {f.explanation}")
                        if f.affected_columns:
                            st.markdown(f"**Affected Columns:** `{', '.join(f.affected_columns)}`")
                        st.markdown(f"**Recommendation:** {f.recommended_action}")
                        st.markdown(f"**Known Rule Limitation:** *{f.limitations}*")

                # Downloadable Reports
                st.markdown("---")
                st.markdown("#### 📥 Export Audit Reports")
                r1, r2, r3 = st.columns(3)
                
                with r1:
                    html_rep = generate_html_report(audit_res)
                    st.download_button(
                        label="🌐 Download Standalone HTML Report",
                        data=html_rep,
                        file_name=f"leaklens_report_{summary.filename}.html",
                        mime="text/html",
                        use_container_width=True
                    )
                with r2:
                    csv_rep = generate_csv_report(audit_res)
                    st.download_button(
                        label="📄 Download CSV Findings Report",
                        data=csv_rep,
                        file_name=f"leaklens_findings_{summary.filename}.csv",
                        mime="text/csv",
                        use_container_width=True
                    )
                with r3:
                    json_rep = generate_json_report(audit_res)
                    st.download_button(
                        label="📋 Download JSON Audit Payload",
                        data=json_rep,
                        file_name=f"leaklens_audit_{summary.filename}.json",
                        mime="application/json",
                        use_container_width=True
                    )

# -----------------------------------------------------------------------------
# MODE 3: Security Specifications & Rule Catalog
# -----------------------------------------------------------------------------
else:
    st.title("ℹ️ Security Architecture & Rule Catalog")
    st.markdown("Detailed specifications of LeakLens AI detection patterns, privacy models, and static analysis boundaries.")

    st.markdown("### 🔐 Credential Detection Rules")
    rule_table = []
    for p in PATTERNS:
        rule_table.append({
            "Rule ID": p["id"],
            "Category": p["category"],
            "Severity": p["severity"],
            "Remediation": p["remediation"]
        })
    st.dataframe(pd.DataFrame(rule_table), use_container_width=True)

    st.markdown("### 🛡️ Zip-Slip & Path Traversal Protections")
    st.markdown("""
    When ZIP archives are submitted:
    1. Every archived entry path is normalized and inspected to ensure it does not contain relative path traversals (`..`), absolute root references (`/` or `C:\\`), or Windows system paths.
    2. Archives with members exceeding extraction safety thresholds (max 2,000 files, max 100 MB uncompressed payload) are aborted immediately to prevent compression bombs.
    3. Content is decompressed in RAM without writing executable files or script binaries to local disk.
    """)

    st.markdown("### 📊 Machine Learning Data-Leakage Heuristics")
    st.markdown(r"""
    - **Target Replicas:** Exact cell-for-cell equality between candidate features and the outcome variable.
    - **Suspicious Bivariate Association:** Statistical dependence exceeding $r \ge 0.88$ (via Pearson $|r|$, Cramér's V, or Correlation Ratio $\eta$).
    - **Post-Outcome Feature Nomenclature:** Lexical identification of columns populated after the event (e.g. resolution notes, cancellation reasons, payout totals).
    - **Train / Test Record Contamination:** Exact duplicate observations leaking across cross-validation or holdout partitions.
    """)

# -----------------------------------------------------------------------------
# Footer
# -----------------------------------------------------------------------------
st.markdown("---")
st.markdown("""
<div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #575A75;">
    <div>LeakLens AI • Developed by <strong>Neural Nexus</strong> (Aayush Varshney & Sonali)</div>
    <div>Local-First • No External AI APIs Required • MIT License</div>
</div>
""", unsafe_allow_html=True)
