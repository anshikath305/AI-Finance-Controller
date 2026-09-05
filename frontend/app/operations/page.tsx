"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getOperations } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  Activity, Shield, AlertCircle, ArrowRight,
  TrendingUp, Clock, Target, Layers, Brain,
  ChevronRight, BarChart3, Filter, History, Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import Copilot from '@/components/Copilot';

function OperationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const runId = searchParams.get('runId');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getOperations(runId ? Number(runId) : undefined);
        setData(result);
      } catch (err) {
        setError("Failed to synchronize operations context.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [runId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6 animate-pulse">
        <Activity className="w-12 h-12 text-black mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Booting Command Center...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-white p-10 text-center">
       <div className="max-w-md space-y-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-3xl font-black uppercase tracking-tighter">Command Failure</h2>
          <p className="text-gray-500 font-medium italic">{error}</p>
          <button onClick={() => router.push('/')} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Return to Home</button>
       </div>
    </div>
  );

  const { summary, work_queue, next_best_review, aging, recent_runs, recommendations } = data;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 selection:bg-black selection:text-white">
      <nav className="border-b border-gray-100 bg-white py-6 px-10 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-10">
          <div onClick={() => router.push('/')} className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-xs font-black shadow-lg">F</div>
            <span className="font-black tracking-tighter text-lg uppercase italic hidden sm:block">Operations Center</span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2 text-finance-accent">
                <Shield className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Oversight Active</span>
             </div>
          </div>
        </div>
        <div className="flex items-center space-x-6">
           <LinkButton label="Run History" onClick={() => router.push('/history')} />
           <button onClick={() => router.push('/new')} className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10">
              New Reconciliation
           </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-10 pt-16 space-y-16">
        {/* Level 1: Global Health Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           <MetricMini label="Value at Risk" value={formatCurrency(summary.value_at_risk_total)} sub={`Across ${summary.total_active_runs} Active Runs`} color="text-red-600" />
           <MetricMini label="Pending Review" value={summary.pending_review_total} sub="Human-in-the-loop Queue" color="text-orange-600" />
           <MetricMini label="Avg Match Rate" value={`${summary.avg_match_rate}%`} sub="Global Efficiency Baseline" color="text-green-600" />
           <MetricMini label="Override Rate" value={`${summary.override_rate}%`} sub="Operator Correction Delta" color="text-blue-600" />
        </div>

        {/* Level 2: Attention & Action */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Next Best Review */}
           <div className="lg:col-span-8 space-y-8">
              <div className="bg-black p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                    <Target className="w-48 h-48" />
                 </div>
                 <div className="relative z-10 space-y-8">
                    <div className="space-y-2">
                       <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em]">Next Strategic Priority</h3>
                       <p className="text-4xl font-black tracking-tighter uppercase italic italic">Highest Value Risk Identified</p>
                    </div>

                    {next_best_review ? (
                      <div className="flex flex-col md:flex-row justify-between items-end gap-10 bg-white/5 p-8 rounded-3xl border border-white/10">
                         <div className="space-y-4 flex-1">
                            <p className="text-xl font-black tracking-tight">{next_best_review.description}</p>
                            <p className="text-2xl font-black text-finance-accent tabular-nums tracking-tighter">{formatCurrency(next_best_review.amount)}</p>
                            <div className="flex items-center space-x-3 pt-2">
                               <StatusBadge status="UNRESOLVED" />
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{next_best_review.reason}</span>
                            </div>
                         </div>
                         <button
                          onClick={() => router.push(`/review?runId=${next_best_review.run_id}`)}
                          className="px-8 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-[1.05] transition-all flex items-center shadow-2xl shadow-white/10"
                         >
                            Investigate Case
                            <ArrowRight className="w-4 h-4 ml-3" />
                         </button>
                      </div>
                    ) : (
                      <p className="text-lg font-bold text-gray-400 italic">Master Queue Cleared. Optimal reconciliation efficiency achieved.</p>
                    )}
                 </div>
              </div>

              {/* Master Work Queue Table */}
              <div className="bg-white rounded-[3rem] border border-gray-200 shadow-sm overflow-hidden hover:border-black transition-all">
                 <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.4em]">Unified Priority Queue</h2>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">Top 15 Mission-Critical Exceptions</p>
                 </div>
                 <table className="w-full">
                    <thead>
                       <tr className="border-b border-gray-50 bg-white">
                          <th className="px-10 py-5 text-left text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Context</th>
                          <th className="px-10 py-5 text-right text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Value</th>
                          <th className="px-10 py-5 text-center text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Priority</th>
                          <th className="px-10 py-5 text-right text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Decision Age</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {work_queue.map((item: any) => (
                          <tr key={item.match_id} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/review?runId=${item.run_id}`)}>
                             <td className="px-10 py-6">
                                <div className="text-sm font-black text-gray-900 uppercase italic tracking-tighter truncate max-w-[280px]">{item.description}</div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Run #{item.run_id} • {item.pattern}</p>
                             </td>
                             <td className="px-10 py-6 text-right">
                                <span className="text-sm font-black text-gray-900 tabular-nums">{formatCurrency(item.amount)}</span>
                             </td>
                             <td className="px-10 py-6 text-center">
                                <span className={clsx(
                                   "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                   item.priority === 'HIGH' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-400 border-gray-200'
                                )}>{item.priority}</span>
                             </td>
                             <td className="px-10 py-6 text-right">
                                <span className="text-[10px] font-black text-gray-400 tabular-nums">{item.age_days} Days</span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Sidebar: Aging & Health */}
           <div className="lg:col-span-4 space-y-10">
              <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm relative overflow-hidden group hover:border-black transition-all">
                 <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <History className="w-24 h-24 text-black" />
                 </div>
                 <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.4em] mb-10">Queue Aging Matrix</h3>
                 <div className="space-y-8 relative z-10">
                    {aging.map((bucket: any) => (
                       <div key={bucket.label} className="space-y-3 group/row">
                          <div className="flex justify-between items-end">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover/row:text-black transition-colors">{bucket.label}</p>
                             <p className="text-sm font-black tabular-nums">{formatCurrency(bucket.value_at_risk)}</p>
                          </div>
                          <div className="flex justify-between items-center">
                             <div className="h-1.5 flex-1 bg-gray-50 rounded-full overflow-hidden mr-6 shadow-inner">
                                <div className="h-full bg-black transition-all duration-1000" style={{ width: `${Math.min(100, (bucket.count / summary.pending_review_total) * 100)}%` }} />
                             </div>
                             <span className="text-[10px] font-black text-gray-300 tabular-nums uppercase">{bucket.count} Cases</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-8">
                 <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.4em]">Tactical Directives</h3>
                 <div className="space-y-4">
                    {recommendations.map((rec: string, i: number) => (
                       <div key={i} className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100/30 flex items-start space-x-4">
                          <Target className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                          <p className="text-xs font-bold text-blue-900 leading-relaxed italic">"{rec}"</p>
                       </div>
                    ))}
                    {recommendations.length === 0 && (
                       <p className="text-xs font-bold text-gray-400 italic text-center py-6">All operational vectors stable.</p>
                    )}
                 </div>
              </div>

              <div className="bg-black p-10 rounded-[3rem] shadow-2xl text-white min-h-[260px] flex flex-col justify-between hover:scale-[1.01] transition-transform">
                 <div className="space-y-6">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em]">System Status</p>
                    <div className="space-y-4">
                       <StatusIndicator label="Precision Baseline Verified" active />
                       <StatusIndicator label="Grounded Copilot Synced" active />
                       <StatusIndicator label="Cross-run Isolation Active" active />
                    </div>
                 </div>
                 <div className="pt-8 border-t border-white/10 flex justify-between items-center opacity-40">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em]">Audit Transparency Shield</span>
                    <Shield className="w-4 h-4 text-green-400" />
                 </div>
              </div>
           </div>
        </div>

        {/* Level 3: Recent Run Health Traces */}
        <div className="space-y-8 pb-20">
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] px-2">Recent Run Integrity Traces</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recent_runs.map((run: any) => (
                 <div key={run.run_id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-black transition-all space-y-6 group">
                    <div className="flex justify-between items-start">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest group-hover:text-finance-accent transition-colors">Trace ID</p>
                          <p className="text-2xl font-black tabular-nums tracking-tighter">#{run.run_id}</p>
                       </div>
                       <StatusBadge status={run.match_rate >= 90 ? 'MATCHED' : 'POSSIBLE_MATCH'} />
                    </div>
                    <div className="grid grid-cols-2 gap-6 py-6 border-y border-gray-50">
                       <HealthStat label="Success" value={`${run.match_rate}%`} />
                       <HealthStat label="Risk" value={formatCurrency(run.value_at_risk)} />
                    </div>
                    <button
                      onClick={() => router.push(`/dashboard?runId=${run.run_id}`)}
                      className="w-full py-4 bg-gray-50 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center justify-center group/btn"
                    >
                       Open Analysis
                       <ChevronRight className="w-3 h-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                 </div>
              ))}
           </div>
        </div>
      </main>

      <Copilot metrics={{ summary }} />
    </div>
  );
}

function MetricMini({ label, value, sub, color }: any) {
   return (
      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between h-56 hover:shadow-2xl hover:border-black transition-all group">
         <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 group-hover:text-black transition-colors">{label}</p>
            <p className={clsx("text-5xl font-black tabular-nums tracking-tighter italic leading-none mb-4", color)}>{value}</p>
         </div>
         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-50 pt-6 italic">{sub}</p>
      </div>
   );
}

function HealthStat({ label, value }: any) {
   return (
      <div className="space-y-1">
         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
         <p className="text-base font-black text-gray-900 tabular-nums">{value}</p>
      </div>
   );
}

function LinkButton({ label, onClick }: any) {
   return (
      <button onClick={onClick} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">{label}</button>
   );
}

function StatusIndicator({ label, active }: any) {
  return (
    <div className="flex items-center space-x-3">
      <div className={clsx("w-2 h-2 rounded-full", active ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-gray-600')} />
      <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
   return (
      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[8px] font-black uppercase tracking-widest">{status}</span>
   );
}

export default function OperationsCenter() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-12 h-12 text-black" /></div>}>
       <OperationsContent />
    </Suspense>
  );
}
