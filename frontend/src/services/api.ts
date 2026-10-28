import { AuditResponse, SampleDatasetInfo } from '../types/audit';

const API_BASE = '/api';

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function getSampleDatasets(): Promise<SampleDatasetInfo[]> {
  const res = await fetch(`${API_BASE}/sample-datasets`);
  if (!res.ok) {
    throw new Error('Failed to retrieve sample datasets');
  }
  return res.json();
}

export async function auditSample(sampleId: string, targetColumn?: string): Promise<AuditResponse> {
  const url = targetColumn 
    ? `${API_BASE}/audit-sample/${sampleId}?target_column=${encodeURIComponent(targetColumn)}`
    : `${API_BASE}/audit-sample/${sampleId}`;
    
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Audit failed with status ${res.status}`);
  }
  return res.json();
}

export async function getExcelWorksheets(file: File): Promise<string[]> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE}/worksheets`, {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Could not discover worksheets');
  }
  
  const data = await res.json();
  return data.worksheets || [];
}

export async function uploadAndAudit(
  file: File,
  targetColumn?: string,
  selectedSheet?: string,
  testFile?: File
): Promise<AuditResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (targetColumn && targetColumn.trim()) {
    formData.append('target_column', targetColumn.trim());
  }
  if (selectedSheet) {
    formData.append('selected_sheet', selectedSheet);
  }
  if (testFile) {
    formData.append('test_file', testFile);
  }

  const res = await fetch(`${API_BASE}/audit`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Upload & audit failed (${res.status})`);
  }

  return res.json();
}

export async function downloadReport(
  auditData: AuditResponse,
  format: 'json' | 'csv' | 'html'
): Promise<void> {
  const res = await fetch(`${API_BASE}/reports/${format}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(auditData),
  });

  if (!res.ok) {
    throw new Error(`Failed to download ${format.toUpperCase()} report`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  const baseName = auditData.summary.filename.replace(/\.[^/.]+$/, "");
  const extensions = { json: 'json', csv: 'csv', html: 'html' };
  a.download = `leaklens_audit_${baseName}.${extensions[format]}`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
