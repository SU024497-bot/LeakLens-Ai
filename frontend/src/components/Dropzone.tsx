import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, FileSpreadsheet, FileText, CheckCircle2, 
  AlertCircle, Sparkles, X, Layers, ArrowRight, Loader2, Play
} from 'lucide-react';
import { getSampleDatasets, getExcelWorksheets } from '../services/api';
import { SampleDatasetInfo } from '../types/audit';

interface DropzoneProps {
  onAuditStart: () => void;
  onAuditUpload: (file: File, target?: string, sheet?: string, testFile?: File) => Promise<void>;
  onAuditSample: (sampleId: string, target?: string) => Promise<void>;
  isLoading: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onAuditStart,
  onAuditUpload,
  onAuditSample,
  isLoading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [showTestUpload, setShowTestUpload] = useState(false);
  const [targetColumn, setTargetColumn] = useState('');
  const [worksheets, setWorksheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [samples, setSamples] = useState<SampleDatasetInfo[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [discoveringSheets, setDiscoveringSheets] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const testFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSampleDatasets()
      .then(setSamples)
      .catch(() => {
        // Fallback demo options
        setSamples([
          {
            id: 'clean_customer_churn',
            name: 'Customer Churn (Clean Baseline)',
            filename: 'sample_clean_churn.csv',
            format: 'csv',
            recommended_target: 'churn',
            description: 'Standard dataset demonstrating passed quality checks.'
          },
          {
            id: 'leaky_credit_risk',
            name: 'Credit Risk (High-Leakage Benchmark)',
            filename: 'sample_leaky_credit.csv',
            format: 'csv',
            recommended_target: 'loan_default',
            description: 'Financial loan dataset with severe target replicas and post-outcome fields.'
          }
        ]);
      });
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = async (file: File) => {
    setErrorMsg(null);
    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx')) {
      setErrorMsg('Unsupported format. Please upload a .csv or .xlsx file.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File exceeds 50 MB limit. Please use a smaller sample.');
      return;
    }

    setSelectedFile(file);

    // If Excel, discover sheets
    if (name.endsWith('.xlsx')) {
      setDiscoveringSheets(true);
      try {
        const sheets = await getExcelWorksheets(file);
        setWorksheets(sheets);
        if (sheets.length > 0) {
          setSelectedSheet(sheets[0]);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to read Excel worksheets.');
      } finally {
        setDiscoveringSheets(false);
      }
    } else {
      setWorksheets([]);
      setSelectedSheet('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleAuditSubmit = async () => {
    if (!selectedFile) return;
    onAuditStart();
    try {
      await onAuditUpload(
        selectedFile,
        targetColumn.trim() || undefined,
        selectedSheet || undefined,
        testFile || undefined
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Audit failed');
    }
  };

  const handleRunSample = async (sample: SampleDatasetInfo) => {
    onAuditStart();
    setErrorMsg(null);
    try {
      await onAuditSample(sample.id, sample.recommended_target);
    } catch (err: any) {
      setErrorMsg(err.message || 'Sample audit failed');
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setTestFile(null);
    setWorksheets([]);
    setSelectedSheet('');
    setTargetColumn('');
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* Main Upload Box */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative p-8 rounded-2xl border-2 border-dashed transition-all duration-200 text-center ${
          dragActive
            ? 'border-indigo-brand bg-indigo-brand/5 scale-[1.01]'
            : 'border-vanilla-border bg-vanilla-card/80 hover:bg-vanilla-card hover:border-indigo-brand/50'
        } ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          className="hidden"
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-brand/10 text-indigo-brand flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-indigo-brand">
              Drag and drop your dataset here
            </h3>
            <p className="text-xs text-indigo-brand/70 max-w-sm mt-1 mb-4">
              Supports <strong>.csv</strong> and <strong>.xlsx</strong> workbooks up to 50 MB.
              Data is processed locally in temporary memory.
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-lg bg-indigo-brand text-vanilla-brand text-xs font-bold hover:bg-indigo-brand/90 transition-all shadow-subtle flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Browse Local Files</span>
            </button>
          </div>
        ) : (
          <div className="text-left space-y-4 max-w-xl mx-auto">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-vanilla-border">
              <div className="flex items-center gap-3 truncate">
                <div className="p-2.5 rounded-lg bg-indigo-brand/10 text-indigo-brand">
                  {selectedFile.name.endsWith('.xlsx') ? (
                    <FileSpreadsheet className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div className="truncate">
                  <div className="text-sm font-bold text-indigo-brand truncate">
                    {selectedFile.name}
                  </div>
                  <div className="text-xs text-indigo-brand/60 font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={clearSelection}
                className="p-1.5 rounded-lg text-indigo-brand/50 hover:text-indigo-brand hover:bg-vanilla-card"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Excel Sheet Picker if multiple sheets */}
            {worksheets.length > 0 && (
              <div className="p-3.5 rounded-xl bg-white border border-vanilla-border space-y-1.5">
                <label className="text-xs font-bold text-indigo-brand flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Select Excel Worksheet:</span>
                </label>
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="w-full text-xs font-medium p-2 bg-vanilla-card/50 border border-vanilla-border rounded-lg text-indigo-brand focus:outline-none focus:ring-1 focus:ring-indigo-brand"
                >
                  {worksheets.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      Worksheet: {sheet}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Target Column Input */}
            <div className="p-3.5 rounded-xl bg-white border border-vanilla-border space-y-1.5">
              <label className="text-xs font-bold text-indigo-brand flex items-center justify-between">
                <span>Designate Target Column (Optional):</span>
                <span className="text-[10px] font-normal text-indigo-brand/60">
                  Required for target duplication & association leakage checks
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. churn, loan_default, is_fraud, target"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full text-xs font-mono p-2 bg-vanilla-card/50 border border-vanilla-border rounded-lg text-indigo-brand focus:outline-none focus:ring-1 focus:ring-indigo-brand placeholder:font-sans placeholder:text-indigo-brand/40"
              />
            </div>

            {/* Optional Holdout Test Split File Toggle */}
            <div className="pt-1">
              {!showTestUpload ? (
                <button
                  type="button"
                  onClick={() => setShowTestUpload(true)}
                  className="text-xs text-indigo-brand/70 hover:text-indigo-brand underline font-medium"
                >
                  + Add separate test partition to audit train/test contamination
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-white border border-vanilla-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-brand">
                      Holdout / Test Split Dataset (Optional):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTestUpload(false);
                        setTestFile(null);
                      }}
                      className="text-[11px] text-indigo-brand/60 hover:text-indigo-brand"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    ref={testFileInputRef}
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={(e) => setTestFile(e.target.files?.[0] || null)}
                    className="text-xs text-indigo-brand"
                  />
                  {testFile && (
                    <div className="text-[11px] font-mono text-emerald-700">
                      ✓ Selected holdout: {testFile.name} ({(testFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Run Audit Action Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleAuditSubmit}
                disabled={isLoading || discoveringSheets}
                className="px-6 py-2.5 rounded-xl bg-indigo-brand text-vanilla-brand text-xs font-bold hover:bg-indigo-brand/90 transition-all shadow-subtle flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Auditing Dataset...</span>
                  </>
                ) : (
                  <>
                    <span>Execute LeakLens Audit</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-status-critical flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Audit Error: </strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Instant Demo Datasets Section */}
      <div className="p-5 rounded-2xl bg-vanilla-card border border-vanilla-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-brand" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-brand">
              Instant Demonstration Benchmarks
            </h4>
          </div>
          <span className="text-[10px] font-bold uppercase text-indigo-brand/60 px-2 py-0.5 rounded bg-indigo-brand/5">
            Synthetic Sample Data
          </span>
        </div>
        <p className="text-xs text-indigo-brand/70 leading-relaxed">
          Test the audit heuristics instantly with preconfigured reference datasets:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {samples.map((s) => (
            <div
              key={s.id}
              className="p-3.5 rounded-xl bg-white border border-vanilla-border flex flex-col justify-between space-y-3 hover:border-indigo-brand/60 transition-all shadow-subtle"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-brand truncate">
                    {s.name}
                  </span>
                  <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-vanilla-subtle text-indigo-brand">
                    {s.format}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-brand/70 line-clamp-2">
                  {s.description}
                </p>
                <div className="mt-2 text-[10px] font-mono text-indigo-brand/60">
                  Target: <strong>{s.recommended_target}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRunSample(s)}
                disabled={isLoading}
                className="w-full py-1.5 px-3 rounded-lg bg-vanilla-card hover:bg-indigo-brand hover:text-vanilla-brand text-indigo-brand text-xs font-bold transition-all border border-vanilla-border flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Run {s.name.split(' ')[0]} Audit</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
