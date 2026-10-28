import React from 'react';
import { 
  ShieldCheck, HardDrive, FileText, Lock, 
  Trash2, AlertCircle, Info, CheckCircle2 
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-indigo-brand tracking-tight">
          System Configuration & Privacy Governance
        </h2>
        <p className="text-xs sm:text-sm text-indigo-brand/70 mt-1">
          Operational thresholds, local file safety lifecycles, and environment configuration parameters.
        </p>
      </div>

      {/* Local-First Architecture Guarantee */}
      <div className="p-6 rounded-2xl bg-vanilla-card border border-vanilla-border space-y-3 shadow-subtle">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-status-success/10 text-status-success">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-indigo-brand">
              Zero-Telemetry & Local Isolation Architecture
            </h3>
            <span className="text-[11px] font-mono text-status-success font-bold">
              STANDALONE LOCAL MODE • NO EXTERNAL APIS
            </span>
          </div>
        </div>
        <p className="text-xs text-indigo-brand/80 leading-relaxed">
          LeakLens AI executes all parsing, data profiling, correlation calculations, and heuristic audits 
          directly inside your local Python runtime. No dataset rows, column names, cell values, or embeddings 
          are transmitted over the public internet, ensuring compliance with strict internal data policies.
        </p>
      </div>

      {/* Resource & Processing Limits */}
      <div className="p-6 rounded-2xl bg-vanilla-card border border-vanilla-border space-y-4 shadow-subtle">
        <h3 className="text-base font-bold text-indigo-brand flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-indigo-brand" />
          <span>Configured Ingestion & Resource Limits</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-white border border-vanilla-border space-y-1">
            <span className="text-indigo-brand/60 font-sans text-[11px] block">
              Max File Upload Size
            </span>
            <span className="text-base font-bold text-indigo-brand">50 MB</span>
            <p className="font-sans text-[11px] text-indigo-brand/70">
              Guards against memory exhaustion on standard 8 GB RAM machines.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-vanilla-border space-y-1">
            <span className="text-indigo-brand/60 font-sans text-[11px] block">
              Max Ingested Rows
            </span>
            <span className="text-base font-bold text-indigo-brand">250,000 Rows</span>
            <p className="font-sans text-[11px] text-indigo-brand/70">
              Files exceeding this threshold are rejected with an explicit boundary error.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-vanilla-border space-y-1">
            <span className="text-indigo-brand/60 font-sans text-[11px] block">
              Max Columns / Feature Count
            </span>
            <span className="text-base font-bold text-indigo-brand">500 Features</span>
            <p className="font-sans text-[11px] text-indigo-brand/70">
              Prevents $O(N^2)$ correlation matrix combinatorial bottlenecks.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-vanilla-border space-y-1">
            <span className="text-indigo-brand/60 font-sans text-[11px] block">
              Execution Timeout
            </span>
            <span className="text-base font-bold text-indigo-brand">60 Seconds</span>
            <p className="font-sans text-[11px] text-indigo-brand/70">
              Hard limit on CPU execution to ensure responsive application loops.
            </p>
          </div>
        </div>
      </div>

      {/* Temporary File Cleanup Lifecycle */}
      <div className="p-6 rounded-2xl bg-vanilla-card border border-vanilla-border space-y-3 shadow-subtle">
        <h3 className="text-base font-bold text-indigo-brand flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-indigo-brand" />
          <span>Temporary File Lifecycle & Disclosure</span>
        </h3>
        <p className="text-xs text-indigo-brand/80 leading-relaxed">
          When a dataset is uploaded via multipart form data:
        </p>
        <ol className="list-decimal list-inside text-xs text-indigo-brand/80 space-y-1.5 pl-1 leading-relaxed">
          <li>A random UUID-tagged temporary file is generated in an isolated directory.</li>
          <li>The audit engine parses and profiles the data in RAM.</li>
          <li>The file is <strong>unconditionally unlinked</strong> in a guaranteed <code className="bg-vanilla-subtle px-1 py-0.5 rounded font-mono text-[11px]">try/finally</code> block upon completion, failure, or timeout.</li>
          <li>On application startup, any stale orphaned temporary files older than 30 minutes are automatically pruned.</li>
        </ol>
        <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
          <strong>Physical Media Notice:</strong> Application-level unlinking deletes file pointers from the filesystem. Operating systems and solid-state drives manage block-level TRIM and wear leveling independently; application unlinking does not provide cryptographic hardware erasure.
        </div>
      </div>
    </div>
  );
};
