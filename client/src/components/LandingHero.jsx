/**
 * @FILE: LandingHero.jsx
 * @RESPONSIBILITY: Public landing hero section: headline, CTAs (/quote, /login), trust row and bespoke solar SVG art.
 */

import React from 'react';
import { ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { SolarHeroArt } from './SolarHeroArt';

export const LandingHero = ({ onQuote, onLogin }) => (
  <section className="relative overflow-hidden pt-14 pb-24 bg-white border-b border-slate-200/80">
    <div className="absolute inset-0 bg-dots opacity-70 pointer-events-none" />
    <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-amber-200/40 blur-3xl pointer-events-none" />
    <div className="absolute -bottom-40 right-0 w-[30rem] h-[30rem] rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
      <div className="lg:col-span-6 space-y-7">
        <div className="inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-xs">
          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] tracking-wide">NEW</span>
          Solar EPC platform · PM Surya Ghar ready
        </div>

        <h1 className="font-heading text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.04]">
          Every rooftop,{' '}
          <span className="relative whitespace-nowrap text-[#135D3B]">
            run on sunlight
            <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true">
              <path d="M2 7 Q50 1 100 5 T198 4" stroke="#F59E0B" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
          </span>
          .
        </h1>

        <p className="text-lg text-slate-700 leading-relaxed max-w-xl">
          One platform for the entire solar journey: instant quotes, surveyed Auto-BOM proposals, barcode-locked dispatch,
          signed roof handovers and a 20-year warranty engine.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={onQuote}
            className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold px-7 py-3.5 shadow-lift flex items-center gap-2 transition-all cursor-pointer text-sm hover:-translate-y-0.5"
          >
            <span>Get Free Quote</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>
          <button
            onClick={onLogin}
            className="rounded-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-semibold px-7 py-3.5 shadow-xs flex items-center gap-2 transition-all cursor-pointer text-sm hover:-translate-y-0.5"
          >
            <Lock className="w-4 h-4 text-slate-600" />
            <span>Staff Portal</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 max-w-lg">
          {[
            ['40+', 'Rooftops / month'],
            ['20 yr', 'Panel warranty'],
            ['2 min', 'To a free quote']
          ].map(([v, l]) => (
            <div key={l}>
              <div className="font-heading text-2xl font-extrabold text-slate-900 tabular-nums">{v}</div>
              <div className="text-xs font-semibold text-slate-600">{l}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-700">
          {['Zero-login estimator', 'Serial-locked inventory', 'Auto-billed warranty'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="lg:col-span-6 px-2 sm:px-8 lg:px-4 pb-6">
        <SolarHeroArt />
      </div>
    </div>
  </section>
);

export default LandingHero;
