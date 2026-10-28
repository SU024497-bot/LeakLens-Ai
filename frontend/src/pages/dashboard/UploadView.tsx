import React from 'react';
import { Dropzone } from '../../components/Dropzone';
import { UploadCloud, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { AuditResponse } from '../../types/audit';

interface UploadViewProps {
  onAuditStart: () => void;
  onAuditUpload: (file: File, target?: string, sheet?: string, testFile?: File) => Promise<void>;
  onAuditSample: (sampleId: string, target?: string) => Promise<void>;
  isLoading: boolean;
  activeAudit: AuditResponse | null;
}

export const UploadView: React.FC<UploadViewProps> = ({
  onAuditStart,
  onAuditUpload,
  onAuditSample,
  isLoading,
  activeAudit,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-indigo-brand tracking-tight">
          Dataset Upload & Configuration
        </h2>
        <p className="text-xs sm:text-sm text-indigo-brand/70 mt-1">
          Upload tabular training files or benchmark datasets to execute automated data quality and leakage checks.
        </p>
      </div>

      {activeAudit && (
        <div className="p-4 rounded-xl bg-indigo-brand/5 border border-indigo-brand/20 flex items-center justify-between text-xs text-indigo-brand">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
            <span>
              Active audit in memory: <strong>{activeAudit.summary.filename}</strong> ({activeAudit.summary.row_count.toLocaleString()} rows). Uploading another file will replace this session.
            </span>
          </div>
        </div>
      )}

      {/* Main Upload Dropzone */}
      <Dropzone
        onAuditStart={onAuditStart}
        onAuditUpload={onAuditUpload}
        onAuditSample={onAuditSample}
        isLoading={isLoading}
      />

      {/* Supported Checks & Constraints Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-indigo-brand/80">
        <div className="p-4 rounded-xl bg-vanilla-card border border-vanilla-border space-y-2">
          <h4 className="font-bold text-indigo-brand uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
            <span>Supported File Formats & Limits</span>
          </h4>
          <ul className="space-y-1 list-disc list-inside text-indigo-brand/70 text-[11px]">
            <li>Standard CSV files (UTF-8, Latin-1, CP1252)</li>
            <li>Excel Workbooks (.xlsx) with interactive sheet selection</li>
            <li>Maximum file size: <strong>50 MB</strong> per file</li>
            <li>Maximum row limit: <strong>250,000 rows</strong> (local 8GB RAM safety)</li>
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-vanilla-card border border-vanilla-border space-y-2">
          <h4 className="font-bold text-indigo-brand uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-brand" />
            <span>Privacy & Storage Guarantees</span>
          </h4>
          <ul className="space-y-1 list-disc list-inside text-indigo-brand/70 text-[11px]">
            <li>Processing executes 100% locally on your computer</li>
            <li>No cloud transmission or third-party telemetry</li>
            <li>Temporary files are strictly unlinked after each audit</li>
            <li>No permanent persistence or database storage</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
