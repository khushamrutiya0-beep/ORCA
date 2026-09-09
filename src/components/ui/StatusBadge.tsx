import React from 'react';
import { cn } from '@/lib/utils/cn';
import { AlertTriangle, CheckCircle2, Clock, HelpCircle, Layers, Sparkles, BookOpen } from 'lucide-react';

export type ExtendedDataStatus = 
  | 'LIVE' 
  | 'DELAYED' 
  | 'DEMO' 
  | 'UNAVAILABLE' 
  | 'REFERENCE' 
  | 'PROTOTYPE_MODEL'
  | 'REQUIRES_CREDENTIALS'
  | 'AVAILABLE';

interface StatusBadgeProps {
  status: ExtendedDataStatus | string;
  source?: string;
  timestamp?: string;
  className?: string;
  showDetails?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  source,
  timestamp,
  className,
  showDetails = false,
  size = 'md',
}) => {
  const getBadgeConfig = (statusStr: string) => {
    switch (statusStr?.toUpperCase()) {
      case 'LIVE':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          dot: 'bg-emerald-500 animate-pulse',
          icon: CheckCircle2,
          label: 'LIVE',
          tooltip: 'Real-time verified programmatic data feed',
        };
      case 'DEMO':
        return {
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
          dot: 'bg-indigo-500',
          icon: Layers,
          label: 'DEMO LAYER',
          tooltip: 'ORCA Demonstration / Proxy dataset — not live government feed',
        };
      case 'REFERENCE':
        return {
          bg: 'bg-sky-50 border-sky-200 text-sky-700',
          dot: 'bg-sky-500',
          icon: BookOpen,
          label: 'REFERENCE DATA',
          tooltip: 'Official static reference catalog (MoEFCC/WII/SoI)',
        };
      case 'PROTOTYPE_MODEL':
        return {
          bg: 'bg-violet-50 border-violet-200 text-violet-700',
          dot: 'bg-violet-500',
          icon: Sparkles,
          label: 'PROTOTYPE MODEL',
          tooltip: 'ORCA Algorithmic Decision Support Model',
        };
      case 'DELAYED':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          dot: 'bg-amber-500',
          icon: Clock,
          label: 'DELAYED',
          tooltip: 'Scheduled / delayed observation cycle',
        };
      case 'REQUIRES_CREDENTIALS':
      case 'UNAVAILABLE':
      default:
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-600',
          dot: 'bg-slate-400',
          icon: HelpCircle,
          label: 'UNAVAILABLE',
          tooltip: 'Official institutional source requires credentials or is offline',
        };
    }
  };

  const config = getBadgeConfig(status);
  const Icon = config.icon;

  const isSmall = size === 'sm';

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)} title={config.tooltip}>
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium border shadow-2xs transition-colors',
          isSmall ? 'px-1.5 py-0.2 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          config.bg
        )}
      >
        <span className={cn('rounded-full shrink-0', isSmall ? 'w-1 h-1' : 'w-1.5 h-1.5', config.dot)} />
        <Icon className={isSmall ? 'w-2.5 h-2.5 shrink-0' : 'w-3 h-3 shrink-0'} />
        <span className="font-semibold tracking-wide">{config.label}</span>
      </span>

      {showDetails && source && (
        <span className="text-xs text-slate-500 truncate max-w-[200px]">
          via <span className="font-medium text-slate-700">{source}</span>
        </span>
      )}
    </div>
  );
};
