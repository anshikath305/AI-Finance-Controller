"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import Copilot from '@/components/Copilot';
import { getMetrics, getMatches, getReport } from '@/lib/api';
import {
  AlertCircle, Loader2, Download, ExternalLink, ArrowUpRight,
  ArrowRight, ShieldCheck, History, Brain
} from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const runId = searchParams.get('runId');

  const [metrics, setMetrics] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!runId) {
      setError("No reconciliation run specified.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const [metricsData, matchesData] = await Promise.all([
          getMetrics(Number(runId)),
          getMatches(Number(runId))
        ]);
        setMetrics(metricsData);
        setMatches(matchesData);
      } catch (err: any) {
        setError("Reconciliation record not found or server is offline.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [runId]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const report = await getReport(Number(runId));
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reconciliation_report_${runId}.json`;
      a.click();
    } catch (err) {
      alert("Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin w-10 h-10 text-black mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading Intelligence...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 font-medium">{error}</p>
        </div>
        <button onClick={() => router.push('/new')} className="w-full py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-xs">New Reconciliation</button>
      </div>
    </div>
  );

  const { operational, financial, automation } = metrics;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Top Navigation Bar */}
      <nav className="border-b border-gray-100 bg-white py-4 px-8 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-6">
          <div onClick={() => router.push('/')} className="flex items-center space-x-2 cursor-pointer group">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-[10px] font-bold group-hover:scale-110 transition-transform">F</div>
            <span className="font-bold tracking-tight text-sm uppercase">Finance-Ops Agent</span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Run</span>
            <span className="text-xs font-bold text-gray-900">#{runId}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-black hover:border-black transition-all flex items-center shadow-sm"
          >
            {exporting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Download className="w-3 h-3 mr-2" />}
            Export JSON
          </button>
          <button onClick={() => router.push('/new')} className="px-4 py-2 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-black/10">
            New Run
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 pt-12">
        {/* Metric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <MetricCard
            label="Reconciliation Coverage"
            value={`${operational.match_rate}%`}
            trend="up"
            sublabel={`${operational.matched} of ${operational.total_bank_records} records`}
          />
          <MetricCard
            label="Reconciled Volume"
            value={`₹${financial.reconciled_amount.toLocaleString('en-IN')}`}
            sublabel={`Target: ₹${financial.total_bank_amount.toLocaleString('en-IN')}`}
          />
          <MetricCard
            label="Review Queue"
            value={operational.possible_matches}
            sublabel="Transactions needing verification"
            trend={operational.possible_matches > 0 ? 'down' : 'neutral'}
          />
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between h-48 transition-all hover:border-black group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Brain className="w-16 h-16 text-black" />
             </div>
             <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Intelligence</p>
                <p className="text-xl font-black text-gray-900 leading-tight">Identify exception patterns</p>
             </div>
             <button
                onClick={() => router.push(`/intelligence?runId=${runId}`)}
                className="w-full py-3 bg-gray-50 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center justify-center"
             >
                View Insights
                <ArrowRight className="w-3 h-3 ml-2" />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Transaction Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Transaction Ledger</h2>
              <button onClick={() => router.push(`/review?runId=${runId}`)} className="group flex items-center text-[10px] font-black text-blue-600 hover:text-blue-500 uppercase tracking-widest transition-all">
                Review Ambiguous Cases ({operational.possible_matches})
                <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Source Context</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {matches.slice(0, 15).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => router.push(`/review?runId=${runId}`)}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{row.bank_detail.desc || row.bank_detail.Description}</div>
                        <div className="text-[10px] font-medium text-gray-400 uppercase mt-0.5 tracking-tight">{row.bank_detail.date || row.bank_detail.Date}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-black text-gray-900">₹{Number(row.bank_detail.amount || row.bank_detail.Amount).toLocaleString('en-IN')}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={row.status as any} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[11px] font-bold text-gray-500 tabular-nums">
                          {row.confidence > 0 ? `${(row.confidence * 100).toFixed(0)}%` : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {matches.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                    <History className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No transaction history recorded</p>
                </div>
              )}
            </div>
            {matches.length > 15 && (
              <div className="p-4 border-t border-gray-100 text-center bg-gray-50/30">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Showing top 15 results • Export report for full ledger</p>
              </div>
            )}
          </div>

          {/* Impact & Safety Sidebars */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck className="w-16 h-16 text-black" />
              </div>
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-8">Automation Impact</h3>
              <div className="space-y-6 relative z-10">
                <ImpactRow label="Deterministic Match" count={automation.auto_resolved_count} type="success" />
                <ImpactRow label="AI Assisted Match" count={automation.ai_assisted_count} type="accent" />
                <ImpactRow label="Human Intervention" count={automation.manual_review_required} type="warning" />
              </div>
            </div>

            <div className="bg-black p-8 rounded-2xl shadow-xl shadow-black/20 text-white flex flex-col justify-between min-h-[240px]">
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Operational Status</h3>
                <div className="space-y-4">
                  <StatusIndicator label="Deterministic precision verified" active />
                  <StatusIndicator label="AI Semantic analysis active" active />
                  <StatusIndicator label="Real-time run isolation" active />
                  <StatusIndicator label="Audit logging enabled" active />
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">System Integrity</span>
                 <ShieldCheck className="w-4 h-4 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Groundwater Copilot */}
      <Copilot runId={Number(runId)} metrics={metrics} />
    </div>
  );
}

function ImpactRow({ label, count, type }: any) {
  const colors: any = {
    success: 'bg-green-500',
    accent: 'bg-blue-500',
    warning: 'bg-orange-500'
  };
  return (
    <div className="flex justify-between items-end">
      <div className="space-y-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <div className={`h-1 rounded-full ${colors[type] || 'bg-gray-200'}`} style={{ width: '40px' }} />
      </div>
      <p className="text-2xl font-black text-gray-900 tabular-nums">{count}</p>
    </div>
  );
}

function StatusIndicator({ label, active }: any) {
  return (
    <div className="flex items-center space-x-3">
      <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-gray-600'}`} />
      <span className="text-xs font-bold text-gray-300 tracking-tight">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-400 font-bold uppercase tracking-widest text-xs">
        Booting Environment...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
