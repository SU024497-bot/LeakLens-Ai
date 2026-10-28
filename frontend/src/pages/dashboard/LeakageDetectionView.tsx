import React from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, HelpCircle, 
  ArrowRight, Sparkles, AlertOctagon, Lock 
} from 'lucide-react';
import { FindingCard } from '../../components/FindingCard';
import { RiskGauge } from '../../components/RiskGauge';
import { AuditResponse } from '../../types/audit';

interface LeakageDetectionViewProps {
  audit: AuditResponse | null;
  onNavigateUpload: () => void;
}

export const LeakageDetectionView: React.FC<LeakageDetectionViewProps> = ({ audit, onNavigateUpload }) => {
  if (!audit) {
    return (
      <div className="p-8 rounded-2xl bg-vanilla-card border border-vanilla-border text-center max-w-xl mx-auto space-y-4">
        <h3 className="text-xl font-bold text-indigo-brand">No Active Audit Session</h3>
        <p className="text-xs text-indigo-brand/70">
          Upload a dataset to evaluate target duplication, correlation anomalies, and post-outcome lookahead.
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

  const { summary, risk_summary, findings } = audit;
  const leakageFindings = findings.filter(
    (f) => (f.category === 'LEAKAGE' || f.category === 'SPLIT')
  );

  const hasUnspecifiedTarget = findings.some((f) => f.rule_id === 'LEAK_TARGET_UNSPECIFIED');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-indigo-brand tracking-tight">
          Potential Data Leakage Detection
        </h2>
        <p className="text-xs sm:text-sm text-indigo-brand/70 mt-1">
          Heuristic risk evaluation for target replicas, post-outcome signals, high bivariate correlations, and split contamination.
        </p>
      </div>

      {/* Target Unspecified Alert if applicable */}
      {hasUnspecifiedTarget && (
        <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Target Column Not Specified for this Audit</span>
          </div>
          <p className="text-xs text-amber-800/90 leading-relaxed">
            Target-dependent leakage checks (such as exact target duplication, strong proxy variables, and correlation anomalies) 
            require designating an outcome label. You can configure a target variable by auditing the dataset again.
          </p>
          <div className="pt-1">
            <button
              onClick={onNavigateUpload}
              className="px-3.5 py-1.5 rounded-lg bg-amber-700 text-white text-xs font-bold hover:bg-amber-800 transition-colors inline-flex items-center gap-1.5"
            >
              <span>Designate Target Variable in Upload</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Risk Summary Card */}
      <RiskGauge risk={risk_summary} />

      {/* Leakage Methodology Callout */}
      <div className="p-4 rounded-xl bg-vanilla-card border border-vanilla-border text-xs space-y-1.5 text-indigo-brand/80">
        <div className="font-bold text-indigo-brand uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-brand" />
          <span>Scientific Disclosure & Heuristic Boundaries</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          LeakLens AI does not claim that every kind of data leakage can be conclusively proven from a static dataset. 
          The indicators below represent statistical anomalies and nomenclature patterns that strongly warrant 
          investigation with domain engineers before training predictive models.
        </p>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-indigo-brand">
            Evaluated Leakage & Partition Checks ({leakageFindings.length})
          </h3>
          <span className="text-xs font-mono text-indigo-brand/60">
            Target: <strong>{summary.target_column || 'None'}</strong>
          </span>
        </div>

        <div className="space-y-3">
          {leakageFindings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      </div>
    </div>
  );
};
