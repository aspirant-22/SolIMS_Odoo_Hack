/**
 * @AUTHOR: Garima Mittal
 * @FILE: PublicLandingView.jsx
 * @RESPONSIBILITY: Public solar landing page, interactive savings calculator, zero-login quote intake, hardware kit showcase, and order tracker with Plus Jakarta Sans typography, semantic status colors, and verified solar visuals.
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
  MapPin,
  Lock,
  Layers,
  TrendingUp,
  AlertCircle,
  BatteryCharging,
  Cpu,
  Barcode,
  Check
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LandingHero } from '../../components/LandingHero';
import { LifecycleTimeline } from '../../components/LifecycleTimeline';
import { executeHttpRequest } from '../../services/api';
import {
  formatCurrencyInr,
  calculateEstimatedSubsidyInr,
  getStatusBadgeStyle
} from '../../erpClientConfig';

export const PublicLandingView = ({ mode = 'landing' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isQuotePage = mode === 'quote';
  const onOpenStaffLogin = () => navigate('/login');

  // Calculator inputs
  const [monthlyBillInr, setMonthlyBillInr] = useState(4500);
  const [roofAreaSqFt, setRoofAreaSqFt] = useState(350);
  const [gridPreference, setGridPreference] = useState('ON_GRID'); // ON_GRID | OFF_GRID

  // Hardware kit showcase tab
  const [activeKitTab, setActiveKitTab] = useState('ON_GRID'); // ON_GRID | OFF_GRID
  const [selectedKitCapacity, setSelectedKitCapacity] = useState(3); // 1 to 5 kW

  // Image load & fallback state
  const [heroImageError, setHeroImageError] = useState(false);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);

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
    let recommendedKw = Math.round(monthlyBillInr / 1500);
    if (recommendedKw < 1) recommendedKw = 1;
    if (recommendedKw > 5) recommendedKw = 5;

    const maxCapacityByRoof = Math.max(1, Math.floor(roofAreaSqFt / 90));
    const finalKw = Math.min(recommendedKw, Math.min(5, maxCapacityByRoof));

    const panelsCount = finalKw * 2; // 550W mono PERC panels
    const monthlyUnitsGenerated = finalKw * 120; // 120 kWh per kW/month average in India
    const estimatedMonthlySavings = Math.min(monthlyBillInr, monthlyUnitsGenerated * 8.5);
    const estimated25YrSavings = estimatedMonthlySavings * 12 * 25;
    const estimatedSubsidy = calculateEstimatedSubsidyInr(finalKw, gridPreference);

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
    } else {
      // Section lives on another route (e.g. /quote -> /)
      navigate(`/#${sectionId}`);
    }
  };

  // Deep-link support for /#section and top-of-page reset on route change
  React.useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location.pathname, location.hash]);

  const pipelineSteps = [
    {
      num: '01',
      title: 'Enquiry',
      subtitle: 'Zero-Login Intake',
      desc: 'Instant rooftop AI capacity estimator & PM Surya Ghar subsidy pre-check',
      icon: Sun,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      num: '02',
      title: 'Site Survey',
      subtitle: 'Technical Audit',
      desc: 'On-site azimuth, tilt angle, shadow-free area & structural load validation',
      icon: MapPin,
      color: 'text-sky-600 bg-sky-50 border-sky-200'
    },
    {
      num: '03',
      title: 'Quotation',
      subtitle: 'Auto-BOM Engine',
      desc: 'Instant 1 kW-5 kW Bill of Materials with government subsidy deductions',
      icon: Zap,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    {
      num: '04',
      title: 'Dispatch',
      subtitle: 'Serial Barcode Scan',
      desc: 'Panels, inverters & batteries scanned and serial-locked before delivery',
      icon: Truck,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      num: '05',
      title: 'Roof Install',
      subtitle: 'Mobile Sign-off',
      desc: 'Live wattage test (Watts), rooftop photos & client digital touchscreen signature',
      icon: FileCheck2,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      num: '06',
      title: '20-Yr Warranty',
      subtitle: 'Monsoon Shield',
      desc: 'Automated 2-yr inverter & 20-yr panel warranty clock with ₹0 repair tickets',
      icon: ShieldCheck,
      color: 'text-emerald-800 bg-emerald-100 border-emerald-300'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#135D3B] selection:text-white">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Tagline - Forest Green Brand Accent */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#135D3B] to-[#0E462C] flex items-center justify-center shadow-md text-white">
              <Sun className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-xl font-extrabold tracking-tight text-slate-900">SolIMS</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Solar ERP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold tracking-tight">Power every project.</p>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button onClick={() => (isQuotePage ? navigate('/') : window.scrollTo({ top: 0, behavior: 'smooth' }))} className="hover:text-[#135D3B] transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => scrollToSection('workflow')} className="hover:text-[#135D3B] transition-colors cursor-pointer">
              Workflow
            </button>
            <button onClick={() => scrollToSection('kits')} className="hover:text-[#135D3B] transition-colors cursor-pointer">
              Solar Kits
            </button>
            <button onClick={() => scrollToSection('calculator')} className="hover:text-[#135D3B] transition-colors cursor-pointer">
              Savings Calculator
            </button>
            <button onClick={() => scrollToSection('features')} className="hover:text-[#135D3B] transition-colors cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollToSection('track')} className="hover:text-[#135D3B] transition-colors cursor-pointer">
              Track Order
            </button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-[#135D3B] transition-colors cursor-pointer">
              FAQ
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenStaffLogin}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200/90 shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Staff Login</span>
            </button>

            <button
              onClick={() => (isQuotePage ? scrollToSection('calculator') : navigate('/quote'))}
              className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold px-5 py-2 text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Get Free Quote</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>
        </div>
      </header>

      {!isQuotePage && (<>
      <LandingHero onQuote={() => navigate('/quote')} onLogin={onOpenStaffLogin} />
      <LifecycleTimeline />

      {/* 4. EQUIPMENT & WORKFLOW VISUAL CARDS: ON-GRID VS. OFF-GRID SOLAR KITS (1 kW - 5 kW) & SERIAL BADGES */}
      <section id="kits" className="py-16 bg-white border-b border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Hardware Architecture & Serial Verification
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2.5">
              On-Grid vs. Off-Grid Solar Kits (1 kW – 5 kW)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5">
              Certified Bill of Materials with serialized tracking for Mono PERC panels, smart inverters, and battery banks.
            </p>

            {/* Kit Capacity Selector */}
            <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
              {[1, 2, 3, 4, 5].map((kw) => (
                <button
                  key={kw}
                  onClick={() => setSelectedKitCapacity(kw)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedKitCapacity === kw
                      ? 'bg-[#135D3B] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="tabular-nums">{kw} kW System</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid of On-Grid vs Off-Grid Illustrated Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. On-Grid Solar Kit Architecture Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-lg font-black text-slate-900">
                      On-Grid Net-Metered Kit
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Subsidy Eligible
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Exports surplus electricity back to state DISCOM via bi-directional net meter.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-semibold block">PM Surya Ghar Subsidy</span>
                  <span className="font-mono text-base font-black text-emerald-700 tabular-nums">
                    {formatCurrencyInr(calculateEstimatedSubsidyInr(selectedKitCapacity, 'ON_GRID'))}
                  </span>
                </div>
              </div>

              {/* Custom SVG Architecture Diagram: On-Grid */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
                  <span>SCHEMATIC: ON_GRID_POWER_FLOW</span>
                  <span className="text-[#135D3B] font-bold">Bi-Directional</span>
                </div>
                <svg viewBox="0 0 500 130" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                  {/* Solar Array Node */}
                  <rect x="15" y="25" width="90" height="75" rx="8" fill="#F8FAFC" stroke="#0284C7" strokeWidth="1.5" />
                  <path d="M25 40h70M25 55h70M25 70h70M60 25v75" stroke="#38BDF8" strokeWidth="1" />
                  <text x="60" y="88" fill="#0369A1" fontSize="9" fontWeight="bold" textAnchor="middle">
                    {selectedKitCapacity * 2} × Mono PERC
                  </text>

                  {/* Flow Arrow 1 */}
                  <line x1="110" y1="62" x2="140" y2="62" stroke="#135D3B" strokeWidth="2" strokeDasharray="3 3" />
                  <polygon points="140,59 146,62 140,65" fill="#135D3B" />

                  {/* String Inverter Node */}
                  <rect x="150" y="25" width="85" height="75" rx="8" fill="#F8FAFC" stroke="#135D3B" strokeWidth="1.5" />
                  <rect x="160" y="35" width="65" height="22" rx="4" fill="#0F291E" />
                  <text x="192" y="50" fill="#34D399" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    {selectedKitCapacity} kW MPPT
                  </text>
                  <text x="192" y="88" fill="#135D3B" fontSize="9" fontWeight="bold" textAnchor="middle">
                    String Inverter
                  </text>

                  {/* Flow Arrow 2 */}
                  <line x1="240" y1="62" x2="270" y2="62" stroke="#135D3B" strokeWidth="2" strokeDasharray="3 3" />
                  <polygon points="270,59 276,62 270,65" fill="#135D3B" />

                  {/* Net Meter Node */}
                  <rect x="280" y="25" width="85" height="75" rx="8" fill="#F8FAFC" stroke="#F59E0B" strokeWidth="1.5" />
                  <circle cx="322" cy="50" r="16" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1" />
                  <text x="322" y="54" fill="#B45309" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    ⇄
                  </text>
                  <text x="322" y="88" fill="#92400E" fontSize="9" fontWeight="bold" textAnchor="middle">
                    Net Meter
                  </text>

                  {/* Flow Arrow 3 */}
                  <line x1="370" y1="62" x2="400" y2="62" stroke="#0284C7" strokeWidth="2" strokeDasharray="3 3" />
                  <polygon points="400,59 406,62 400,65" fill="#0284C7" />

                  {/* Grid Tower Node */}
                  <rect x="410" y="25" width="75" height="75" rx="8" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
                  <path d="M447 35L425 90h45z" fill="none" stroke="#64748B" strokeWidth="1.5" />
                  <line x1="432" y1="65" x2="462" y2="65" stroke="#64748B" strokeWidth="1" />
                  <text x="447" y="88" fill="#334155" fontSize="8" fontWeight="bold" textAnchor="middle">
                    DISCOM Grid
                  </text>
                </svg>
              </div>

              {/* Hardware Specifications List */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Solar PV Generation</span>
                  <span className="font-heading font-black text-slate-900 tabular-nums">
                    {selectedKitCapacity * 2} Modules ({selectedKitCapacity * 550}W)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">20-Yr Linear Warranty</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Monthly Production</span>
                  <span className="font-heading font-black text-slate-900 tabular-nums">
                    ~{selectedKitCapacity * 120} kWh / Units
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Zero battery degradation</span>
                </div>
              </div>
            </div>

            {/* 2. Off-Grid Solar Kit Architecture Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-lg font-black text-slate-900">
                      Off-Grid Battery Kit
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      100% Blackout Backup
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Complete energy independence with deep-cycle lithium-ion or tall tubular battery storage.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-semibold block">Grid Independence</span>
                  <span className="font-mono text-base font-black text-amber-800 tabular-nums">
                    24×7 Power
                  </span>
                </div>
              </div>

              {/* Custom SVG Architecture Diagram: Off-Grid */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
                  <span>SCHEMATIC: OFF_GRID_HYBRID_FLOW</span>
                  <span className="text-amber-700 font-bold">Islanded Storage</span>
                </div>
                <svg viewBox="0 0 500 130" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                  {/* Solar Array Node */}
                  <rect x="15" y="25" width="90" height="75" rx="8" fill="#F8FAFC" stroke="#0284C7" strokeWidth="1.5" />
                  <path d="M25 40h70M25 55h70M25 70h70M60 25v75" stroke="#38BDF8" strokeWidth="1" />
                  <text x="60" y="88" fill="#0369A1" fontSize="9" fontWeight="bold" textAnchor="middle">
                    {selectedKitCapacity * 2} × Mono PERC
                  </text>

                  {/* Flow Arrow 1 */}
                  <line x1="110" y1="62" x2="140" y2="62" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" />
                  <polygon points="140,59 146,62 140,65" fill="#F59E0B" />

                  {/* Hybrid PCU Inverter Node */}
                  <rect x="150" y="25" width="85" height="75" rx="8" fill="#F8FAFC" stroke="#F59E0B" strokeWidth="1.5" />
                  <rect x="160" y="35" width="65" height="22" rx="4" fill="#1C1917" />
                  <text x="192" y="50" fill="#FBBF24" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    Hybrid MPPT
                  </text>
                  <text x="192" y="88" fill="#B45309" fontSize="9" fontWeight="bold" textAnchor="middle">
                    Solar PCU
                  </text>

                  {/* Flow Arrow 2 */}
                  <line x1="240" y1="62" x2="270" y2="62" stroke="#10B981" strokeWidth="2" strokeDasharray="3 3" />
                  <polygon points="270,59 276,62 270,65" fill="#10B981" />

                  {/* Battery Bank Node */}
                  <rect x="280" y="25" width="85" height="75" rx="8" fill="#F8FAFC" stroke="#10B981" strokeWidth="1.5" />
                  <rect x="295" y="38" width="55" height="30" rx="4" fill="#ECFDF5" stroke="#10B981" strokeWidth="1" />
                  <line x1="305" y1="53" x2="315" y2="53" stroke="#059669" strokeWidth="2" />
                  <line x1="325" y1="53" x2="340" y2="53" stroke="#059669" strokeWidth="2" />
                  <text x="322" y="88" fill="#047857" fontSize="9" fontWeight="bold" textAnchor="middle">
                    Li-Ion Bank
                  </text>

                  {/* Flow Arrow 3 */}
                  <line x1="370" y1="62" x2="400" y2="62" stroke="#6366F1" strokeWidth="2" strokeDasharray="3 3" />
                  <polygon points="400,59 406,62 400,65" fill="#6366F1" />

                  {/* Home Backup Load Node */}
                  <rect x="410" y="25" width="75" height="75" rx="8" fill="#F8FAFC" stroke="#6366F1" strokeWidth="1.5" />
                  <path d="M447 40l-20 18h8v24h24V58h8z" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1" />
                  <text x="447" y="88" fill="#4338CA" fontSize="8" fontWeight="bold" textAnchor="middle">
                    Home Circuits
                  </text>
                </svg>
              </div>

              {/* Hardware Specifications List */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Battery Bank Storage</span>
                  <span className="font-heading font-black text-slate-900 tabular-nums">
                    {selectedKitCapacity * 2.4} kWh Deep-Cycle
                  </span>
                  <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">Zero Grid Dependency</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Cut-Over Speed</span>
                  <span className="font-heading font-black text-slate-900 tabular-nums">
                    &lt;10 ms UPS Switch
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Smooth PC / router runtime</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Inverter & Panel Serial Cards */}
          <div className="pt-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-xl font-bold text-slate-900">
                  Serialized Smart Hardware Identification Cards
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Laser-scanned serial numbers assigned during warehouse dispatch and verified at roof sign-off.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                100% Traceability
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inverter Serial Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  <Cpu className="w-8 h-8 text-[#135D3B]" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Smart Inverter
                    </span>
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      2-Yr Full Replacement
                    </span>
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-slate-900">
                      SolIMS High-Frequency MPPT String Inverter
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Barcode className="w-4 h-4 text-slate-400" />
                      <span className="font-mono text-xs font-bold text-slate-800 tabular-nums">
                        INV-5KW-MPPT-2026-X89
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex justify-between">
                    <span>Rated Voltage: <strong className="tabular-nums">230V AC / 50Hz</strong></span>
                    <span>Efficiency: <strong className="tabular-nums text-emerald-700">99.2%</strong></span>
                  </div>
                </div>
              </div>

              {/* Panel Serial Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  <Sun className="w-8 h-8 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Mono PERC Solar Panel
                    </span>
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      20-Yr Linear Warranty
                    </span>
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-slate-900">
                      550W Half-Cut Monocrystalline PV Module
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Barcode className="w-4 h-4 text-slate-400" />
                      <span className="font-mono text-xs font-bold text-slate-800 tabular-nums">
                        PANEL-550W-MONO-BATCH-88
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex justify-between">
                    <span>Degradation: <strong className="tabular-nums">&lt;0.55% / yr</strong></span>
                    <span>Year 25 Output: <strong className="tabular-nums text-emerald-700">84.8%</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      </>)}

      {isQuotePage && (
        <div className="bg-white border-b border-slate-200/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#135D3B]">Zero-login · Free · 2 minutes</div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 mt-1">Rooftop Inquiry &amp; Solar Savings Estimator</h1>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl">Estimate your system size, monthly savings and PM Surya Ghar subsidy, then submit your rooftop inquiry. No account required.</p>
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE SOLAR SAVINGS CALCULATOR & ZERO-LOGIN FREE QUOTE FORM */}
      <section id="calculator" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[11px] font-mono font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Instant Rooftop Sizing & PM Surya Ghar Subsidy
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2.5">
              Solar Savings Calculator & Zero-Login Quote
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5">
              Enter your monthly electricity bill and roof area. We auto-calculate recommended capacity, PM Surya Ghar subsidy, and generate your corporate quote request immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Calculator Sliders & Live Results */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-8">
              <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
                <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span>Step 1: Estimate Your Rooftop Specifications</span>
                </h3>
                <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  Live Estimator
                </span>
              </div>

              {/* Slider 1: Monthly Electricity Bill */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">
                    Average Monthly Electricity Bill
                  </label>
                  <span className="font-mono text-base font-black text-slate-900 tabular-nums">
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
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#135D3B]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold tabular-nums">
                  <span>₹1,000 (Small Load)</span>
                  <span>₹10,000</span>
                  <span>₹20,000+ (High Load)</span>
                </div>
              </div>

              {/* Slider 2: Shadow-Free Roof Area */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">
                    Shadow-Free Roof Area
                  </label>
                  <span className="font-mono text-base font-black text-slate-900 tabular-nums">
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
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#135D3B]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold tabular-nums">
                  <span>100 sq.ft (1 kW)</span>
                  <span>600 sq.ft</span>
                  <span>1,200 sq.ft (5 kW)</span>
                </div>
              </div>

              {/* Grid Preference Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Grid Connection Preference
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGridPreference('ON_GRID')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      gridPreference === 'ON_GRID'
                        ? 'bg-slate-100 border-slate-400 text-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">On-Grid (Net-Metered)</div>
                    <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                      Govt PM Surya Ghar Subsidy Eligible
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGridPreference('OFF_GRID')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      gridPreference === 'OFF_GRID'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-amber-900">Off-Grid (Battery Storage)</div>
                    <div className="text-[10px] font-medium text-amber-700 mt-0.5">
                      100% Blackout Backup Protection
                    </div>
                  </button>
                </div>
              </div>

              {/* Recommended System Snapshot Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recommended Size</div>
                  <div className="text-xl font-black text-slate-900 font-mono mt-0.5 tabular-nums">
                    {calculatedSpecs.capacityKw} kW
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium tabular-nums">{calculatedSpecs.panelsCount} × 550W Panels</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monthly Output</div>
                  <div className="text-xl font-black text-slate-900 font-mono mt-0.5 tabular-nums">
                    ~{calculatedSpecs.monthlyUnitsGenerated}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">kWh / Units / mo</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Govt Subsidy</div>
                  <div className="text-xl font-black text-amber-700 font-mono mt-0.5 tabular-nums">
                    {formatCurrencyInr(calculatedSpecs.estimatedSubsidy)}
                  </div>
                  <div className="text-[10px] text-amber-800 font-bold">PM Surya Ghar</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">25-Yr Savings</div>
                  <div className="text-xl font-black text-emerald-700 font-mono mt-0.5 tabular-nums">
                    {formatCurrencyInr(calculatedSpecs.estimated25YrSavings)}
                  </div>
                  <div className="text-[10px] text-emerald-800 font-bold">Lifetime Return</div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Zero-Login Quote Intake Form */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-md relative">
              <div className="border-b border-slate-200 pb-4 mb-5">
                <span className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Zero Signup Needed
                </span>
                <h3 className="font-heading font-bold text-base text-slate-900 mt-2">
                  Step 2: Submit Free Quote Request
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  We assign a certified technician for your free on-site roof audit.
                </p>
              </div>

              {quoteSubmissionResult ? (
                /* Success Card with Corporate Reference */
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4">
                  <div className="w-12 h-12 bg-[#135D3B] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-600 uppercase">Inquiry Registered</span>
                    <h4 className="text-2xl font-black text-slate-900 font-mono mt-1 tabular-nums">
                      {quoteSubmissionResult.inquiryReference}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      Congratulations, {quoteSubmissionResult.customerFullName}! Your {quoteSubmissionResult.requestedCapacityKw} kW rooftop inquiry is confirmed.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-left space-y-1.5 font-medium text-slate-700">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        Draft ➔ Survey Scheduled
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>System Variant:</span>
                      <span className="font-bold">{quoteSubmissionResult.requestedVariant}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Govt Subsidy:</span>
                      <span className="font-bold text-emerald-700 tabular-nums">
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
                    className="w-full py-2.5 rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:border-[#135D3B] focus:ring-1 focus:ring-[#135D3B]"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-medium font-mono tabular-nums focus:bg-white focus:outline-hidden focus:border-[#135D3B] focus:ring-1 focus:ring-[#135D3B]"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:border-[#135D3B] focus:ring-1 focus:ring-[#135D3B]"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:border-[#135D3B] focus:ring-1 focus:ring-[#135D3B]"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>Configured System:</span>
                      <span className="text-slate-900 tabular-nums">{calculatedSpecs.capacityKw} kW {gridPreference}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Est. PM Surya Ghar Subsidy:</span>
                      <span className="text-emerald-700 font-bold tabular-nums">
                        {formatCurrencyInr(calculatedSpecs.estimatedSubsidy)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingQuote}
                    className="w-full py-3 rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSubmittingQuote ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                        <span>Generating Reference...</span>
                      </span>
                    ) : (
                      <span>Submit Free Quote Request ➔</span>
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

      {/* 6. TRACK MY SOLAR ORDER LOOKUP BOX */}
      <section id="track" className="py-16 bg-white border-t border-slate-200/90">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Public Tracking Portal</span>
          </div>

          <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
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
                className="w-full bg-slate-50 border border-slate-300 rounded-full pl-4 pr-10 py-2.5 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-[#135D3B] focus:ring-1 focus:ring-[#135D3B]"
              />
            </div>
            <button
              type="submit"
              disabled={isTracking}
              className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white text-xs font-semibold px-5 py-2.5 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
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
            <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-6 text-left space-y-4 shadow-sm animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <span className="font-mono text-xs font-black text-slate-900 tabular-nums">
                    {trackingResult.order?.orderReference || trackingResult.lead?.inquiryReference}
                  </span>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {trackingResult.order?.customerFullName || trackingResult.lead?.customerFullName}
                  </div>
                </div>
                {(() => {
                  const statusVal = trackingResult.order?.orderWorkflowStatus || trackingResult.lead?.inquiryWorkflowStatus;
                  const badgeStyle = getStatusBadgeStyle(statusVal);
                  return (
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                      {statusVal}
                    </span>
                  );
                })()}
              </div>

              {/* Progress Milestones Ribbon */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Live Project Progression
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ✓ 1. Inquiry
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    trackingResult.lead?.inquiryWorkflowStatus === 'Approved' || trackingResult.order
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    2. Survey
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    trackingResult.order?.orderWorkflowStatus === 'Dispatched' || trackingResult.order?.orderWorkflowStatus === 'Installed'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    3. Dispatch
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    trackingResult.order?.orderWorkflowStatus === 'Installed' || trackingResult.order?.orderWorkflowStatus === 'Done'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    4. Installed
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-medium text-slate-600 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">System Capacity</span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {trackingResult.order?.systemCapacityKw || trackingResult.lead?.requestedCapacityKw} kW{' '}
                    {trackingResult.order?.systemVariant || trackingResult.lead?.requestedVariant}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Subsidy Status</span>
                  <span className="font-bold text-amber-800">
                    {trackingResult.order?.subsidyApplicationStatus || 'Eligibility Pre-Verified'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {!isQuotePage && (<>
      {/* 7. FEATURES SHOWCASE */}
      <section id="features" className="py-16 bg-slate-50 border-t border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
              Enterprise Grade Capabilities
            </span>
            <h2 className="font-heading text-3xl font-black text-slate-900 tracking-tight mt-2.5">
              Why Solar EPC Leaders Run on SolIMS
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Built to manage 40+ rooftop projects a month with bulletproof double-entry accounting and serialized tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-heading font-bold text-sm text-slate-900">Automated BOM & Pricing Engine</h3>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                1-click auto-generation of exact bills of material for 1 kW to 5 kW On-Grid and Off-Grid configurations with PM Surya Ghar subsidy deductions.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Truck className="w-5 h-5 text-sky-600" />
              </div>
              <h3 className="font-heading font-bold text-sm text-slate-900">Warehouse Serial Barcode Scanner</h3>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Scan panels, inverters, and battery banks before dispatch. Locks dispatches until serial numbers match BOM requirements precisely.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-heading font-bold text-sm text-slate-900">Mobile Roof Installation Sign-off</h3>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Field technicians log power generation (Watts), upload rooftop pictures, and capture homeowner digital touchscreen signatures.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-heading font-bold text-sm text-slate-900">Monsoon Warranty Auto-Clock</h3>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Auto-evaluates 2-year inverter and 20-year panel warranties. Automatically bills ₹0 for active warranties vs standard parts + ₹1,200 labor for expired.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-heading font-bold text-sm text-slate-900">Director Executive P&L</h3>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Monitor project gross margins, 15-technician payroll, hardware COGS, and pending PM Surya Ghar government subsidies with 1-click CSV export.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#135D3B]" />
              </div>
              <h3 className="font-heading font-bold text-sm text-slate-900">Double-Entry Stock & Financials</h3>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Strict mathematical parity (Debits === Credits) enforced on every hardware move and customer advance payment ledger entry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-16 bg-white border-t border-slate-200/90">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Clear Answers
            </span>
            <h2 className="font-heading text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <h4 className="font-heading font-bold text-sm text-slate-900">
                How does the PM Surya Ghar National Rooftop Subsidy work?
              </h4>
              <p className="text-xs text-slate-600 font-normal mt-1 leading-relaxed">
                Under the PM Surya Ghar scheme, residential On-Grid systems receive ₹30,000 for 1 kW, ₹60,000 for 2 kW, and up to ₹78,000 for 3 kW–5 kW systems. SolIMS automatically deducts this subsidy in quotes and tracks DISCOM verification stages.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <h4 className="font-heading font-bold text-sm text-slate-900">
                What is the difference between On-Grid and Off-Grid solar?
              </h4>
              <p className="text-xs text-slate-600 font-normal mt-1 leading-relaxed">
                On-Grid systems export excess solar units directly to your electrical DISCOM grid via net metering. Off-Grid systems incorporate dedicated battery storage to provide uninterrupted power during local grid outages.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <h4 className="font-heading font-bold text-sm text-slate-900">
                How long do the equipment warranties last?
              </h4>
              <p className="text-xs text-slate-600 font-normal mt-1 leading-relaxed">
                Solar PV panels carry a 20-year performance warranty (7,300 days). Smart solar inverters and battery banks carry a 2-year warranty (730 days) auto-initialized upon warehouse serial dispatch.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <h4 className="font-heading font-bold text-sm text-slate-900">
                How can I track my installation progress?
              </h4>
              <p className="text-xs text-slate-600 font-normal mt-1 leading-relaxed">
                You can enter your unique <span className="font-mono">INQ/2026/XXXX</span> inquiry code or registered phone number in the public "Track Order" portal above to see your live milestone progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      </>)}

      {/* 9. FOOTER */}
      <footer className="bg-slate-950 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#135D3B] flex items-center justify-center text-white">
              <Sun className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="font-heading font-black text-sm tracking-tight text-white">SolIMS Solutions</span>
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
