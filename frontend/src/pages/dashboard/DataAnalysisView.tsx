import React from 'react';
import { 
  Database, AlertTriangle, Layers, ArrowUpDown, 
  Search, CheckCircle2, FileSpreadsheet, BarChart2 
} from 'lucide-react';
import { DataTable } from '../../components/DataTable';
import { MissingValueBarChart, CorrelationBarChart } from '../../components/Charts';
import { MetricCard } from '../../components/MetricCard';
import { AuditResponse } from '../../types/audit';

interface DataAnalysisViewProps {
  audit: AuditResponse | null;
  onNavigateUpload: () => void;
}

export const DataAnalysisView: React.FC<DataAnalysisViewProps> = ({ audit, onNavigateUpload }) => {
  if (!audit) {
    return (
      <div className="p-8 rounded-2xl bg-vanilla-card border border-vanilla-border text-center max-w-xl mx-auto space-y-4">
        <h3 className="text-xl font-bold text-indigo-brand">
          No Audit Active
        </h3>
        <p className="text-xs text-indigo-brand/70">
          Upload a dataset to inspect its profiling statistics, data dictionary, and correlation matrix.
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

  const { summary, column_profiles, correlations } = audit;
  const constantColumns = column_profiles.filter((c) => c.inferred_type === 'constant');
  const idColumns = column_profiles.filter((c) => c.inferred_type === 'id_candidate');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-indigo-brand tracking-tight">
          Data Profiling & Semantic Analysis
        </h2>
        <p className="text-xs sm:text-sm text-indigo-brand/70 mt-1">
          Detailed breakdown of matrix dimensions, semantic type inferences, missingness rates, and bivariate correlations.
        </p>
      </div>

      {/* Profiling Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Observations"
          value={summary.row_count.toLocaleString()}
          subtitle={`${summary.duplicate_row_count} duplicate rows (${summary.duplicate_row_percentage}%)`}
          icon={Database}
        />
        <MetricCard
          title="Feature Columns"
          value={summary.column_count}
          subtitle={`${constantColumns.length} constant / zero-variance`}
          icon={Layers}
          badge={{
            text: constantColumns.length > 0 ? `${constantColumns.length} Constant` : 'All Diverse',
            variant: constantColumns.length > 0 ? 'warning' : 'success'
          }}
        />
        <MetricCard
          title="Matrix Missingness"
          value={`${summary.total_missing_percentage}%`}
          subtitle={`${summary.total_missing_cells.toLocaleString()} empty / null cells`}
          icon={AlertTriangle}
          badge={{
            text: summary.total_missing_percentage > 10 ? 'High' : 'Normal',
            variant: summary.total_missing_percentage > 10 ? 'warning' : 'success'
          }}
        />
        <MetricCard
          title="High-Cardinality IDs"
          value={idColumns.length}
          subtitle={`${idColumns.map(c => c.name).slice(0, 2).join(', ') || 'None'}`}
          icon={FileSpreadsheet}
          badge={{
            text: idColumns.length > 0 ? 'Candidates Flagged' : 'None',
            variant: idColumns.length > 0 ? 'neutral' : 'success'
          }}
        />
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MissingValueBarChart columns={column_profiles} />
        <CorrelationBarChart correlations={correlations} />
      </div>

      {/* Interactive Searchable Data Dictionary Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-indigo-brand">
              Searchable Data Dictionary & Feature Profiles
            </h3>
            <p className="text-xs text-indigo-brand/70">
              Filter by inferred data type, search by feature name, and review value samples
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-brand px-2.5 py-1 rounded bg-vanilla-card border border-vanilla-border">
            {column_profiles.length} Total Columns
          </span>
        </div>

        <DataTable columns={column_profiles} />
      </div>
    </div>
  );
};
