"use client";

import React, { useState } from 'react';
import { runBenchmark } from '@/lib/api';
import { Play, Activity, ShieldCheck, AlertOctagon, TrendingUp, Search, Info, FlaskConical, Target, Zap, ArrowLeft } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { useRouter } from 'next/navigation';

export default function BenchmarkingPage() {
  const router = useRouter();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overall');

  const handleRun = async (id: string) => {
    setLoading(true);
    try {
      const data = await runBenchmark(id);
      setResults(data);
    } catch (err) {
      alert("Evaluation engine failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 selection:bg-black selection:text-white">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 py-6 px-8 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-6">
          <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-black">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.1em]">Quality Assurance Labs</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Stress-Testing Reconciliation Intelligence</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-100 text-[10px] font-black uppercase tracking-widest">
           <FlaskConical className="w-3 h-3" />
           <span>Benchmarking Mode</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <BenchmarkCard
            id="easy" name="Standard (Easy)" difficulty="EASY" desc="100% Exact match scenarios to verify deterministic baseline."
            onClick={handleRun} loading={loading}
          />
          <BenchmarkCard
            id="medium" name="Fuzzy Mixed" difficulty="MEDIUM" desc="Varied merchant descriptions and date shifts to test heuristic safety."
            onClick={handleRun} loading={loading}
          />
          <BenchmarkCard
            id="hard" name="Adversarial" difficulty="HARD" desc="Deliberate traps (Amount mismatches, Duplicates) to verify precision."
            onClick={handleRun} loading={loading}
          />
        </div>

        {results ? (
          <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
            {/* Results Terminal */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Run Summary: {results.benchmark_name}</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-0.5">{results.dataset_size} Transactions Analyzed</p>
                  </div>
                </div>
                <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
                  {['overall', 'provenance', 'calibration', 'errors'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`px-5 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${
                        activeTab === t ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-10">
                {activeTab === 'overall' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <EvalMetric label="Precision" value={results.evaluation.overall.precision} icon={<ShieldCheck className="w-4 h-4" />} color="text-green-600" desc="Matches that were correct" />
                    <EvalMetric label="Recall" value={results.evaluation.overall.recall} icon={<TrendingUp className="w-4 h-4" />} color="text-blue-600" desc="Target matches identified" />
                    <EvalMetric label="F1 Score" value={results.evaluation.overall.f1_score} icon={<Zap className="w-4 h-4" />} color="text-purple-600" desc="Balanced accuracy metric" />
                    <EvalMetric label="False Positive" value={results.evaluation.overall.false_match_rate} icon={<AlertOctagon className="w-4 h-4" />} color="text-red-600" desc="Incorrect matches (Safety fail)" />
                  </div>
                )}

                {activeTab === 'provenance' && (
                  <div className="space-y-6 max-w-2xl">
                     <ProvenanceItem label="Deterministic Engine" tp={results.evaluation.provenance.deterministic.tp} fp={results.evaluation.provenance.deterministic.fp} />
                     <ProvenanceItem label="AI Semantic Layer" tp={results.evaluation.provenance.ai_assisted.tp} fp={results.evaluation.provenance.ai_assisted.fp} />
                  </div>
                )}

                {activeTab === 'calibration' && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(results.evaluation.confidence_calibration).map(([k, v]: any) => (
                      <div key={k} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center flex flex-col justify-between h-32">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{k}</p>
                        <p className="text-2xl font-black text-gray-900">{(v.precision * 100).toFixed(0)}%</p>
                        <p className="text-[10px] font-bold text-gray-400">n={v.total}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'errors' && (
                  <div className="overflow-hidden border border-gray-100 rounded-2xl">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank Identifier</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest text-red-500">Prediction</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest text-green-600">Ground Truth</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Classification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 bg-white">
                        {results.evaluation.error_analysis.map((e: any, i: number) => (
                          <tr key={i} className="hover:bg-red-50/30 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold text-gray-900">{e.bank_id}</td>
                            <td className="px-6 py-4 text-sm font-black text-red-500">{e.pred || 'NULL'}</td>
                            <td className="px-6 py-4 text-sm font-black text-green-600">{e.actual || 'NULL'}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-lg uppercase tracking-tight">{e.type.replace('_', ' ')}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {results.evaluation.error_analysis.length === 0 && (
                      <div className="py-20 text-center space-y-4">
                        <ShieldCheck className="w-12 h-12 text-green-500 mx-auto" />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No safety regressions detected. 100% Precision Verified.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Methodology Note */}
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start space-x-4">
               <Info className="w-5 h-5 text-blue-500 mt-0.5" />
               <div>
                  <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">Benchmarking Methodology</h4>
                  <p className="text-xs text-blue-700 font-medium leading-relaxed">
                    Evaluation results are calculated by comparing production matching engine predictions against isolated ground-truth labels.
                    <b> Precision</b> measures financial safety (avoiding incorrect matches), while <b>Recall</b> measures operational efficiency (identifying correct matches automatically).
                  </p>
               </div>
            </div>
          </div>
        ) : (
          <div className="py-32 text-center max-w-md mx-auto space-y-6">
             <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto text-gray-300">
               <Activity className="w-10 h-10" />
             </div>
             <div className="space-y-2">
               <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Ready for Evaluation</h3>
               <p className="text-sm text-gray-500 font-medium">Select a test scenario above to begin the quality assessment. Ground-truth results are never exposed to the matching engine.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BenchmarkCard({ id, name, difficulty, desc, onClick, loading }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between group hover:border-black transition-all hover:shadow-xl hover:shadow-black/[0.02]">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{difficulty} SCENARIO</p>
            <h3 className="font-black text-xl tracking-tight">{name}</h3>
          </div>
          <span className={`w-2 h-2 rounded-full mt-1.5 ${
            difficulty === 'EASY' ? 'bg-green-400' : difficulty === 'MEDIUM' ? 'bg-yellow-400' : 'bg-red-400'
          }`} />
        </div>
        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">{desc}</p>
      </div>
      <button
        onClick={() => onClick(id)}
        disabled={loading}
        className="w-full py-4 bg-gray-50 group-hover:bg-black group-hover:text-white text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-all disabled:opacity-50"
      >
        {loading ? <Activity className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
        Execute Benchmark
      </button>
    </div>
  );
}

function EvalMetric({ label, value, icon, color, desc }: any) {
  return (
    <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-4">
      <div className="flex items-center space-x-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
        <div className={`p-2 rounded-lg bg-gray-50 ${color.replace('text', 'text-')}`}>
          {icon}
        </div>
        <span>{label}</span>
      </div>
      <div>
        <p className={`text-4xl font-black ${color} tracking-tighter`}>{(value * 100).toFixed(1)}%</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase mt-2 tracking-tight">{desc}</p>
      </div>
    </div>
  );
}

function ProvenanceItem({ label, tp, fp }: any) {
  return (
    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
      <span className="font-black text-xs uppercase tracking-widest text-gray-600">{label}</span>
      <div className="flex space-x-12">
        <div className="text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Correct</p>
          <p className="text-xl font-black text-green-600 tabular-nums">{tp}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-red-300">Errors</p>
          <p className="text-xl font-black text-red-600 tabular-nums">{fp}</p>
        </div>
      </div>
    </div>
  );
}
