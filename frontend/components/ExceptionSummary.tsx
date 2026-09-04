import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

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
    <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
      <div className="space-y-4">
        <div>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Queue Health</h2>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-black text-gray-900">{count}</span>
            <span className="text-sm font-bold text-gray-400 uppercase">Exceptions to Resolve</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 bg-red-50 text-red-600 rounded-lg border border-red-100 text-[10px] font-black uppercase tracking-widest">
            {value} at risk
          </div>
          <div className="h-4 w-px bg-gray-100" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Progress: {reviewedCount} / {totalToReview} reviewed
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 max-w-md">
        {categories.map((cat) => (
          <div key={cat.label} className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center space-x-2">
            <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{cat.label}</span>
            <span className="w-5 h-5 bg-white rounded-lg flex items-center justify-center text-[10px] font-black border border-gray-200 shadow-sm">{cat.count}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onReviewClick}
        className="group px-8 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all flex items-center shadow-xl shadow-black/10"
      >
        <span>Execute Review</span>
        <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

export default ExceptionSummary;
