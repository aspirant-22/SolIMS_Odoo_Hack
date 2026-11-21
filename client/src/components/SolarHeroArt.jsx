/**
 * @FILE: SolarHeroArt.jsx
 * @RESPONSIBILITY: Bespoke offline-safe SVG illustration of a sunrise rooftop-solar home connected to the grid,
 *                  with floating live-metric glass badges. No external assets.
 */

import React from 'react';
import { Zap, CheckCircle2, ShieldCheck, Sun } from 'lucide-react';

const PANEL_ROWS = [
  { y: 182, hw: 84 },
  { y: 206, hw: 110 },
  { y: 230, hw: 137 }
].map((r) => {
  const n = Math.floor((r.hw * 2) / 34);
  const w = n * 34 - 4;
  return { y: r.y, n, x0: 320 - w / 2 };
});

export const SolarHeroArt = () => (
  <div className="relative">
    <div className="absolute -inset-6 bg-gradient-to-tr from-amber-200/40 via-transparent to-emerald-200/40 blur-2xl rounded-[2.5rem] pointer-events-none" />

    <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-lift bg-slate-900">
      <svg viewBox="0 0 640 480" className="w-full h-auto block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sunrise over a rooftop solar home connected to the grid">
        <defs>
          <linearGradient id="sh-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0B1F33" />
            <stop offset="0.5" stopColor="#1B5C73" />
            <stop offset="0.85" stopColor="#F2B45A" />
            <stop offset="1" stopColor="#FCD98B" />
          </linearGradient>
          <radialGradient id="sh-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFF3C4" />
            <stop offset="0.35" stopColor="#FBBF24" stopOpacity="0.95" />
            <stop offset="1" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sh-panel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1D4ED8" />
            <stop offset="0.5" stopColor="#0C4A6E" />
            <stop offset="1" stopColor="#082F49" />
          </linearGradient>
          <linearGradient id="sh-roof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#475569" />
            <stop offset="1" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="sh-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F8FAFC" />
            <stop offset="1" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="sh-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#166A45" />
            <stop offset="1" stopColor="#0B3D27" />
          </linearGradient>
          <linearGradient id="sh-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FEF3C7" />
            <stop offset="1" stopColor="#FBBF24" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="640" height="480" fill="url(#sh-sky)" />
        {[...Array(18)].map((_, i) => (
          <circle key={i} cx={(i * 97) % 640} cy={(i * 53) % 150 + 8} r={i % 3 === 0 ? 1.4 : 0.8} fill="#fff" opacity={0.55} />
        ))}

        {/* Sun with rotating rays */}
        <circle cx="505" cy="92" r="92" fill="url(#sh-sun)" />
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 505 92" to="360 505 92" dur="60s" repeatCount="indefinite" />
          {[...Array(16)].map((_, i) => (
            <line key={i} x1="505" y1="38" x2="505" y2={i % 2 ? 24 : 14} stroke="#FDE68A" strokeWidth="2.4" strokeLinecap="round" transform={`rotate(${i * 22.5} 505 92)`} opacity="0.85" />
          ))}
        </g>
        <circle cx="505" cy="92" r="30" fill="#FDE047" />
        <circle cx="505" cy="92" r="22" fill="#FFF7D1" />

        {/* Clouds */}
        <g fill="#fff" opacity="0.18">
          <ellipse cx="110" cy="70" rx="50" ry="13" />
          <ellipse cx="140" cy="60" rx="30" ry="12" />
          <ellipse cx="300" cy="120" rx="44" ry="10" />
          <ellipse cx="325" cy="112" rx="26" ry="9" />
        </g>

        {/* Hills */}
        <path d="M0 340 Q120 290 240 330 T480 320 T640 335 L640 400 L0 400 Z" fill="#0F5A3A" opacity="0.8" />
        <path d="M0 365 Q160 325 300 360 T640 350 L640 420 L0 420 Z" fill="#12734A" />
        <rect y="388" width="640" height="92" fill="url(#sh-ground)" />
        <path d="M0 402 H640" stroke="#FBBF24" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="10 8" />

        {/* Grid pylon */}
        <g stroke="#CBD5E1" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M585 392 L598 200 M611 392 L598 200" />
          <path d="M573 230 H623 M580 270 H616 M587 312 H609" strokeWidth="2" />
          <path d="M585 392 L611 312 M611 392 L585 312 M585 312 L611 270 M611 312 L585 270" strokeWidth="1.2" opacity="0.7" />
        </g>
        <path d="M573 230 H623" stroke="#F8FAFC" strokeWidth="3" />
        <circle cx="598" cy="196" r="4" fill="#FBBF24" />

        {/* House */}
        <g>
          <rect x="150" y="265" width="340" height="125" fill="url(#sh-wall)" />
          <rect x="150" y="265" width="340" height="8" fill="#94A3B8" opacity="0.5" />
          {/* roof */}
          <polygon points="122,268 224,172 416,172 518,268" fill="url(#sh-roof)" />
          <polygon points="122,268 224,172 416,172 518,268" fill="none" stroke="#0F172A" strokeWidth="2" />
          {/* panels */}
          {PANEL_ROWS.map((row, ri) =>
            [...Array(row.n)].map((_, ci) => (
              <g key={`${ri}-${ci}`}>
                <rect x={row.x0 + ci * 34} y={row.y} width="30" height="20" rx="1.5" fill="url(#sh-panel)" stroke="#7DD3FC" strokeWidth="0.9" />
                <line x1={row.x0 + ci * 34 + 15} y1={row.y} x2={row.x0 + ci * 34 + 15} y2={row.y + 20} stroke="#7DD3FC" strokeWidth="0.5" opacity="0.7" />
                <line x1={row.x0 + ci * 34} y1={row.y + 10} x2={row.x0 + ci * 34 + 30} y2={row.y + 10} stroke="#7DD3FC" strokeWidth="0.5" opacity="0.7" />
                <path d={`M${row.x0 + ci * 34 + 2} ${row.y + 2} L${row.x0 + ci * 34 + 14} ${row.y + 2} L${row.x0 + ci * 34 + 6} ${row.y + 14} Z`} fill="#fff" opacity="0.16" />
              </g>
            ))
          )}
          {/* chimney */}
          <rect x="360" y="140" width="22" height="40" fill="#64748B" />
          <rect x="356" y="136" width="30" height="7" fill="#334155" />

          {/* windows (warm lit) */}
          <rect x="182" y="296" width="62" height="52" rx="4" fill="url(#sh-glass)" stroke="#475569" strokeWidth="3" />
          <path d="M213 296 V348 M182 322 H244" stroke="#475569" strokeWidth="2" />
          <rect x="396" y="296" width="62" height="52" rx="4" fill="url(#sh-glass)" stroke="#475569" strokeWidth="3" />
          <path d="M427 296 V348 M396 322 H458" stroke="#475569" strokeWidth="2" />
          {/* door */}
          <rect x="294" y="300" width="52" height="90" rx="3" fill="#135D3B" stroke="#0B3D27" strokeWidth="2" />
          <circle cx="336" cy="348" r="2.6" fill="#FBBF24" />
          <rect x="302" y="310" width="36" height="22" rx="2" fill="#86EFAC" opacity="0.5" />
          {/* steps */}
          <rect x="284" y="388" width="72" height="6" fill="#94A3B8" />
        </g>

        {/* Inverter + net meter */}
        <rect x="124" y="318" width="22" height="42" rx="3" fill="#0F172A" stroke="#22C55E" strokeWidth="1.6" />
        <circle cx="135" cy="328" r="3" fill="#4ADE80">
          <animate attributeName="opacity" values="1;0.25;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <rect x="128" y="338" width="14" height="3" fill="#475569" />
        <rect x="128" y="345" width="14" height="3" fill="#475569" />
        <rect x="496" y="322" width="22" height="30" rx="3" fill="#F8FAFC" stroke="#475569" strokeWidth="1.6" />
        <circle cx="507" cy="334" r="6" fill="none" stroke="#135D3B" strokeWidth="1.6" />
        <path d="M507 334 L511 330" stroke="#F59E0B" strokeWidth="1.6" />

        {/* Energy flow: roof -> inverter -> meter -> grid */}
        <g fill="none" strokeLinecap="round" strokeWidth="2.6">
          <path d="M150 262 L135 262 L135 318" stroke="#FBBF24" strokeDasharray="6 6">
            <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.1s" repeatCount="indefinite" />
          </path>
          <path d="M146 340 L150 340 M518 337 L540 337 L540 392" stroke="#4ADE80" strokeDasharray="6 6">
            <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.1s" repeatCount="indefinite" />
          </path>
          <path d="M598 232 Q560 240 518 268" stroke="#7DD3FC" strokeDasharray="5 6" strokeWidth="2">
            <animate attributeName="stroke-dashoffset" from="0" to="22" dur="1.4s" repeatCount="indefinite" />
          </path>
        </g>

        {/* Sunbeams to panels */}
        <g stroke="#FDE68A" strokeWidth="1.4" strokeDasharray="4 7" opacity="0.8">
          <line x1="485" y1="115" x2="395" y2="190">
            <animate attributeName="stroke-dashoffset" from="22" to="0" dur="1.8s" repeatCount="indefinite" />
          </line>
          <line x1="480" y1="108" x2="350" y2="182">
            <animate attributeName="stroke-dashoffset" from="22" to="0" dur="1.8s" repeatCount="indefinite" />
          </line>
          <line x1="470" y1="100" x2="300" y2="180">
            <animate attributeName="stroke-dashoffset" from="22" to="0" dur="1.8s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Trees */}
        <g>
          <rect x="62" y="352" width="7" height="40" fill="#78350F" />
          <circle cx="66" cy="338" r="26" fill="#0B6B3D" />
          <circle cx="52" cy="350" r="16" fill="#12804C" />
          <circle cx="82" cy="350" r="16" fill="#12804C" />
        </g>
        <g opacity="0.95">
          <rect x="556" y="360" width="6" height="30" fill="#78350F" />
          <circle cx="559" cy="350" r="18" fill="#0B6B3D" />
        </g>
      </svg>

      {/* Telemetry chips */}
      <div className="absolute top-4 left-4 flex items-center gap-2 text-[11px] font-mono font-bold text-white bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>NET METER LIVE</span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white font-mono bg-slate-950/75 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
        <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-300" />Output <strong className="text-emerald-300 tabular-nums">3,420 W</strong></span>
        <span>Efficiency <strong className="text-emerald-300 tabular-nums">99.2%</strong></span>
      </div>
    </div>

    {/* Floating glass metric badges */}
    <div className="absolute -top-5 -right-2 sm:-right-5 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lift border border-slate-200/80 flex items-center gap-3 animate-float">
      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700"><Zap className="w-5 h-5" /></div>
      <div>
        <div className="font-heading text-lg font-extrabold text-slate-900 tabular-nums leading-none">1.2 MW</div>
        <div className="text-[11px] font-semibold text-slate-600 mt-1">Installed capacity</div>
      </div>
    </div>

    <div className="absolute top-1/2 -left-3 sm:-left-8 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lift border border-slate-200/80 flex items-center gap-3 animate-float-delayed">
      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700"><CheckCircle2 className="w-5 h-5" /></div>
      <div>
        <div className="font-heading text-lg font-extrabold text-slate-900 tabular-nums leading-none">98.4%</div>
        <div className="text-[11px] font-semibold text-slate-600 mt-1">On-time handover</div>
      </div>
    </div>

    <div className="absolute -bottom-6 right-4 sm:right-8 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lift border border-slate-200/80 flex items-center gap-3 animate-float">
      <div className="p-2 rounded-xl bg-[#135D3B] text-white"><ShieldCheck className="w-5 h-5 text-amber-300" /></div>
      <div>
        <div className="font-heading text-lg font-extrabold text-slate-900 tabular-nums leading-none">₹0</div>
        <div className="text-[11px] font-semibold text-slate-600 mt-1">Covered warranty claims</div>
      </div>
    </div>
  </div>
);

export default SolarHeroArt;
