/**
 * @FILE: LifecycleTimeline.jsx
 * @RESPONSIBILITY: Interactive 6-step Solar Lifecycle visual timeline (auto-advancing, click/hover to explore).
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, MapPin, Zap, Truck, FileCheck2, ShieldCheck, ArrowRight, Check } from 'lucide-react';

const STEPS = [
  {
    title: 'Enquiry', sub: 'Zero-login intake', icon: Sun, badge: 'Draft',
    badgeCls: 'bg-slate-100 text-slate-700 border-slate-200',
    dotCls: 'bg-slate-700 text-white', owner: 'Homeowner', sla: '2 min',
    desc: 'Homeowners enter their monthly bill and roof area. SolIMS estimates system size, savings and PM Surya Ghar subsidy instantly, with no account required.',
    bullets: ['Savings & payback estimator', 'Subsidy pre-check', 'Inquiry code issued instantly'],
    cta: { label: 'Get a free quote', to: '/quote' }
  },
  {
    title: 'Survey', sub: 'Rooftop audit', icon: MapPin, badge: 'Pending',
    badgeCls: 'bg-amber-50 text-amber-800 border-amber-200',
    dotCls: 'bg-amber-500 text-white', owner: 'Operations', sla: '48 hrs',
    desc: 'A surveyor validates azimuth, tilt, shadow-free area and structural load. The survey is a hard gate before any quotation can be generated.',
    bullets: ['Shadow & load checks', 'Survey gate enforced', 'Scheduling with crew calendar']
  },
  {
    title: 'Auto-BOM Quote', sub: '1 kW – 5 kW kits', icon: Zap, badge: 'Quoted',
    badgeCls: 'bg-sky-50 text-sky-800 border-sky-200',
    dotCls: 'bg-sky-600 text-white', owner: 'Operations', sla: 'Instant',
    desc: 'The Bill of Materials is generated automatically from the surveyed capacity, with subsidy deductions and the advance payment that locks the order.',
    bullets: ['Panels, inverter, structure, cabling', 'Subsidy-adjusted pricing', 'Advance payment lock']
  },
  {
    title: 'Serial Dispatch', sub: 'Barcode scan', icon: Truck, badge: 'Dispatched',
    badgeCls: 'bg-sky-50 text-sky-800 border-sky-200',
    dotCls: 'bg-sky-700 text-white', owner: 'Warehouse', sla: 'Same day',
    desc: 'Every panel and inverter serial is scanned and locked to the order before the truck leaves. Inventory stays in perfect double-entry parity.',
    bullets: ['Barcode serial scanner', 'Stock reserved automatically', 'Warranty clock initialised']
  },
  {
    title: 'Roof Sign-Off', sub: 'Mobile technician', icon: FileCheck2, badge: 'In Progress',
    badgeCls: 'bg-sky-50 text-sky-800 border-sky-200',
    dotCls: 'bg-emerald-600 text-white', owner: 'Technician', sla: '1 day',
    desc: 'The crew records the live wattage test, captures rooftop photos with the camera and collects the homeowner’s digital signature on a touchscreen.',
    bullets: ['Live camera roof capture', 'Wattage commissioning test', 'On-screen signature']
  },
  {
    title: '20-Yr Warranty', sub: 'Monsoon shield', icon: ShieldCheck, badge: 'Under Warranty',
    badgeCls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotCls: 'bg-[#135D3B] text-white', owner: 'Support', sla: '20 years',
    desc: 'Warranty countdowns start at sign-off. In a rainy-season breakdown, support looks up the serial: covered repairs cost ₹0, expired parts are auto-billed.',
    bullets: ['2-yr inverter · 20-yr panel', '₹0 covered vs auto-billed split', 'Service tickets with live status']
  }
];

export const LifecycleTimeline = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 4200);
    return () => clearInterval(t);
  }, [paused]);

  const step = STEPS[active];
  const Icon = step.icon;

  return (
    <section id="workflow" className="py-20 bg-slate-50 border-y border-slate-200/80 relative overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-60 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#135D3B] bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
            Solar Lifecycle
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            From enquiry to a 20-year warranty, in six governed steps
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Every handover is enforced by a state machine. Click a step to see what happens and who owns it.
          </p>
        </div>

        <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          {/* Rail */}
          <div className="relative">
            <div className="absolute left-[8.33%] right-[8.33%] top-7 h-1 rounded-full bg-slate-200 hidden md:block" />
            <div
              className="absolute left-[8.33%] top-7 h-1 rounded-full bg-gradient-to-r from-amber-400 via-sky-500 to-[#135D3B] hidden md:block transition-all duration-500"
              style={{ width: `${(active / (STEPS.length - 1)) * 83.34}%` }}
            />
            <div className="grid grid-cols-3 md:grid-cols-6 gap-y-6">
              {STEPS.map((s, i) => {
                const StepIcon = s.icon;
                const done = i < active;
                const isActive = i === active;
                return (
                  <button
                    key={s.title}
                    onClick={() => setActive(i)}
                    className="relative flex flex-col items-center text-center cursor-pointer group focus:outline-none"
                  >
                    <span
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                        isActive
                          ? `${s.dotCls} border-white shadow-glow scale-110 ring-4 ring-amber-300/50`
                          : done
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-white text-slate-500 border-slate-200 group-hover:border-slate-300'
                      }`}
                    >
                      {done ? <Check className="w-6 h-6 stroke-[2.5]" /> : <StepIcon className="w-6 h-6" />}
                    </span>
                    <span className="mt-3 text-[10px] font-mono font-bold text-slate-500 tabular-nums">0{i + 1}</span>
                    <span className={`font-heading text-sm font-bold leading-tight ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{s.title}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{s.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail card */}
          <div className="mt-10 bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-5">
            <div className="lg:col-span-3 p-7 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`p-2.5 rounded-xl ${step.dotCls}`}><Icon className="w-5 h-5" /></span>
                <div>
                  <div className="text-[11px] font-mono font-bold text-slate-500 tabular-nums">STEP 0{active + 1} / 06</div>
                  <h3 className="font-heading text-xl font-extrabold text-slate-900">{step.title}</h3>
                </div>
                <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full border ${step.badgeCls}`}>{step.badge}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{step.desc}</p>
              <ul className="space-y-2">
                {step.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />{b}
                  </li>
                ))}
              </ul>
              {step.cta && (
                <button
                  onClick={() => navigate(step.cta.to)}
                  className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold text-sm px-5 py-2.5 inline-flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  {step.cta.label}<ArrowRight className="w-4 h-4 text-amber-300" />
                </button>
              )}
            </div>
            <div className="lg:col-span-2 bg-slate-900 text-white p-7 flex flex-col justify-center gap-5">
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Owner</div>
                <div className="font-heading text-lg font-bold">{step.owner}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Typical turnaround</div>
                <div className="font-heading text-3xl font-extrabold text-amber-300 tabular-nums">{step.sla}</div>
              </div>
              <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500" style={{ width: `${((active + 1) / STEPS.length) * 100}%` }} />
              </div>
              <div className="text-xs text-slate-300 font-medium tabular-nums">{Math.round(((active + 1) / STEPS.length) * 100)}% of lifecycle complete</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LifecycleTimeline;
