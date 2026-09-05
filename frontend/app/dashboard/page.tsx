"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import Copilot from '@/components/Copilot';
import { getMetrics, getMatches, getReport, getReportXlsxUrl, getReportPdfUrl } from '@/lib/api';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import {
  AlertCircle, Loader2, Download, ArrowRight, ShieldCheck,
  History, Brain, FileSpreadsheet, FileText, Activity, Layers, Calendar
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
      <div className="text-center space-y-6">
        <Activity className="animate-pulse w-12 h-12 text-black mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Assembling Control Panel...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-white p-10">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto border border-red-100 shadow-xl shadow-red-100/50">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Access Restricted</h2>
          <p className="text-gray-500 font-medium italic leading-relaxed">{error}</p>
        </div>
        <button onClick={() => router.push('/new')} className="w-full py-5 bg-black text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Start New Run</button>
      </div>
    </div>
  );

  const { operational, financial, automation, metadata } = metrics;
  const currency = metadata?.policy_config?.currency || 'INR';

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      {/* Run-Specific Header */}
      <nav className="border-b border-gray-100 bg-white py-5 px-10 flex justify-between items-center sticky top-0 z-30 shadow-sm shadow-black/[0.01]">
        <div className="flex items-center space-x-8">
          <div onClick={() => router.push('/')} className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-xs font-black shadow-lg group-hover:scale-110 transition-transform">F</div>
            <span className="font-black tracking-tighter text-lg uppercase hidden sm:block">Controller</span>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          <div
            onClick={() => router.push('/operations')}
            className="flex items-center space-x-2 cursor-pointer hover:opacity-70 transition-opacity"
          >
            <Activity className="w-3.5 h-3.5 text-finance-accent" />
            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Ops Center</span>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center space-x-6">
             <div
               onClick={() => router.push(`/audit?runId=${runId}`)}
               className="flex items-center space-x-2 cursor-pointer hover:opacity-70 transition-opacity"
             >
                <Fingerprint className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Audit Trail</span>
             </div>
             <div className="flex items-center space-x-2">
                <Layers className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                  Active Audit Run #{runId}
                  {metrics?.metadata?.policy_config && (
                    <span className="text-gray-400 ml-2 italic">({metrics.metadata.policy_config.profile_name})</span>
                  )}
                </span>
             </div>
             <div className="flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Baseline Alpha</span>
             </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
           <button
            onClick={() => router.push('/history')}
            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
           >
             Run History
           </button>
           <button onClick={() => router.push('/new')} className="px-5 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10">
              New Run
           </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-10 pt-16">
        {/* Core KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <MetricCard
            label="Reconciliation Coverage"
            value={`${operational.match_rate}%`}
            trend="up"
            sublabel={`${operational.matched} / ${operational.total_bank_records} matched`}
          />
          <MetricCard
            label="Reconciled Value"
            value={formatCurrency(financial.reconciled_amount, currency)}
            sublabel={`Total Source: ${formatCurrency(financial.total_bank_amount, currency)}`}
          />
          <MetricCard
            label="Audit Queue"
            value={operational.possible_matches}
            sublabel="Cases awaiting human review"
            trend={operational.possible_matches > 0 ? 'down' : 'neutral'}
          />
          <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col justify-between h-48 transition-all hover:border-black group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Brain className="w-20 h-22 text-black" />
             </div>
             <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Strategic Intelligence</p>
                <p className="text-xl font-black text-gray-900 leading-tight italic uppercase tracking-tighter">Identify Exception Patterns</p>
             </div>
             <button
                onClick={() => router.push(`/intelligence?runId=${runId}`)}
                className="w-full py-4 bg-gray-50 text-black rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all flex items-center justify-center border border-gray-100 group-hover:border-black shadow-sm"
             >
                Analyze Trends
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Main Transaction Table */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:border-black transition-all">
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Operational Ledger</h2>
              <button onClick={() => router.push(`/review?runId=${runId}`)} className="group flex items-center text-[10px] font-black text-finance-accent hover:underline uppercase tracking-[0.2em] transition-all">
                Resolve Ambiguities ({operational.possible_matches})
                <ArrowRight className="w-3.5 h-3.5 ml-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white">
                  <tr>
                    <th className="px-10 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Source Narration</th>
                    <th className="px-10 py-5 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Value</th>
                    <th className="px-10 py-5 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Audit State</th>
                    <th className="px-10 py-5 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Calibration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {matches.slice(0, 12).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => router.push(`/review?runId=${runId}`)}>
                      <td className="px-10 py-6">
                        <div className="flex items-center space-x-4">
                           <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/audit?runId=${runId}&matchId=${row.id}`);
                            }}
                            className="p-1.5 hover:bg-white rounded-lg text-gray-300 hover:text-black transition-all shadow-sm opacity-0 group-hover:opacity-100"
                            title="Decision Trace"
                           >
                              <Fingerprint className="w-3.5 h-3.5" />
                           </button>
                           <div>
                              <div className="text-sm font-black text-gray-900 truncate max-w-[240px] tracking-tighter">{row.bank_detail.desc || row.bank_detail.Description}</div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-[0.1em]">{row.bank_detail.date || row.bank_detail.Date}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="text-sm font-black text-gray-900 tabular-nums">{formatCurrency(Number(row.bank_detail.amount || row.bank_detail.Amount), currency)}</div>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <StatusBadge status={row.status as any} />
                      </td>
                      <td className="px-10 py-6 text-right">
                        <span className={clsx(
                          "text-[10px] font-black tabular-nums tracking-widest",
                          row.confidence >= 0.85 ? 'text-green-500' : row.confidence >= 0.6 ? 'text-orange-500' : 'text-gray-300'
                        )}>
                          {row.confidence > 0 ? `${(row.confidence * 100).toFixed(0)}%` : '---'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {matches.length === 0 && (
                <div className="py-24 text-center space-y-6">
                  <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto border border-gray-100 shadow-sm">
                    <History className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Zero historical records detected</p>
                </div>
              )}
            </div>

            {matches.length > 12 && (
              <div className="p-6 border-t border-gray-100 text-center bg-gray-50/20">
                 <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Truncated Preview • Full Ledger available via Audit Hub</p>
              </div>
            )}
          </div>

          {/* Right Sidebar: Hubs */}
          <div className="space-y-10">
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-200 shadow-sm relative overflow-hidden group hover:border-black transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12">
                <ShieldCheck className="w-24 h-24 text-black" />
              </div>
              <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] mb-10">Automation Provenance</h3>
              <div className="space-y-8 relative z-10">
                <ImpactRow label="Deterministic Direct" count={automation.auto_resolved_count} type="success" />
                <ImpactRow label="AI Semantic Assisted" count={automation.ai_assisted_count} type="accent" />
                <ImpactRow label="Human Validated" count={automation.manual_review_required} type="warning" />
              </div>
            </div>

            <div className="bg-black p-10 rounded-[2.5rem] shadow-2xl shadow-black/30 text-white min-h-[300px] flex flex-col justify-between hover:scale-[1.01] transition-transform">
               <div className="space-y-8">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Audit Artifact Hub</h3>
                  <div className="space-y-4">
                     <ReportLink
                        href={getReportXlsxUrl(Number(runId))}
                        icon={<FileSpreadsheet className="w-5 h-5 text-green-400" />}
                        label="Analytical Audit Log"
                        sub="Detailed XLSX Evidence"
                     />
                     <ReportLink
                        href={getReportPdfUrl(Number(runId))}
                        icon={<FileText className="w-5 h-5 text-red-400" />}
                        label="Executive Summary"
                        sub="Stakeholder Review PDF"
                     />
                     <button
                        onClick={handleExport}
                        className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left group"
                     >
                        <div className="flex items-center space-x-4">
                           <Activity className="w-5 h-5 text-blue-400" />
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-tight">Technical Data (JSON)</p>
                              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Raw Trace Export</p>
                           </div>
                        </div>
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />}
                     </button>
                  </div>
               </div>
               <div className="pt-8 border-t border-white/10 flex justify-between items-center opacity-40">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em]">Audit Transparency Shield</span>
                  <ShieldCheck className="w-4 h-4" />
               </div>
            </div>
          </div>
        </div>
      </main>

      <Copilot runId={Number(runId)} metrics={metrics} />
    </div>
  );
}

function ImpactRow({ label, count, type }: any) {
  const colors: any = {
    success: 'bg-green-500 shadow-green-500/20',
    accent: 'bg-blue-500 shadow-blue-500/20',
    warning: 'bg-orange-500 shadow-orange-500/20'
  };
  return (
    <div className="flex justify-between items-end">
      <div className="space-y-2 flex-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
           <div className={clsx("h-full rounded-full transition-all duration-1000 shadow-sm", colors[type])} style={{ width: `${Math.min(100, count * 10)}%` }} />
        </div>
      </div>
      <p className="text-3xl font-black text-gray-900 tabular-nums ml-8 tracking-tighter">{count}</p>
    </div>
  );
}

function ReportLink({ href, icon, label, sub }: any) {
  return (
    <a
      href={href}
      download
      className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left group shadow-sm"
    >
       <div className="flex items-center space-x-4">
          {icon}
          <div>
             <p className="text-[10px] font-black uppercase tracking-tight text-white">{label}</p>
             <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{sub}</p>
          </div>
       </div>
       <Download className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
    </a>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4 animate-pulse">
           <div className="w-12 h-12 bg-gray-100 rounded-2xl mx-auto" />
           <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">Synchronizing Context...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
