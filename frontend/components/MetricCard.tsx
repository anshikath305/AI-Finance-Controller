import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { clsx } from 'clsx';

interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, sublabel, trend }) => {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col justify-between h-48 transition-all hover:border-black hover:shadow-xl group">
      <div>
        <div className="flex justify-between items-start mb-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
          {trend && (
            <div className={clsx(
              "p-1.5 rounded-lg border",
              trend === 'up' ? 'bg-green-50 text-green-600 border-green-100' :
              trend === 'down' ? 'bg-red-50 text-red-600 border-red-100' :
              'bg-gray-50 text-gray-400 border-gray-200'
            )}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            </div>
          )}
        </div>
        <p className="text-4xl font-black text-gray-900 tracking-tight group-hover:scale-[1.02] origin-left transition-transform tabular-nums">
          {value}
        </p>
      </div>
      {sublabel && (
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-50 pt-4 mt-4">
          {sublabel}
        </p>
      )}
    </div>
  );
};

export default MetricCard;
