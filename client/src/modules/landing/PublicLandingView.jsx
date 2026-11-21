/**
 * @AUTHOR: Garima Mittal
 * @FILE: PublicLandingView.jsx
 * @RESPONSIBILITY: Public solar landing page, interactive savings calculator, zero-login quote intake, and order tracker.
 * @DEPENDENCIES: react, lucide-react, api.js, erpClientConfig.js
 */

import React, { useState, useMemo } from 'react';
import {
  Sun,
  Zap,
  ShieldCheck,
  Truck,
  FileCheck2,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  ChevronRight,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Lock,
  Layers,
  Wrench,
  Percent,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import {
  ERP_CLIENT_CONFIG,
  formatCurrencyInr,
  calculateEstimatedSubsidyInr
} from '../../erpClientConfig';

export const PublicLandingView = ({ onOpenStaffLogin, onSelectPublicSection }) => {
  // Calculator inputs
  const [monthlyBillInr, setMonthlyBillInr] = useState(4500);
  const [roofAreaSqFt, setRoofAreaSqFt] = useState(350);
  const [gridPreference, setGridPreference] = useState('ON_GRID'); // ON_GRID | OFF_GRID

  // Quote intake form state (Zero-Login)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteSubmissionResult, setQuoteSubmissionResult] = useState(null);
  const [quoteErrorMessage, setQuoteErrorMessage] = useState('');

  // Track My Order State
  const [trackQuery, setTrackQuery] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackErrorMessage, setTrackErrorMessage] = useState('');

  // Interactive calculations based on bill & roof area
  const calculatedSpecs = useMemo(() => {
    // Sizing rule: ~₹1,500 bill ~ 1 kW capacity, bounded between 1 kW and 5 kW
    let recommendedKw = Math.round(monthlyBillInr / 1500);
    if (recommendedKw < 1) recommendedKw = 1;
    if (recommendedKw > 5) recommendedKw = 5;

    // Roof area check: 1 kW requires ~100 sq ft
    const maxCapacityByRoof = Math.max(1, Math.floor(roofAreaSqFt / 90));
    const finalKw = Math.min(recommendedKw, Math.min(5, maxCapacityByRoof));

    const panelsCount = finalKw * 2; // 550W mono PERC panels
    const monthlyUnitsGenerated = finalKw * 120; // 120 kWh per kW/month average in India
    const estimatedMonthlySavings = Math.min(monthlyBillInr, monthlyUnitsGenerated * 8.5);
    const estimated25YrSavings = estimatedMonthlySavings * 12 * 25;
    const estimatedSubsidy = calculateEstimatedSubsidyInr(finalKw, gridPreference);

    // Approximate cost benchmark
    const baseCostPerKw = gridPreference === 'OFF_GRID' ? 72000 : 58000;
    const grossCost = finalKw * baseCostPerKw;
    const netCost = Math.max(0, grossCost - estimatedSubsidy);

    return {
      capacityKw: finalKw,
      panelsCount,
      monthlyUnitsGenerated,
      estimatedMonthlySavings,
      estimated25YrSavings,
      estimatedSubsidy,
      grossCost,
      netCost
    };
  }, [monthlyBillInr, roofAreaSqFt, gridPreference]);

  // Handle Free Quote Submission (Zero-Login)
  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    setQuoteErrorMessage('');
    setIsSubmittingQuote(true);

    try {
      const payload = {
        customerFullName: customerName.trim(),
        customerPhoneNumber: customerPhone.trim(),
        customerEmailAddress: customerEmail.trim() || `${customerName.trim().toLowerCase().replace(/\s+/g, '')}@solcustomer.in`,
        installationSiteAddress: siteAddress.trim(),
        approximateRoofAreaSqFt: Number(roofAreaSqFt),
        averageMonthlyElectricityBillInr: Number(monthlyBillInr),
        requestedCapacityKw: calculatedSpecs.capacityKw,
        requestedVariant: gridPreference,
        isSubsidyEligible: gridPreference === 'ON_GRID'
      };

      const response = await executeHttpRequest('/api/leads', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.success && response.lead) {
        setQuoteSubmissionResult(response.lead);
      }
    } catch (err) {
      setQuoteErrorMessage(err.message || 'Unable to submit free quote. Please check your inputs.');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Handle Track My Order Lookup
  const handleTrackSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!trackQuery.trim()) return;

    setTrackErrorMessage('');
    setIsTracking(true);
    setTrackingResult(null);

    try {
      const response = await executeHttpRequest(`/api/leads/track/${encodeURIComponent(trackQuery.trim())}`);
      if (response.success && response.result) {
        setTrackingResult(response.result);
      } else {
        setTrackErrorMessage('No project record found for this tracking code or phone number.');
      }
    } catch (err) {
      setTrackErrorMessage(err.message || 'Could not find any matching record. Try inquiry code (e.g. INQ/2026/0001).');
    } finally {
      setIsTracking(false);
    }
  };

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const pipelineSteps = [
    { num: '01', title: 'Customer Enquiry', desc: 'Zero-login rooftop intake & instant AI capacity recommendation', icon: Sun },
    { num: '02', title: 'Site Survey', desc: 'Technician on-site azimuth, tilt angle & shadow-free area audit', icon: MapPin },
    { num: '03', title: 'Auto-BOM Quotation', desc: 'Instant 1 kW-5 kW Bill of Materials with PM Surya Ghar subsidy', icon: Zap },
    { num: '04', title: 'Serial Dispatch', desc: 'Barcode-scanned panels, inverter & battery tracking to warehouse nodes', icon: Truck },
    { num: '05', title: 'Roof Installation', desc: 'Mobile roof sign-off, live wattage testing & homeowner digital signature', icon: FileCheck2 },
    { num: '06', title: '20-Yr Warranty', desc: 'Automated 2-yr inverter & 20-yr panel warranty clock with ₹0 service', icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#14532D] to-[#166534] flex items-center justify-center shadow-md shadow-emerald-900/10 text-white">
              <Sun className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">SolIMS</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-[#14532D] border border-emerald-200">
                  Solar ERP
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-bold tracking-tight">Power every project.</p>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-700">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[#14532D] transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => scrollToSection('workflow')} className="hover:text-[#14532D] transition-colors cursor-pointer">
              Workflow
            </button>
            <button onClick={() => scrollToSection('calculator')} className="hover:text-[#14532D] transition-colors cursor-pointer">
              Savings Calculator
            </button>
            <button onClick={() => scrollToSection('features')} className="hover:text-[#14532D] transition-colors cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollToSection('track')} className="hover:text-[#14532D] transition-colors cursor-pointer">
              Track Order
            </button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-[#14532D] transition-colors cursor-pointer">
              FAQ
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenStaffLogin}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Staff Login</span>
            </button>

            <button
              onClick={() => scrollToSection('calculator')}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-[#14532D] to-[#166534] hover:from-[#0F3E22] hover:to-[#14532D] shadow-md shadow-emerald-900/15 flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Get Free Quote</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION & FLOATING KPI CARDS */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-white via-[#F0FDF4]/40 to-[#F8FAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline & CTA */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#14532D] text-xs font-extrabold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#166534] animate-ping" />
                <span>⚡ Complete Rooftop Solar ERP Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
                Smarter Solar Operations.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14532D] via-[#166534] to-emerald-700">
                  A Greener Tomorrow.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-700 font-medium leading-relaxed max-w-2xl">
                From first rooftop inquiry and site survey to serial-tracked dispatch and 20-year warranty support — all in one unified, high-contrast platform.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => scrollToSection('calculator')}
                  className="px-6 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-[#14532D] to-[#166534] hover:from-[#0F3E22] hover:to-[#14532D] shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Get Free Quote</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </button>

                <button
                  onClick={onOpenStaffLogin}
                  className="px-5 py-3.5 rounded-xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Staff Portal Demo ▷</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-6 text-xs text-slate-700 font-bold">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                  <span>PM Surya Ghar Subsidy Ready</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                  <span>100% Zero-Login Estimator</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                  <span>Double-Entry Inventory Moves</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-Resolution Solar Architectural SVG Visual with Glass KPI Cards */}
            <div className="lg:col-span-5 relative">
              {/* Background ambient glow */}
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-emerald-200/50 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />

              {/* Custom Crisp Architectural Solar SVG Illustration */}
              <div className="relative bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-700/60 overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 text-white/90">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>SOLAR_ARRAY_GRID_LIVE</span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-mono font-extrabold uppercase bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    Net Meter Active
                  </span>
                </div>

                {/* SVG Visual */}
                <div className="py-4 flex justify-center">
                  <svg
                    viewBox="0 0 400 240"
                    className="w-full max-w-[360px] h-auto drop-shadow-lg"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Sky and sun */}
                    <circle cx="340" cy="40" r="26" fill="#F59E0B" opacity="0.9" />
                    <circle cx="340" cy="40" r="38" fill="#FDE68A" opacity="0.3" />
                    {/* Sun rays */}
                    <line x1="340" y1="5" x2="340" y2="0" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" />
                    <line x1="305" y1="40" x2="295" y2="40" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" />
                    <line x1="315" y1="65" x2="230" y2="120" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />

                    {/* House Structure */}
                    <polygon points="200,50 90,120 310,120" fill="#334155" />
                    <rect x="110" y="120" width="180" height="100" fill="#1E293B" rx="4" />

                    {/* Solar Panels on Roof */}
                    <g transform="rotate(-3, 200, 85)">
                      {/* Solar panel frame 1 */}
                      <rect x="135" y="70" width="34" height="42" fill="#0284C7" stroke="#38BDF8" strokeWidth="1.5" rx="2" />
                      <line x1="152" y1="70" x2="152" y2="112" stroke="#BAE6FD" strokeWidth="0.8" />
                      <line x1="135" y1="91" x2="169" y2="91" stroke="#BAE6FD" strokeWidth="0.8" />

                      {/* Solar panel frame 2 */}
                      <rect x="175" y="70" width="34" height="42" fill="#0284C7" stroke="#38BDF8" strokeWidth="1.5" rx="2" />
                      <line x1="192" y1="70" x2="192" y2="112" stroke="#BAE6FD" strokeWidth="0.8" />
                      <line x1="175" y1="91" x2="209" y2="91" stroke="#BAE6FD" strokeWidth="0.8" />

                      {/* Solar panel frame 3 */}
                      <rect x="215" y="70" width="34" height="42" fill="#0284C7" stroke="#38BDF8" strokeWidth="1.5" rx="2" />
                      <line x1="232" y1="70" x2="232" y2="112" stroke="#BAE6FD" strokeWidth="0.8" />
                      <line x1="215" y1="91" x2="249" y2="91" stroke="#BAE6FD" strokeWidth="0.8" />
                    </g>

                    {/* Windows & Door */}
                    <rect x="135" y="145" width="30" height="30" fill="#38BDF8" opacity="0.85" rx="3" />
                    <rect x="235" y="145" width="30" height="30" fill="#38BDF8" opacity="0.85" rx="3" />
                    <rect x="185" y="160" width="30" height="60" fill="#475569" rx="2" />
                    <circle cx="190" cy="190" r="2" fill="#E2E8F0" />

                    {/* Inverter Box & Generation Pulse */}
                    <rect x="75" y="160" width="22" height="35" fill="#14532D" stroke="#22C55E" strokeWidth="1.5" rx="3" />
                    <circle cx="86" cy="170" r="3" fill="#86EFAC" />
                    <line x1="97" y1="175" x2="110" y2="175" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="2 2" />

                    {/* Ground line */}
                    <line x1="40" y1="220" x2="360" y2="220" stroke="#475569" strokeWidth="3" />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono pt-2 border-t border-slate-700/60">
                  <span>Current Output: 3,420 W</span>
                  <span className="text-emerald-400 font-bold">Efficiency: 99.2%</span>
                </div>
              </div>

              {/* Floating Glass KPI Card 1: Revenue Growth */}
              <div className="absolute -top-4 -left-6 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-emerald-100 flex items-center gap-3 transform -rotate-1 hover:rotate-0 transition-transform">
                <div className="p-2 bg-emerald-100 rounded-xl text-[#14532D]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-black text-slate-900">+24% Revenue Growth</div>
                  <div className="text-[10px] text-slate-500 font-bold">Month-Over-Month Solar EPC</div>
                </div>
              </div>

              {/* Floating Glass KPI Card 2: Total Installed */}
              <div className="absolute -bottom-6 -left-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-emerald-100 flex items-center gap-3 transform rotate-1 hover:rotate-0 transition-transform">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-800">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-base font-black text-slate-900">1.2 MW Total Installed</div>
                  <div className="text-[10px] text-slate-500 font-bold">40 Rooftops / Month Cadence</div>
                </div>
              </div>

              {/* Floating Glass KPI Card 3: Customer Satisfaction */}
              <div className="absolute -bottom-4 -right-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-emerald-100 flex items-center gap-2.5 transform -rotate-1 hover:rotate-0 transition-transform">
                <div className="p-1.5 bg-[#14532D] rounded-lg text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">98% Satisfaction</div>
                  <div className="text-[10px] text-slate-500 font-bold">20-Yr Hardware Warranty</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. END-TO-END 6-STEP VISUAL PIPELINE BAR */}
      <section id="workflow" className="py-12 bg-white border-y border-emerald-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] font-mono font-black text-[#14532D] uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              The SunPower Lifecycle Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              End-to-End 6-Stage Solar EPC Operations
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Zero spreadsheet chaos. Every milestone governed by atomic state machine locks and serial verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {pipelineSteps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs hover:shadow-sm space-y-2.5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-[#14532D]">{step.num}</span>
                    <div className="p-2 bg-white rounded-xl border border-slate-200 text-[#14532D] shadow-2xs">
                      <StepIcon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900">{step.title}</h3>
                    <p className="text-[11px] text-slate-600 font-medium mt-1 leading-snug">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE SOLAR SAVINGS CALCULATOR & ZERO-LOGIN FREE QUOTE FORM */}
      <section id="calculator" className="py-16 bg-gradient-to-b from-[#F8FAF9] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[11px] font-mono font-black text-amber-800 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Instant Rooftop Sizing & PM Surya Ghar Subsidy
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
              Solar Savings Calculator & Zero-Login Quote
            </h2>
            <p className="text-sm text-slate-600 font-medium mt-1.5">
              Enter your monthly electricity bill and roof area. We auto-calculate recommended capacity, PM Surya Ghar subsidy, and generate your corporate quote request immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Calculator Sliders & Live Results */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
              <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span>Step 1: Estimate Your Rooftop Specifications</span>
                </h3>
                <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Live Calculator
                </span>
              </div>

              {/* Slider 1: Monthly Electricity Bill */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-slate-700">
                    Average Monthly Electricity Bill
                  </label>
                  <span className="font-mono text-base font-black text-[#14532D]">
                    {formatCurrencyInr(monthlyBillInr)} / mo
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="20000"
                  step="500"
                  value={monthlyBillInr}
                  onChange={(e) => setMonthlyBillInr(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#14532D]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>₹1,000 (Small Load)</span>
                  <span>₹10,000</span>
                  <span>₹20,000+ (High Load)</span>
                </div>
              </div>

              {/* Slider 2: Shadow-Free Roof Area */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-slate-700">
                    Shadow-Free Roof Area
                  </label>
                  <span className="font-mono text-base font-black text-slate-900">
                    {roofAreaSqFt} sq. ft.
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1200"
                  step="50"
                  value={roofAreaSqFt}
                  onChange={(e) => setRoofAreaSqFt(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#14532D]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>100 sq.ft (1 kW)</span>
                  <span>600 sq.ft</span>
                  <span>1,200 sq.ft (5 kW)</span>
                </div>
              </div>

              {/* Grid Preference Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Grid Connection Preference
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGridPreference('ON_GRID')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      gridPreference === 'ON_GRID'
                        ? 'bg-emerald-50 border-[#14532D] text-[#14532D] shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-extrabold text-xs">On-Grid (Net-Metered)</div>
                    <div className="text-[10px] font-medium mt-0.5 opacity-80">
                      Govt PM Surya Ghar Subsidy Eligible
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGridPreference('OFF_GRID')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      gridPreference === 'OFF_GRID'
                        ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-extrabold text-xs">Off-Grid (Battery Storage)</div>
                    <div className="text-[10px] font-medium mt-0.5 opacity-80">
                      100% Blackout Backup Protection
                    </div>
                  </button>
                </div>
              </div>

              {/* Recommended System Snapshot Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F0FDF4]/70 p-4 rounded-2xl border border-emerald-200">
                <div>
                  <div className="text-[10px] font-bold text-[#14532D] uppercase tracking-wider">Recommended Size</div>
                  <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                    {calculatedSpecs.capacityKw} kW
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">{calculatedSpecs.panelsCount} × 550W Panels</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-[#14532D] uppercase tracking-wider">Monthly Output</div>
                  <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                    ~{calculatedSpecs.monthlyUnitsGenerated}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">kWh / Units / mo</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Govt Subsidy</div>
                  <div className="text-xl font-black text-amber-700 font-mono mt-0.5">
                    {formatCurrencyInr(calculatedSpecs.estimatedSubsidy)}
                  </div>
                  <div className="text-[10px] text-amber-800 font-bold">PM Surya Ghar</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">25-Yr Savings</div>
                  <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">
                    {formatCurrencyInr(calculatedSpecs.estimated25YrSavings)}
                  </div>
                  <div className="text-[10px] text-emerald-800 font-bold">Lifetime Return</div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Zero-Login Quote Intake Form */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg relative">
              <div className="border-b border-slate-200 pb-4 mb-5">
                <span className="text-[10px] font-mono font-black text-[#14532D] uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Zero Signup Needed
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">
                  Step 2: Submit Free Quote Request
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  We assign a certified technician for your free on-site roof audit.
                </p>
              </div>

              {quoteSubmissionResult ? (
                /* Success Card with Corporate Reference */
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-300 text-center space-y-4">
                  <div className="w-12 h-12 bg-[#14532D] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-[#14532D] uppercase">Inquiry Registered</span>
                    <h4 className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {quoteSubmissionResult.inquiryReference}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      Congratulations, {quoteSubmissionResult.customerFullName}! Your {quoteSubmissionResult.requestedCapacityKw} kW rooftop inquiry is confirmed.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs text-left space-y-1.5 font-medium text-slate-700">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-bold text-[#14532D]">Draft ➔ Survey Scheduled</span>
                    </div>
                    <div className="flex justify-between">
                      <span>System Variant:</span>
                      <span className="font-bold">{quoteSubmissionResult.requestedVariant}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Govt Subsidy:</span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrencyInr(calculatedSpecs.estimatedSubsidy)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setTrackQuery(quoteSubmissionResult.inquiryReference);
                      setQuoteSubmissionResult(null);
                      scrollToSection('track');
                    }}
                    className="w-full py-2.5 bg-[#14532D] hover:bg-[#0F3E22] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Track This Order Now</span>
                  </button>
                </div>
              ) : (
                /* Intake Form */
                <form onSubmit={handleQuoteSubmit} className="space-y-4 text-xs">
                  {quoteErrorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{quoteErrorMessage}</span>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Homeowner Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:border-[#14532D] focus:ring-1 focus:ring-[#14532D]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      10-Digit Phone Number (For WhatsApp Updates) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      pattern="[0-9]{10}"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-medium font-mono focus:bg-white focus:outline-hidden focus:border-[#14532D] focus:ring-1 focus:ring-[#14532D]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="ramesh@gmail.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:border-[#14532D] focus:ring-1 focus:ring-[#14532D]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Installation Rooftop Address *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="House No., Street, City, Pin Code"
                      value={siteAddress}
                      onChange={(e) => setSiteAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:border-[#14532D] focus:ring-1 focus:ring-[#14532D]"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>Configured System:</span>
                      <span className="text-[#14532D]">{calculatedSpecs.capacityKw} kW {gridPreference}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Est. PM Surya Ghar Subsidy:</span>
                      <span className="text-emerald-700 font-bold">
                        {formatCurrencyInr(calculatedSpecs.estimatedSubsidy)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingQuote}
                    className="w-full py-3 bg-gradient-to-r from-[#14532D] to-[#166534] hover:from-[#0F3E22] hover:to-[#14532D] text-white font-extrabold rounded-xl shadow-md shadow-emerald-900/15 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSubmittingQuote ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                        <span>Generating Reference...</span>
                      </span>
                    ) : (
                      <>
                        <span>Submit Free Quote Request ➔</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-slate-500 font-medium">
                    🔒 Zero email/password signup required. Corporate reference generated via Odoo <span className="font-mono">ir.sequence</span>.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRACK MY SOLAR ORDER LOOKUP BOX */}
      <section id="track" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Public Tracking Portal</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Track My Solar Project Order
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl mx-auto">
            Check the live stage of your rooftop installation, survey approval, warehouse serial dispatch, or subsidy disbursement.
          </p>

          <form onSubmit={handleTrackSubmit} className="max-w-md mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Inquiry/Order Ref or Phone..."
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-[#14532D] focus:ring-1 focus:ring-[#14532D]"
              />
            </div>
            <button
              type="submit"
              disabled={isTracking}
              className="px-5 py-2.5 bg-[#14532D] hover:bg-[#0F3E22] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isTracking ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Track</span>
                </>
              )}
            </button>
          </form>

          {trackErrorMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl max-w-md mx-auto font-medium">
              {trackErrorMessage}
            </div>
          )}

          {trackingResult && (
            <div className="max-w-xl mx-auto bg-slate-50 rounded-2xl border border-slate-200 p-6 text-left space-y-4 shadow-sm animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <span className="font-mono text-xs font-black text-[#14532D]">
                    {trackingResult.order?.orderReference || trackingResult.lead?.inquiryReference}
                  </span>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {trackingResult.order?.customerFullName || trackingResult.lead?.customerFullName}
                  </div>
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-[#14532D] border border-emerald-300">
                  {trackingResult.order?.orderWorkflowStatus || trackingResult.lead?.inquiryWorkflowStatus}
                </span>
              </div>

              {/* Progress Milestones Ribbon */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Live Project Progression
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-200">
                    ✓ 1. Inquiry
                  </div>
                  <div className={`p-2 rounded-lg border ${
                    trackingResult.lead?.inquiryWorkflowStatus === 'Approved' || trackingResult.order
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                      : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}>
                    2. Survey
                  </div>
                  <div className={`p-2 rounded-lg border ${
                    trackingResult.order?.orderWorkflowStatus === 'Dispatched' || trackingResult.order?.orderWorkflowStatus === 'Installed'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                      : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}>
                    3. Dispatch
                  </div>
                  <div className={`p-2 rounded-lg border ${
                    trackingResult.order?.orderWorkflowStatus === 'Installed' || trackingResult.order?.orderWorkflowStatus === 'Done'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                      : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}>
                    4. Installed
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-medium text-slate-600 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">System Capacity</span>
                  <span className="font-bold text-slate-800">
                    {trackingResult.order?.systemCapacityKw || trackingResult.lead?.requestedCapacityKw} kW{' '}
                    {trackingResult.order?.systemVariant || trackingResult.lead?.requestedVariant}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Subsidy Status</span>
                  <span className="font-bold text-purple-900">
                    {trackingResult.order?.subsidyApplicationStatus || 'Eligibility Pre-Verified'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. FEATURES SHOWCASE */}
      <section id="features" className="py-16 bg-[#F8FAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-mono font-black text-[#14532D] uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Enterprise Grade Capabilities
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
              Why Solar EPC Leaders Run on SolIMS
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Built to manage 40+ rooftop projects a month with bulletproof double-entry accounting and serialized tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#14532D] flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Automated BOM & Pricing Engine</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                1-click auto-generation of exact bills of material for 1 kW to 5 kW On-Grid and Off-Grid configurations with PM Surya Ghar subsidy deductions.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Warehouse Serial Barcode Scanner</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Scan panels, inverters, and battery banks before dispatch. Locks dispatches until serial numbers match BOM requirements precisely.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Mobile Roof Installation Sign-off</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Field technicians log power generation (Watts), upload rooftop pictures, and capture homeowner digital touchscreen signatures.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Monsoon Warranty Auto-Clock</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Auto-evaluates 2-year inverter and 20-year panel warranties. Automatically bills ₹0 for active warranties vs standard parts + ₹1,200 labor for expired.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#14532D] flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Director Executive P&L</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Monitor project gross margins, 15-technician payroll, hardware COGS, and pending PM Surya Ghar government subsidies with 1-click CSV export.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Double-Entry Stock & Financials</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Strict mathematical parity (Debits === Credits) enforced on every hardware move and customer advance payment ledger entry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono font-black text-[#14532D] uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Clear Answers
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-extrabold text-sm text-slate-900">
                How does the PM Surya Ghar National Rooftop Subsidy work?
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                Under the PM Surya Ghar scheme, residential On-Grid systems receive ₹30,000 for 1 kW, ₹60,000 for 2 kW, and up to ₹78,000 for 3 kW–5 kW systems. SolIMS automatically deducts this subsidy in quotes and tracks DISCOM verification stages.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-extrabold text-sm text-slate-900">
                What is the difference between On-Grid and Off-Grid solar?
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                On-Grid systems export excess solar units directly to your electrical DISCOM grid via net metering. Off-Grid systems incorporate dedicated battery storage to provide uninterrupted power during local grid outages.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-extrabold text-sm text-slate-900">
                How long do the equipment warranties last?
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                Solar PV panels carry a 20-year performance warranty (7,300 days). Smart solar inverters and battery banks carry a 2-year warranty (730 days) auto-initialized upon warehouse serial dispatch.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-extrabold text-sm text-slate-900">
                How can I track my installation progress?
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                You can enter your unique <span className="font-mono">INQ/2026/XXXX</span> inquiry code or registered phone number in the public "Track Order" portal above to see your live milestone progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-slate-950 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#14532D] flex items-center justify-center text-white">
              <Sun className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-white">SolIMS Solutions</span>
              <p className="text-[11px] text-slate-400 font-medium">Power every project. Rooftop Solar EPC ERP</p>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <div className="text-xs font-mono font-bold text-amber-400">
              Authored by Garima Mittal
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Odoo Hackathon Finale Edition • MERN + Socket.IO Architecture
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLandingView;
