const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function uploadFiles(bankFile: File, ledgerFile: File) {
  const fd = new FormData();
  fd.append('bank_file', bankFile);
  fd.append('ledger_file', ledgerFile);
  const r = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: fd });
  if (!r.ok) throw new Error('Upload failed');
  return r.json();
}

export async function startReconciliation(runId: number) {
  const r = await fetch(`${API_BASE_URL}/reconcile/${runId}`, { method: 'POST' });
  if (!r.ok) throw new Error('Start failed');
  return r.json();
}

export async function getMetrics(runId: number) {
  const r = await fetch(`${API_BASE_URL}/runs/${runId}/metrics`);
  if (!r.ok) throw new Error('Metrics failed');
  return r.json();
}

export async function getMatches(runId: number) {
  const r = await fetch(`${API_BASE_URL}/runs/${runId}/matches`);
  if (!r.ok) throw new Error('Matches failed');
  return r.json();
}

export async function getReport(runId: number) {
  const r = await fetch(`${API_BASE_URL}/runs/${runId}/report`);
  if (!r.ok) throw new Error('Report failed');
  return r.json();
}

export function getReportXlsxUrl(runId: number) {
  return `${API_BASE_URL}/runs/${runId}/report/xlsx`;
}

export function getReportPdfUrl(runId: number) {
  return `${API_BASE_URL}/runs/${runId}/report/pdf`;
}

export async function getIntelligence(runId: number) {
  const r = await fetch(`${API_BASE_URL}/runs/${runId}/intelligence`);
  if (!r.ok) throw new Error('Intelligence failed');
  return r.json();
}

export async function getMatchEvidence(matchId: number) {
  const r = await fetch(`${API_BASE_URL}/matches/${matchId}/evidence`);
  if (!r.ok) throw new Error('Evidence failed');
  return r.json();
}

export async function runBenchmark(benchmarkId: string) {
  const r = await fetch(`${API_BASE_URL}/benchmarks/${benchmarkId}/run`, { method: 'POST' });
  if (!r.ok) throw new Error('Benchmark failed');
  return r.json();
}

export async function submitReview(matchId: number, action: 'ACCEPT' | 'REJECT' | 'MARK_EXCEPTION', comment?: string) {
  const r = await fetch(`${API_BASE_URL}/matches/${matchId}/review`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, comment }),
  });
  if (!r.ok) throw new Error('Review failed');
  return r.json();
}
