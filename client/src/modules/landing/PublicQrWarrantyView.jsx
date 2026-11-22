/**
 * @AUTHOR: Garima Mittal
 * @FILE: PublicQrWarrantyView.jsx
 * @RESPONSIBILITY: Public, mobile-first QR scan landing page (/u/:serialNumber) displaying live equipment warranty status, hardware specs, and 1-click Service Breakdown Ticket filing.
 * @DEPENDENCIES: react, react-router-dom, lucide-react, api.js, qrCodeSvg.jsx
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sun,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  X,
  Phone,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Zap,
  Activity,
  Award
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { InlineSvgQrCode } from '../../utils/qrCodeSvg';

export const PublicQrWarrantyView = () => {
  const { serialNumber } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState(null);
  const [copied, setCopied] = useState(false);

  // Service ticket breakdown filing modal state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [reportedFaultCode, setReportedFaultCode] = useState('ERR_INVERTER_GRID_FAIL');
  const [issueDescription, setIssueDescription] = useState(
    'Monsoon heavy rain caused inverter grid disconnect. Power generation dropped to 0W.'
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [ticketConfirmation, setTicketConfirmation] = useState(null);

  const fetchUnitDetails = async () => {
    if (!serialNumber) {
      setError('No equipment serial number specified.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const safeSerial = encodeURIComponent(String(serialNumber).trim());
    // Try primary public unit lookup endpoint, fallback to inventory or service alias
    const endpoints = [
      `/api/public/unit/${safeSerial}`,
      `/api/inventory/public/${safeSerial}`,
      `/api/service/public-lookup/${safeSerial}`
    ];

    let found = null;
    let lastError = null;

    for (const url of endpoints) {
      try {
        const res = await executeHttpRequest(url);
        const resolved = res?.unit || res?.asset || res?.data;
        if (res?.success && resolved) {
          found = resolved;
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (found) {
      setUnit(found);
      setCustomerName(found.customerFullName || found.maskedCustomerName || '');
      setCustomerPhone(found.customerPhoneNumber || '');
    } else {
      setError(
        lastError?.message ||
          `No registered equipment found for serial "${serialNumber}". Please check the QR sticker.`
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUnitDetails();
  }, [serialNumber]);

  const handleCopySerial = () => {
    if (unit?.serialNumber) {
      navigator.clipboard?.writeText(unit.serialNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileTicketSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingTicket(true);
      const res = await executeHttpRequest('/api/public/ticket', {
        method: 'POST',
        body: JSON.stringify({
          targetSerialNumber: unit.serialNumber,
          reportedFaultCode,
          issueDescription,
          customerFullName: customerName || unit.customerFullName || 'Verified Homeowner',
          customerPhoneNumber: customerPhone || unit.customerPhoneNumber || '+91 98000 00000'
        })
      });

      if (res?.success && res?.ticket) {
        setTicketConfirmation(res.ticket);
        setIsTicketModalOpen(false);
      }
    } catch (err) {
      // Fallback to service endpoint if public/ticket isn't reached
      try {
        const fallbackRes = await executeHttpRequest('/api/service/public-ticket', {
          method: 'POST',
          body: JSON.stringify({
            targetSerialNumber: unit.serialNumber,
            reportedFaultCode,
            issueDescription,
            customerFullName: customerName || unit.customerFullName || 'Verified Homeowner',
            customerPhoneNumber: customerPhone || unit.customerPhoneNumber || '+91 98000 00000'
          })
        });
        if (fallbackRes?.success && fallbackRes?.ticket) {
          setTicketConfirmation(fallbackRes.ticket);
          setIsTicketModalOpen(false);
          return;
        }
      } catch (e) {
        alert(e.message || err.message || 'Failed to submit service ticket');
      }
    } finally {
      setSubmittingTicket(false);
    }
  };

  // 1. Loading State (Never blank)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-spin">
            <Sun className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-black text-lg text-slate-100">
              Verifying Hardware QR Sticker
            </h3>
            <p className="text-xs text-slate-400">
              Querying SolIMS National Solar Registry for unit:{' '}
              <span className="font-mono text-emerald-400 font-bold">{serialNumber}</span>
            </p>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Error / Not Found State (Never blank)
  if (error || !unit) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Serial Not Found
            </span>
            <h3 className="font-heading font-black text-xl text-white">Equipment Record Missing</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              No registered solar equipment found for serial{' '}
              <span className="font-mono font-bold text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                {serialNumber}
              </span>
              . Please inspect the QR code sticker on your inverter or contact support.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => fetchUnitDetails()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
            >
              🔄 Retry Scanning Registry
            </button>
            <Link
              to="/"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all border border-slate-700"
            >
              Return to SolIMS Portal Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Live Computed Status
  const isUnderWarranty = unit.isUnderWarranty || unit.isUnderActiveWarranty || unit.warrantyStatus === 'UNDER_WARRANTY';
  const remainingDays = unit.daysRemaining ?? unit.remainingWarrantyDays ?? 0;
  const expiredDays = unit.daysExpired ?? unit.expiredDays ?? 0;

  // Crisp required badge strings
  const badgeLabel = isUnderWarranty
    ? `✅ ACTIVE WARRANTY — ${remainingDays} Days Remaining`
    : '⚠️ WARRANTY EXPIRED';

  const qrPageUrl = typeof window !== 'undefined' ? `${window.location.origin}/u/${unit.serialNumber}` : '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans flex flex-col items-center justify-start pb-16 selection:bg-emerald-500 selection:text-white">
      {/* Top SolIMS Public Header */}
      <header className="w-full max-w-md px-4 pt-5 pb-3 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-[#135D3B] text-white flex items-center justify-center font-black shadow-lg shadow-emerald-900/30">
            ☀️
          </div>
          <div>
            <div className="font-heading font-black text-sm tracking-tight text-white flex items-center gap-1.5">
              SolIMS <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">VERIFIED UNIT</span>
            </div>
            <div className="text-[10px] text-slate-400">National Rooftop Solar Equipment Registry</div>
          </div>
        </div>

        <Link
          to="/"
          className="text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
        >
          Portal
        </Link>
      </header>

      {/* Main Mobile Card Content */}
      <main className="w-full max-w-md px-4 pt-5 space-y-4">
        {/* Ticket Confirmation Toast Banner (if newly filed) */}
        {ticketConfirmation && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-4 space-y-2 shadow-xl animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Service Breakdown Ticket Filed!
              </span>
              <button
                onClick={() => setTicketConfirmation(null)}
                className="text-emerald-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Reference:{' '}
              <span className="font-mono font-bold text-white bg-emerald-900/60 px-1.5 py-0.5 rounded">
                {ticketConfirmation.ticketReference}
              </span>
            </p>
            <p className="text-[11px] text-slate-400">
              Our 24x7 monsoon response crew has been notified. Dispatch guaranteed within 4 hours.
            </p>
          </div>
        )}

        {/* Crisp Mobile Warranty Status Badge Card */}
        <section
          className={`rounded-3xl p-5 border relative overflow-hidden transition-all shadow-xl ${
            isUnderWarranty
              ? 'bg-gradient-to-b from-emerald-950/70 via-slate-900 to-slate-900 border-emerald-500/40 shadow-emerald-950/40'
              : 'bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-900 border-amber-500/40 shadow-amber-950/40'
          }`}
        >
          {/* Background Ambient Glow */}
          <div
            className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10 ${
              isUnderWarranty ? 'bg-emerald-500/15' : 'bg-amber-500/15'
            }`}
          />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className={`w-4 h-4 ${isUnderWarranty ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Warranty Status
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                BIS / MNRE Certified
              </span>
            </div>

            {/* Crisp Badge String required by specification */}
            <div
              className={`py-3 px-4 rounded-2xl border text-center font-black tracking-tight text-sm sm:text-base flex items-center justify-center gap-2 shadow-inner ${
                isUnderWarranty
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              }`}
            >
              {badgeLabel}
            </div>

            {/* Warranty Coverage Summary */}
            <div className="text-center pt-0.5">
              {isUnderWarranty ? (
                <p className="text-[11px] text-emerald-400/90 font-medium">
                  ✨ 100% Free Parts Replacement + ₹0 Labor Visit Fee under OEM Warranty.
                </p>
              ) : (
                <p className="text-[11px] text-amber-400/90 font-medium">
                  Standard SolIMS Authorized BOM service rates apply (₹9,700 Inverter Core / ₹1,200 Visit).
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 1-Click Action Button: Report Breakdown */}
        <section>
          <button
            onClick={() => setIsTicketModalOpen(true)}
            className="w-full py-4 px-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-black text-sm rounded-2xl transition-all shadow-lg shadow-emerald-950/60 active:scale-[0.98] flex items-center justify-center gap-2.5 border border-emerald-400/30"
          >
            <Wrench className="w-5 h-5 text-amber-300 animate-bounce" />
            <span>🔧 Report Breakdown / File Service Ticket</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-1.5">
            ⚡ Rainy-season priority dispatch • Auto-verifies warranty coverage in field
          </p>
        </section>

        {/* Hardware Specifications Card */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-200">
                Equipment Specifications
              </h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
              {unit.systemCapacityKw || 3} kW System
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Model Name */}
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Model Designation</div>
              <div className="font-heading font-bold text-slate-100 text-sm mt-0.5 leading-snug">
                {unit.modelDesignation || 'SolIMS Smart Inverter 3kW'}
              </div>
            </div>

            {/* Serial Number with 1-click Copy */}
            <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase">Asset Serial Number</div>
                <div className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                  {unit.serialNumber}
                </div>
              </div>
              <button
                onClick={handleCopySerial}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-semibold"
                title="Copy Serial Number"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Grid of Key Properties */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-slate-950/70 border border-slate-800/70 p-2.5 rounded-xl space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Installation Date</span>
                </div>
                <div className="font-semibold text-slate-200 text-xs">
                  {unit.installationDate
                    ? new Date(unit.installationDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '18 Months in Service'}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/70 p-2.5 rounded-xl space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Warranty Clock</span>
                </div>
                <div className="font-semibold text-slate-200 text-xs">
                  {unit.warrantyDurationDays || 730} Days (2 Years)
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/70 p-2.5 rounded-xl space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>Site Region</span>
                </div>
                <div className="font-semibold text-slate-200 text-xs truncate">
                  {unit.maskedCity || unit.customerCityMasked || 'Registered Rooftop'}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/70 p-2.5 rounded-xl space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Award className="w-3 h-3 text-slate-400" />
                  <span>Client (Masked)</span>
                </div>
                <div className="font-semibold text-slate-200 text-xs truncate">
                  {unit.maskedCustomerName || unit.customerNameMasked || 'Verified Client'}
                </div>
              </div>
            </div>

            {/* Compliance Badge */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>PM Surya Ghar Muft Bijli Yojana</span>
              </span>
              <span className="font-semibold text-emerald-400 text-[10px]">DCR Compliant</span>
            </div>
          </div>
        </section>

        {/* QR Code Hardware Sticker Seal */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center space-y-3 shadow-xl">
          <div className="font-heading font-bold text-xs uppercase tracking-wider text-slate-300">
            Official Equipment QR Seal
          </div>
          <div className="bg-white p-3.5 rounded-2xl inline-block shadow-md border border-slate-700">
            <InlineSvgQrCode text={qrPageUrl || window.location.href} size={130} />
          </div>
          <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
            Scan this physical sticker anytime with any smartphone camera to check real-time warranty status or report faults.
          </p>
        </section>

        {/* 24x7 Helpline Contact Footer */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center border border-slate-700">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-200">24x7 Solar Helpline</div>
              <div className="text-[10px] text-slate-400">Toll Free: 1800-555-SOLAR</div>
            </div>
          </div>
          <a
            href="tel:+918005557652"
            className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold transition-colors"
          >
            Call Now
          </a>
        </section>
      </main>

      {/* 1-Click Breakdown Ticket Modal / Drawer */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm text-white">File Breakdown Service Ticket</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Unit: {unit.serialNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFileTicketSubmit} className="space-y-4 text-xs">
              {/* Coverage Notice */}
              <div
                className={`p-3 rounded-xl border ${
                  isUnderWarranty
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{badgeLabel}</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  {isUnderWarranty
                    ? 'Coverage: Free replacement parts and technician visit are fully covered (₹0).'
                    : `Coverage: Standard billable BOM rate ₹${(unit.totalBillableCostInr || 9700).toLocaleString('en-IN')} applies upon resolution confirmation.`}
                </div>
              </div>

              {/* Fault Code Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Reported Fault Type
                </label>
                <select
                  value={reportedFaultCode}
                  onChange={(e) => setReportedFaultCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="ERR_INVERTER_GRID_FAIL">Monsoon Rain Inverter Grid Trip (ERR_GRID_FAIL)</option>
                  <option value="ERR_GENERATION_DROP">Solar Power Output Significantly Low (ERR_LOW_GEN)</option>
                  <option value="ERR_COMMUNICATION">Remote Wi-Fi Monitoring Offline (ERR_COMM)</option>
                  <option value="ERR_PHYSICAL_DAMAGE">Roof Earthing / Cable Inspection Needed (ERR_ROOF_CABLE)</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Detailed Issue Description
                </label>
                <textarea
                  rows={3}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-medium focus:outline-none focus:border-emerald-500 text-xs resize-none"
                  placeholder="Describe the issue observed..."
                  required
                />
              </div>

              {/* Contact Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {submittingTicket ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Filing Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Dispatch Field Crew</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicQrWarrantyView;
