import React from 'react';
import { AlertCircle, ArrowRight, Activity, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

interface ExceptionSummaryProps {
  count: number;
  value: string;
  categories: { label: string; count: number }[];
  onReviewClick: () => void;
  reviewedCount: number;
  totalToReview: number;
}

const ExceptionSummary: React.FC<ExceptionSummaryProps> = ({
  count,
  value,
  categories,
  onReviewClick,
  reviewedCount,
  totalToReview
}) => {
  const progress = totalToReview > 0 ? (reviewedCount / totalToReview) * 100 : 100;

  return (
    <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-16 relative overflow-hidden group hover:border-black transition-all">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
         <Activity className="w-32 h-32 text-black" />
      </div>

      <div className="space-y-6 relative z-10">
        <div>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Queue Integrity</h2>
          <div className="flex items-baseline space-x-3">
            <span className="text-6xl font-black text-gray-900 tracking-tighter tabular-nums">{count}</span>
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Exceptions</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-1.5 bg-red-50 text-red-700 rounded-full border border-red-100 text-[10px] font-black uppercase tracking-widest flex items-center shadow-sm">
            <TrendingUp className="w-3 h-3 mr-2" />
            {value} UNRESOLVED
          </div>
          <div className="h-4 w-px bg-gray-100 hidden sm:block" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Audit Progress: <span className="text-gray-900 font-black">{reviewedCount} / {totalToReview}</span>
          </p>

          <div className="w-32 h-1.5 bg-gray-50 rounded-full overflow-hidden ml-2 hidden md:block">
             <div className="h-full bg-black transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 max-w-lg relative z-10">
        {categories.map((cat) => (
          <div key={cat.label} className="px-5 py-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center space-x-3 group/chip hover:bg-white hover:border-black transition-all shadow-sm">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover/chip:text-black">{cat.label}</span>
            <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[11px] font-black border border-gray-200 shadow-sm group-hover/chip:bg-black group-hover/chip:text-white transition-colors">{cat.count}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onReviewClick}
        className="group px-10 py-6 bg-black text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center shadow-2xl shadow-black/20 relative z-10"
      >
        <span>Execute Audit Queue</span>
        <ArrowRight className="w-4 h-4 ml-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

export default ExceptionSummary;
