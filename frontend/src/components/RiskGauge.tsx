import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { AuditRiskSummary } from '../types/audit';

interface RiskGaugeProps {
  risk: AuditRiskSummary;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ risk }) => {
  const [showFormula, setShowFormula] = useState(false);

  const levelStyles = {
    LOW: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      accent: '#059669',
      border: 'border-emerald-500',
      bgGlow: 'from-emerald-50/50 to-transparent',
      label: 'Low Risk',
      summary: 'Data quality checks passed with minimal or standard observational anomalies.'
    },
    MODERATE: {
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      accent: '#D97706',
      border: 'border-amber-500',
      bgGlow: 'from-amber-50/50 to-transparent',
      label: 'Moderate Risk',
      summary: 'Notable missingness, high-cardinality IDs, or constant features require pipeline cleaning.'
    },
    ELEVATED: {
      badge: 'bg-orange-100 text-orange-800 border-orange-300',
      accent: '#EA580C',
      border: 'border-orange-500',
      bgGlow: 'from-orange-50/50 to-transparent',
      label: 'Elevated Risk',
      summary: 'Suspicious post-outcome feature names or high associations warrant human verification.'
    },
    CRITICAL: {
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      accent: '#DC2626',
      border: 'border-rose-500',
      bgGlow: 'from-rose-50/50 to-transparent',
      label: 'Critical Leakage Risk',
      summary: 'Severe data leakage detected (direct target replicas, 99%+ correlation, or train/test contamination).'
    }
  }[risk.overall_risk_level] || {
    badge: 'bg-gray-100 text-gray-800 border-gray-300',
    accent: '#6B7280',
    border: 'border-gray-400',
    bgGlow: 'from-gray-50/50 to-transparent',
    label: risk.overall_risk_level,
    summary: 'Dataset evaluation complete.'
  };

  // Circumference for 44px radius circle (2 * PI * 44 = 276.46)
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (risk.overall_risk_score / 100) * circumference;

  return (
    <div className={`p-6 rounded-xl bg-vanilla-card border border-vanilla-border relative overflow-hidden shadow-subtle`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${levelStyles.bgGlow} pointer-events-none`} />
      
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Circular Metric */}
        <div className="flex items-center gap-5">
          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-vanilla-subtle"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={levelStyles.accent}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-indigo-brand tracking-tight">
                {Math.round(risk.overall_risk_score)}
              </span>
              <span className="text-[10px] uppercase font-bold text-indigo-brand/60">
                / 100
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${levelStyles.badge}`}>
                {levelStyles.label}
              </span>
              {risk.overall_risk_level === 'CRITICAL' ? (
                <ShieldAlert className="w-4 h-4 text-status-critical" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-status-success" />
              )}
            </div>
            <h3 className="text-lg font-bold text-indigo-brand tracking-tight">
              Dataset Leakage & Quality Risk
            </h3>
            <p className="text-xs text-indigo-brand/80 max-w-md mt-1 leading-relaxed">
              {levelStyles.summary}
            </p>
          </div>
        </div>

        {/* Right: Findings count pills */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="px-3 py-2 rounded-lg bg-white/80 border border-vanilla-border flex flex-col items-center min-w-[70px]">
            <span className="text-xs font-medium text-indigo-brand/60">Critical</span>
            <span className={`text-base font-bold ${risk.critical_findings_count > 0 ? 'text-status-critical' : 'text-indigo-brand'}`}>
              {risk.critical_findings_count}
            </span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-white/80 border border-vanilla-border flex flex-col items-center min-w-[70px]">
            <span className="text-xs font-medium text-indigo-brand/60">High</span>
            <span className={`text-base font-bold ${risk.high_findings_count > 0 ? 'text-status-high' : 'text-indigo-brand'}`}>
              {risk.high_findings_count}
            </span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-white/80 border border-vanilla-border flex flex-col items-center min-w-[70px]">
            <span className="text-xs font-medium text-indigo-brand/60">Medium</span>
            <span className={`text-base font-bold ${risk.medium_findings_count > 0 ? 'text-status-medium' : 'text-indigo-brand'}`}>
              {risk.medium_findings_count}
            </span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-white/80 border border-vanilla-border flex flex-col items-center min-w-[70px]">
            <span className="text-xs font-medium text-indigo-brand/60">Passed</span>
            <span className="text-base font-bold text-status-success">
              {risk.passed_checks_count}
            </span>
          </div>
        </div>
      </div>

      {/* Transparent Score Derivation Accordion */}
      <div className="mt-4 pt-4 border-t border-vanilla-border/60">
        <button
          onClick={() => setShowFormula(!showFormula)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-brand/80 hover:text-indigo-brand transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>How is this score calculated? (Transparent Audit Rationale)</span>
          {showFormula ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showFormula && (
          <div className="mt-2.5 p-3.5 rounded-lg bg-white/70 border border-vanilla-border text-xs text-indigo-brand/90 leading-relaxed font-mono">
            <p className="font-semibold text-indigo-brand mb-1">
              Documented Weighting Calculation:
            </p>
            <p>{risk.score_calculation_rationale}</p>
            <p className="mt-2 text-[11px] font-sans text-indigo-brand/70">
              * Note: LeakLens AI never implies calibrated probabilities. This score provides a standardized, explainable severity indicator to help teams prioritize pre-modeling remediation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
