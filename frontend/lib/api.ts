const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function uploadFiles(bankFile: File, ledgerFile: File) {
  const fd = new FormData();
  fd.append('bank_file', bankFile);
  fd.append('ledger_file', ledgerFile);
  const r = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: fd });
  if (!r.ok) throw new Error('Upload failed');
  return r.json();
}

export async function startReconciliation(runId: number, bankMap: any, ledgerMap: any) {
  const r = await fetch(`${API_BASE_URL}/reconcile/${runId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bank_map: bankMap, ledger_map: ledgerMap })
  });
  if (!r.ok) throw new Error('Start failed');
  return r.json();
}

export async function checkReadiness(runId: number, bankMap: any, ledgerMap: any) {
  const r = await fetch(`${API_BASE_URL}/runs/${runId}/readiness`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bank_map: bankMap, ledger_map: ledgerMap })
  });
  if (!r.ok) throw new Error('Readiness check failed');
  return r.json();
}

export async function startDemo() {
  const r = await fetch(`${API_BASE_URL}/demo`, { method: 'POST' });
  if (!r.ok) throw new Error('Demo failed');
  return r.json();
}

export async function getMetrics(runId: number) {
  const r = await fetch(`${API_BASE_URL}/runs/${runId}/metrics`);
  if (!r.ok) throw new Error('Metrics failed');
  return r.json();
}

export async function getRuns() {
  const r = await fetch(`${API_BASE_URL}/runs`);
  if (!r.ok) throw new Error('Runs failed');
  return r.json();
}

export async function compareRuns(currentId: number, previousId: number) {
  const r = await fetch(`${API_BASE_URL}/runs/compare?current_run_id=${currentId}&previous_run_id=${previousId}`);
  if (!r.ok) throw new Error('Comparison failed');
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

export async function getActionability(runId: number, baselineId?: number) {
  let url = `${API_BASE_URL}/runs/${runId}/actionability`;
  if (baselineId) url += `?baseline_id=${baselineId}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('Actionability failed');
  return r.json();
}

export async function getReviewInsights(runId: number) {
  const r = await fetch(`${API_BASE_URL}/runs/${runId}/review-insights`);
  if (!r.ok) throw new Error('Review insights failed');
  return r.json();
}

export async function getOperations(runId?: number) {
  let url = `${API_BASE_URL}/operations`;
  if (runId) url += `?run_id=${runId}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('Operations context failed');
  return r.json();
}

export async function getHistoricalPrecedent(matchId: number) {
  const r = await fetch(`${API_BASE_URL}/matches/${matchId}/precedent`);
  if (!r.ok) return null;
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
