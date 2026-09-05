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
    <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden group hover:border-black transition-all">
       <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center space-x-3">
             <div className={clsx(
                "w-2 h-2 rounded-full",
                priority === 'HIGH' ? 'bg-red-500' : priority === 'MEDIUM' ? 'bg-orange-500' : 'bg-gray-400'
             )} />
             <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">{title}</h3>
          </div>
          <span className={clsx(
            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight border",
            priority === 'HIGH' ? 'bg-red-50 text-red-600 border-red-100' :
            priority === 'MEDIUM' ? 'bg-orange-50 text-orange-600 border-orange-100' :
            'bg-gray-50 text-gray-400 border-gray-200'
          )}>
            {priority} Priority
          </span>
       </div>

       <div className="p-8 space-y-6">
          <div className="space-y-2">
             <p className="text-sm font-bold text-gray-900 leading-relaxed">{insight}</p>
             <p className="text-xs font-medium text-gray-400 italic">{reason}</p>
          </div>

          <div className="grid grid-cols-3 gap-6 py-6 border-y border-gray-50">
             {evidence.map((ev: any) => (
                <div key={ev.label} className="space-y-1">
                   <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{ev.label}</p>
                   <p className="text-sm font-black text-gray-900">{ev.value}</p>
                </div>
             ))}
          </div>

          <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50 flex items-start space-x-4">
             <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                <Target className="w-4 h-4" />
             </div>
             <div className="space-y-1">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Recommended Action</p>
                <p className="text-sm font-bold text-blue-900">{recommended_action}</p>
             </div>
          </div>

          <div className="pt-4">
             <button
                onClick={() => onReview(link_pattern)}
                className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center shadow-xl shadow-black/10"
             >
                Review Affected Records
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
             </button>
          </div>
       </div>
    </div>
  );
};

export default StrategicActionCard;
