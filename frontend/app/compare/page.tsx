"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { compareRuns } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeft, BarChart3, TrendingUp, TrendingDown,
  Minus, Loader2, AlertCircle, Shield, Brain, Zap,
  CheckCircle2, Info, Activity, Layers, Calendar, ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentId = searchParams.get('currentId');
  const previousId = searchParams.get('previousId');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!currentId || !previousId) {
        setError("Invalid comparative selection matrix.");
        setLoading(false);
        return;
      }
      try {
        const result = await compareRuns(Number(currentId), Number(previousId));
        setData(result);
      } catch (err) {
        setError("Synchronization failed. One or more run contexts are inaccessible.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentId, previousId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white text-finance-primary">
      <div className="text-center space-y-8 animate-pulse">
        <Activity className="w-16 h-16 text-black mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-400">Computing Strategic Delta...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-white p-12">
      <div className="max-w-md w-full text-center space-y-10">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto border border-red-100 shadow-xl shadow-red-100/50">
           <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-3">
           <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Context Disrupted</h2>
           <p className="text-gray-500 font-medium italic leading-relaxed">{error || "Comparative data unavailable."}</p>
        </div>
        <button onClick={() => router.push('/history')} className="w-full py-5 bg-black text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Return to Master History</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      <nav className="border-b border-gray-100 bg-white py-6 px-10 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-10">
          <button onClick={() => router.push('/history')} className="p-3 hover:bg-gray-100 rounded-2xl transition-all hover:scale-105 active:scale-95 group">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.3em] tracking-tighter italic">Comparative Analysis</h1>
            <div className="flex items-center space-x-4 mt-1">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Test: #{currentId}</p>
               <div className="w-1 h-1 rounded-full bg-gray-200" />
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Baseline: #{previousId}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3 px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/20">
           <Layers className="w-3.5 h-3.5 text-blue-400" />
           <span>Differential Mode</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-10 pt-16">
        {/* Executive Comparison Summary */}
        <div className="bg-white p-12 rounded-[4rem] border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-start gap-16 mb-20 relative overflow-hidden group hover:border-black transition-all">
           <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
              <Zap className="w-56 h-56 text-black" />
           </div>

           <div className="space-y-10 flex-1 relative z-10">
              <div>
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] mb-8">Authoritative Delta</h2>
                <div className="space-y-5">
                   {data.summary_text.map((text: string, i: number) => (
                      <div key={i} className="flex items-center text-2xl font-black text-gray-900 tracking-tighter italic uppercase leading-none">
                         <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mr-6 border border-green-100 shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                         </div>
                         {text}
                      </div>
                   ))}
                   {data.summary_text.length === 0 && (
                      <div className="flex items-center text-2xl font-black text-gray-300 tracking-tighter uppercase italic leading-none">
                         <Minus className="w-8 h-8 mr-6 text-gray-100" />
                         No Significant Operational Variance
                      </div>
                   )}
                </div>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 w-full lg:w-96 relative z-10">
              {data.metrics.slice(0, 3).map((m: any) => (
                 <div key={m.label} className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-sm group/card hover:bg-white hover:border-black transition-all">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-3 group-hover/card:text-gray-900">{m.label}</p>
                    <div className="flex items-end justify-between">
                       <span className="text-3xl font-black text-gray-900 tabular-nums tracking-tighter">
                          {m.unit === 'currency' ? formatCurrency(m.current_value) : m.current_value}{m.unit === 'percentage_points' ? '%' : ''}
                       </span>
                       <div className={clsx(
                          "flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
                          m.direction === 'up' ? 'bg-green-50 text-green-700 border-green-100' :
                          m.direction === 'down' ? 'bg-red-50 text-red-700 border-red-100' :
                          'bg-gray-50 text-gray-400 border-gray-200'
                       )}>
                          {m.direction === 'up' ? <TrendingUp className="w-3 h-3 mr-2" /> : m.direction === 'down' ? <TrendingDown className="w-3 h-3 mr-2" /> : <Minus className="w-3 h-3 mr-2" />}
                          {m.change}{m.unit === 'percentage_points' ? 'pp' : ''}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Detailed KPI Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
           <div className="lg:col-span-8 space-y-12 pb-20">
              <div className="bg-white rounded-[3.5rem] border border-gray-200 shadow-sm overflow-hidden hover:border-black transition-all">
                 <div className="px-12 py-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.4em] italic">Variance Audit Log</h3>
                    <div className="flex items-center space-x-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                       <Shield className="w-3.5 h-3.5" />
                       <span>ISO Certified Calculations</span>
                    </div>
                 </div>
                 <table className="w-full">
                    <thead>
                       <tr className="border-b border-gray-100 bg-white">
                          <th className="px-12 py-6 text-left text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Operational Metric</th>
                          <th className="px-12 py-6 text-right text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Baseline Run</th>
                          <th className="px-12 py-6 text-right text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Active Audit</th>
                          <th className="px-12 py-6 text-right text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Net Variance</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {data.metrics.map((m: any) => (
                          <tr key={m.label} className="group hover:bg-gray-50/50 transition-colors">
                             <td className="px-12 py-8 text-sm font-black text-gray-900 uppercase italic tracking-tight">{m.label}</td>
                             <td className="px-12 py-8 text-right text-sm font-bold text-gray-400 tabular-nums">
                                {m.unit === 'currency' ? formatCurrency(m.previous_value) : m.previous_value}{m.unit === 'percentage_points' ? '%' : ''}
                             </td>
                             <td className="px-12 py-8 text-right text-base font-black text-gray-900 tabular-nums">
                                {m.unit === 'currency' ? formatCurrency(m.current_value) : m.current_value}{m.unit === 'percentage_points' ? '%' : ''}
                             </td>
                             <td className={clsx(
                                "px-12 py-8 text-right text-sm font-black tabular-nums tracking-tighter",
                                m.direction === 'neutral' ? 'text-gray-300' : (
                                  (m.label.includes('Rate') || m.label.includes('Reconciled'))
                                  ? (m.direction === 'up' ? 'text-green-600' : 'text-red-600')
                                  : (m.direction === 'down' ? 'text-green-600' : 'text-red-600')
                                )
                             )}>
                                <div className="flex items-center justify-end">
                                   {m.direction === 'up' ? <TrendingUp className="w-3 h-3 mr-2" /> : m.direction === 'down' ? <TrendingDown className="w-3 h-3 mr-2" /> : <Minus className="w-3 h-3 mr-2 opacity-20" />}
                                   <span>
                                      {m.direction === 'up' ? '+' : m.direction === 'down' ? '-' : ''}
                                      {m.unit === 'currency' ? formatCurrency(m.change) : m.change}{m.unit === 'percentage_points' ? 'pp' : ''}
                                   </span>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Exception Intelligence Trend */}
           <div className="lg:col-span-4 space-y-8 sticky top-28">
              <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm relative overflow-hidden group hover:border-black transition-all">
                 <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity">
                    <Brain className="w-24 h-24 text-black" />
                 </div>
                 <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.4em] mb-12">Pattern Drift</h3>
                 <div className="space-y-10">
                    {data.exceptions.map((e: any) => (
                       <div key={e.label} className="space-y-4">
                          <div className="flex justify-between items-end">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-black transition-colors">{e.label}</p>
                             <div className={clsx(
                                "px-2 py-1 rounded-lg text-[9px] font-black tabular-nums border",
                                e.change < 0 ? "bg-green-50 text-green-700 border-green-100" : e.change > 0 ? "bg-red-50 text-red-700 border-red-100" : "bg-gray-50 text-gray-400 border-gray-200"
                             )}>
                                {e.change > 0 ? '+' : ''}{e.change} DRIFT
                             </div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
                             <span className="text-gray-900">{e.current_count} Cases Active</span>
                             <span className="opacity-30 italic">Baseline: {e.previous_count}</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden flex shadow-inner">
                             <div
                              className={clsx(
                                "h-full transition-all duration-1000 ease-out",
                                e.change < 0 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : e.change > 0 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" : "bg-gray-200"
                              )}
                              style={{ width: `${Math.min(100, (Math.abs(e.change) / (e.previous_count || 1)) * 100)}%` }}
                             />
                          </div>
                       </div>
                    ))}
                    {data.exceptions.length === 0 && (
                       <div className="text-center py-12 space-y-4 bg-gray-50/50 rounded-3xl border border-gray-100 border-dashed">
                          <ShieldCheck className="w-8 h-8 text-gray-200 mx-auto" />
                          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] italic">No Measurable Drift</p>
                       </div>
                    )}
                 </div>
              </div>

              <div className="bg-black p-10 rounded-[3rem] shadow-2xl shadow-black/40 text-white min-h-[300px] flex flex-col justify-between border border-white/5 group hover:scale-[1.01] transition-transform">
                 <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] mb-4">Strategic Appraisal</h3>
                    <p className="text-xl font-black leading-tight tracking-tight uppercase italic">
                       {data.metrics.find((m: any) => m.label === "Match Rate")?.direction === 'up'
                         ? "Efficiency gains confirmed. Systematic automation is successfully outperforming the historical baseline."
                         : "Operational regression identified. Immediate audit of normalization rule efficacy is recommended."}
                    </p>
                 </div>
                 <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center opacity-40">
                    <span className="text-[9px] font-black uppercase tracking-[0.5em]">Forensic Audit Baseline</span>
                    <ShieldCheck className="w-4 h-4 text-green-400" />
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
         <Loader2 className="animate-spin w-12 h-12 text-black" />
      </div>
    }>
       <CompareContent />
    </Suspense>
  );
}
