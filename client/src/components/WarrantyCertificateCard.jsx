/**
 * @FILE: WarrantyCertificateCard.jsx
 * @RESPONSIBILITY: Live digital warranty certificate with a days-remaining countdown meter and a
 *                  "₹0 Covered" vs "Auto-Billed" cost breakdown. Purely presentational.
 */

import React from 'react';
import { ShieldCheck, AlertTriangle, Wrench, BadgeCheck, Receipt } from 'lucide-react';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const WarrantyCertificateCard = ({ asset, onCreateTicket }) => {
  const active = !!asset.isUnderActiveWarranty;
  const remaining = Math.max(0, Number(asset.remainingWarrantyDays) || 0);
  const isPanel = /panel/i.test(asset.assetCategory || '');
  const termDays = isPanel ? 7300 : 730;
  const pct = active ? Math.min(100, Math.max(4, (remaining / termDays) * 100)) : 100;

  const R = 46;
  const C = 2 * Math.PI * R;
  const ringColor = active ? '#059669' : '#E11D48';

  const part = asset.estimatedPartCostInr || 0;
  const labor = asset.estimatedLaborCostInr || 0;
  const wouldBill = part + labor;

  return (
    <div className={`relative bg-white rounded-3xl border-2 shadow-card hover:shadow-lift transition-shadow overflow-hidden ${active ? 'border-emerald-200' : 'border-rose-200'}`}>
      {/* Certificate header */}
      <div className={`px-5 py-3 flex items-center justify-between border-b ${active ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
        <div className="flex items-center gap-2.5">
          <span className={`p-1.5 rounded-lg text-white ${active ? 'bg-emerald-700' : 'bg-rose-600'}`}>
            {active ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </span>
          <div>
            <div className="font-heading text-xs font-extrabold uppercase tracking-wider text-slate-900">Digital Warranty Certificate</div>
            <div className="text-[10px] font-mono font-semibold text-slate-600 tabular-nums">{asset.orderReference}</div>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${active ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}`}>
          {active ? 'UNDER WARRANTY' : 'EXPIRED'}
        </span>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-5 gap-5 items-center">
        {/* Countdown meter */}
        <div className="sm:col-span-2 flex flex-col items-center">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r={R} fill="none" stroke="#E2E8F0" strokeWidth="10" />
              <circle
                cx="60" cy="60" r={R} fill="none" stroke={ringColor} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={active ? C : `${C / 18} ${C / 18}`}
                strokeDashoffset={active ? C - (C * pct) / 100 : 0}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {active ? (
                <>
                  <span className="font-heading text-2xl font-extrabold text-emerald-800 tabular-nums leading-none">{remaining.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-600 mt-1">Days remaining</span>
                </>
              ) : (
                <>
                  <span className="font-heading text-lg font-extrabold text-rose-700 leading-none">Expired</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-600 mt-1">0 days left</span>
                </>
              )}
            </div>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-slate-600">
            {isPanel ? '20-year panel term' : '2-year inverter term'}
          </div>
        </div>

        {/* Holder details */}
        <div className="sm:col-span-3 space-y-2.5 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Serial number</div>
            <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">{asset.serialNumber}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Certificate holder</div>
            <div className="font-heading font-bold text-slate-900">{asset.customerFullName}</div>
            <div className="text-xs text-slate-600">{asset.installationSiteAddress}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">{asset.assetCategory}</span>
            {active && <BadgeCheck className="w-4 h-4 text-emerald-700" />}
          </div>
        </div>
      </div>

      {/* Covered vs Auto-billed breakdown */}
      <div className="px-5 pb-5">
        <div className={`rounded-2xl border p-4 ${active ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
              <Receipt className="w-4 h-4 text-slate-600" />
              {active ? 'Instant ₹0 covered' : 'Auto-billed repair'}
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${active ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}`}>
              {active ? '100% covered' : 'Customer pays'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-800 font-medium">
              <span>Replacement hardware / parts</span>
              <span className="font-mono font-bold tabular-nums text-slate-900">{active ? '₹0' : inr(part)}</span>
            </div>
            <div className="flex justify-between text-slate-800 font-medium">
              <span>Technician visit &amp; labor</span>
              <span className="font-mono font-bold tabular-nums text-slate-900">{active ? '₹0' : inr(labor)}</span>
            </div>
            <div className="flex items-end justify-between pt-2 mt-1 border-t border-slate-300/70">
              <span className="font-bold text-slate-900">Total to customer</span>
              <div className="text-right">
                {active && wouldBill > 0 && (
                  <div className="text-[11px] text-slate-600 line-through tabular-nums font-mono">{inr(wouldBill)}</div>
                )}
                <div className={`font-heading text-2xl font-extrabold tabular-nums ${active ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {inr(asset.totalBillableCostInr)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onCreateTicket}
            className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold text-xs py-2 px-4 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Create Breakdown Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarrantyCertificateCard;
