import React, { useState } from 'react';
import { 
  AlertOctagon, AlertTriangle, CheckCircle2, HelpCircle, 
  ChevronDown, ChevronUp, ShieldAlert, Sparkles, Layers, ArrowRight
} from 'lucide-react';
import { Finding, CheckStatus, FindingSeverity } from '../types/audit';

interface FindingCardProps {
  finding: Finding;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  const [expanded, setExpanded] = useState(finding.severity === 'CRITICAL' || finding.severity === 'HIGH');

  const statusConfig = {
    PASSED: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: CheckCircle2,
      label: 'Passed Check',
      borderLeft: 'border-l-emerald-500'
    },
    DETECTED: {
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: AlertOctagon,
      label: 'Confirmed Concern',
      borderLeft: 'border-l-rose-500'
    },
    WARNING: {
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: AlertTriangle,
      label: 'Heuristic Warning',
      borderLeft: 'border-l-amber-500'
    },
    UNAVAILABLE: {
      badge: 'bg-gray-100 text-gray-700 border-gray-300',
      icon: HelpCircle,
      label: 'Check Unavailable',
      borderLeft: 'border-l-gray-400'
    }
  }[finding.status];

  const severityConfig = {
    CRITICAL: 'bg-rose-600 text-white',
    HIGH: 'bg-orange-600 text-white',
    MEDIUM: 'bg-amber-600 text-white',
    LOW: 'bg-blue-600 text-white',
    INFO: 'bg-gray-600 text-white',
  }[finding.severity];

  const StatusIcon = statusConfig.icon;

  return (
    <div className={`rounded-xl bg-vanilla-card border border-vanilla-border border-l-4 ${statusConfig.borderLeft} shadow-subtle hover:shadow-elevated transition-all duration-200 overflow-hidden`}>
      {/* Top Header Row */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="p-4 sm:p-5 cursor-pointer flex items-start justify-between gap-4 select-none"
      >
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 shrink-0">
            <StatusIcon className={`w-5 h-5 ${
              finding.status === 'PASSED' ? 'text-emerald-600' :
              finding.status === 'DETECTED' ? 'text-rose-600' :
              finding.status === 'WARNING' ? 'text-amber-600' : 'text-gray-500'
            }`} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wide border ${statusConfig.badge}`}>
                {statusConfig.label}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${severityConfig}`}>
                {finding.severity}
              </span>
              <span className="text-xs font-mono font-medium text-indigo-brand/60">
                {finding.rule_id}
              </span>
              <span className="text-xs font-bold text-indigo-brand/80 px-2 py-0.5 rounded bg-indigo-brand/5">
                {finding.category}
              </span>
            </div>

            <h4 className="text-base font-bold text-indigo-brand tracking-tight">
              {finding.title}
            </h4>

            {!expanded && (
              <p className="text-xs text-indigo-brand/70 line-clamp-1 mt-1">
                {finding.explanation}
              </p>
            )}
          </div>
        </div>

        <button className="text-indigo-brand/60 hover:text-indigo-brand shrink-0 p-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Details Body */}
      {expanded && (
        <div className="px-5 pb-5 pt-1 border-t border-vanilla-border/60 text-xs space-y-4">
          {/* Explanation */}
          <div>
            <span className="font-bold text-indigo-brand uppercase tracking-wider text-[11px]">
              Detailed Explanation:
            </span>
            <p className="text-indigo-brand/80 mt-1 leading-relaxed text-sm">
              {finding.explanation}
            </p>
          </div>

          {/* Affected Columns */}
          {finding.affected_columns && finding.affected_columns.length > 0 && (
            <div>
              <span className="font-bold text-indigo-brand uppercase tracking-wider text-[11px]">
                Affected Feature(s):
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {finding.affected_columns.map((col) => (
                  <span
                    key={col}
                    className="px-2.5 py-1 rounded bg-indigo-brand/10 text-indigo-brand font-mono font-medium text-xs border border-indigo-brand/20"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Container */}
          {finding.evidence && Object.keys(finding.evidence).length > 0 && (
            <div>
              <span className="font-bold text-indigo-brand uppercase tracking-wider text-[11px]">
                Computed Evidence & Measured Metrics:
              </span>
              <div className="mt-1.5 p-3 rounded-lg bg-white/80 border border-vanilla-border font-mono text-[11px] text-indigo-brand overflow-x-auto">
                <pre>{JSON.stringify(finding.evidence, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Recommended Action */}
          <div className="p-3.5 rounded-lg bg-emerald-50/80 border border-emerald-200">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold uppercase tracking-wider text-[11px] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Recommended Action:</span>
            </div>
            <p className="text-emerald-900 leading-relaxed text-xs">
              {finding.recommended_action}
            </p>
          </div>

          {/* Limitations and Confidence */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2 border-t border-vanilla-border/50 text-[11px] text-indigo-brand/70">
            <div>
              <span className="font-semibold text-indigo-brand">Rule Limitations: </span>
              <span>{finding.limitations}</span>
            </div>
            {finding.confidence !== null && finding.confidence !== undefined && (
              <div className="shrink-0">
                <span className="font-semibold text-indigo-brand">Confidence: </span>
                <span className="font-mono">{Math.round(finding.confidence * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
