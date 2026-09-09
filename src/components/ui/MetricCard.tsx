import React from 'react';
import { MarineMetric } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils/cn';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  metric: MarineMetric<number | string>;
  icon: LucideIcon;
  formatValue?: (val: number | string) => string;
  className?: string;
  subLabel?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  metric,
  icon: Icon,
  formatValue,
  className,
  subLabel,
}) => {
  const isAvailable = metric.status !== 'UNAVAILABLE' && metric.value !== null && metric.value !== undefined;

  const displayValue = isAvailable
    ? (formatValue ? formatValue(metric.value!) : String(metric.value))
    : 'UNAVAILABLE';

  const formattedTime = metric.timestamp
    ? new Date(metric.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div
      className={cn(
        'relative bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-cardHover hover:border-blue-300 transition-all duration-200 group marine-card',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-sky-400 group-hover:border-slate-900 transition-all shadow-2xs">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block tracking-tight">
              {label}
            </span>
            {subLabel && (
              <span className="text-[10px] text-slate-400 block -mt-0.5 font-medium">
                {subLabel}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={metric.status} size="sm" />
      </div>

      <div className="my-1.5">
        {isAvailable ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono-data tracking-tight text-slate-900">
              {displayValue}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {metric.unit}
            </span>
          </div>
        ) : (
          <div className="text-xs font-semibold text-slate-400 py-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span>DATA UNAVAILABLE</span>
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate max-w-[140px] font-medium" title={metric.source}>
          {metric.source || 'Open-Meteo'}
        </span>
        <span className="font-mono-data text-[10px] text-slate-400 font-semibold">{formattedTime}</span>
      </div>
    </div>
  );
};
