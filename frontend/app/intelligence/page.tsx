"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getIntelligence, getActionability } from '@/lib/api';
import StrategicActionCard from '@/components/StrategicActionCard';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeft, Brain, Loader2, TrendingUp, AlertTriangle,
  ChevronRight, Info, BarChart3, Zap, ShieldCheck, Target,
  Activity, Sparkles, Filter, Layout
} from 'lucide-react';
import { clsx } from 'clsx';

function IntelligenceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const runId = searchParams.get('runId');
  const baselineId = searchParams.get('baselineId');

  const [data, setData] = useState<any>(null);
  const [actionability, setActionability] = useState<any>(null);
  const [reviewInsights, setReviewInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'patterns' | 'actions' | 'review'>('actions');

  useEffect(() => {
    async function fetchData() {
      if (!runId) {
        setError("No reconciliation run specified.");
        setLoading(false);
        return;
      }
      try {
        const [intel, action, review] = await Promise.all([
          getIntelligence(Number(runId)),
          getActionability(Number(runId), baselineId ? Number(baselineId) : undefined),
          getReviewInsights(Number(runId))
        ]);
        setData(intel);
        setActionability(action);
        setReviewInsights(review);
        if (intel.patterns.length > 0) {
          setSelectedPattern(intel.patterns[0]);
        }
      } catch (err: any) {
        setError("Failed to load exception intelligence metadata.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [runId, baselineId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6 animate-pulse">
        <Brain className="w-12 h-12 text-black mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Synthesizing Operational Data...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-white p-10">
      <div className="max-w-md w-full text-center space-y-8">
        <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto" />
        <div className="space-y-2">
           <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Analysis Incomplete</h2>
           <p className="text-gray-500 font-medium italic">{error || "No pattern data detected for this run."}</p>
        </div>
        <button onClick={() => router.push(`/dashboard?runId=${runId}`)} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Return to Control</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      <nav className="border-b border-gray-100 bg-white py-6 px-10 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-8">
          <button onClick={() => router.push(`/dashboard?runId=${runId}`)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.2em]">Intelligence Workspace</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Audit Run #{runId} • Forensic Pattern Detection</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
           <Sparkles className="w-3.5 h-3.5 fill-blue-700/20" />
           <span>Pattern-Matched Context</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-10 pt-16">
        {/* Summary Header */}
        <div className="bg-white p-12 rounded-[3rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16 relative overflow-hidden group hover:border-black transition-all">
           <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
              <Activity className="w-48 h-48 text-black" />
           </div>

          <div className="space-y-4 relative z-10">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2">Macro Exposure</h2>
            <div className="flex items-baseline space-x-3">
              <span className="text-7xl font-black text-gray-900 tracking-tighter tabular-nums">{data.summary.total_exceptions}</span>
              <span className="text-sm font-black text-gray-400 uppercase tracking-widest italic">Core Exceptions</span>
            </div>
            <p className="text-lg font-black text-red-600 uppercase tracking-tighter italic">
              {formatCurrency(data.summary.total_value)} AT RISK
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
             <div className="px-8 py-6 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Structural Fingerprints</p>
                <p className="text-4xl font-black text-gray-900">{data.summary.pattern_count}</p>
             </div>
             <div className="px-8 py-6 bg-black rounded-[2rem] shadow-2xl shadow-black/20 text-white flex flex-col justify-between">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Master Variance</p>
                <p className="text-lg font-black italic uppercase tracking-tighter leading-none truncate w-40">{data.patterns[0]?.label || 'Neutral'}</p>
             </div>
          </div>
        </div>

        {/* Tab Logic */}
        <div className="flex items-center space-x-12 border-b border-gray-100 mb-12">
           <TabButton
              active={activeTab === 'actions'}
              onClick={() => setActiveTab('actions')}
              icon={<Target className="w-4 h-4" />}
              label="Recommended Actions"
              count={actionability?.summary.total_actions}
           />
           <TabButton
              active={activeTab === 'review'}
              onClick={() => setActiveTab('review')}
              icon={<Users className="w-4 h-4" />}
              label="Review Intelligence"
           />
           <TabButton
              active={activeTab === 'patterns'}
              onClick={() => setActiveTab('patterns')}
              icon={<Layout className="w-4 h-4" />}
              label="Pattern Analysis"
              count={data.patterns.length}
           />
        </div>

        {activeTab === 'actions' ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {actionability?.actions.map((action: any, i: number) => (
                   <StrategicActionCard
                    key={i}
                    action={action}
                    onReview={(p) => router.push(`/review?runId=${runId}&pattern=${p}`)}
                   />
                ))}
             </div>

             {actionability?.actions.length === 0 && (
                <div className="bg-white p-32 rounded-[4rem] border border-gray-200 border-dashed text-center space-y-8">
                   <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-100/50 border border-green-100">
                      <ShieldCheck className="w-10 h-10" />
                   </div>
                   <div className="space-y-3">
                      <h2 className="text-2xl font-black text-gray-900 uppercase italic">Maximum Efficiency Achieved</h2>
                      <p className="text-gray-400 font-medium max-w-sm mx-auto leading-relaxed">No recurring structural anomalies were detected in this reconciliation run.</p>
                   </div>
                </div>
             )}
          </div>
        ) : activeTab === 'review' ? (
           <div className="space-y-12 animate-in fade-in duration-500 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <MetricMiniCard label="Total Reviewed" value={reviewInsights?.summary.total_reviewed} icon={<Users className="w-4 h-4 text-blue-500" />} />
                 <MetricMiniCard label="Accepted" value={reviewInsights?.summary.accepted} icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} />
                 <MetricMiniCard label="Override Rate" value={`${reviewInsights?.summary.override_rate}%`} icon={<AlertCircle className="w-4 h-4 text-orange-500" />} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                 <div className="lg:col-span-7 bg-white p-10 rounded-[2.5rem] border border-gray-200 shadow-sm space-y-8">
                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Decision Calibration</h3>
                    <div className="space-y-6">
                       {reviewInsights?.confidence_calibration.map((bucket: any) => (
                          <div key={bucket.range} className="space-y-2">
                             <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                                <span className="text-gray-400">{bucket.range} Confidence</span>
                                <span className="text-gray-900">{bucket.acceptance_rate}% Acceptance</span>
                             </div>
                             <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden flex">
                                <div className="h-full bg-black transition-all duration-1000" style={{ width: `${bucket.acceptance_rate}%` }} />
                             </div>
                             <p className="text-[9px] font-bold text-gray-300 text-right">{bucket.count} cases analyzed</p>
                          </div>
                       ))}
                       {reviewInsights?.confidence_calibration.length === 0 && (
                          <p className="text-xs font-bold text-gray-400 italic text-center py-10">No calibration data available.</p>
                       )}
                    </div>
                 </div>

                 <div className="lg:col-span-5 space-y-6">
                    <div className="bg-black p-10 rounded-[2.5rem] shadow-2xl text-white space-y-10">
                       <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Audit Observations</h3>
                       <div className="space-y-8">
                          {reviewInsights?.patterns.map((p: any, i: number) => (
                             <div key={i} className="space-y-3">
                                <p className="text-lg font-black italic uppercase tracking-tighter leading-none">{p.label}</p>
                                <p className="text-sm font-medium text-gray-400 leading-relaxed italic">"{p.insight}"</p>
                             </div>
                          ))}
                          {reviewInsights?.patterns.length === 0 && (
                             <p className="text-xs font-bold text-gray-500 italic">No recurring override patterns identified.</p>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-500 pb-20">
            {/* Patterns List */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center space-x-3 px-2 mb-6">
                 <Filter className="w-3.5 h-3.5 text-gray-400" />
                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Signature Inventory</h3>
              </div>

              {data.patterns.map((p: any) => (
                <button
                  key={p.type}
                  onClick={() => setSelectedPattern(p)}
                  className={clsx(
                    "w-full text-left p-8 rounded-[2.5rem] border transition-all group relative overflow-hidden",
                    selectedPattern?.type === p.type
                    ? 'bg-black text-white border-black shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] scale-[1.02] z-10'
                    : 'bg-white border-gray-100 hover:border-black shadow-sm'
                  )}
                >
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className={clsx("p-3 rounded-2xl", selectedPattern?.type === p.type ? 'bg-white/10' : 'bg-gray-50')}>
                      <Brain className={clsx("w-5 h-5", selectedPattern?.type === p.type ? 'text-white' : 'text-gray-900')} />
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Queue Impact</p>
                      <p className="text-2xl font-black tabular-nums tracking-tighter">{p.workload_percentage}%</p>
                    </div>
                  </div>

                  <h4 className="text-xl font-black tracking-tight mb-2 uppercase italic">{p.label}</h4>
                  <p className={clsx("text-[10px] font-black uppercase tracking-widest mb-6", selectedPattern?.type === p.type ? 'text-gray-400' : 'text-gray-400')}>
                    {p.case_count} Instances • {formatCurrency(p.total_value)}
                  </p>

                  <div className={clsx("h-1.5 w-full rounded-full overflow-hidden", selectedPattern?.type === p.type ? 'bg-white/10' : 'bg-gray-100')}>
                    <div className={clsx("h-full rounded-full transition-all duration-1000", selectedPattern?.type === p.type ? 'bg-white' : 'bg-black')} style={{ width: `${p.workload_percentage}%` }} />
                  </div>
                </button>
              ))}

              {data.patterns.length === 0 && (
                <div className="bg-white p-20 rounded-[3rem] border border-gray-100 border-dashed text-center">
                   <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-6" />
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Zero Recurring Patterns</p>
                </div>
              )}
            </div>

            {/* Pattern Deep Dive */}
            <div className="lg:col-span-7">
              {selectedPattern ? (
                <div className="space-y-10 sticky top-28">
                  <div className="bg-white rounded-[3.5rem] border border-gray-200 shadow-sm overflow-hidden hover:border-black transition-all">
                    <div className="p-12 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex items-center space-x-3 mb-4">
                         <Activity className="w-4 h-4 text-gray-400" />
                         <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Forensic Profile</h3>
                      </div>
                      <p className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-10">{selectedPattern.label}</p>

                      <div className="bg-white p-8 rounded-[2rem] border border-gray-200 flex items-start space-x-6 shadow-sm">
                        <div className="p-4 bg-blue-50 rounded-2xl">
                          <Info className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Root Cause Hypothesis</p>
                          <p className="text-base font-bold text-gray-700 leading-relaxed">{selectedPattern.explanation}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-12 space-y-10">
                      <div>
                        <div className="flex items-center space-x-3 mb-8">
                           <Layout className="w-3.5 h-3.5 text-gray-400" />
                           <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Evidence Samples</h4>
                        </div>
                        <div className="space-y-4">
                          {selectedPattern.examples.map((ex: any, i: number) => (
                            <div key={i} className="p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100 flex justify-between items-center group/item hover:bg-white hover:border-black transition-all">
                              <div className="space-y-2">
                                <p className="text-sm font-black text-gray-900 tracking-tight">{ex.bank_desc}</p>
                                {ex.ledger_desc && (
                                  <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <ChevronRight className="w-3 h-3 mr-1" />
                                    <span>{ex.ledger_desc}</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right space-y-1">
                                <p className="text-base font-black text-gray-900 tabular-nums tracking-tighter">{formatCurrency(ex.amount)}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ex.date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="text-center md:text-left space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Operational Directive</p>
                          <p className="text-base font-black italic tracking-tight">Review alignment across {selectedPattern.case_count} cases.</p>
                        </div>
                        <button
                          onClick={() => router.push(`/review?runId=${runId}&pattern=${selectedPattern.type}`)}
                          className="px-10 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl shadow-black/20"
                        >
                          Execute Queue
                          <ChevronRight className="w-4 h-4 ml-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-white rounded-[4rem] border border-gray-100 border-dashed space-y-6">
                   <Target className="w-16 h-16 text-gray-100" />
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Subject Required</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MetricMiniCard({ label, value, icon }: any) {
   return (
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-black transition-all">
         <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-black text-gray-900 tabular-nums tracking-tighter">{value}</p>
         </div>
         <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors">
            {icon}
         </div>
      </div>
   );
}

function TabButton({ active, onClick, icon, label, count }: any) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "pb-6 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative flex items-center space-x-3",
        active ? "text-black" : "text-gray-300 hover:text-gray-500"
      )}
    >
       <span className={clsx("transition-colors", active ? 'text-finance-accent' : 'text-gray-300')}>{icon}</span>
       <span>{label}</span>
       {count !== undefined && (
          <span className={clsx(
            "w-5 h-5 rounded flex items-center justify-center text-[10px] font-black",
            active ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
          )}>{count}</span>
       )}
       {active && <div className="absolute bottom-0 left-0 w-full h-1 bg-black rounded-full" />}
    </button>
  );
}

export default function IntelligencePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
         <Loader2 className="animate-spin w-8 h-8 text-black" />
      </div>
    }>
      <IntelligenceContent />
    </Suspense>
  );
}
