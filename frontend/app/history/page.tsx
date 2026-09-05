"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRuns } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  History, Calendar, ArrowRight, Loader2,
  Search, Filter, AlertCircle, CheckCircle2,
  BarChart3, Shield, Clock, Layers, Check
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { clsx } from 'clsx';

export default function RunHistoryPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selection, setSelection] = useState<number[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getRuns();
        setRuns(data);
      } catch (err) {
        setError("Failed to synchronize reconciliation history.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredRuns = runs.filter(run =>
    String(run.id).includes(searchQuery) ||
    run.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSelection(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selection.length !== 2) return;
    const sorted = [...selection].sort((a, b) => b - a);
    router.push(`/compare?currentId=${sorted[0]}&previousId=${sorted[1]}`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6 animate-pulse">
        <Layers className="w-12 h-12 text-black mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Retrieving Master Logs...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white py-6 px-10 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-10">
          <div onClick={() => router.push('/')} className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-xs font-black shadow-lg group-hover:scale-110 transition-transform">F</div>
            <span className="font-black tracking-tighter text-lg uppercase hidden sm:block">Controller</span>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center space-x-3 text-finance-accent">
            <History className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Master Run Ledger</span>
          </div>
        </div>

        <button onClick={() => router.push('/new')} className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10">
          New Reconciliation
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-10 pt-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-16">
           <div className="space-y-3">
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic">Run History</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Comprehensive audit trail of all synchronization events</p>
           </div>

           <div className="flex items-center space-x-6">
              {selection.length > 0 && (
                <div className="flex items-center space-x-6 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Comparative Analysis</p>
                      <p className="text-sm font-black text-blue-600 uppercase tracking-tighter italic">{selection.length} Subjects Armed</p>
                   </div>
                   <button
                    disabled={selection.length !== 2}
                    onClick={handleCompare}
                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 disabled:opacity-20 disabled:grayscale"
                   >
                     Delta Comparison
                   </button>
                </div>
              )}

              <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
                  <input
                    type="text"
                    placeholder="Search Audit ID or Status..."
                    className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-[1.5rem] text-sm font-medium focus:ring-2 focus:ring-black transition-all outline-none shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
           </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-100 p-12 rounded-[3rem] text-center space-y-6">
             <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
             <p className="text-red-600 font-black uppercase tracking-[0.3em] text-[10px]">{error}</p>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="bg-white border border-gray-200 p-32 rounded-[4rem] text-center space-y-10 shadow-sm border-dashed">
             <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto border border-gray-100 shadow-sm transition-all hover:rotate-12">
                <BarChart3 className="w-10 h-10 text-gray-200" />
             </div>
             <div className="space-y-3">
                <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Zero Reconciliations Detected</h2>
                <p className="text-gray-400 font-medium italic max-w-xs mx-auto leading-relaxed text-lg">Your operational audit trail is currently empty. Initiate your first run to begin tracking.</p>
             </div>
             <button onClick={() => router.push('/new')} className="px-12 py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:scale-[1.05] transition-all shadow-2xl shadow-black/20">
                Execute Baseline Run
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {filteredRuns.map((run) => (
              <div
                key={run.id}
                onClick={() => router.push(`/dashboard?runId=${run.id}`)}
                className={clsx(
                  "bg-white border rounded-[2.5rem] p-10 shadow-sm hover:shadow-2xl transition-all group cursor-pointer flex flex-col lg:flex-row justify-between items-center gap-12 relative overflow-hidden",
                  selection.includes(run.id) ? "border-blue-600 ring-8 ring-blue-50" : "border-gray-100 hover:border-black"
                )}
              >
                {selection.includes(run.id) && (
                   <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
                )}

                <div className="flex items-center space-x-10 w-full lg:w-auto">
                   <div
                    onClick={(e) => toggleSelection(e, run.id)}
                    className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all hover:scale-110",
                      selection.includes(run.id) ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white border-gray-200 text-transparent hover:border-blue-400"
                    )}
                   >
                     <Check className="w-6 h-6 stroke-[3]" />
                   </div>

                   <div className={clsx(
                      "w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black border transition-all",
                      selection.includes(run.id) ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-gray-50 border-gray-100 text-gray-900 group-hover:bg-black group-hover:text-white group-hover:rotate-6"
                   )}>
                      #{run.id}
                   </div>

                   <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                         <StatusBadge status={run.status} />
                         <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            <Calendar className="w-3.5 h-3.5 mr-2" />
                            {new Date(run.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                         </div>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic leading-none pt-2">Audit Execution Trace</h3>
                      <div className="flex items-center space-x-5">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formatNumber(run.bank_count)} Bank Subjects</p>
                         <div className="w-1 h-1 rounded-full bg-gray-200" />
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formatNumber(run.ledger_count)} Ledger Subjects</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-16 w-full lg:w-auto px-6 border-l border-gray-50 lg:ml-auto">
                   <MetricMini label="Macro Success" value={`${run.match_rate}%`} />
                   <MetricMini label="Capital Cleared" value={formatCurrency(run.reconciled_amount)} color="text-green-600" />
                   <MetricMini label="Verification" value={run.pending_review} color={run.pending_review > 0 ? "text-orange-600" : "text-gray-900"} />
                   <MetricMini label="Anomalies" value={run.exception_count} color={run.exception_count > 0 ? "text-red-600" : "text-gray-900"} />
                </div>

                <div className="flex items-center lg:pl-10">
                   <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2 border border-gray-100 shadow-sm">
                      <ArrowRight className="w-6 h-6 text-black" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-10 py-20 text-center">
         <p className="text-[10px] font-black text-gray-200 uppercase tracking-[0.6em]">Authoritative Source Immutable Ledger</p>
      </footer>
    </div>
  );
}

function MetricMini({ label, value, color = "text-gray-900" }: any) {
  return (
    <div className="space-y-2 text-center lg:text-left">
       <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">{label}</p>
       <p className={clsx("text-2xl font-black tabular-nums tracking-tighter italic leading-none", color)}>{value}</p>
    </div>
  );
}
