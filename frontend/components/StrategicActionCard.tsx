import React from 'react';
import {
  ArrowRight, Shield, Zap, Info,
  TrendingUp, TrendingDown, Target, ExternalLink
} from 'lucide-react';
import { clsx } from 'clsx';

interface StrategicActionCardProps {
  action: any;
  onReview: (pattern: string) => void;
}

const StrategicActionCard: React.FC<StrategicActionCardProps> = ({ action, onReview }) => {
  const { priority, title, insight, affected_amount, affected_records, recommended_action, reason, evidence, link_pattern } = action;

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden group hover:border-black transition-all hover:shadow-2xl">
       <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center space-x-3">
             <div className={clsx(
                "w-2.5 h-2.5 rounded-full shadow-sm",
                priority === 'HIGH' ? 'bg-red-500 animate-pulse' : priority === 'MEDIUM' ? 'bg-orange-500' : 'bg-gray-400'
             )} />
             <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">{title}</h3>
          </div>
          <span className={clsx(
            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm",
            priority === 'HIGH' ? 'bg-red-50 text-red-600 border-red-100' :
            priority === 'MEDIUM' ? 'bg-orange-50 text-orange-600 border-orange-100' :
            'bg-gray-50 text-gray-400 border-gray-200'
          )}>
            {priority} PRIORITY
          </span>
       </div>

       <div className="p-10 space-y-8">
          <div className="space-y-3">
             <p className="text-lg font-black text-gray-900 leading-tight tracking-tight">{insight}</p>
             <p className="text-sm font-medium text-gray-400 italic leading-relaxed">{reason}</p>
          </div>

          <div className="grid grid-cols-3 gap-8 py-8 border-y border-gray-100">
             {evidence.map((ev: any) => (
                <div key={ev.label} className="space-y-1">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{ev.label}</p>
                   <p className="text-xl font-black text-gray-900 tabular-nums">{ev.value}</p>
                </div>
             ))}
          </div>

          <div className="bg-blue-50/30 p-6 rounded-3xl border border-blue-100/50 flex items-start space-x-4">
             <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 shadow-sm">
                <Target className="w-5 h-5" />
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Operator Directive</p>
                <p className="text-sm font-bold text-blue-900 leading-relaxed">{recommended_action}</p>
             </div>
          </div>

          <div className="pt-4">
             <button
                onClick={() => onReview(link_pattern)}
                className="w-full py-5 bg-black text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center shadow-2xl shadow-black/20"
             >
                Execute Investigation
                <ArrowRight className="w-4 h-4 ml-3" />
             </button>
          </div>
       </div>
    </div>
  );
};

export default StrategicActionCard;
