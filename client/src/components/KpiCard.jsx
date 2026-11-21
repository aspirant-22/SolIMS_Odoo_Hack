/**
 * @FILE: KpiCard.jsx
 * @RESPONSIBILITY: Reusable KPI summary card (icon, value, trend indicator) and responsive strip wrapper.
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TONES = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200'
};

const BARS = {
  emerald: 'from-emerald-400 to-emerald-600',
  amber: 'from-amber-300 to-amber-500',
  sky: 'from-sky-300 to-sky-500',
  rose: 'from-rose-300 to-rose-500',
  slate: 'from-slate-300 to-slate-500'
};

export const KpiCard = ({ label, value, icon: Icon, tone = 'slate', trend, trendDir = 'flat', hint }) => {
  const TrendIcon = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus;
  const trendCls =
    trendDir === 'up'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : trendDir === 'down'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-lift transition-all p-5 overflow-hidden group">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${BARS[tone]}`} />
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{label}</div>
        {Icon && (
          <span className={`p-2 rounded-xl border ${TONES[tone]} transition-transform group-hover:scale-110`}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <div className="font-heading text-3xl font-extrabold text-slate-900 mt-2 tabular-nums tracking-tight">{value}</div>
      <div className="flex items-center gap-2 mt-2">
        {trend && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border tabular-nums ${trendCls}`}>
            <TrendIcon className="w-3 h-3" />
            {trend}
          </span>
        )}
        {hint && <span className="text-[11px] text-slate-600 font-medium">{hint}</span>}
      </div>
    </div>
  );
};

export const KpiStrip = ({ children }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>
);

export default KpiCard;
