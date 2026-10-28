import io
import csv
import json
import html
from typing import Dict, Any
from backend.app.schemas.audit import AuditResponse, FindingSeverity, CheckStatus

def generate_json_report(audit_response: AuditResponse) -> str:
    """Serializes the complete audit response to formatted JSON."""
    return json.dumps(audit_response.model_dump(), indent=2, default=str)

def generate_csv_report(audit_response: AuditResponse) -> str:
    """Generates a clean tabular CSV export of all findings and checks."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Finding ID",
        "Rule ID",
        "Category",
        "Severity",
        "Status",
        "Title",
        "Explanation",
        "Affected Columns",
        "Recommended Action",
        "Confidence",
        "Limitations"
    ])
    
    for f in audit_response.findings:
        writer.writerow([
            f.id,
            f.rule_id,
            f.category.value,
            f.severity.value,
            f.status.value,
            f.title,
            f.explanation,
            "; ".join(f.affected_columns),
            f.recommended_action,
            f.confidence if f.confidence is not None else "N/A",
            f.limitations
        ])
        
    return output.getvalue()

def generate_html_report(audit_response: AuditResponse) -> str:
    """
    Generates a standalone, beautifully styled HTML executive report
    in the Midnight Indigo (#282B4A) and Vanilla (#EEEBDA) brand theme.
    """
    summary = audit_response.summary
    risk = audit_response.risk_summary
    
    # Severity badge color mapping
    def get_badge(severity: FindingSeverity, status: CheckStatus) -> str:
        if status == CheckStatus.PASSED:
            return '<span class="badge badge-success">PASSED</span>'
        if status == CheckStatus.UNAVAILABLE:
            return '<span class="badge badge-neutral">UNAVAILABLE</span>'
        if severity == FindingSeverity.CRITICAL:
            return '<span class="badge badge-critical">CRITICAL</span>'
        if severity == FindingSeverity.HIGH:
            return '<span class="badge badge-high">HIGH</span>'
        if severity == FindingSeverity.MEDIUM:
            return '<span class="badge badge-medium">MEDIUM</span>'
        return '<span class="badge badge-low">LOW / INFO</span>'
        
    findings_rows = ""
    for f in audit_response.findings:
        aff = ", ".join(f.affected_columns) if f.affected_columns else "<em>Whole Dataset</em>"
        badge = get_badge(f.severity, f.status)
        findings_rows += f"""
        <tr class="finding-row {f.severity.value.lower()}">
            <td>{badge}</td>
            <td><strong>{html.escape(f.category.value)}</strong><br><small>{html.escape(f.rule_id)}</small></td>
            <td>
                <strong>{html.escape(f.title)}</strong>
                <p class="desc">{html.escape(f.explanation)}</p>
                <div class="evidence"><strong>Evidence:</strong> {html.escape(json.dumps(f.evidence, default=str))}</div>
                <div class="action"><strong>Recommendation:</strong> {html.escape(f.recommended_action)}</div>
            </td>
            <td><code>{html.escape(aff)}</code></td>
        </tr>
        """
        
    column_rows = ""
    for col in audit_response.column_profiles:
        flags = " ".join([f'<span class="col-flag">{html.escape(fl)}</span>' for fl in col.suspicious_flags]) or "-"
        column_rows += f"""
        <tr>
            <td><strong>{html.escape(col.name)}</strong></td>
            <td><span class="type-pill">{html.escape(col.inferred_type)}</span></td>
            <td>{col.null_count:,} ({col.null_percentage}%)</td>
            <td>{col.unique_count:,} ({col.unique_percentage}%)</td>
            <td>{flags}</td>
        </tr>
        """

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LeakLens AI Audit Report — {html.escape(summary.filename)}</title>
    <style>
        :root {{
            --midnight-indigo: #282B4A;
            --midnight-dark: #1F213A;
            --vanilla: #EEEBDA;
            --vanilla-card: #F7F5EC;
            --vanilla-border: #D8D4C2;
            --text-dark: #1C1E33;
            --text-muted: #575A75;
            --critical-red: #DC2626;
            --high-orange: #EA580C;
            --medium-amber: #D97706;
            --success-green: #059669;
            --blue-info: #2563EB;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--vanilla);
            color: var(--text-dark);
            line-height: 1.5;
            padding: 30px;
        }}
        .container {{
            max-width: 1100px;
            margin: 0 auto;
            background: #FFFFFF;
            border-radius: 12px;
            border: 1px solid var(--vanilla-border);
            box-shadow: 0 10px 25px rgba(40, 43, 74, 0.08);
            overflow: hidden;
        }}
        .header {{
            background-color: var(--midnight-indigo);
            color: #FFFFFF;
            padding: 35px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .header-title h1 {{ font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }}
        .header-title p {{ color: var(--vanilla); opacity: 0.85; margin-top: 4px; font-size: 14px; }}
        .header-meta {{ text-align: right; font-size: 13px; color: var(--vanilla); }}
        .content {{ padding: 35px 40px; }}
        .section {{ margin-bottom: 35px; }}
        .section-title {{
            font-size: 18px;
            font-weight: 700;
            color: var(--midnight-indigo);
            border-bottom: 2px solid var(--vanilla-border);
            padding-bottom: 8px;
            margin-bottom: 18px;
        }}
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 25px;
        }}
        .metric-card {{
            background: var(--vanilla-card);
            border: 1px solid var(--vanilla-border);
            border-radius: 8px;
            padding: 16px;
        }}
        .metric-card .label {{ font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }}
        .metric-card .val {{ font-size: 22px; font-weight: 700; color: var(--midnight-indigo); margin-top: 4px; }}
        .risk-banner {{
            background: var(--midnight-dark);
            color: #FFFFFF;
            border-radius: 8px;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }}
        .risk-level {{
            font-size: 22px;
            font-weight: 800;
            padding: 4px 14px;
            border-radius: 6px;
            display: inline-block;
        }}
        .risk-low {{ background: var(--success-green); color: #fff; }}
        .risk-moderate {{ background: var(--medium-amber); color: #fff; }}
        .risk-elevated {{ background: var(--high-orange); color: #fff; }}
        .risk-critical {{ background: var(--critical-red); color: #fff; }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-top: 10px;
        }}
        th, td {{
            padding: 12px 14px;
            border-bottom: 1px solid var(--vanilla-border);
            text-align: left;
            vertical-align: top;
        }}
        th {{
            background: var(--vanilla-card);
            color: var(--midnight-indigo);
            font-weight: 600;
        }}
        .badge {{
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            display: inline-block;
        }}
        .badge-critical {{ background: #FEE2E2; color: #991B1B; }}
        .badge-high {{ background: #FFEDD5; color: #9A3412; }}
        .badge-medium {{ background: #FEF3C7; color: #92400E; }}
        .badge-low {{ background: #EFF6FF; color: #1E40AF; }}
        .badge-success {{ background: #D1FAE5; color: #065F46; }}
        .badge-neutral {{ background: #F3F4F6; color: #4B5563; }}
        .type-pill {{ background: #E0E7FF; color: #3730A3; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; }}
        .col-flag {{ background: #FEE2E2; color: #B91C1C; padding: 2px 5px; border-radius: 3px; font-size: 10px; font-weight: 600; }}
        .desc {{ margin: 5px 0; color: #333; }}
        .evidence {{ font-size: 11px; background: #F9FAFB; padding: 6px 10px; border-radius: 4px; border-left: 3px solid var(--midnight-indigo); margin-top: 6px; }}
        .action {{ font-size: 11px; color: #065F46; background: #ECFDF5; padding: 6px 10px; border-radius: 4px; margin-top: 6px; }}
        .footer {{
            background: var(--vanilla-card);
            border-top: 1px solid var(--vanilla-border);
            padding: 20px 40px;
            font-size: 12px;
            color: var(--text-muted);
            display: flex;
            justify-content: space-between;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-title">
                <h1>LeakLens AI — Audit Report</h1>
                <p>Dataset Quality and Potential Data Leakage Assessment</p>
            </div>
            <div class="header-meta">
                <div><strong>Audited File:</strong> {html.escape(summary.filename)}</div>
                <div><strong>Audit Timestamp:</strong> {audit_response.timestamp}</div>
                <div><strong>Team:</strong> Neural Nexus</div>
            </div>
        </div>
        
        <div class="content">
            <!-- Risk Banner -->
            <div class="risk-banner">
                <div>
                    <div style="font-size: 13px; opacity: 0.85; margin-bottom: 4px;">OVERALL LEAKAGE & QUALITY RISK EVALUATION</div>
                    <div class="risk-level risk-{risk.overall_risk_level.lower()}">{risk.overall_risk_level} (Score: {risk.overall_risk_score} / 100)</div>
                    <div style="font-size: 12px; margin-top: 6px; opacity: 0.9;"><strong>Formula:</strong> {html.escape(risk.score_calculation_rationale)}</div>
                </div>
                <div style="text-align: right; font-size: 13px;">
                    <div>Critical Findings: <strong>{risk.critical_findings_count}</strong></div>
                    <div>High Warnings: <strong>{risk.high_findings_count}</strong></div>
                    <div>Medium Warnings: <strong>{risk.medium_findings_count}</strong></div>
                    <div>Passed Checks: <strong>{risk.passed_checks_count}</strong></div>
                </div>
            </div>
            
            <!-- Dataset Profiling Metrics -->
            <div class="section">
                <div class="section-title">Dataset Summary</div>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="label">Total Rows</div>
                        <div class="val">{summary.row_count:,}</div>
                    </div>
                    <div class="metric-card">
                        <div class="label">Total Columns</div>
                        <div class="val">{summary.column_count}</div>
                    </div>
                    <div class="metric-card">
                        <div class="label">Duplicate Rows</div>
                        <div class="val">{summary.duplicate_row_count:,} ({summary.duplicate_row_percentage}%)</div>
                    </div>
                    <div class="metric-card">
                        <div class="label">Missing Cells</div>
                        <div class="val">{summary.total_missing_cells:,} ({summary.total_missing_percentage}%)</div>
                    </div>
                    <div class="metric-card">
                        <div class="label">Target Column</div>
                        <div class="val" style="font-size: 16px;">{html.escape(summary.target_column or "Not Specified")}</div>
                    </div>
                </div>
            </div>
            
            <!-- Audit Findings -->
            <div class="section">
                <div class="section-title">Detailed Audit Findings & Heuristic Warnings</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 100px;">Status</th>
                            <th style="width: 160px;">Category / Rule</th>
                            <th>Title & Evidence / Recommended Action</th>
                            <th style="width: 160px;">Affected Columns</th>
                        </tr>
                    </thead>
                    <tbody>
                        {findings_rows}
                    </tbody>
                </table>
            </div>
            
            <!-- Column Profiles -->
            <div class="section">
                <div class="section-title">Column Profiles & Inferred Types</div>
                <table>
                    <thead>
                        <tr>
                            <th>Column Name</th>
                            <th>Inferred Type</th>
                            <th>Missing (Count / %)</th>
                            <th>Unique (Count / %)</th>
                            <th>Suspicious Indicators</th>
                        </tr>
                    </thead>
                    <tbody>
                        {column_rows}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="footer">
            <div>LeakLens AI | Built by Neural Nexus (Aayush Varshney & Sonali)</div>
            <div>Core engine operates locally without external LLM/cloud dependencies.</div>
        </div>
    </div>
</body>
</html>
"""
    return html_content
