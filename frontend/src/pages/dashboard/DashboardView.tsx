import React from 'react';
import { 
  Database, FileSpreadsheet, AlertTriangle, ShieldCheck, 
  ShieldAlert, ArrowRight, UploadCloud, CheckCircle2, RefreshCw
} from 'lucide-react';
import { MetricCard } from '../../components/MetricCard';
import { RiskGauge } from '../../components/RiskGauge';
import { CategoryBreakdown, MissingValueBarChart } from '../../components/Charts';
import { AuditResponse } from '../../types/audit';
import { DashboardTab } from '../../components/Sidebar';

interface DashboardViewProps {
  audit: AuditResponse | null;
  onNavigate: (tab: DashboardTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ audit, onNavigate }) => {
  if (!audit) {
    return (
      <div className="space-y-6">
        <div className="p-8 rounded-2xl bg-vanilla-card border border-vanilla-border text-center max-w-xl mx-auto space-y-4 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-indigo-brand/10 text-indigo-brand flex items-center justify-center mx-auto">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-indigo-brand">
            No Dataset Currently Audited
          </h3>
          <p className="text-xs text-indigo-brand/70 leading-relaxed max-w-md mx-auto">
            Upload your CSV or Excel workbook, or test with one of our preconfigured benchmarks 
            to inspect data quality defects and potential leakage.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('upload')}
              className="px-6 py-2.5 rounded-xl bg-indigo-brand text-vanilla-brand text-xs font-bold hover:bg-indigo-brand/90 transition-all shadow-subtle inline-flex items-center gap-2"
            >
              <span>Go to Upload Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { summary, risk_summary, findings, column_profiles } = audit;
  const criticalFindings = findings.filter((f) => f.severity === 'CRITICAL' && f.status !== 'PASSED');
  const leakageFindings = findings.filter((f) => f.category === 'LEAKAGE' && f.status !== 'PASSED');

  return (
    <div className="space-y-8">
      {/* Top Banner / Dataset Status */}
      <div className="p-6 rounded-2xl bg-vanilla-card border border-vanilla-border shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-brand text-vanilla-brand">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-indigo-brand">
                {summary.filename}
              </h2>
              {summary.sheet_name && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-brand/10 text-indigo-brand font-bold">
                  Sheet: {summary.sheet_name}
                </span>
              )}
            </div>
            <p className="text-xs text-indigo-brand/70 mt-0.5 font-mono">
              Audit ID: {audit.audit_id} • Completed at {audit.timestamp}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => onNavigate('upload')}
            className="w-full md:w-auto px-4 py-2 rounded-xl border border-vanilla-border bg-white text-indigo-brand text-xs font-bold hover:bg-vanilla-card transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Audit New File</span>
          </button>
          <button
            onClick={() => onNavigate('results')}
            className="w-full md:w-auto px-4 py-2 rounded-xl bg-indigo-brand text-vanilla-brand text-xs font-bold hover:bg-indigo-brand/90 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Review Findings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Transparent Risk Summary Gauge */}
      <RiskGauge risk={risk_summary} />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Dataset Dimensions"
          value={`${summary.row_count.toLocaleString()} × ${summary.column_count}`}
          subtitle={`${summary.memory_usage_mb} MB in-memory footprint`}
          icon={Database}
          badge={{ text: summary.file_format.toUpperCase(), variant: 'info' }}
        />

        <MetricCard
          title="Missing Cells"
          value={`${summary.total_missing_cells.toLocaleString()}`}
          subtitle={`${summary.total_missing_percentage}% total matrix sparsity`}
          icon={AlertTriangle}
          badge={{
            text: summary.total_missing_percentage > 20 ? 'High' : 'Normal',
            variant: summary.total_missing_percentage > 20 ? 'warning' : 'success',
          }}
        />

        <MetricCard
          title="Exact Duplicate Rows"
          value={`${summary.duplicate_row_count.toLocaleString()}`}
          subtitle={`${summary.duplicate_row_percentage}% duplicated observations`}
          icon={FileSpreadsheet}
          badge={{
            text: summary.duplicate_row_count > 0 ? 'Duplicates Flagged' : 'Unique',
            variant: summary.duplicate_row_count > 0 ? 'danger' : 'success',
          }}
        />

        <MetricCard
          title="Target Variable"
          value={summary.target_column || 'Unspecified'}
          subtitle={summary.target_type ? `Inferred Type: ${summary.target_type}` : 'Required for leakage checks'}
          icon={ShieldCheck}
          badge={{
            text: summary.target_column ? 'Target Set' : 'Unsupervised',
            variant: summary.target_column ? 'success' : 'neutral',
          }}
        />
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBreakdown findings={findings} />
        <MissingValueBarChart columns={column_profiles} />
      </div>

      {/* Quick Findings Highlights */}
      <div className="p-6 rounded-2xl bg-vanilla-card border border-vanilla-border space-y-4 shadow-subtle">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-indigo-brand">
              Priority Findings Requiring Review
            </h3>
            <p className="text-xs text-indigo-brand/70">
              Top critical concerns and high heuristic warnings
            </p>
          </div>
          <button
            onClick={() => onNavigate('results')}
            className="text-xs font-bold text-indigo-brand hover:underline flex items-center gap-1"
          >
            <span>View All {findings.length} Findings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {criticalFindings.length === 0 && leakageFindings.length === 0 ? (
          <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>No critical defects or severe data leakage indicators were detected in this dataset.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {[...criticalFindings, ...leakageFindings].slice(0, 3).map((f) => (
              <div
                key={f.id}
                onClick={() => onNavigate('results')}
                className="p-4 rounded-xl bg-white border border-vanilla-border hover:border-indigo-brand/60 transition-all cursor-pointer flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      f.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {f.severity}
                    </span>
                    <span className="text-xs font-bold text-indigo-brand">
                      {f.title}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-brand/70 line-clamp-1">
                    {f.explanation}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-brand/40 shrink-0 mt-1" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
