import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, description, action, noPadding = false }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs ${className}`}>
      {(title || action) && (
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
           <div>
             {title && <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{title}</h3>}
             {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
           </div>
           {action && <div className="ml-4 flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
    </div>
  );
};

export const KPICard: React.FC<{ title: string; value: string | number; icon: React.ElementType; trend?: string; trendUp?: boolean }> = ({ title, value, icon: Icon, trend, trendUp }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</span>
        <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      </div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">{value}</div>
        {trend && (
          <div className={`flex items-center text-xs font-medium ${trendUp ? 'text-green-600 dark:text-green-500' : 'text-slate-500 dark:text-slate-400'}`}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
};