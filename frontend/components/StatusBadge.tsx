import React from 'react';
import { clsx } from 'clsx';
import { Check, Info, AlertOctagon, HelpCircle, Shield } from 'lucide-react';

type StatusType = 'MATCHED' | 'POSSIBLE_MATCH' | 'UNRESOLVED' | 'EXCEPTION' | 'MISMATCH';

interface StatusBadgeProps {
  status: StatusType;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: any = {
    MATCHED: {
      bg: 'bg-green-50 text-green-700 border-green-100',
      icon: <Check className="w-3 h-3 mr-1" />,
      label: 'Matched'
    },
    POSSIBLE_MATCH: {
      bg: 'bg-blue-50 text-blue-700 border-blue-100',
      icon: <Info className="w-3 h-3 mr-1" />,
      label: 'Review'
    },
    UNRESOLVED: {
      bg: 'bg-gray-50 text-gray-500 border-gray-100',
      icon: <HelpCircle className="w-3 h-3 mr-1" />,
      label: 'Unresolved'
    },
    EXCEPTION: {
      bg: 'bg-red-50 text-red-700 border-red-100',
      icon: <AlertOctagon className="w-3 h-3 mr-1" />,
      label: 'Exception'
    },
    MISMATCH: {
      bg: 'bg-orange-50 text-orange-700 border-orange-100',
      icon: <AlertOctagon className="w-3 h-3 mr-1" />,
      label: 'Mismatch'
    },
  };

  const config = styles[status] || styles.UNRESOLVED;

  return (
    <span className={clsx(
      "inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight border",
      config.bg
    )}>
      {config.icon}
      {config.label}
    </span>
  );
};

export default StatusBadge;
