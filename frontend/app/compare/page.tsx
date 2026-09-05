"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { compareRuns } from '@/lib/api';
import {
  ArrowLeft, BarChart3, TrendingUp, TrendingDown,
  Minus, Loader2, AlertCircle, Shield, Brain, Zap,
  CheckCircle2, Info
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
        setError("Invalid selection for comparison.");
        setLoading(false);
        return;
      }
      try {
        const result = await compareRuns(Number(currentId), Number(previousId));
        setData(result);
      } catch (err) {
        setError("Failed to generate comparison. Ensure runs exist.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentId, previousId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin w-10 h-10 text-black mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Comparing Performance...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <h2 className="text-2xl font-black tracking-tight text-gray-900">Comparison Failed</h2>
        <p className="text-gray-500 font-medium">{error || "No data available."}</p>
        <button onClick={() => router.push('/history')} className="w-full py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-xs">Back to History</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <nav className="border-b border-gray-100 bg-white py-4 px-8 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-6">
          <button onClick={() => router.push('/history')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.1em]">Comparative Intelligence</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Run #{currentId} vs Run #{previousId}</p>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-12">
        {/* Executive Comparison Summary */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
           <div className="space-y-6 flex-1">
              <div>
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Strategic Delta</h2>
                <div className="space-y-3">
                   {data.summary_text.map((text: string, i: number) => (
                      <div key={i} className="flex items-center text-lg font-black text-gray-900">
                         <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                         {text}
                      </div>
                   ))}
                   {data.summary_text.length === 0 && (
                      <div className="flex items-center text-lg font-black text-gray-400">
                         <Minus className="w-5 h-5 mr-3 shrink-0" />
                         No significant variance detected between runs.
                      </div>
                   )}
                </div>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full md:w-auto">
              {data.metrics.slice(0, 3).map((m: any) => (
                 <div key={m.label} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 min-w-[200px]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{m.label}</p>
                    <div className="flex items-baseline space-x-2">
                       <span className="text-2xl font-black text-gray-900">
                          {m.unit === 'currency' ? `₹${m.current_value.toLocaleString('en-IN')}` : m.current_value}{m.unit === 'percentage_points' ? '%' : ''}
                       </span>
                       <div className={clsx(
                          "flex items-center text-[10px] font-black uppercase tracking-tight",
                          m.direction === 'up' ? 'text-green-600' : m.direction === 'down' ? 'text-red-600' : 'text-gray-400'
                       )}>
                          {m.direction === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : m.direction === 'down' ? <TrendingDown className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
                          {m.change}{m.unit === 'percentage_points' ? 'pp' : ''}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Detailed KPI Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           <div className="lg:col-span-8 space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
                 <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Operational Variance</h3>
                 </div>
                 <table className="w-full">
                    <thead>
                       <tr className="border-b border-gray-100">
                          <th className="px-10 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Metric</th>
                          <th className="px-10 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Baseline (#{previousId})</th>
                          <th className="px-10 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Current (#{currentId})</th>
                          <th className="px-10 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Variance</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {data.metrics.map((m: any) => (
                          <tr key={m.label} className="group hover:bg-gray-50/50 transition-colors">
                             <td className="px-10 py-6 text-sm font-bold text-gray-900">{m.label}</td>
                             <td className="px-10 py-6 text-right text-sm font-medium text-gray-400 tabular-nums">
                                {m.unit === 'currency' ? `₹${m.previous_value.toLocaleString('en-IN')}` : m.previous_value}{m.unit === 'percentage_points' ? '%' : ''}
                             </td>
                             <td className="px-10 py-6 text-right text-sm font-black text-gray-900 tabular-nums">
                                {m.unit === 'currency' ? `₹${m.current_value.toLocaleString('en-IN')}` : m.current_value}{m.unit === 'percentage_points' ? '%' : ''}
                             </td>
                             <td className={clsx(
                                "px-10 py-6 text-right text-sm font-black tabular-nums",
                                m.direction === 'neutral' ? 'text-gray-300' : (
                                  (m.label.includes('Rate') || m.label.includes('Reconciled'))
                                  ? (m.direction === 'up' ? 'text-green-600' : 'text-red-600')
                                  : (m.direction === 'down' ? 'text-green-600' : 'text-red-600')
                                )
                             )}>
                                {m.direction === 'up' ? '+' : m.direction === 'down' ? '-' : ''}
                                {m.unit === 'currency' ? `₹${m.change.toLocaleString('en-IN')}` : m.change}{m.unit === 'percentage_points' ? 'pp' : ''}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Exception Intelligence Trend */}
           <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Brain className="w-16 h-16 text-black" />
                 </div>
                 <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-8">Exception Trends</h3>
                 <div className="space-y-6">
                    {data.exceptions.map((e: any) => (
                       <div key={e.label} className="space-y-2">
                          <div className="flex justify-between items-end">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{e.label}</p>
                             <div className={clsx(
                                "text-xs font-black tabular-nums",
                                e.change < 0 ? "text-green-600" : e.change > 0 ? "text-red-600" : "text-gray-400"
                             )}>
                                {e.change > 0 ? '+' : ''}{e.change}
                             </div>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                             <span>{e.current_count} Cases</span>
                             <span className="text-gray-300">Baseline: {e.previous_count}</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden flex">
                             <div
                              className={clsx(
                                "h-full transition-all duration-1000",
                                e.change < 0 ? "bg-green-500" : e.change > 0 ? "bg-red-500" : "bg-gray-200"
                              )}
                              style={{ width: `${Math.min(100, (Math.abs(e.change) / (e.previous_count || 1)) * 100)}%` }}
                             />
                          </div>
                       </div>
                    ))}
                    {data.exceptions.length === 0 && (
                       <p className="text-xs font-bold text-gray-400 italic text-center py-8">No exceptions to track.</p>
                    )}
                 </div>
              </div>

              <div className="bg-black p-8 rounded-[2.5rem] shadow-2xl shadow-black/20 text-white flex flex-col justify-between min-h-[240px]">
                 <div>
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">System Verdict</h3>
                    <p className="text-lg font-bold leading-relaxed">
                       {data.metrics.find((m: any) => m.label === "Match Rate")?.direction === 'up'
                         ? "Reconciliation accuracy is improving. Strategic automation is reducing manual review workload."
                         : "Operational exceptions require investigation. Review recent normalization rule efficiency."}
                    </p>
                 </div>
                 <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Audit Evidence Baseline</span>
                    <Shield className="w-4 h-4 text-green-400" />
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Comparative Analytics...</div>}>
       <CompareContent />
    </Suspense>
  );
}
