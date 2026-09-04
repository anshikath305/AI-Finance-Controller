"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import ExceptionSummary from '@/components/ExceptionSummary';
import MatchEvidence from '@/components/MatchEvidence';
import {
  Check, X, AlertCircle, Info, Loader2, ChevronLeft, ChevronRight,
  AlertTriangle, Minus, ArrowLeft, Shield, Search, TrendingDown, Clock, Tag
} from 'lucide-react';
import { getMatches, submitReview, getMatchEvidence } from '@/lib/api';

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
  const patternFilter = searchParams.get('pattern');

  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState('highest-amount');
  const [evidence, setEvidence] = useState<any>(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!runId) return;
      try {
        const matches = await getMatches(Number(runId));
        setAllMatches(matches);
      } catch (err) { alert("Session expired or network error."); } finally { setLoading(false); }
    }
    fetchData();
  }, [runId]);

  // Priority Logic
  const getPriority = (m: any) => {
    const signals = m.matching_signals || {};
    const amount = Number(m.bank_detail.amount || 0);

    if (!signals.amount_match) return { level: 'HIGH', color: 'text-red-600 bg-red-50 border-red-100', reason: 'Amount Mismatch' };
    if (!m.ledger_transaction_id) return { level: 'HIGH', color: 'text-red-600 bg-red-50 border-red-100', reason: 'Missing Counterpart' };
    if (amount > 10000) return { level: 'HIGH', color: 'text-red-600 bg-red-50 border-red-100', reason: 'Large Financial Value' };

    if (signals.date_match !== 'exact') return { level: 'MEDIUM', color: 'text-orange-600 bg-orange-50 border-orange-100', reason: 'Date Discrepancy' };

    return { level: 'LOW', color: 'text-gray-600 bg-gray-50 border-gray-100', reason: 'Metadata Variation' };
  };

  const queue = useMemo(() => {
    let items = allMatches.filter((m: any) =>
      (m.status === 'POSSIBLE_MATCH' || m.status === 'UNRESOLVED') && !m.is_reviewed
    ).map(m => ({
      ...m,
      priority: getPriority(m)
    }));

    // Pattern Filter
    if (patternFilter) {
      items = items.filter(m => {
        const signals = m.matching_signals || {};
        if (patternFilter === 'MISSING_COUNTERPART') return !m.ledger_transaction_id;
        if (patternFilter === 'AMOUNT_MISMATCH') return signals.amount_match === false;
        if (patternFilter === 'MERCHANT_VARIATION') return ['partial', 'weak'].includes(signals.merchant_match);
        if (patternFilter === 'DATE_DIFFERENCE') return signals.date_match === 'near';
        if (patternFilter === 'AMBIGUOUS_MATCH') return m.status === 'POSSIBLE_MATCH' && signals.amount_match && signals.merchant_match === 'exact';
        return true;
      });
    }

    // Search
    let filtered = items.filter(m =>
      m.bank_detail.desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(m.bank_detail.amount).includes(searchQuery)
    );

    // Sort
    if (sortConfig === 'highest-amount') {
      filtered.sort((a, b) => b.bank_detail.amount - a.bank_detail.amount);
    } else if (sortConfig === 'lowest-confidence') {
      filtered.sort((a, b) => a.confidence - b.confidence);
    }

    return filtered;
  }, [allMatches, searchQuery, sortConfig]);

  const stats = useMemo(() => {
    const reviewed = allMatches.filter(m => m.is_reviewed).length;
    const totalToReview = allMatches.filter(m => m.status === 'POSSIBLE_MATCH' || m.status === 'UNRESOLVED').length;
    const atRisk = queue.reduce((sum, m) => sum + Number(m.bank_detail.amount || 0), 0);

    const cats = [
      { label: 'High Priority', count: queue.filter(m => m.priority.level === 'HIGH').length },
      { label: 'Unresolved', count: queue.filter(m => m.status === 'UNRESOLVED').length }
    ];

    return { reviewed, totalToReview, atRisk, cats };
  }, [allMatches, queue]);

  const handleAction = async (action: 'ACCEPT' | 'REJECT' | 'MARK_EXCEPTION') => {
    const currentMatch = queue[selectedIndex];
    if (!currentMatch) return;
    setSubmitting(true);
    try {
      await submitReview(currentMatch.id, action);
      // Update local state to reflect review
      setAllMatches(prev => prev.map(m => m.id === currentMatch.id ? { ...m, is_reviewed: true } : m));

      // Auto-move to next if not at end
      if (selectedIndex >= queue.length - 1 && queue.length > 1) {
        setSelectedIndex(Math.max(0, queue.length - 2));
      }
    } catch (err: any) { alert("Verification failed: " + err.message); } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin w-8 h-8 text-black" />
    </div>
  );

  const activeItem = queue[selectedIndex];

  useEffect(() => {
    async function fetchEvidence() {
      if (!activeItem) return;
      setLoadingEvidence(true);
      try {
        const result = await getMatchEvidence(activeItem.id);
        setEvidence(result);
      } catch (err) {
        console.error("Evidence load failed", err);
      } finally {
        setLoadingEvidence(false);
      }
    }
    fetchEvidence();
  }, [activeItem]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col selection:bg-black selection:text-white">
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex justify-between items-center sticky top-0 z-20 shadow-sm shadow-black/[0.01]">
        <div className="flex items-center space-x-6">
          <button onClick={() => router.push(`/dashboard?runId=${runId}`)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.1em]">Exception Workspace</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Run #{runId} • Critical Control</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
           <Shield className="w-3 h-3 text-green-400" />
           <span>Authoritative Environment</span>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <ExceptionSummary
          count={queue.length}
          value={`₹${stats.atRisk.toLocaleString('en-IN')}`}
          categories={stats.cats}
          reviewedCount={stats.reviewed}
          totalToReview={stats.totalToReview}
          onReviewClick={() => setSelectedIndex(0)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-400px)]">
          {/* LEFT: PRIORITIZED QUEUE */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            <div className="relative mb-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search exceptions..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-black transition-all outline-none shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center px-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{queue.length} Items Pending</p>
              <select
                className="text-[10px] font-black uppercase tracking-widest bg-transparent border-none outline-none text-gray-500 cursor-pointer hover:text-black"
                value={sortConfig}
                onChange={(e) => setSortConfig(e.target.value)}
              >
                <option value="highest-amount">Value: High to Low</option>
                <option value="lowest-confidence">Uncertainty: High to Low</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {queue.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-5 rounded-3xl border transition-all relative group ${
                    selectedIndex === idx
                      ? 'bg-black text-white border-black shadow-xl shadow-black/10'
                      : 'bg-white border-gray-200 text-gray-900 hover:border-gray-400 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tight border ${
                      selectedIndex === idx ? 'bg-white/10 border-white/20 text-white' : item.priority.color
                    }`}>
                      {item.priority.level}
                    </span>
                    <span className={`text-sm font-black tabular-nums ${selectedIndex === idx ? 'text-white' : 'text-gray-900'}`}>
                      ₹{item.bank_detail.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className={`text-xs font-bold truncate mb-1 ${selectedIndex === idx ? 'text-white' : 'text-gray-700'}`}>
                    {item.bank_detail.desc}
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center text-[10px] font-medium opacity-60">
                      <Clock className="w-3 h-3 mr-1" /> {item.bank_detail.date}
                    </div>
                    <div className="flex items-center text-[10px] font-medium opacity-60">
                      <Tag className="w-3 h-3 mr-1" /> {item.priority.reason}
                    </div>
                  </div>
                </button>
              ))}

              {queue.length === 0 && (
                <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                   <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Check className="w-6 h-6" />
                   </div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Queue is currently clear</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: DETAILED INVESTIGATION */}
          <div className="lg:col-span-8 overflow-y-auto pr-2 custom-scrollbar">
            {!activeItem ? (
              <div className="h-full flex items-center justify-center bg-white rounded-[2.5rem] border border-gray-200 border-dashed">
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select an item to investigate</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-12">
                <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-10 py-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-end">
                    <div className="space-y-2">
                       <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Investigation Mode</h3>
                       <p className="text-2xl font-black text-gray-900 tracking-tight">Financial Alignment Analysis</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">System Recommendation</p>
                       <StatusBadge status={activeItem.status} />
                    </div>
                  </div>

                  <div className="p-10 grid grid-cols-2 gap-12 relative">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center z-10 text-[10px] font-black text-gray-300 uppercase">VS</div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black text-finance-accent uppercase tracking-widest flex items-center">
                         <div className="w-2 h-2 bg-finance-accent rounded-full mr-3" /> Bank Source
                       </h4>
                       <DataBlock label="Description" value={activeItem.bank_detail.desc} />
                       <div className="grid grid-cols-2 gap-4">
                         <DataBlock label="Value" value={`₹${activeItem.bank_detail.amount.toLocaleString('en-IN')}`} />
                         <DataBlock label="Date" value={activeItem.bank_detail.date} />
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center">
                         <div className="w-2 h-2 bg-purple-600 rounded-full mr-3" /> Ledger Candidate
                       </h4>
                       {activeItem.ledger_detail ? (
                         <>
                           <DataBlock label="Record Title" value={activeItem.ledger_detail.desc} />
                           <div className="grid grid-cols-2 gap-4">
                             <DataBlock label="Value" value={`₹${activeItem.ledger_detail.amount.toLocaleString('en-IN')}`} />
                             <DataBlock label="Date" value={activeItem.ledger_detail.date} />
                           </div>
                         </>
                       ) : (
                         <div className="h-full flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed py-12">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No Candidate Identified</p>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                {/* EVIDENCE & AUDIT ACTIONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {loadingEvidence ? (
                      <div className="bg-white p-12 rounded-[2.5rem] border border-gray-200 shadow-sm flex items-center justify-center">
                         <Loader2 className="animate-spin w-6 h-6 text-gray-300" />
                      </div>
                    ) : (
                      <MatchEvidence evidence={evidence} />
                    )}
                  </div>

                  <div className="bg-black p-8 rounded-[2.5rem] shadow-2xl shadow-black/20 text-white flex flex-col justify-between min-h-[300px]">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-8 text-center tracking-[0.3em]">Decision Execution</h4>
                      <div className="space-y-3">
                        <button disabled={submitting} onClick={() => handleAction('ACCEPT')} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-all flex items-center justify-center disabled:opacity-30">
                          <Check className="w-3.5 h-3.5 mr-2" /> Confirm Alignment
                        </button>
                        <button disabled={submitting} onClick={() => handleAction('REJECT')} className="w-full py-4 bg-white/10 text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all flex items-center justify-center disabled:opacity-30">
                          <X className="w-3.5 h-3.5 mr-2" /> Reject Match
                        </button>
                      </div>
                    </div>
                    <button disabled={submitting} onClick={() => handleAction('MARK_EXCEPTION')} className="w-full py-2 text-red-400 text-[9px] font-black uppercase tracking-[0.3em] hover:text-red-300 transition-all text-center border-t border-white/5 pt-6">
                      Classify as Exception
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function DataBlock({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-black text-gray-900 tracking-tight">{value}</p>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-black" /></div>}>
      <ReviewContent />
    </Suspense>
  );
}
