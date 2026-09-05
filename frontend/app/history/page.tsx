"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRuns } from '@/lib/api';
import {
  History, Calendar, ArrowRight, Loader2,
  ExternalLink, Search, Filter, AlertCircle,
  BarChart3, Shield, Clock
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
        setError("Failed to load reconciliation history.");
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
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin w-10 h-10 text-black mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading History...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white py-4 px-8 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-6">
          <div onClick={() => router.push('/')} className="flex items-center space-x-2 cursor-pointer group">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-[10px] font-bold group-hover:scale-110 transition-transform">F</div>
            <span className="font-bold tracking-tight text-sm uppercase">Finance-Ops Agent</span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center space-x-2">
            <History className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Reconciliation Workspace</span>
          </div>
        </div>
        <button onClick={() => router.push('/new')} className="px-4 py-2 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-black/10">
          New Reconciliation
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
           <div className="space-y-2">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Run History</h1>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Audit trail of all financial reconciliation events</p>
           </div>

           <div className="flex items-center space-x-4">
              {selection.length > 0 && (
                <div className="flex items-center space-x-4 animate-in fade-in slide-in-from-right-4 duration-300">
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selection.length} Selected</p>
                   <button
                    disabled={selection.length !== 2}
                    onClick={handleCompare}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-30 disabled:grayscale"
                   >
                     Compare Runs
                   </button>
                </div>
              )}

              <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by Run ID or Status..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-black transition-all outline-none shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
           </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center space-y-4">
             <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
             <p className="text-red-600 font-bold uppercase tracking-widest text-xs">{error}</p>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="bg-white border border-gray-200 p-20 rounded-[3rem] text-center space-y-6 shadow-sm border-dashed">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <BarChart3 className="w-8 h-8 text-gray-300" />
             </div>
             <div className="space-y-2">
                <h2 className="text-xl font-black text-gray-900 uppercase">No reconciliations found</h2>
                <p className="text-gray-400 font-medium italic">Begin by uploading your first set of transaction data.</p>
             </div>
             <button onClick={() => router.push('/new')} className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all">
                Start First Run
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredRuns.map((run) => (
              <div
                key={run.id}
                onClick={() => router.push(`/dashboard?runId=${run.id}`)}
                className={clsx(
                  "bg-white border rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all group cursor-pointer flex flex-col lg:flex-row justify-between items-center gap-8",
                  selection.includes(run.id) ? "border-blue-600 ring-4 ring-blue-50" : "border-gray-100 hover:border-black"
                )}
              >
                <div className="flex items-center space-x-8 w-full lg:w-auto">
                   <div
                    onClick={(e) => toggleSelection(e, run.id)}
                    className={clsx(
                      "w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all",
                      selection.includes(run.id) ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-transparent hover:border-blue-400"
                    )}
                   >
                     <Check className="w-5 h-5" />
                   </div>

                   <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-xl font-black text-gray-900 border border-gray-100 group-hover:bg-black group-hover:text-white transition-colors">
                      #{run.id}
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                         <StatusBadge status={run.status} />
                         <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(run.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                         </div>
                      </div>
                      <h3 className="text-lg font-black text-gray-900 tracking-tight">Reconciliation Run</h3>
                      <div className="flex items-center space-x-4">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{run.bank_count} Bank Records</p>
                         <div className="w-1 h-1 rounded-full bg-gray-200" />
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{run.ledger_count} Ledger Records</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 w-full lg:w-auto">
                   <MetricMini label="Match Rate" value={`${run.match_rate}%`} />
                   <MetricMini label="Reconciled" value={`₹${run.reconciled_amount.toLocaleString('en-IN')}`} color="text-green-600" />
                   <MetricMini label="In Review" value={run.pending_review} color={run.pending_review > 0 ? "text-orange-600" : "text-gray-900"} />
                   <MetricMini label="Exceptions" value={run.exception_count} color={run.exception_count > 0 ? "text-red-600" : "text-gray-900"} />
                </div>

                <div className="flex items-center space-x-4">
                   <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-5 h-5 text-black" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-12 text-center">
         <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Authoritative Historical Audit Data</p>
      </footer>
    </div>
  );
}

function MetricMini({ label, value, color = "text-gray-900" }: any) {
  return (
    <div className="space-y-1">
       <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
       <p className={clsx("text-xl font-black tabular-nums tracking-tight", color)}>{value}</p>
    </div>
  );
}
