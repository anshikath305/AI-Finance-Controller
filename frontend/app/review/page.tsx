"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { Check, X, AlertCircle, Info, Loader2, ChevronLeft, ChevronRight, AlertTriangle, Minus, ArrowLeft, Shield } from 'lucide-react';
import { getMatches, submitReview } from '@/lib/api';

function ComparisonRow({ label, bankValue, ledgerValue, isMatch, isMissing }: any) {
  return (
    <div className="grid grid-cols-3 py-4 border-b border-gray-100 items-center transition-colors hover:bg-gray-50/30">
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</div>
      <div className="text-sm font-bold text-gray-900 pr-4">{bankValue}</div>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-bold ${isMissing ? 'text-gray-300 italic' : 'text-gray-900'}`}>{ledgerValue ?? '—'}</span>
        <div className="ml-4">
          {isMissing ? (
            <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center"><Minus className="w-3 h-3 text-gray-300" /></div>
          ) : isMatch ? (
            <div className="w-6 h-6 bg-green-50 rounded-lg flex items-center justify-center border border-green-100 shadow-sm shadow-green-100/50">
              <Check className="w-3.5 h-3.5 text-green-600" />
            </div>
          ) : (
            <div className="w-6 h-6 bg-orange-50 rounded-lg flex items-center justify-center border border-orange-100 shadow-sm shadow-orange-100/50">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const runId = searchParams.get('runId');
  const [possibleMatches, setPossibleMatches] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!runId) return;
      try {
        const matches = await getMatches(Number(runId));
        setPossibleMatches(matches.filter((m: any) => m.status === 'POSSIBLE_MATCH' || m.status === 'UNRESOLVED'));
      } catch (err) { alert("Session expired or network error."); } finally { setLoading(false); }
    }
    fetchData();
  }, [runId]);

  const handleAction = async (action: 'ACCEPT' | 'REJECT' | 'MARK_EXCEPTION') => {
    const currentMatch = possibleMatches[currentIndex];
    if (!currentMatch) return;
    setSubmitting(true);
    try {
      await submitReview(currentMatch.id, action);
      const updated = [...possibleMatches];
      updated.splice(currentIndex, 1);
      setPossibleMatches(updated);
      if (currentIndex >= updated.length && updated.length > 0) setCurrentIndex(updated.length - 1);
    } catch (err: any) { alert("Verification failed: " + err.message); } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin w-8 h-8 text-black" />
    </div>
  );

  const match = possibleMatches[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col selection:bg-black selection:text-white">
      {/* Dynamic Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex justify-between items-center sticky top-0 z-10 shadow-sm shadow-black/[0.02]">
        <div className="flex items-center space-x-6">
          <button onClick={() => router.push(`/dashboard?runId=${runId}`)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.1em]">Verification Queue</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {possibleMatches.length > 0 ? `Case ${currentIndex + 1} of ${possibleMatches.length}` : 'All cases cleared'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-[10px] font-black uppercase tracking-widest">
           <Shield className="w-3 h-3" />
           <span>High Sensitivity Mode</span>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        {!match ? (
          <div className="max-w-xl mx-auto mt-20 text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl shadow-green-100/50 flex items-center justify-center mx-auto text-green-500 border border-green-50">
              <Check className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2">Review Complete</h2>
              <p className="text-gray-500 font-medium">All ambiguous candidates for Run #{runId} have been successfully resolved.</p>
            </div>
            <button onClick={() => router.push(`/dashboard?runId=${runId}`)} className="px-8 py-4 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-all shadow-lg shadow-black/10">
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Comparison Workspace */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-end bg-gray-50/30">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Decision Target</h3>
                  <p className="text-xl font-black text-gray-900 tracking-tight">Resolve Discrepancy</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Confidence</p>
                  <p className="text-3xl font-black text-blue-600 tabular-nums">{(match.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-3 mb-6 pb-2 border-b border-gray-100"><div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Attribute</div><div className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Bank Record</div><div className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Ledger Record</div></div>
                <div className="space-y-1">
                  <ComparisonRow label="Monetary Value" bankValue={`₹${Number(match.bank_detail.amount || match.bank_detail.Amount).toLocaleString('en-IN')}`} ledgerValue={match.ledger_detail ? `₹${Number(match.ledger_detail.amount || match.ledger_detail.Amount).toLocaleString('en-IN')}` : undefined} isMatch={match.matching_signals?.amount_match} isMissing={!match.ledger_detail} />
                  <ComparisonRow label="Effective Date" bankValue={match.bank_detail.date || match.bank_detail.Date} ledgerValue={match.ledger_detail?.date || match.ledger_detail?.Date} isMatch={match.matching_signals?.date_match === 'exact'} isMissing={!match.ledger_detail} />
                  <ComparisonRow label="Merchant / Memo" bankValue={match.bank_detail.desc || match.bank_detail.Description} ledgerValue={match.ledger_detail?.desc || match.ledger_detail?.Description} isMatch={match.matching_signals?.merchant_match === 'exact'} isMissing={!match.ledger_detail} />
                </div>
              </div>
            </div>

            {/* Evidence & Action Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col h-full">
                  <div className="flex items-center space-x-2 mb-6">
                    <Info className="w-4 h-4 text-blue-500" />
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Reconciliation Evidence</h4>
                  </div>
                  <div className="flex-1 space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Authoritative Signals</p>
                      <div className="space-y-3">
                        {match.explanation.split('.').filter(Boolean).map((s: string, i: number) => (
                          <div key={i} className="flex items-start text-sm font-medium text-gray-700 leading-tight">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 mr-3 shrink-0" />
                            {s}.
                          </div>
                        ))}
                      </div>
                    </div>
                    {match.matching_signals?.ai_evidence && (
                      <div className="pt-6 border-t border-gray-100">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">AI Interpretive Reasoning</p>
                        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                          <p className="text-sm text-blue-900 font-bold leading-relaxed mb-4">"{match.matching_signals.ai_evidence.reasoning}"</p>
                          <div className="flex flex-wrap gap-2">
                            {match.matching_signals.ai_evidence.supporting_evidence.map((e: string, i: number) => (
                              <span key={i} className="px-2.5 py-1 bg-white border border-blue-100 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-tight shadow-sm">{e}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-black p-8 rounded-[2.5rem] shadow-2xl shadow-black/20 text-white flex flex-col justify-between h-full min-h-[400px]">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-10 text-center">Execute Audit Decision</h4>
                    <div className="space-y-4">
                      <button disabled={submitting} onClick={() => handleAction('ACCEPT')} className="group w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50">
                        <Check className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform" />
                        Confirm Match
                      </button>
                      <button disabled={submitting} onClick={() => handleAction('REJECT')} className="w-full py-5 bg-white/10 text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all flex items-center justify-center disabled:opacity-50">
                        <X className="w-4 h-4 mr-3" />
                        Reject Candidate
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="h-px bg-white/10" />
                    <button disabled={submitting} onClick={() => handleAction('MARK_EXCEPTION')} className="w-full py-2 text-red-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-red-300 transition-all text-center">
                      Report Exception
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
              <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)} className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest hover:text-black transition-all disabled:opacity-20 group">
                <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Previous Case
              </button>
              <button disabled={currentIndex === possibleMatches.length - 1} onClick={() => setCurrentIndex(prev => prev + 1)} className="flex items-center text-xs font-black text-gray-400 uppercase tracking-widest hover:text-black transition-all disabled:opacity-20 group">
                Next Case <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ReviewPage() { return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-black" /></div>}><ReviewContent /></Suspense>; }
