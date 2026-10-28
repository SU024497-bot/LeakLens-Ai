import React from 'react';
import { Navbar } from '../components/Navbar';
import { 
  ArrowRight, ShieldCheck, ShieldAlert, Sparkles, FileSpreadsheet, 
  Search, CheckCircle2, AlertTriangle, Layers, Lock, Cpu, BarChart2,
  HelpCircle, RefreshCw, Eye
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

interface LandingPageProps {
  onStartAuditing: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartAuditing }) => {
  return (
    <div className="min-h-screen bg-[#EEEBDA] text-[#282B4A] flex flex-col justify-between">
      <Navbar onStartAuditing={onStartAuditing} />

      <main className="flex-1">
        {/* ========================================================
            HERO SECTION
            ======================================================== */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden border-b border-vanilla-border/60">
          {/* Subtle gradient background accents */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-brand/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Headlines & CTA */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-brand/10 border border-indigo-brand/15 text-xs font-bold text-indigo-brand">
                  <span className="w-2 h-2 rounded-full bg-[#059669]" />
                  <span>Local-First Dataset Auditing & Leakage Intelligence</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-indigo-brand leading-[1.1]">
                  Find the Hidden Risks in Your Data.
                </h1>

                <p className="text-base sm:text-lg text-indigo-brand/80 max-w-2xl leading-relaxed">
                  Before you train models, audit dataset quality, detect potential target leakage, 
                  surface post-outcome proxies, and inspect train/test contamination with explainable heuristics.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 justify-center lg:justify-start">
                  <button
                    onClick={onStartAuditing}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-brand text-vanilla-brand font-bold text-sm hover:bg-indigo-brand/90 transition-all shadow-elevated flex items-center justify-center gap-2 group"
                  >
                    <span>Start Auditing Dataset</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <a
                    href="#how-it-works"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-vanilla-border bg-vanilla-card/80 text-indigo-brand font-semibold text-sm hover:bg-white transition-all text-center"
                  >
                    See How It Works
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-medium text-indigo-brand/70 justify-center lg:justify-start">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                    <span>100% Local & Privacy-Preserving</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                    <span>No Cloud APIs or External LLMs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                    <span>CSV & XLSX Workbook Support</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Sophisticated Dashboard Preview */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl bg-indigo-brand p-1 shadow-2xl border border-indigo-brand/40">
                  <div className="p-5 rounded-xl bg-indigo-dark text-vanilla-brand space-y-4 font-sans text-xs">
                    {/* Header bar of preview */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="font-mono text-[11px] text-vanilla-brand/60 ml-2">
                          audit_preview.py
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Illustrative Demo
                      </span>
                    </div>

                    {/* Illustrative Risk Score */}
                    <div className="p-3.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-vanilla-brand/60">
                          Illustrative Leakage Risk Index
                        </div>
                        <div className="text-xl font-extrabold text-rose-400 mt-0.5">
                          Critical Leakage (75 / 100)
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 font-mono text-[11px] font-bold">
                        3 Leaks Found
                      </span>
                    </div>

                    {/* Findings Snippets */}
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-rose-300 text-[11px]">
                            Direct Target Duplication
                          </div>
                          <div className="text-[10px] text-vanilla-brand/70 font-mono">
                            Feature 'loan_approved_status' == Target 'loan_approved' (r = 1.0)
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-amber-300 text-[11px]">
                            Suspicious Post-Outcome Feature
                          </div>
                          <div className="text-[10px] text-vanilla-brand/70 font-mono">
                            'charge_off_recovery_amount' populated after outcome
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Honest notice */}
                    <div className="text-[10px] text-vanilla-brand/50 text-center italic pt-1 border-t border-white/10">
                      * Illustrative values shown for demonstration. Run an audit to inspect your actual dataset.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            PROBLEM SECTION
            ======================================================== */}
        <section className="py-20 bg-vanilla-card/50 border-b border-vanilla-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-brand/60">
                The Hidden ML Blindspot
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-indigo-brand tracking-tight">
                Why 99% Test Accuracy Often Collapses in Production
              </h2>
              <p className="text-sm sm:text-base text-indigo-brand/80 leading-relaxed">
                Machine learning algorithms are greedy optimizers. If your training data contains 
                flawed schemas, proxy variables, or future outcome signals, your model will cheat—leading to 
                catastrophic silent failures upon real-world deployment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-vanilla-border shadow-subtle space-y-3">
                <div className="w-10 h-10 rounded-xl bg-status-critical/10 text-status-critical flex items-center justify-center font-bold">
                  !
                </div>
                <h3 className="text-base font-bold text-indigo-brand">
                  Target Duplication & Proxies
                </h3>
                <p className="text-xs text-indigo-brand/75 leading-relaxed">
                  Features that directly duplicate the target or encode it through deterministic 1-to-1 mappings 
                  give models trivial shortcut solutions.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-vanilla-border shadow-subtle space-y-3">
                <div className="w-10 h-10 rounded-xl bg-status-high/10 text-status-high flex items-center justify-center font-bold">
                  ⏳
                </div>
                <h3 className="text-base font-bold text-indigo-brand">
                  Post-Outcome Lookahead
                </h3>
                <p className="text-xs text-indigo-brand/75 leading-relaxed">
                  Fields like resolution notes, cancellation reasons, or reimbursement amounts are recorded 
                  only after the event, making them impossible inputs at inference.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-vanilla-border shadow-subtle space-y-3">
                <div className="w-10 h-10 rounded-xl bg-status-medium/10 text-status-medium flex items-center justify-center font-bold">
                  ⇄
                </div>
                <h3 className="text-base font-bold text-indigo-brand">
                  Train / Test Contamination
                </h3>
                <p className="text-xs text-indigo-brand/75 leading-relaxed">
                  Exact record duplicates across training and holdout partitions cause severe validation 
                  leakage, producing deceptive metrics that hide true generalization errors.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-vanilla-border shadow-subtle space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-brand/10 text-indigo-brand flex items-center justify-center font-bold">
                  ∅
                </div>
                <h3 className="text-base font-bold text-indigo-brand">
                  Silent Data Corruption
                </h3>
                <p className="text-xs text-indigo-brand/75 leading-relaxed">
                  Duplicate column headers, constant zero-variance features, and mixed string numbers distort 
                  gradient calculations and feature importances.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            FEATURES SECTION
            ======================================================== */}
        <section id="features" className="py-20 border-b border-vanilla-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-brand/60">
                Core Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-indigo-brand tracking-tight">
                Engineered for Rigorous Data Auditing
              </h2>
              <p className="text-sm sm:text-base text-indigo-brand/80 leading-relaxed">
                Four dedicated pillars designed to deliver actionable data intelligence without paid cloud dependencies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl bg-vanilla-card border border-vanilla-border shadow-subtle space-y-4 hover:border-indigo-brand/50 transition-colors">
                <div className="p-3 rounded-xl bg-indigo-brand text-vanilla-brand w-fit">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-indigo-brand">
                  1. Comprehensive Data Quality Auditing
                </h3>
                <p className="text-xs sm:text-sm text-indigo-brand/80 leading-relaxed">
                  Profiles complete dataset dimensions, infers semantic column types (numeric, categorical, boolean, 
                  datetime, identifiers), measures exact null cell ratios, flags zero-variance constant features, 
                  and detects duplicate rows.
                </p>
                <div className="pt-2 text-xs font-mono text-indigo-brand/70 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                  <span>Deterministic checks with 100% mathematical certainty</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl bg-vanilla-card border border-vanilla-border shadow-subtle space-y-4 hover:border-indigo-brand/50 transition-colors">
                <div className="p-3 rounded-xl bg-indigo-brand text-vanilla-brand w-fit">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-indigo-brand">
                  2. Potential Data Leakage Detection
                </h3>
                <p className="text-xs sm:text-sm text-indigo-brand/80 leading-relaxed">
                  Executes context-aware heuristics for direct target duplication, suspicious bivariate associations 
                  (Pearson |r| &gt; 0.88, Cramér’s V, correlation ratio), post-outcome feature names, and train/test 
                  split record contamination.
                </p>
                <div className="pt-2 text-xs font-mono text-indigo-brand/70 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-high" />
                  <span>Clearly separates confirmed defects from heuristic warnings</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-2xl bg-vanilla-card border border-vanilla-border shadow-subtle space-y-4 hover:border-indigo-brand/50 transition-colors">
                <div className="p-3 rounded-xl bg-indigo-brand text-vanilla-brand w-fit">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-indigo-brand">
                  3. Explainable Findings & Evidence
                </h3>
                <p className="text-xs sm:text-sm text-indigo-brand/80 leading-relaxed">
                  Every finding provides exact computed evidence: numerical correlation values, affected column headers, 
                  overlapping row counts, confidence ratings, and explicitly documented rule limitations so you understand 
                  why each alert fired.
                </p>
                <div className="pt-2 text-xs font-mono text-indigo-brand/70 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-low" />
                  <span>No black-box scores; transparent rule logic</span>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-8 rounded-2xl bg-vanilla-card border border-vanilla-border shadow-subtle space-y-4 hover:border-indigo-brand/50 transition-colors">
                <div className="p-3 rounded-xl bg-indigo-brand text-vanilla-brand w-fit">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-indigo-brand">
                  4. Actionable Remediation & Multi-Format Exports
                </h3>
                <p className="text-xs sm:text-sm text-indigo-brand/80 leading-relaxed">
                  Provides concrete pre-processing recommendations for every identified risk. Download complete structured 
                  audits as JSON, tabular CSV findings, or a beautifully formatted standalone HTML executive report.
                </p>
                <div className="pt-2 text-xs font-mono text-indigo-brand/70 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                  <span>Exports exactly match UI findings</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            HOW IT WORKS SECTION
            ======================================================== */}
        <section id="how-it-works" className="py-20 bg-vanilla-card/40 border-b border-vanilla-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-brand/60">
                Auditing Lifecycle
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-indigo-brand tracking-tight">
                How LeakLens AI Works
              </h2>
              <p className="text-sm sm:text-base text-indigo-brand/80 leading-relaxed">
                From raw upload to structured findings in 5 simple local steps:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { step: '01', title: 'Upload Dataset', desc: 'Drop your CSV or XLSX file. Select an Excel sheet or test split if applicable.' },
                { step: '02', title: 'Inspect Quality', desc: 'Scan for missing cells, duplicate rows, zero-variance columns, and schema quirks.' },
                { step: '03', title: 'Investigate Leakage', desc: 'Audit target correlations, post-outcome names, and train/test partition overlap.' },
                { step: '04', title: 'Review Evidence', desc: 'Examine exact metrics, sample values, rule confidence, and remediation actions.' },
                { step: '05', title: 'Export Reports', desc: 'Download structured JSON, tabular CSV, or a styled HTML report for your team.' },
              ].map((item) => (
                <div key={item.step} className="p-5 rounded-2xl bg-white border border-vanilla-border flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-2xl font-black text-indigo-brand/30 font-mono">
                      {item.step}
                    </span>
                    <h4 className="text-sm font-bold text-indigo-brand mt-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-indigo-brand/70 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
            BENEFITS SECTION
            ======================================================== */}
        <section id="benefits" className="py-20 border-b border-vanilla-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-brand/60">
                Real-World Impact
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-indigo-brand tracking-tight">
                Engineered for Machine Learning Reliability
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-vanilla-card border border-vanilla-border space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-brand text-vanilla-brand flex items-center justify-center font-bold">
                  ⚡
                </div>
                <h3 className="text-base font-bold text-indigo-brand">
                  Earlier Risk Identification
                </h3>
                <p className="text-xs text-indigo-brand/80 leading-relaxed">
                  Catch data flaws and lookahead proxies before spending hours tuning hyper-parameters 
                  on fundamentally compromised datasets.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-vanilla-card border border-vanilla-border space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-brand text-vanilla-brand flex items-center justify-center font-bold">
                  🔒
                </div>
                <h3 className="text-base font-bold text-indigo-brand">
                  Zero Data Exfiltration
                </h3>
                <p className="text-xs text-indigo-brand/80 leading-relaxed">
                  Your datasets never leave your computer. Processing occurs entirely in local memory 
                  with automatic temporary file cleanup.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-vanilla-card border border-vanilla-border space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-brand text-vanilla-brand flex items-center justify-center font-bold">
                  🎯
                </div>
                <h3 className="text-base font-bold text-indigo-brand">
                  Transparent Decision-Making
                </h3>
                <p className="text-xs text-indigo-brand/80 leading-relaxed">
                  Move from blind trust to evidence-based auditing. Audit reports provide clear documentation 
                  for model governance and compliance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            FUTURE SCOPE SECTION
            ======================================================== */}
        <section id="future-scope" className="py-20 bg-vanilla-card/50 border-b border-vanilla-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-brand/10 text-xs font-bold text-indigo-brand">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Planned Roadmap & Future Vision</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-indigo-brand tracking-tight">
                Future Scope
              </h2>
              <p className="text-xs sm:text-sm text-indigo-brand/75 leading-relaxed">
                The capabilities below represent planned future extensions and are clearly distinguished from 
                the currently implemented local audit engine.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-dashed border-vanilla-border space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-brand/10 text-indigo-brand">
                  Phase 2 Concept
                </span>
                <h3 className="text-sm font-bold text-indigo-brand">
                  Automated Group & Temporal Split Verifier
                </h3>
                <p className="text-xs text-indigo-brand/70 leading-relaxed">
                  Support for multi-entity group leakage detection (e.g. patients in both train and test) 
                  and strict time-series rolling window validation.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-dashed border-vanilla-border space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-brand/10 text-indigo-brand">
                  Phase 3 Concept
                </span>
                <h3 className="text-sm font-bold text-indigo-brand">
                  Native Scikit-Learn Pipeline Integration
                </h3>
                <p className="text-xs text-indigo-brand/70 leading-relaxed">
                  A lightweight Python CLI library (`pip install leaklens`) allowing automated pre-flight checks 
                  directly in ML training scripts and CI/CD pipelines.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-dashed border-vanilla-border space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-brand/10 text-indigo-brand">
                  Phase 4 Concept
                </span>
                <h3 className="text-sm font-bold text-indigo-brand">
                  Differential Privacy & PII Masking Checks
                </h3>
                <p className="text-xs text-indigo-brand/70 leading-relaxed">
                  Automatic identification of latent personal identifiable information (PII) and Quasi-Identifiers 
                  that could cause re-identification leaks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            FINAL CTA & FOOTER
            ======================================================== */}
        <section className="py-20 bg-indigo-brand text-vanilla-brand relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
            <BrandLogo size="lg" variant="light" className="justify-center" />

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Audit Your Machine Learning Datasets?
            </h2>

            <p className="text-sm sm:text-base text-vanilla-brand/80 max-w-xl mx-auto leading-relaxed">
              Launch the local LeakLens AI platform to inspect quality defects, evaluate potential target 
              leakage, and export verifiable audit reports.
            </p>

            <div className="pt-4">
              <button
                onClick={onStartAuditing}
                className="px-8 py-4 rounded-xl bg-vanilla-brand text-indigo-brand font-extrabold text-sm hover:bg-white transition-all shadow-2xl inline-flex items-center gap-2 group"
              >
                <span>Launch LeakLens AI Platform</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-indigo-dark text-vanilla-brand/70 text-xs py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-vanilla-brand">LeakLens AI</span>
            <span>—</span>
            <span>Developed by <strong>Neural Nexus</strong> (Aayush Varshney & Sonali)</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <span>Local & Privacy-Preserving</span>
            <span>•</span>
            <span>Python 3.14 + React + TypeScript</span>
            <span>•</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
