import React from 'react';
import { STATUS_STYLES, PRIORITY_STYLES } from '../../constants';
import { IncidentStatus, Priority } from '../../types';
import { AlertCircle, ArrowDown, ArrowUp, Minus } from 'lucide-react';

interface StatusBadgeProps {
  status: IncidentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = STATUS_STYLES[status];
  
  return (
    <span className={`inline-flex items-center font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'} ${config.color}`}>
      <span className={`mr-1.5 rounded-full ${size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'} ${config.dot}`}></span>
      {config.label}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: Priority;
  showLabel?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, showLabel = true }) => {
  const config = PRIORITY_STYLES[priority];
  
  const getIcon = () => {
    switch (priority) {
      case 'CRITICAL': return <AlertCircle className="h-3.5 w-3.5" />;
      case 'HIGH': return <ArrowUp className="h-3.5 w-3.5" />;
      case 'MEDIUM': return <Minus className="h-3.5 w-3.5 rotate-45" />; // Slanted minus
      case 'LOW': return <ArrowDown className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  return (
    <span 
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border border-transparent ${config.iconColor} ${showLabel ? config.bgColor + ' border-opacity-50 border-' + config.iconColor.replace('text-', '') : ''}`}
      title={`Priorité: ${config.label}`}
    >
       <span className="mr-1">{getIcon()}</span>
       {showLabel && config.label}
    </span>
  );
};