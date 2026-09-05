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
    <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden transition-all">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-10 py-8 flex justify-between items-center hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center space-x-4">
          <Fingerprint className="w-6 h-6 text-gray-900" />
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Authoritative Evidence</h3>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {isExpanded && (
        <div className="px-10 pb-10 space-y-10 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Signal Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {signals.map((sig: any) => (
              <div key={sig.type} className={clsx("p-6 rounded-[1.5rem] border flex flex-col justify-between h-36 shadow-sm", getStatusBg(sig.status))}>
                <div className="flex justify-between items-start">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{sig.label}</p>
                   {getStatusIcon(sig.status)}
                </div>
                <p className="text-[11px] font-bold text-gray-900 leading-relaxed uppercase tracking-tight">{sig.message}</p>
              </div>
            ))}
          </div>

          {/* Explanation Section */}
          <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-4 h-4 text-black" />
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Logic Outcome</p>
            </div>
            <p className="text-sm font-bold text-gray-700 leading-relaxed italic">
              "{decision.explanation}"
            </p>
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
               <div className="flex items-center space-x-3">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Methodology</span>
                 <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-gray-900 uppercase tracking-widest shadow-sm">{decision.method}</span>
               </div>
               <div className="flex items-center space-x-3">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confidence</span>
                 <span className="text-2xl font-black text-finance-accent tabular-nums">{decision.confidence}%</span>
               </div>
            </div>
          </div>

          {/* AI Interpretation (Optional) */}
          {ai_interpretation.available && (
            <div className="bg-blue-50/30 rounded-3xl p-8 border border-blue-100/50">
               <div className="flex items-center space-x-3 mb-4">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">AI Semantic Reasoning</p>
               </div>
               <p className="text-sm font-bold text-blue-900 leading-relaxed italic mb-6">
                 "{ai_interpretation.reasoning}"
               </p>
               <div className="flex flex-wrap gap-2">
                  {ai_interpretation.supporting_evidence.map((ev: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-white border border-blue-100 text-blue-600 text-[10px] font-black rounded-xl uppercase tracking-widest shadow-sm">
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
