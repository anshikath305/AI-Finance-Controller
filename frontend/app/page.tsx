"use client";

import React, { useState } from 'react';
import { ShieldCheck, Zap, BarChart3, Users, Loader2, ArrowRight, History } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startDemo } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await startDemo();
      router.push(`/new?runId=${res.run_id}&isDemo=true`);
    } catch (err) {
      alert("Failed to start demo");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-finance-primary selection:bg-black selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 py-6 px-10 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-xl z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-black/20">F</div>
          <span className="font-black tracking-tighter text-xl uppercase">Finance-Ops Controller</span>
        </div>
        <div className="space-x-8 flex items-center">
          <Link href="/operations" className="text-[10px] font-black uppercase tracking-widest text-finance-accent hover:text-black transition-colors flex items-center">
            <Activity className="w-3.5 h-3.5 mr-2" /> Operations
          </Link>
          <Link href="/history" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center">
            <History className="w-3.5 h-3.5 mr-2" /> History
          </Link>
          <Link href="/benchmarks" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center">
            <BarChart3 className="w-3.5 h-3.5 mr-2" /> Evaluation
          </Link>
          <Link href="/new" className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all shadow-xl shadow-black/10">
            New Reconciliation
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto pt-32 pb-24 px-10 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-3xl -z-10 opacity-30" />

        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-12 border border-green-100 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Validated 100% Deterministic Precision</span>
        </div>

        <h1 className="text-7xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.95] text-gray-900">
          Automate the obvious.<br/>
          <span className="text-gray-300">Explain the uncertain.</span>
        </h1>

        <p className="text-2xl text-gray-500 max-w-3xl mx-auto mb-16 font-medium leading-relaxed italic">
          Trustworthy AI-powered financial reconciliation for professionals who value precision over aggregate automation.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center space-y-6 sm:space-y-0 sm:space-x-8">
          <Link href="/new" className="group px-12 py-6 bg-black text-white rounded-[2rem] font-black text-xl hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl shadow-black/20 flex items-center">
            Start Reconciliation
            <ArrowRight className="w-6 h-6 ml-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="group px-12 py-6 bg-white border-2 border-gray-100 text-gray-900 rounded-[2rem] font-black text-xl hover:bg-gray-50 hover:border-black transition-all flex items-center justify-center min-w-[260px] shadow-sm"
          >
            {demoLoading ? <Loader2 className="animate-spin w-6 h-6 mr-3" /> : <Zap className="w-6 h-6 mr-3 text-finance-accent fill-finance-accent/20" />}
            Try a Live Demo
          </button>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="max-w-7xl mx-auto px-10 py-32 border-t border-gray-100">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-finance-accent" />}
              title="Hybrid Intelligence"
              description="Our engine combines strict deterministic rules with GPT-4o semantic interpretation to resolve merchant variations without sacrificing precision."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-finance-accent" />}
              title="Audit Authority"
              description="A dedicated human-in-the-loop workspace ensures the finance professional remains the final authority on every ambiguous transaction."
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8 text-finance-accent" />}
              title="Explainable Proof"
              description="Every decision is backed by transparent evidence signals, mapping deterministic facts against AI reasoning for total auditability."
            />
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-gray-100 text-center bg-gray-50/30">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-4">Precision First • AI Assisted • Human Controlled</p>
        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-white font-black text-xs mx-auto opacity-50">F</div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="space-y-6">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">{title}</h3>
      <p className="text-gray-500 text-lg leading-relaxed font-medium">{description}</p>
    </div>
  );
}
