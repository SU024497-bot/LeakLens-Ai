import React, { useState } from 'react';
import { 
  FileDown, FileCode, FileSpreadsheet, Globe, 
  CheckCircle2, Download, ExternalLink, Loader2 
} from 'lucide-react';
import { downloadReport } from '../../services/api';
import { AuditResponse } from '../../types/audit';

interface ReportsViewProps {
  audit: AuditResponse | null;
  onNavigateUpload: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ audit, onNavigateUpload }) => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  if (!audit) {
    return (
      <div className="p-8 rounded-2xl bg-vanilla-card border border-vanilla-border text-center max-w-xl mx-auto space-y-4">
        <h3 className="text-xl font-bold text-indigo-brand">No Audit Report Available</h3>
        <p className="text-xs text-indigo-brand/70">
          Upload and audit a dataset to export standalone reports in JSON, CSV, and HTML formats.
        </p>
        <button
          onClick={onNavigateUpload}
          className="px-5 py-2.5 rounded-xl bg-indigo-brand text-vanilla-brand text-xs font-bold"
        >
          Upload Dataset
        </button>
      </div>
    );
  }

  const handleDownload = async (format: 'json' | 'csv' | 'html') => {
    setDownloadingFormat(format);
    try {
      await downloadReport(audit, format);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-indigo-brand tracking-tight">
          Audit Reports & Data Governance Export
        </h2>
        <p className="text-xs sm:text-sm text-indigo-brand/70 mt-1">
          Export verifiable audit artifacts generated from the live in-memory analysis of <strong>{audit.summary.filename}</strong>.
        </p>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* HTML Report */}
        <div className="p-6 rounded-2xl bg-vanilla-card border border-vanilla-border flex flex-col justify-between space-y-4 shadow-subtle hover:border-indigo-brand/60 transition-all">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-indigo-brand text-vanilla-brand w-fit">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-status-success tracking-wider">
                Recommended for Teams
              </span>
              <h3 className="text-lg font-bold text-indigo-brand mt-0.5">
                Standalone HTML Report
              </h3>
            </div>
            <p className="text-xs text-indigo-brand/75 leading-relaxed">
              Self-contained, styled executive report styled with Midnight Indigo & Vanilla branding. 
              Opens directly in any browser without external server requirements.
            </p>
          </div>

          <button
            onClick={() => handleDownload('html')}
            disabled={downloadingFormat === 'html'}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-brand text-vanilla-brand text-xs font-bold hover:bg-indigo-brand/90 transition-all flex items-center justify-center gap-2 shadow-subtle disabled:opacity-50"
          >
            {downloadingFormat === 'html' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download HTML Report</span>
          </button>
        </div>

        {/* CSV Findings Export */}
        <div className="p-6 rounded-2xl bg-vanilla-card border border-vanilla-border flex flex-col justify-between space-y-4 shadow-subtle hover:border-indigo-brand/60 transition-all">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-indigo-brand text-vanilla-brand w-fit">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-brand/60 tracking-wider">
                Tabular Data
              </span>
              <h3 className="text-lg font-bold text-indigo-brand mt-0.5">
                Findings CSV Table
              </h3>
            </div>
            <p className="text-xs text-indigo-brand/75 leading-relaxed">
              Clean tabular spreadsheet containing every rule ID, affected columns, severity ratings, 
              recommended remediation actions, and confidence levels.
            </p>
          </div>

          <button
            onClick={() => handleDownload('csv')}
            disabled={downloadingFormat === 'csv'}
            className="w-full py-2.5 px-4 rounded-xl border border-vanilla-border bg-white text-indigo-brand text-xs font-bold hover:bg-vanilla-card transition-all flex items-center justify-center gap-2 shadow-subtle disabled:opacity-50"
          >
            {downloadingFormat === 'csv' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download CSV Findings</span>
          </button>
        </div>

        {/* JSON Structured Export */}
        <div className="p-6 rounded-2xl bg-vanilla-card border border-vanilla-border flex flex-col justify-between space-y-4 shadow-subtle hover:border-indigo-brand/60 transition-all">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-indigo-brand text-vanilla-brand w-fit">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-brand/60 tracking-wider">
                Machine-Readable
              </span>
              <h3 className="text-lg font-bold text-indigo-brand mt-0.5">
                Structured JSON Audit
              </h3>
            </div>
            <p className="text-xs text-indigo-brand/75 leading-relaxed">
              Complete machine-readable JSON object with dataset summary, column statistics, correlation matrices, 
              and finding dictionaries for CI/CD integration.
            </p>
          </div>

          <button
            onClick={() => handleDownload('json')}
            disabled={downloadingFormat === 'json'}
            className="w-full py-2.5 px-4 rounded-xl border border-vanilla-border bg-white text-indigo-brand text-xs font-bold hover:bg-vanilla-card transition-all flex items-center justify-center gap-2 shadow-subtle disabled:opacity-50"
          >
            {downloadingFormat === 'json' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download JSON Audit</span>
          </button>
        </div>
      </div>

      {/* Embedded Live Report Preview */}
      <div className="p-6 rounded-2xl bg-vanilla-card border border-vanilla-border space-y-4 shadow-subtle">
        <div className="flex items-center justify-between border-b border-vanilla-border/60 pb-3">
          <h3 className="text-base font-bold text-indigo-brand">
            Audit Report Summary Preview
          </h3>
          <span className="text-xs font-mono text-indigo-brand/60">
            {audit.findings.length} Total Rules Evaluated
          </span>
        </div>

        <div className="p-5 rounded-xl bg-white border border-vanilla-border space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row justify-between gap-4 pb-3 border-b border-vanilla-border/40">
            <div>
              <div className="font-bold text-sm text-indigo-brand">
                {audit.summary.filename}
              </div>
              <div className="text-indigo-brand/70 font-mono text-[11px] mt-0.5">
                {audit.summary.row_count.toLocaleString()} rows • {audit.summary.column_count} columns • Target: {audit.summary.target_column || 'None'}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-brand/60 block">
                Evaluated Risk Index
              </span>
              <span className="text-sm font-extrabold text-indigo-brand">
                {audit.risk_summary.overall_risk_level} ({Math.round(audit.risk_summary.overall_risk_score)} / 100)
              </span>
            </div>
          </div>

          {/* Quick Table Snippet */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-vanilla-card text-indigo-brand/70 uppercase font-mono font-bold">
                <tr>
                  <th className="p-2">Status</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Rule Title</th>
                  <th className="p-2">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vanilla-border/40">
                {audit.findings.slice(0, 5).map((f) => (
                  <tr key={f.id}>
                    <td className="p-2 font-bold font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        f.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' :
                        f.status === 'DETECTED' ? 'bg-rose-100 text-rose-800' :
                        f.status === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="p-2 font-semibold text-indigo-brand">{f.category}</td>
                    <td className="p-2 font-medium text-indigo-brand">{f.title}</td>
                    <td className="p-2 text-indigo-brand/80 max-w-xs truncate">{f.recommended_action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {audit.findings.length > 5 && (
            <div className="text-center text-[11px] text-indigo-brand/50 italic pt-1">
              + {audit.findings.length - 5} more findings included in the full exported reports
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
