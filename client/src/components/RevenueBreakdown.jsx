/**
 * @FILE: RevenueBreakdown.jsx
 * @RESPONSIBILITY: Director visuals: Revenue vs Cost & Margin breakdown (stacked bar + progress rows)
 *                  and per-project profitability bars. Purely presentational.
 */

import React from 'react';
import { PieChart, TrendingUp } from 'lucide-react';

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

const Row = ({ label, value, pct, bar, text }) => (
  <div>
    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
      <span className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${bar}`} />{label}</span>
      <span className="tabular-nums font-mono"><span className="text-slate-900 font-bold">{inr(value)}</span> <span className={`ml-1 ${text}`}>{pct.toFixed(1)}%</span></span>
    </div>
    <div className="h-2 rounded-full bg-slate-100 mt-1.5 overflow-hidden">
      <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  </div>
);

export const RevenueBreakdown = ({ kpis = {}, projectMargins = [] }) => {
  const revenue = Number(kpis.cumulativeRevenueInr) || 0;
  const cogs = Number(kpis.cumulativeHardwareCogsInr) || 0;
  const labor = Number(kpis.cumulativeLaborPayrollInr) || 0;
  const claims = Number(kpis.cumulativeWarrantyExpenseInr) || 0;
  const net = Number(kpis.overallNetProfitInr) || 0;
  const base = revenue > 0 ? revenue : 1;
  const p = (v) => (v / base) * 100;

  const rows = projectMargins.slice(0, 6);
  const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(Number(r.profitMarginPercentage) || 0)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-heading text-sm font-extrabold text-slate-900">
            <PieChart className="w-4 h-4 text-[#135D3B]" /> Revenue vs. Cost &amp; Margin
          </div>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border tabular-nums ${net >= 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
            {net >= 0 ? 'Profitable' : 'Loss'} · {kpis.netProfitMarginPercent || 0}% margin
          </span>
        </div>

        <div className="text-[11px] text-slate-600 font-medium mt-3">Where every ₹1 of revenue goes</div>
        <div className="flex h-5 rounded-full overflow-hidden mt-1.5 bg-slate-100 border border-slate-200">
          <div className="bg-sky-500" style={{ width: `${Math.min(100, p(cogs))}%` }} title="Hardware COGS" />
          <div className="bg-amber-400" style={{ width: `${Math.min(100, p(labor))}%` }} title="Technician payroll" />
          <div className="bg-rose-500" style={{ width: `${Math.min(100, p(claims))}%` }} title="Warranty claims" />
          <div className="bg-emerald-500 flex-1" title="Net profit" />
        </div>

        <div className="space-y-3.5 mt-5">
          <Row label="Hardware COGS" value={cogs} pct={p(cogs)} bar="bg-sky-500" text="text-sky-700" />
          <Row label="Technician payroll" value={labor} pct={p(labor)} bar="bg-amber-400" text="text-amber-700" />
          <Row label="Warranty claims" value={claims} pct={p(claims)} bar="bg-rose-500" text="text-rose-700" />
          <Row label="Net profit" value={net} pct={p(net)} bar="bg-emerald-500" text="text-emerald-700" />
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
        <div className="flex items-center gap-2 font-heading text-sm font-extrabold text-slate-900">
          <TrendingUp className="w-4 h-4 text-[#135D3B]" /> Job margin leaders
        </div>
        <div className="space-y-3 mt-4">
          {rows.length === 0 && <div className="text-xs text-slate-600 font-medium">No completed project margins yet.</div>}
          {rows.map((r) => {
            const m = Number(r.profitMarginPercentage) || 0;
            const good = m >= 0;
            return (
              <div key={r.orderReference}>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-900 truncate pr-2">{r.customerFullName}</span>
                  <span className={`font-mono font-bold tabular-nums ${good ? 'text-emerald-700' : 'text-rose-700'}`}>{m}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 mt-1 overflow-hidden">
                  <div className={`h-full rounded-full ${good ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${(Math.abs(m) / maxAbs) * 100}%` }} />
                </div>
                <div className="text-[10px] font-mono text-slate-500 tabular-nums mt-0.5">{r.orderReference} · {inr(r.netJobProfitInr)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RevenueBreakdown;
