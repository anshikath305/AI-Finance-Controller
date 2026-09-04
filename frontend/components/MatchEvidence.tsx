import React, { useState } from 'react';
import {
  Check, X, Info, AlertTriangle, ChevronDown,
  ChevronUp, Shield, Brain, Zap, Fingerprint
} from 'lucide-react';
import { clsx } from 'clsx';

interface MatchEvidenceProps {
  evidence: any;
}

const MatchEvidence: React.FC<MatchEvidenceProps> = ({ evidence }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!evidence) return null;

  const { decision, facts, signals, ai_interpretation } = evidence;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aligned': return <Check className="w-3.5 h-3.5 text-green-500" />;
      case 'difference': return <Zap className="w-3.5 h-3.5 text-orange-500" />;
      case 'conflict': return <X className="w-3.5 h-3.5 text-red-500" />;
      default: return <Info className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'aligned': return 'bg-green-50/50 border-green-100';
      case 'difference': return 'bg-orange-50/50 border-orange-100';
      case 'conflict': return 'bg-red-50/50 border-red-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden transition-all">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-8 py-6 flex justify-between items-center hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Fingerprint className="w-5 h-5 text-gray-900" />
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Decision Evidence</h3>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {isExpanded && (
        <div className="px-8 pb-8 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Signal Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {signals.map((sig: any) => (
              <div key={sig.type} className={clsx("p-5 rounded-2xl border flex flex-col justify-between h-32", getStatusBg(sig.status))}>
                <div className="flex justify-between items-start">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{sig.label}</p>
                   {getStatusIcon(sig.status)}
                </div>
                <p className="text-xs font-bold text-gray-900 leading-snug">{sig.message}</p>
              </div>
            ))}
          </div>

          {/* Explanation Section */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-3.5 h-3.5 text-black" />
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">System Conclusion</p>
            </div>
            <p className="text-sm font-bold text-gray-700 leading-relaxed">
              {decision.explanation}
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
               <div className="flex items-center space-x-2">
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Method</span>
                 <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-lg text-[9px] font-black text-gray-900 uppercase">{decision.method}</span>
               </div>
               <div className="flex items-center space-x-2">
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Confidence</span>
                 <span className="text-sm font-black text-blue-600">{decision.confidence}%</span>
               </div>
            </div>
          </div>

          {/* AI Interpretation (Optional) */}
          {ai_interpretation.available && (
            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50">
               <div className="flex items-center space-x-2 mb-3">
                  <Brain className="w-3.5 h-3.5 text-blue-600" />
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">AI Semantic Interpretation</p>
               </div>
               <p className="text-sm font-bold text-blue-900 leading-relaxed italic mb-4">
                 "{ai_interpretation.reasoning}"
               </p>
               <div className="flex flex-wrap gap-2">
                  {ai_interpretation.supporting_evidence.map((ev: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-white border border-blue-100 text-blue-600 text-[9px] font-black rounded-lg uppercase tracking-tight shadow-sm">
                      {ev}
                    </span>
                  ))}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchEvidence;
