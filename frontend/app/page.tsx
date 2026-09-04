"use client";

import React, { useState } from 'react';
import { ShieldCheck, Zap, BarChart3, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startDemo } from '@/lib/api';

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
    <main className="min-h-screen bg-white text-finance-primary selection:bg-finance-accent selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 py-4 px-8 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold">F</div>
          <span className="font-bold tracking-tight text-lg uppercase">Finance-Ops Agent</span>
        </div>
        <div className="space-x-6 flex items-center">
          <Link href="/benchmarks" className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors">Evaluation</Link>
          <Link href="/new" className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-all">New Run</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto pt-24 pb-16 px-8 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-widest mb-8 border border-green-100">
          <ShieldCheck className="w-3 h-3" />
          <span>Validated 100% Deterministic Precision</span>
        </div>
        <h1 className="text-6xl font-black tracking-tight mb-6 leading-[1.1]">
          Automate the obvious.<br/>
          <span className="text-gray-400">Explain the uncertain.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 font-medium">
          A trustworthy AI-powered financial reconciliation platform that puts financial truth before aggressive automation.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link href="/new" className="px-8 py-4 bg-black text-white rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10">
            Start Reconciliation
          </Link>
          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center min-w-[200px]"
          >
            {demoLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Zap className="w-5 h-5 mr-2 text-finance-accent" />}
            Try a Demo
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 px-8 py-24 border-t border-gray-100">
        <FeatureCard
          icon={<Zap className="w-6 h-6 text-finance-accent" />}
          title="Hybrid Engine"
          description="Combines deterministic rules with AI semantic reasoning to resolve complex merchant variations."
        />
        <FeatureCard
          icon={<Users className="w-6 h-6 text-finance-accent" />}
          title="Human-in-the-Loop"
          description="Explicit review queue for ambiguous cases, preserving the authority of the finance professional."
        />
        <FeatureCard
          icon={<BarChart3 className="w-6 h-6 text-finance-accent" />}
          title="Grounded Copilot"
          description="Investigate discrepancies with an analytical assistant grounded strictly in your reconciliation data."
        />
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 text-center">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Built for Finance-Ops & Accounting Specialists</p>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="space-y-4">
      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
