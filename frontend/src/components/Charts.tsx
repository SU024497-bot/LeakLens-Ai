import React from 'react';
import { ColumnProfile, CorrelationInfo, Finding } from '../types/audit';

interface MissingValueBarChartProps {
  columns: ColumnProfile[];
}

export const MissingValueBarChart: React.FC<MissingValueBarChartProps> = ({ columns }) => {
  // Sort columns with missing values descending
  const missingCols = columns
    .filter((c) => c.null_count > 0)
    .sort((a, b) => b.null_percentage - a.null_percentage)
    .slice(0, 8);

  if (missingCols.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-vanilla-card border border-vanilla-border text-center">
        <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-700 mb-2 font-bold">
          ✓ 100% Complete
        </div>
        <h4 className="text-sm font-bold text-indigo-brand">Zero Missing Values</h4>
        <p className="text-xs text-indigo-brand/70 mt-1">
          Every cell in this dataset contains populated observations.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-vanilla-card border border-vanilla-border shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-indigo-brand">
            Missing Values by Feature
          </h4>
          <p className="text-xs text-indigo-brand/70">
            Top incomplete columns ranked by null ratio
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-indigo-brand px-2 py-0.5 rounded bg-indigo-brand/10">
          {missingCols.length} Flagged
        </span>
      </div>

      <div className="space-y-3">
        {missingCols.map((col) => {
          const isCrit = col.null_percentage > 50;
          const barColor = isCrit ? 'bg-status-critical' : 'bg-status-medium';
          
          return (
            <div key={col.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-medium text-indigo-brand truncate max-w-[180px]">
                  {col.name}
                </span>
                <span className="font-bold text-indigo-brand/90 font-mono">
                  {col.null_count.toLocaleString()} ({col.null_percentage}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-vanilla-subtle overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-700`}
                  style={{ width: `${Math.min(100, Math.max(2, col.null_percentage))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface CorrelationBarChartProps {
  correlations: CorrelationInfo[];
}

export const CorrelationBarChart: React.FC<CorrelationBarChartProps> = ({ correlations }) => {
  const topCorrs = correlations.slice(0, 6);

  if (topCorrs.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-vanilla-card border border-vanilla-border text-center">
        <h4 className="text-sm font-bold text-indigo-brand">No High Pairwise Correlations</h4>
        <p className="text-xs text-indigo-brand/70 mt-1">
          No feature pairs reached the correlation threshold (r &gt; 0.50).
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-vanilla-card border border-vanilla-border shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-indigo-brand">
            High Feature Associations
          </h4>
          <p className="text-xs text-indigo-brand/70">
            Computed bivariate statistical dependence
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-indigo-brand px-2 py-0.5 rounded bg-indigo-brand/10">
          Top {topCorrs.length}
        </span>
      </div>

      <div className="space-y-3.5">
        {topCorrs.map((c, i) => {
          const isSuspicious = c.value >= 0.88;
          const barColor = isSuspicious ? 'bg-status-critical' : 'bg-indigo-brand';

          return (
            <div key={`${c.column1}-${c.column2}-${i}`} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                  <span className="font-mono text-indigo-brand font-medium truncate">{c.column1}</span>
                  <span className="text-indigo-brand/40">↔</span>
                  <span className="font-mono text-indigo-brand font-medium truncate">{c.column2}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-indigo-brand/60 uppercase">{c.metric_name}</span>
                  <span className={`font-mono font-bold ${isSuspicious ? 'text-status-critical' : 'text-indigo-brand'}`}>
                    {c.value.toFixed(3)}
                  </span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-vanilla-subtle overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-700`}
                  style={{ width: `${Math.min(100, Math.max(5, c.value * 100))}%` }}
                />
              </div>
              <div className="text-[11px] text-indigo-brand/60 italic">
                {c.interpretation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface CategoryBreakdownProps {
  findings: Finding[];
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ findings }) => {
  const counts = {
    QUALITY: findings.filter((f) => f.category === 'QUALITY' && f.status !== 'PASSED').length,
    LEAKAGE: findings.filter((f) => f.category === 'LEAKAGE' && f.status !== 'PASSED').length,
    SCHEMA: findings.filter((f) => f.category === 'SCHEMA' && f.status !== 'PASSED').length,
    SPLIT: findings.filter((f) => f.category === 'SPLIT' && f.status !== 'PASSED').length,
  };

  const total = counts.QUALITY + counts.LEAKAGE + counts.SCHEMA + counts.SPLIT;

  return (
    <div className="p-5 rounded-xl bg-vanilla-card border border-vanilla-border shadow-subtle">
      <h4 className="text-sm font-bold text-indigo-brand mb-1">
        Findings by Domain Category
      </h4>
      <p className="text-xs text-indigo-brand/70 mb-4">
        Distribution of detected concerns and heuristic warnings
      </p>

      {total === 0 ? (
        <div className="p-6 text-center text-xs text-emerald-800 font-medium bg-emerald-50 rounded-lg">
          No warnings or issues flagged across any audit category!
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-indigo-brand">Data Leakage Warnings</span>
              <span className="font-mono font-bold text-status-critical">{counts.LEAKAGE}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-vanilla-subtle overflow-hidden">
              <div 
                className="h-full bg-status-critical rounded-full" 
                style={{ width: `${(counts.LEAKAGE / total) * 100}%` }} 
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-indigo-brand">Data Quality Observations</span>
              <span className="font-mono font-bold text-status-medium">{counts.QUALITY}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-vanilla-subtle overflow-hidden">
              <div 
                className="h-full bg-status-medium rounded-full" 
                style={{ width: `${(counts.QUALITY / total) * 100}%` }} 
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-indigo-brand">Schema / Header Flags</span>
              <span className="font-mono font-bold text-indigo-brand">{counts.SCHEMA}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-vanilla-subtle overflow-hidden">
              <div 
                className="h-full bg-indigo-brand rounded-full" 
                style={{ width: `${(counts.SCHEMA / total) * 100}%` }} 
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-indigo-brand">Partition / Split Flags</span>
              <span className="font-mono font-bold text-status-high">{counts.SPLIT}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-vanilla-subtle overflow-hidden">
              <div 
                className="h-full bg-status-high rounded-full" 
                style={{ width: `${(counts.SPLIT / total) * 100}%` }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
