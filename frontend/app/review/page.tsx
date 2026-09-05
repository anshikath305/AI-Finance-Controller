"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import ExceptionSummary from '@/components/ExceptionSummary';
import MatchEvidence from '@/components/MatchEvidence';
import {
  Check, X, AlertCircle, Info, Loader2, ChevronLeft, ChevronRight,
  AlertTriangle, Minus, ArrowLeft, Shield, Search, TrendingDown, Clock, Tag,
  LayoutGrid, List, Activity, Target
} from 'lucide-react';
import { getMatches, submitReview, getMatchEvidence } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { clsx } from 'clsx';

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
  const [run, setRun] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      if (!runId) return;
      try {
        const [matches, metrics] = await Promise.all([
          getMatches(Number(runId)),
          getMetrics(Number(runId))
        ]);
        setAllMatches(matches);
        setRun(metrics.metadata);
      } catch (err) { alert("Audit session expired or network error."); } finally { setLoading(false); }
    }
    fetchData();
  }, [runId]);

  const currency = run?.policy_config?.currency || 'INR';

  // Priority Logic (Deterministic)
  const getPriority = (m: any) => {
    const signals = m.matching_signals || {};
    const amount = Number(m.bank_detail.amount || 0);

    if (!signals.amount_match) return { level: 'HIGH', color: 'text-red-600 bg-red-50 border-red-100', reason: 'Value Mismatch' };
    if (!m.ledger_transaction_id) return { level: 'HIGH', color: 'text-red-600 bg-red-50 border-red-100', reason: 'Missing Artifact' };
    if (amount > 50000) return { level: 'HIGH', color: 'text-red-600 bg-red-50 border-red-100 shadow-sm', reason: 'Significant Value' };

    if (signals.date_match !== 'exact') return { level: 'MEDIUM', color: 'text-orange-600 bg-orange-50 border-orange-100', reason: 'Timing Variance' };

    return { level: 'LOW', color: 'text-gray-500 bg-gray-50 border-gray-100', reason: 'Metadata Discrepancy' };
  };

  const queue = useMemo(() => {
    let items = allMatches.filter((m: any) =>
      (m.status === 'POSSIBLE_MATCH' || m.status === 'UNRESOLVED') && !m.is_reviewed
    ).map(m => ({
      ...m,
      priority: getPriority(m)
    }));

    // Pattern Filter (from Intelligence)
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

    // Search & Sort
    let filtered = items.filter(m =>
      m.bank_detail.desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(m.bank_detail.amount).includes(searchQuery)
    );

    if (sortConfig === 'highest-amount') {
      filtered.sort((a, b) => b.bank_detail.amount - a.bank_detail.amount);
    } else if (sortConfig === 'lowest-confidence') {
      filtered.sort((a, b) => a.confidence - b.confidence);
    }

    return filtered;
  }, [allMatches, searchQuery, sortConfig, patternFilter]);

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

  const activeItem = queue[selectedIndex];

  useEffect(() => {
    async function fetchEvidence() {
      if (!activeItem) return;
      setLoadingEvidence(true);
      try {
        const result = await getMatchEvidence(activeItem.id);
        setEvidence(result);
      } catch (err) {
        console.error("Audit evidence load failed", err);
      } finally {
        setLoadingEvidence(false);
      }
    }
    fetchEvidence();
  }, [activeItem]);

  const handleAction = async (action: 'ACCEPT' | 'REJECT' | 'MARK_EXCEPTION') => {
    if (!activeItem) return;
    setSubmitting(true);
    try {
      await submitReview(activeItem.id, action);
      setAllMatches(prev => prev.map(m => m.id === activeItem.id ? { ...m, is_reviewed: true } : m));
      if (selectedIndex >= queue.length - 1 && queue.length > 1) {
        setSelectedIndex(Math.max(0, queue.length - 2));
      }
    } catch (err: any) { alert("Verification failed: " + err.message); } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6 animate-pulse">
        <Shield className="w-12 h-12 text-black mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Securing Audit Environment...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col selection:bg-black selection:text-white">
      <header className="bg-white border-b border-gray-100 px-10 py-6 flex justify-between items-center sticky top-0 z-30 shadow-sm shadow-black/[0.01]">
        <div className="flex items-center space-x-8">
          <button onClick={() => router.push(`/dashboard?runId=${runId}`)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all hover:scale-105 active:scale-95 group">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.2em] tracking-tighter">Exception Workspace</h1>
            <div className="flex items-center space-x-3 mt-1">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Audit #{runId}</p>
               <div className="w-1 h-1 rounded-full bg-gray-200" />
               <p className="text-[10px] font-bold text-finance-accent uppercase tracking-widest">{patternFilter ? `Filter: ${patternFilter}` : 'Master Queue'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3 px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/20">
           <Shield className="w-3.5 h-3.5 text-green-400" />
           <span>Authoritative Control Mode</span>
        </div>
      </header>

      <main className="flex-1 p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        <ExceptionSummary
          count={queue.length}
          value={formatCurrency(stats.atRisk, currency)}
          categories={stats.cats}
          reviewedCount={stats.reviewed}
          totalToReview={stats.totalToReview}
          onReviewClick={() => setSelectedIndex(0)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-[calc(100vh-420px)]">
          {/* LEFT: PRIORITIZED QUEUE */}
          <div className="lg:col-span-4 flex flex-col space-y-5">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
              <input
                type="text"
                placeholder="Search description or amount..."
                className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-3xl text-sm font-medium focus:ring-2 focus:ring-black focus:border-black transition-all outline-none shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center px-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{queue.length} Pending Actions</p>
              <div className="flex items-center space-x-2">
                <List className="w-3 h-3 text-gray-300" />
                <select
                  className="text-[10px] font-black uppercase tracking-widest bg-transparent border-none outline-none text-gray-500 cursor-pointer hover:text-black transition-colors"
                  value={sortConfig}
                  onChange={(e) => setSortConfig(e.target.value)}
                >
                  <option value="highest-amount">By Magnitude (DESC)</option>
                  <option value="lowest-confidence">By Uncertainty (ASC)</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar pb-10">
              {queue.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={clsx(
                    "w-full text-left p-6 rounded-[2rem] border transition-all relative group overflow-hidden",
                    selectedIndex === idx
                      ? 'bg-black text-white border-black shadow-2xl shadow-black/30 scale-[1.02] z-10'
                      : 'bg-white border-gray-100 text-gray-900 hover:border-gray-400 shadow-sm'
                  )}
                >
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <span className={clsx(
                      "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                      selectedIndex === idx ? 'bg-white/10 border-white/20 text-white' : item.priority.color
                    )}>
                      {item.priority.level}
                    </span>
                    <span className={clsx(
                      "text-base font-black tabular-nums tracking-tighter",
                      selectedIndex === idx ? 'text-white' : 'text-gray-900'
                    )}>
                      {formatCurrency(item.bank_detail.amount, currency)}
                    </span>
                  </div>

                  <p className={clsx(
                    "text-sm font-black truncate mb-3 relative z-10",
                    selectedIndex === idx ? 'text-white' : 'text-gray-800'
                  )}>
                    {item.bank_detail.desc || item.bank_detail.Description}
                  </p>

                  <div className="flex items-center space-x-5 relative z-10">
                    <div className="flex items-center text-[10px] font-bold opacity-60 uppercase tracking-widest">
                      <Clock className="w-3 h-3 mr-1.5" /> {item.bank_detail.date}
                    </div>
                    <div className="flex items-center text-[10px] font-bold opacity-60 uppercase tracking-widest">
                      <Tag className="w-3 h-3 mr-1.5 text-finance-accent" /> {item.priority.reason}
                    </div>
                  </div>
                </button>
              ))}

              {queue.length === 0 && (
                <div className="py-24 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm border-dashed">
                   <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100 shadow-xl shadow-green-100/50">
                     <CheckCircle2 className="w-10 h-10" />
                   </div>
                   <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">Queue Clear</h3>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2">Zero unhandled exceptions remaining</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: DETAILED INVESTIGATION */}
          <div className="lg:col-span-8 overflow-y-auto pr-3 custom-scrollbar">
            {!activeItem ? (
              <div className="h-full flex flex-col items-center justify-center bg-white rounded-[3rem] border border-gray-100 border-dashed space-y-6">
                 <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm">
                    <Target className="w-8 h-8 text-gray-300" />
                 </div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">Awaiting Selection</p>
              </div>
            ) : (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                <div className="bg-white rounded-[3rem] border border-gray-200 shadow-sm overflow-hidden hover:border-black transition-all">
                  <div className="px-12 py-10 border-b border-gray-100 bg-gray-50/50 flex justify-between items-end">
                    <div className="space-y-3">
                       <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Audit Subject Analysis</h3>
                       <p className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Forensic Discrepancy View</p>
                    </div>
                    <div className="text-right space-y-2">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recommended Logic</p>
                       <StatusBadge status={activeItem.status} />
                    </div>
                  </div>

                  <div className="p-12 grid grid-cols-2 gap-16 relative">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full border border-gray-100 flex items-center justify-center z-20 text-[10px] font-black text-gray-400 uppercase shadow-lg">VS</div>

                    <div className="space-y-8 relative">
                       <div className="flex items-center space-x-3 mb-2">
                         <div className="w-3 h-3 bg-finance-accent rounded-full shadow-[0_0_8px_rgba(0,102,204,0.4)]" />
                         <h4 className="text-[11px] font-black text-finance-accent uppercase tracking-[0.3em]">Bank Statement</h4>
                       </div>
                       <DataBlock label="Source Description" value={activeItem.bank_detail.desc || activeItem.bank_detail.Description} />
                       <div className="grid grid-cols-2 gap-8">
                         <DataBlock label="Transaction Value" value={formatCurrency(activeItem.bank_detail.amount, currency)} highlight />
                         <DataBlock label="Posting Date" value={activeItem.bank_detail.date} />
                       </div>
                    </div>

                    <div className="space-y-8 relative">
                       <div className="flex items-center space-x-3 mb-2">
                         <div className="w-3 h-3 bg-purple-600 rounded-full shadow-[0_0_8px_rgba(147,51,234,0.4)]" />
                         <h4 className="text-[11px] font-black text-purple-600 uppercase tracking-[0.3em]">Internal Ledger</h4>
                       </div>
                       {activeItem.ledger_detail ? (
                         <>
                           <DataBlock label="Book Description" value={activeItem.ledger_detail.desc || activeItem.ledger_detail.Description} />
                           <div className="grid grid-cols-2 gap-8">
                             <DataBlock label="Recorded Value" value={formatCurrency(activeItem.ledger_detail.amount, currency)} highlight />
                             <DataBlock label="Book Date" value={activeItem.ledger_detail.date} />
                           </div>
                         </>
                       ) : (
                         <div className="h-[240px] flex items-center justify-center bg-gray-50/50 rounded-3xl border border-gray-100 border-dashed">
                           <div className="text-center space-y-4">
                              <Minus className="w-8 h-8 text-gray-200 mx-auto" />
                              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">No Candidate Identified</p>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                {/* EVIDENCE & ACTIONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    {loadingEvidence ? (
                      <div className="bg-white p-20 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center space-y-4">
                         <Loader2 className="animate-spin w-8 h-8 text-gray-200" />
                         <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">Crunching Evidence...</p>
                      </div>
                    ) : (
                      <MatchEvidence evidence={evidence} />
                    )}
                  </div>

                  <div className="bg-black p-10 rounded-[3rem] shadow-2xl shadow-black/40 text-white flex flex-col justify-between min-h-[440px] border border-white/5 group hover:scale-[1.005] transition-transform">
                    <div>
                      <div className="flex items-center justify-center space-x-3 mb-12">
                         <Activity className="w-4 h-4 text-gray-500" />
                         <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] text-center">Execute Audit Directive</h4>
                      </div>

                      <div className="space-y-4">
                        <ActionButton
                          disabled={submitting}
                          onClick={() => handleAction('ACCEPT')}
                          variant="white"
                          icon={<Check className="w-4 h-4" />}
                          label="Confirm Alignment"
                        />
                        <ActionButton
                          disabled={submitting}
                          onClick={() => handleAction('REJECT')}
                          variant="ghost"
                          icon={<X className="w-4 h-4" />}
                          label="Invalidate Candidate"
                        />
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="h-px bg-white/10 w-full" />
                      <button
                        disabled={submitting}
                        onClick={() => handleAction('MARK_EXCEPTION')}
                        className="w-full py-4 text-red-500 text-[10px] font-black uppercase tracking-[0.4em] hover:text-red-400 transition-all text-center group/btn flex items-center justify-center"
                      >
                        <AlertCircle className="w-3.5 h-3.5 mr-3 group-hover/btn:animate-bounce" />
                        Classify as Hard Exception
                      </button>
                    </div>
                  </div>
                </div>

                {/* FOOTER NAV */}
                <div className="flex justify-between items-center py-10 border-t border-gray-200">
                  <button
                    disabled={selectedIndex === 0}
                    onClick={() => setSelectedIndex(prev => prev - 1)}
                    className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-black transition-all disabled:opacity-10 group"
                  >
                    <ChevronLeft className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform" /> Previous Case
                  </button>

                  <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Decision Matrix</div>

                  <button
                    disabled={selectedIndex === queue.length - 1}
                    onClick={() => setSelectedIndex(prev => prev + 1)}
                    className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-black transition-all disabled:opacity-10 group"
                  >
                    Next Case <ChevronRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function DataBlock({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{label}</p>
      <p className={clsx(
        "text-lg font-black tracking-tight",
        highlight ? 'text-gray-900 tabular-nums' : 'text-gray-800'
      )}>{value}</p>
    </div>
  );
}

function ActionButton({ onClick, disabled, variant, icon, label }: any) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center disabled:opacity-30 active:scale-95",
        variant === 'white' ? 'bg-white text-black hover:bg-gray-100 shadow-xl' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
      )}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </button>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-400 font-bold uppercase tracking-[0.5em] text-[10px]">
        Context Synchronizing...
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}
