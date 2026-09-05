"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { runBenchmark } from '@/lib/api';
import {
  ShieldCheck, Zap, BarChart3, Loader2, ArrowRight,
  ChevronRight, AlertCircle, Play, Info, Target, FlaskConical, Activity
} from 'lucide-react';
import { clsx } from 'clsx';

function BenchmarkCard({ id, name, difficulty, desc, onClick, loading }: any) {
  const diffColors: any = {
    EASY: 'bg-green-50 text-green-700 border-green-100',
    MEDIUM: 'bg-blue-50 text-blue-700 border-blue-100',
    HARD: 'bg-red-50 text-red-700 border-red-100'
  };

  return (
    <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm flex flex-col justify-between h-[440px] group hover:border-black transition-all relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
         <FlaskConical className="w-40 h-48 text-black" />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-10">
          <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-all shadow-sm">
             <Activity className="w-6 h-6" />
          </div>
          <span className={clsx("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm", diffColors[difficulty])}>
            {difficulty} SEVERITY
          </span>
        </div>
        <h3 className="text-3xl font-black text-gray-900 tracking-tighter mb-4 uppercase italic">{name}</h3>
        <p className="text-gray-500 font-medium leading-relaxed italic">{desc}</p>
      </div>

      <button
        disabled={loading}
        onClick={() => onClick(id)}
        className="w-full py-6 bg-black text-white rounded-3xl font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center shadow-2xl shadow-black/20 disabled:opacity-30 relative z-10"
      >
        {loading === id ? <Loader2 className="animate-spin w-4 h-4" /> : (
          <>Execute Simulation <Play className="w-3.5 h-3.5 ml-4 fill-white" /></>
        )}
      </button>
    </div>
  );
}

export default function BenchmarkLabs() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  const handleRun = async (id: string) => {
    setLoading(id);
    try {
      const res = await runBenchmark(id);
      setResults(res);
    } catch (err) {
      alert("Simulation failure: Backend evaluation engine unreachable.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      <nav className="border-b border-gray-100 bg-white py-6 px-10 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-10">
          <div onClick={() => router.push('/')} className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-xs font-black shadow-lg">F</div>
            <span className="font-black tracking-tighter text-lg uppercase hidden sm:block">Controller</span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center space-x-3 text-finance-accent">
            <FlaskConical className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Quality Assurance Labs</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-10 pt-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20">
           <div className="space-y-4">
              <h1 className="text-6xl font-black text-gray-900 tracking-tighter uppercase italic">Engine Calibration</h1>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">Stress-testing 100% precision baseline against adversarial datasets</p>
           </div>

           <div className="flex items-center space-x-4 px-6 py-3 bg-green-50 text-green-700 rounded-2xl border border-green-100 shadow-sm animate-in fade-in zoom-in duration-700">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Active Safety Boundary: 1.00 Precision</span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-24">
          <BenchmarkCard
            id="easy" name="Standard (Easy)" difficulty="EASY" desc="Exact match scenarios used to verify deterministic baseline alignment."
            onClick={handleRun} loading={loading}
          />
          <BenchmarkCard
            id="medium" name="Fuzzy Mixed" difficulty="MEDIUM" desc="Varied merchant descriptions and date settlement shifts to test heuristic safety."
            onClick={handleRun} loading={loading}
          />
          <BenchmarkCard
            id="hard" name="Adversarial" difficulty="HARD" desc="High-entropy descriptions and amount traps designed to force manual review."
            onClick={handleRun} loading={loading}
          />
        </div>

        {results && (
          <div className="animate-in slide-in-from-bottom-10 duration-700 space-y-12 pb-20">
            <div className="bg-white p-12 rounded-[4rem] border border-gray-200 shadow-2xl shadow-black/5 relative overflow-hidden group hover:border-black transition-all">
               <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                  <BarChart3 className="w-64 h-64 text-black" />
               </div>

               <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 relative z-10">
                  <div className="space-y-4">
                     <div className="flex items-center space-x-3">
                        <Activity className="w-5 h-5 text-finance-accent" />
                        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em]">Simulation Result Trace</h2>
                     </div>
                     <p className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">{results.benchmark_name} Protocol</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-12">
                     <ResultStat label="Safety (Precision)" value={`${(results.evaluation.overall.precision * 100).toFixed(1)}%`} color="text-green-600" />
                     <ResultStat label="Efficiency (Recall)" value={`${(results.evaluation.overall.recall * 100).toFixed(1)}%`} color="text-blue-600" />
                     <ResultStat label="Manual Escalation" value={`${(results.evaluation.overall.review_rate * 100).toFixed(1)}%`} color="text-orange-600" />
                     <ResultStat label="False Match Rate" value={`${(results.evaluation.overall.false_match_rate * 100).toFixed(1)}%`} color={results.evaluation.overall.false_match_rate > 0 ? "text-red-600" : "text-gray-900"} />
                  </div>
               </div>

               <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10">
                  <MetricInsightCard
                    title="Audit Provenance"
                    icon={<Target className="w-4 h-4 text-purple-600" />}
                    stats={[
                       { label: 'Deterministic Success', val: results.evaluation.provenance.deterministic.tp },
                       { label: 'AI Semantic Success', val: results.evaluation.provenance.ai_assisted.tp }
                    ]}
                  />
                  <MetricInsightCard
                    title="Error Analysis"
                    icon={<AlertCircle className="w-4 h-4 text-red-600" />}
                    stats={[
                       { label: 'False Positives', val: results.evaluation.overall.fp },
                       { label: 'False Negatives', val: results.evaluation.overall.fn }
                    ]}
                  />
                  <div className="bg-black p-8 rounded-[2.5rem] text-white flex flex-col justify-between min-h-[200px] shadow-2xl shadow-black/20">
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">System Verdict</p>
                        <p className="text-lg font-bold leading-tight italic uppercase tracking-tighter">
                           {results.evaluation.overall.precision >= 1.0
                             ? "Safety baseline verified. High-precision reconciliation mode is active."
                             : "Operational drift detected. Engine calibration exceeds safety tolerance."}
                        </p>
                     </div>
                     <div className="pt-6 border-t border-white/10 flex justify-between items-center opacity-40">
                        <span className="text-[9px] font-black uppercase tracking-[0.4em]">Authored Logic</span>
                        <ShieldCheck className="w-4 h-4 text-green-400" />
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ResultStat({ label, value, color }: any) {
  return (
    <div className="space-y-3">
       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
       <p className={clsx("text-4xl font-black tabular-nums tracking-tighter leading-none", color)}>{value}</p>
    </div>
  );
}

function MetricInsightCard({ title, icon, stats }: any) {
  return (
    <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 flex flex-col justify-between min-h-[200px] shadow-sm">
       <div className="flex items-center space-x-3">
          {icon}
          <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">{title}</h4>
       </div>
       <div className="space-y-6 mt-8">
          {stats.map((s: any) => (
             <div key={s.label} className="flex justify-between items-end border-b border-gray-200/50 pb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</span>
                <span className="text-xl font-black text-gray-900 tabular-nums">{s.val}</span>
             </div>
          ))}
       </div>
    </div>
  );
}
