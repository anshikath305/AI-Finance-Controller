const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getAuthHeader() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('finance_ops_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(path: string, options: any = {}) {
  const headers = {
    ...options.headers,
    ...getAuthHeader()
  };
  const r = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (r.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
       localStorage.removeItem('finance_ops_token');
       window.location.href = '/login';
    }
  }
  return r;
}

export async function login(email: string, password: string) {
  const fd = new URLSearchParams();
  fd.append('username', email);
  fd.append('password', password);
  const r = await fetch(`${API_BASE_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: fd
  });
  if (!r.ok) throw new Error('Login failed');
  const data = await r.json();
  localStorage.setItem('finance_ops_token', data.access_token);
  return data;
}

export async function register(user: any) {
  const r = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  if (!r.ok) throw new Error('Registration failed');
  return r.json();
}

export async function getMe() {
  const r = await request('/auth/me');
  if (!r.ok) throw new Error('Failed to fetch user');
  return r.json();
}

export async function uploadFiles(bankFile: File, ledgerFile: File) {
  const fd = new FormData();
  fd.append('bank_file', bankFile);
  fd.append('ledger_file', ledgerFile);
  const r = await request('/upload', { method: 'POST', body: fd });
  if (!r.ok) throw new Error('Upload failed');
  return r.json();
}

export async function startReconciliation(runId: number, bankMap: any, ledgerMap: any, profile?: any) {
  const r = await request(`/reconcile/${runId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bank_map: bankMap, ledger_map: ledgerMap, profile })
  });
  if (!r.ok) throw new Error('Start failed');
  return r.json();
}

export async function checkReadiness(runId: number, bankMap: any, ledgerMap: any) {
  const r = await request(`/runs/${runId}/readiness`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bank_map: bankMap, ledger_map: ledgerMap })
  });
  if (!r.ok) throw new Error('Readiness check failed');
  return r.json();
}

export async function startDemo() {
  const r = await request('/demo', { method: 'POST' });
  if (!r.ok) throw new Error('Demo failed');
  return r.json();
}

export async function getMetrics(runId: number) {
  const r = await request(`/runs/${runId}/metrics`);
  if (!r.ok) throw new Error('Metrics failed');
  return r.json();
}

export async function getRuns() {
  const r = await request('/runs');
  if (!r.ok) throw new Error('Runs failed');
  return r.json();
}

export async function compareRuns(currentId: number, previousId: number) {
  const r = await request(`/runs/compare?current_run_id=${currentId}&previous_run_id=${previousId}`);
  if (!r.ok) throw new Error('Comparison failed');
  return r.json();
}

export async function getMatches(runId: number) {
  const r = await request(`/runs/${runId}/matches`);
  if (!r.ok) throw new Error('Matches failed');
  return r.json();
}

export async function getReport(runId: number) {
  const r = await request(`/runs/${runId}/report`);
  if (!r.ok) throw new Error('Report failed');
  return r.json();
}

export function getReportXlsxUrl(runId: number) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('finance_ops_token') : '';
  return `${API_BASE_URL}/runs/${runId}/report/xlsx?token=${token}`;
}

export function getReportPdfUrl(runId: number) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('finance_ops_token') : '';
  return `${API_BASE_URL}/runs/${runId}/report/pdf?token=${token}`;
}

export async function getIntelligence(runId: number) {
  const r = await request(`/runs/${runId}/intelligence`);
  if (!r.ok) throw new Error('Intelligence failed');
  return r.json();
}

export async function getActionability(runId: number, baselineId?: number) {
  let url = `/runs/${runId}/actionability`;
  if (baselineId) url += `?baseline_id=${baselineId}`;
  const r = await request(url);
  if (!r.ok) throw new Error('Actionability failed');
  return r.json();
}

export async function getControls(runId: number) {
  const r = await request(`/runs/${runId}/controls`);
  if (!r.ok) throw new Error('Controls failed');
  return r.json();
}

export async function getReviewInsights(runId: number) {
  const r = await request(`/runs/${runId}/review-insights`);
  if (!r.ok) throw new Error('Review insights failed');
  return r.json();
}

export async function getOperations(runId?: number) {
  let url = '/operations';
  if (runId) url += `?run_id=${runId}`;
  const r = await request(url);
  if (!r.ok) throw new Error('Operations context failed');
  return r.json();
}

export async function getRunAudit(runId: number) {
  const r = await request(`/runs/${runId}/audit`);
  if (!r.ok) throw new Error('Audit failed');
  return r.json();
}

export async function getDecisionTrace(matchId: number) {
  const r = await request(`/matches/${matchId}/audit`);
  if (!r.ok) throw new Error('Decision trace failed');
  return r.json();
}

export async function getExceptions(runId: number) {
  const r = await request(`/runs/${runId}/exceptions`);
  if (!r.ok) throw new Error('Exceptions fetch failed');
  return r.json();
}

export async function updateException(exceptionId: number, action: any) {
  const r = await request(`/exceptions/${exceptionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action)
  });
  if (!r.ok) throw new Error('Exception update failed');
  return r.json();
}

export async function getHistoricalPrecedent(matchId: number) {
  const r = await request(`/matches/${matchId}/precedent`);
  if (!r.ok) return null;
  return r.json();
}

export async function getMatchEvidence(matchId: number) {
  const r = await request(`/matches/${matchId}/evidence`);
  if (!r.ok) throw new Error('Evidence failed');
  return r.json();
}

export async function runBenchmark(benchmarkId: string) {
  const r = await request(`/benchmarks/${benchmarkId}/run`, { method: 'POST' });
  if (!r.ok) throw new Error('Benchmark failed');
  return r.json();
}

export async function submitReview(matchId: number, action: 'ACCEPT' | 'REJECT' | 'MARK_EXCEPTION', comment?: string) {
  const r = await request(`/matches/${matchId}/review`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, comment }),
  });
  if (!r.ok) throw new Error('Review failed');
  return r.json();
}
