"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getRunAudit, getDecisionTrace } from '@/lib/api';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import {
  Shield, Fingerprint, Clock, CheckCircle2, AlertTriangle,
  ArrowLeft, Search, Loader2, ChevronRight, Activity,
  BarChart3, User, Cpu, Sparkles, FileText, Layout
} from 'lucide-react';
import { clsx } from 'clsx';
import StatusBadge from '@/components/StatusBadge';

function AuditContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const runId = searchParams.get('runId');
  const initialMatchId = searchParams.get('matchId');

  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(initialMatchId ? Number(initialMatchId) : null);
  const [traceData, setTraceData] = useState<any>(null);
  const [loadingTrace, setLoadingTrace] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!runId) {
        setError("No reconciliation context specified.");
        setLoading(false);
        return;
      }
      try {
        const res = await getRunAudit(Number(runId));
        setAuditData(res);
      } catch (err) {
        setError("Synchronization failure. Audit logs inaccessible.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [runId]);

  useEffect(() => {
    async function fetchTrace() {
      if (!selectedMatchId) return;
      setLoadingTrace(true);
      try {
        const res = await getDecisionTrace(selectedMatchId);
        setTraceData(res);
      } catch (err) {
        console.error("Trace load failed");
      } finally {
        setLoadingTrace(false);
      }
    }
    fetchTrace();
  }, [selectedMatchId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6 animate-pulse">
        <Fingerprint className="w-12 h-12 text-black mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Authenticating Audit Stream...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 selection:bg-black selection:text-white">
      <nav className="border-b border-gray-100 bg-white py-6 px-10 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-10">
          <button onClick={() => router.push(`/dashboard?runId=${runId}`)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.3em] tracking-tighter">Audit Control Center</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Immutable Decision Trace • Run #{runId}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/20">
           <Shield className="w-3.5 h-3.5 text-green-400" />
           <span>Authoritative Observation Mode</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-10 pt-16 space-y-16">
        {/* Audit Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           <AuditMetric label="Audit Depth" value={auditData.summary.total_events} sub="Events Logged" icon={<Activity className="w-4 h-4 text-blue-500" />} />
           <AuditMetric label="Human Decisions" value={auditData.summary.human_actions} sub="Authoritative Overrides" icon={<User className="w-4 h-4 text-purple-500" />} />
           <AuditMetric label="System Decisions" value={auditData.summary.system_actions} sub="Deterministic / Heuristic" icon={<Cpu className="w-4 h-4 text-gray-400" />} />
           <AuditMetric label="Evidence Coverage" value={`${auditData.summary.evidence_coverage}%`} sub="Decision Transparencey" icon={<Sparkles className="w-4 h-4 text-finance-accent" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Run Timeline */}
           <div className="lg:col-span-4 space-y-10">
              <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm relative overflow-hidden group hover:border-black transition-all">
                 <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.4em] mb-12">Execution Timeline</h3>
                 <div className="space-y-0 relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-50 group-hover:bg-gray-100 transition-colors" />
                    {auditData.timeline.map((event: any, i: number) => (
                       <div key={i} className="relative pl-12 pb-10 last:pb-0 group/ev">
                          <div className={clsx(
                             "absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center z-10 transition-all",
                             event.actor_type === 'HUMAN' ? 'bg-purple-600 scale-110 shadow-lg' : 'bg-gray-100'
                          )}>
                             {event.actor_type === 'HUMAN' ? <User className="w-3 h-3 text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                          </div>
                          <div className="space-y-1">
                             <div className="flex justify-between items-center">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{event.event_type.replace(/_/g, ' ')}</p>
                                <p className="text-[8px] font-bold text-gray-300 tabular-nums uppercase">{new Date(event.timestamp).toLocaleTimeString()}</p>
                             </div>
                             <p className="text-xs font-bold text-gray-700 leading-relaxed">{event.description}</p>
                          </div>
                       </div>
                    ))}
                    {auditData.timeline.length === 0 && (
                       <p className="text-xs font-bold text-gray-400 italic text-center py-10">No historical events recorded for this context.</p>
                    )}
                 </div>
              </div>
           </div>

              {/* Decision Trace Table & Detail */}
              <div className="lg:col-span-8 space-y-10">
                <div className="bg-white rounded-[3rem] border border-gray-200 shadow-sm overflow-hidden hover:border-black transition-all">
                   <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.4em]">Decision Trace Registry</h2>
                      <div className="relative">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                         <input
                          type="text"
                          placeholder="Search identifier..."
                          className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-black transition-all outline-none"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                         />
                      </div>
                   </div>

                   <div className="p-10">
                      {loadingTrace ? (
                         <div className="py-32 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="animate-spin w-8 h-8 text-black" />
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reconstructing decision lifecycle...</p>
                         </div>
                      ) : !traceData ? (
                         <div className="py-32 text-center space-y-6">
                            <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mx-auto border border-gray-100 shadow-sm">
                               <FileText className="w-8 h-8 text-gray-200" />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">Awaiting Subject Selection</p>
                         </div>
                      ) : (
                       <div className="space-y-12 animate-in fade-in duration-500">
                          <div className="grid grid-cols-2 gap-16 relative">
                             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border border-gray-100 flex items-center justify-center z-20 text-[8px] font-black text-gray-300 uppercase shadow-md">VS</div>

                             <div className="space-y-6">
                                <p className="text-[9px] font-black text-finance-accent uppercase tracking-[0.3em]">Bank Input</p>
                                <TraceFact label="Description" value={traceData.bank_tx.desc || traceData.bank_tx.Description} />
                                <div className="grid grid-cols-2 gap-6">
                                   <TraceFact label="Amount" value={formatCurrency(traceData.bank_tx.amount, traceData.policy.currency)} />
                                   <TraceFact label="Date" value={traceData.bank_tx.date} />
                                </div>
                             </div>

                             <div className="space-y-6">
                                <p className="text-[9px] font-black text-purple-600 uppercase tracking-[0.3em]">Ledger Input</p>
                                {traceData.ledger_tx ? (
                                   <>
                                      <TraceFact label="Description" value={traceData.ledger_tx.desc || traceData.ledger_tx.Description} />
                                      <div className="grid grid-cols-2 gap-6">
                                         <TraceFact label="Amount" value={formatCurrency(traceData.ledger_tx.amount, traceData.policy.currency)} />
                                         <TraceFact label="Date" value={traceData.ledger_tx.date} />
                                      </div>
                                   </>
                                ) : (
                                   <div className="h-full bg-gray-50/50 rounded-2xl border border-dashed border-gray-100 flex items-center justify-center p-8">
                                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">No Counterpart Candidate</p>
                                   </div>
                                )}
                             </div>
                          </div>

                          <div className="pt-10 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-10">
                             <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Engine Logic</h4>
                                <div className="space-y-4">
                                   <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                                      <span className="text-gray-400 uppercase tracking-widest text-[9px]">Decision State</span>
                                      <StatusBadge status={traceData.status} />
                                   </div>
                                   <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                                      <span className="text-gray-400 uppercase tracking-widest text-[9px]">Confidence Calibration</span>
                                      <span className="text-lg font-black text-finance-accent tabular-nums tracking-tighter">{traceData.confidence}%</span>
                                   </div>
                                   <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 italic text-xs font-medium text-gray-600 leading-relaxed shadow-inner">
                                      "{traceData.explanation}"
                                   </div>
                                </div>
                             </div>

                             <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Policy Active Snapshot</h4>
                                <div className="grid grid-cols-2 gap-6 bg-gray-900 p-6 rounded-[2rem] text-white">
                                   <PolicyMini label="Profile" value={traceData.policy.profile_name} />
                                   <PolicyMini label="Date Tol" value={`${traceData.policy.date_tolerance}d`} />
                                   <PolicyMini label="Amount Tol" value={formatCurrency(traceData.policy.amount_tolerance, traceData.policy.currency)} />
                                   <PolicyMini label="Threshold" value={traceData.policy.match_threshold} />
                                </div>
                             </div>
                          </div>

                          {traceData.ai_analysis?.available && (
                             <div className="bg-blue-50/30 p-8 rounded-[2.5rem] border border-blue-100/30 space-y-4">
                                <div className="flex items-center space-x-3">
                                   <Sparkles className="w-4 h-4 text-blue-600 fill-blue-600/10" />
                                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">AI Interpretive Trace</p>
                                </div>
                                <p className="text-sm font-bold text-blue-900 italic leading-relaxed">"{traceData.ai_analysis.reasoning}"</p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                   {traceData.ai_analysis.supporting_evidence.map((ev: string, i: number) => (
                                      <span key={i} className="px-3 py-1 bg-white border border-blue-100 text-blue-600 text-[9px] font-black rounded-lg uppercase tracking-tight shadow-sm">{ev}</span>
                                   ))}
                                </div>
                             </div>
                          )}
                       </div>
                    )}
                 </div>
              </div>

              {/* Simplified Decision List for Selection */}
              <div className="bg-white rounded-[3rem] border border-gray-200 shadow-sm overflow-hidden p-8 hover:border-black transition-all">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-8">Subject Index</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                     {/* For a real audit view, we'd fetch matches here.
                         For MVP Phase H.5, we'll suggest using the master dashboard for navigation. */}
                     <p className="text-xs font-bold text-gray-400 italic col-span-2 text-center py-20">Select a transaction in the Reconciliation Workspace to trace its lifecycle, or use the Command Center to identify high-risk subjects.</p>
                  </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}

function AuditMetric({ label, value, sub, icon }: any) {
   return (
      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between h-56 hover:shadow-2xl hover:border-black transition-all group">
         <div>
            <div className="flex justify-between items-center mb-6">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] group-hover:text-black transition-colors">{label}</p>
               <div className="p-2 bg-gray-50 rounded-xl transition-colors group-hover:bg-black group-hover:text-white">
                  {icon}
               </div>
            </div>
            <p className="text-5xl font-black tabular-nums tracking-tighter italic leading-none mb-4">{value}</p>
         </div>
         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-50 pt-6 italic">{sub}</p>
      </div>
   );
}

function TraceFact({ label, value }: { label: string, value: string }) {
   return (
      <div className="space-y-1">
         <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">{label}</p>
         <p className="text-sm font-black text-gray-900 tracking-tight leading-tight">{value}</p>
      </div>
   );
}

function PolicyMini({ label, value }: { label: string, value: any }) {
   return (
      <div className="space-y-1">
         <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
         <p className="text-xs font-black text-white uppercase italic">{value}</p>
      </div>
   );
}

export default function AuditControlCenter() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-black" /></div>}>
       <AuditContent />
    </Suspense>
  );
}
