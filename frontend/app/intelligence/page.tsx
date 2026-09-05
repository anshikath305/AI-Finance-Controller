"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getIntelligence, getActionability } from '@/lib/api';
import StrategicActionCard from '@/components/StrategicActionCard';
import {
  ArrowLeft, Brain, Loader2, TrendingUp, AlertTriangle,
  ChevronRight, Info, BarChart3, Zap, ShieldCheck, Target
} from 'lucide-react';

function IntelligenceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const runId = searchParams.get('runId');
  const baselineId = searchParams.get('baselineId');

  const [data, setData] = useState<any>(null);
  const [actionability, setActionability] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'patterns' | 'actions'>('actions');

  useEffect(() => {
    async function fetchData() {
      if (!runId) {
        setError("No reconciliation run specified.");
        setLoading(false);
        return;
      }
      try {
        const [intel, action] = await Promise.all([
          getIntelligence(Number(runId)),
          getActionability(Number(runId), baselineId ? Number(baselineId) : undefined)
        ]);
        setData(intel);
        setActionability(action);
        if (intel.patterns.length > 0) {
          setSelectedPattern(intel.patterns[0]);
        }
      } catch (err: any) {
        setError("Failed to load exception intelligence.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [runId, baselineId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin w-10 h-10 text-black mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Analyzing Patterns...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <h2 className="text-2xl font-black tracking-tight text-gray-900">Intelligence Unavailable</h2>
        <p className="text-gray-500 font-medium">{error || "No data found."}</p>
        <button onClick={() => router.push(`/dashboard?runId=${runId}`)} className="w-full py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-xs">Back to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <nav className="border-b border-gray-100 bg-white py-4 px-8 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-6">
          <button onClick={() => router.push(`/dashboard?runId=${runId}`)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.1em]">Exception Intelligence</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Run #{runId} • Pattern Analysis</p>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-12">
        {/* Summary Header */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div className="space-y-2">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operational Insight</h2>
            <div className="flex items-baseline space-x-3">
              <span className="text-5xl font-black text-gray-900">{data.summary.total_exceptions}</span>
              <span className="text-lg font-bold text-gray-400 uppercase">Total Exceptions</span>
            </div>
            <p className="text-sm font-bold text-red-600">₹{data.summary.total_value.toLocaleString('en-IN')} Unresolved Value</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Distinct Patterns</p>
                <p className="text-2xl font-black text-gray-900">{data.summary.pattern_count}</p>
             </div>
             <div className="px-6 py-4 bg-black rounded-2xl shadow-xl shadow-black/10">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Strategic Actions</p>
                <p className="text-2xl font-black text-white">{actionability?.summary.total_actions || 0}</p>
             </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-8 border-b border-gray-100 mb-12">
           <button
            onClick={() => setActiveTab('actions')}
            className={clsx(
              "pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
              activeTab === 'actions' ? "text-black" : "text-gray-300 hover:text-gray-500"
            )}
           >
              Strategic Actions
              {activeTab === 'actions' && <div className="absolute bottom-0 left-0 w-full h-1 bg-black rounded-full" />}
           </button>
           <button
            onClick={() => setActiveTab('patterns')}
            className={clsx(
              "pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
              activeTab === 'patterns' ? "text-black" : "text-gray-300 hover:text-gray-500"
            )}
           >
              Pattern Analysis
              {activeTab === 'patterns' && <div className="absolute bottom-0 left-0 w-full h-1 bg-black rounded-full" />}
           </button>
        </div>

        {activeTab === 'actions' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {actionability?.actions.map((action: any, i: number) => (
                   <StrategicActionCard
                    key={i}
                    action={action}
                    onReview={(p) => router.push(`/review?runId=${runId}&pattern=${p}`)}
                   />
                ))}
             </div>

             {actionability?.actions.length === 0 && (
                <div className="bg-white p-20 rounded-[3rem] border border-gray-100 text-center space-y-6">
                   <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-8 h-8" />
                   </div>
                   <div className="space-y-2">
                      <h2 className="text-xl font-black text-gray-900 uppercase">No Actions Required</h2>
                      <p className="text-gray-400 font-medium italic">Operational efficiency is within healthy baseline parameters.</p>
                   </div>
                </div>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
          {/* Patterns List */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-4">Recurring Exception Patterns</h3>
            {data.patterns.map((p: any) => (
              <button
                key={p.type}
                onClick={() => setSelectedPattern(p)}
                className={`w-full text-left p-6 rounded-[2rem] border transition-all group ${
                  selectedPattern?.type === p.type
                  ? 'bg-black text-white border-black shadow-2xl shadow-black/20 scale-[1.02]'
                  : 'bg-white border-gray-200 hover:border-black shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-xl ${selectedPattern?.type === p.type ? 'bg-white/10' : 'bg-gray-50'}`}>
                    <Brain className={`w-4 h-4 ${selectedPattern?.type === p.type ? 'text-white' : 'text-gray-900'}`} />
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${selectedPattern?.type === p.type ? 'text-gray-400' : 'text-gray-400'}`}>Workload</p>
                    <p className="text-xl font-black tabular-nums">{p.workload_percentage}%</p>
                  </div>
                </div>
                <h4 className="text-lg font-black tracking-tight mb-1">{p.label}</h4>
                <p className={`text-xs font-bold mb-4 ${selectedPattern?.type === p.type ? 'text-gray-400' : 'text-gray-500'}`}>{p.case_count} instances • ₹{p.total_value.toLocaleString('en-IN')}</p>

                <div className={`h-1.5 w-full rounded-full overflow-hidden ${selectedPattern?.type === p.type ? 'bg-white/10' : 'bg-gray-100'}`}>
                  <div className={`h-full rounded-full transition-all duration-1000 ${selectedPattern?.type === p.type ? 'bg-white' : 'bg-black'}`} style={{ width: `${p.workload_percentage}%` }} />
                </div>
              </button>
            ))}

            {data.patterns.length === 0 && (
              <div className="bg-white p-12 rounded-[2rem] border border-gray-200 border-dashed text-center">
                 <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
                 <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">No Recurring Patterns Identified</p>
              </div>
            )}
          </div>

          {/* Pattern Deep Dive */}
          <div className="lg:col-span-7">
            {selectedPattern ? (
              <div className="space-y-8 sticky top-24">
                <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-10 border-b border-gray-100 bg-gray-50/30">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Pattern Analysis</h3>
                    <p className="text-3xl font-black text-gray-900 tracking-tight mb-6">{selectedPattern.label}</p>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 flex items-start space-x-4">
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <Info className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Root Cause Explanation</p>
                        <p className="text-sm font-bold text-gray-700 leading-relaxed">{selectedPattern.explanation}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-10">
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6">Representative Examples</h4>
                    <div className="space-y-4">
                      {selectedPattern.examples.map((ex: any, i: number) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-xs font-black text-gray-900">{ex.bank_desc}</p>
                            {ex.ledger_desc && (
                              <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                <span>{ex.ledger_desc}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-gray-900">₹{ex.amount.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{ex.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-12 p-8 bg-black rounded-[2rem] text-white flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="text-center md:text-left">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Strategic Recommendation</p>
                        <p className="text-sm font-bold">Improve normalization rules for this pattern.</p>
                      </div>
                      <button
                        onClick={() => router.push(`/review?runId=${runId}&pattern=${selectedPattern.type}`)}
                        className="px-6 py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center hover:scale-[1.05] transition-all whitespace-nowrap"
                      >
                        Review Affected
                        <ChevronRight className="w-3 h-3 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-white rounded-[2.5rem] border border-gray-200 border-dashed">
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select a pattern to investigate</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function IntelligencePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white text-gray-400 font-bold uppercase tracking-widest text-xs">Environment Booting...</div>}>
      <IntelligenceContent />
    </Suspense>
  );
}
