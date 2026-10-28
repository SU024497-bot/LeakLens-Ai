import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, CheckCircle2, AlertTriangle, AlertOctagon, 
  HelpCircle, Layers, ArrowUpDown, RefreshCw 
} from 'lucide-react';
import { FindingCard } from '../../components/FindingCard';
import { AuditResponse, FindingSeverity, CheckStatus, FindingCategory } from '../../types/audit';

interface ResultsViewProps {
  audit: AuditResponse | null;
  onNavigateUpload: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ audit, onNavigateUpload }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  if (!audit) {
    return (
      <div className="p-8 rounded-2xl bg-vanilla-card border border-vanilla-border text-center max-w-xl mx-auto space-y-4">
        <h3 className="text-xl font-bold text-indigo-brand">No Audit Results Available</h3>
        <p className="text-xs text-indigo-brand/70">
          Upload a dataset to review grouped audit findings, evidence, and recommendations.
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

  const { findings } = audit;

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchesSearch = 
        f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.rule_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.affected_columns.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSeverity = severityFilter === 'ALL' || f.severity === severityFilter;
      const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || f.category === categoryFilter;

      return matchesSearch && matchesSeverity && matchesStatus && matchesCategory;
    });
  }, [findings, searchTerm, severityFilter, statusFilter, categoryFilter]);

  const statusCounts = {
    PASSED: findings.filter((f) => f.status === 'PASSED').length,
    DETECTED: findings.filter((f) => f.status === 'DETECTED').length,
    WARNING: findings.filter((f) => f.status === 'WARNING').length,
    UNAVAILABLE: findings.filter((f) => f.status === 'UNAVAILABLE').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-indigo-brand tracking-tight">
            Audit Findings & Detailed Evidence
          </h2>
          <p className="text-xs sm:text-sm text-indigo-brand/70 mt-1">
            Search, filter, and inspect verified data quality observations, potential leakage indicators, and heuristic warnings.
          </p>
        </div>

        {/* Status Quick Counters */}
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-200">
            {statusCounts.DETECTED} Confirmed
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
            {statusCounts.WARNING} Warnings
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
            {statusCounts.PASSED} Passed
          </span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 rounded-xl bg-vanilla-card border border-vanilla-border flex flex-wrap items-center justify-between gap-3 shadow-subtle">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-brand/50" />
          <input
            type="text"
            placeholder="Search findings, columns, or rule IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-vanilla-border rounded-lg text-indigo-brand focus:outline-none focus:ring-1 focus:ring-indigo-brand placeholder:text-indigo-brand/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-white border border-vanilla-border rounded-lg px-2.5 py-1.5 text-indigo-brand focus:outline-none focus:ring-1 focus:ring-indigo-brand font-medium"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="INFO">Info</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-vanilla-border rounded-lg px-2.5 py-1.5 text-indigo-brand focus:outline-none focus:ring-1 focus:ring-indigo-brand font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="DETECTED">Detected Concerns</option>
            <option value="WARNING">Heuristic Warnings</option>
            <option value="PASSED">Passed Checks</option>
            <option value="UNAVAILABLE">Unavailable Checks</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-vanilla-border rounded-lg px-2.5 py-1.5 text-indigo-brand focus:outline-none focus:ring-1 focus:ring-indigo-brand font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="QUALITY">Data Quality</option>
            <option value="LEAKAGE">Data Leakage</option>
            <option value="SCHEMA">Schema & Headers</option>
            <option value="SPLIT">Train / Test Split</option>
          </select>

          {(searchTerm || severityFilter !== 'ALL' || statusFilter !== 'ALL' || categoryFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSeverityFilter('ALL');
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
              }}
              className="text-xs text-indigo-brand/70 hover:text-indigo-brand underline font-medium px-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Findings Results List */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="p-10 rounded-2xl bg-vanilla-card border border-vanilla-border text-center text-xs text-indigo-brand/60">
            No audit findings match your selected filter criteria.
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))
        )}
      </div>
    </div>
  );
};
