/**
 * @AUTHOR: Garima Mittal
 * @FILE: CustomerMySolarPortalView.jsx
 * @RESPONSIBILITY: Dedicated homeowner solar portal with project milestone ribbon, live 20-yr warranty certificates, installation proof, and rainy-season repair dispatch matching SolIMS Grid Forest-Emerald & Soft-Mint design.
 * @DEPENDENCIES: react, lucide-react, api.js, AuthContext.jsx, erpClientConfig.js
 */

import React, { useState, useEffect } from 'react';
import {
  Sun,
  CloudRain,
  CheckCircle2,
  FileCheck2,
  Award,
  AlertTriangle,
  LogOut,
  Wrench
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const CustomerMySolarPortalView = () => {
  const { currentUser, logoutUser, switchPersonaRole, setIsSystemProcessing } = useAuth();
  const [customerTickets, setCustomerTickets] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportedFaultCode, setReportedFaultCode] = useState('ERR_INVERTER_GRID_FAIL');
  const [issueDescription, setIssueDescription] = useState('Heavy monsoon downpour caused inverter red light. Home solar generation is stopped.');
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });
  const [warrantyData, setWarrantyData] = useState(null);

  // Load customer tickets and warranty info
  const loadCustomerData = async () => {
    try {
      const [ticketsRes, warrantyRes] = await Promise.all([
        executeHttpRequest('/api/service/tickets'),
        executeHttpRequest(`/api/service/warranty-lookup?query=${encodeURIComponent(currentUser?.email || 'customer@solims.com')}`)
      ]);

      if (ticketsRes.success) {
        const matched = (ticketsRes.tickets || []).filter(
          (t) =>
            t.customerFullName?.toLowerCase().includes('sunil') ||
            t.customerPhoneNumber === currentUser?.phoneNumber ||
            t.customerPhoneNumber === '+91 98333 44556'
        );
        setCustomerTickets(matched.length > 0 ? matched : ticketsRes.tickets.slice(0, 2));
      }

      if (warrantyRes.success && warrantyRes.results?.length > 0) {
        setWarrantyData(warrantyRes.results[0]);
      }
    } catch (err) {
      console.error('Failed to load customer data:', err);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, []);

  // Handle Rainy Season Issue Filing
  const handleReportIssueSubmit = async (e) => {
    e.preventDefault();
    setIsSystemProcessing(true);
    setFeedbackMessage({ type: '', text: '' });

    try {
      const response = await executeHttpRequest('/api/service/tickets', {
        method: 'POST',
        body: JSON.stringify({
          targetSerialNumber: warrantyData?.serialNumber || 'INV-2024-RAINY-ACTIVE',
          reportedFaultCode,
          issueDescription
        })
      });

      if (response.success && response.ticket) {
        setIsReportModalOpen(false);
        setFeedbackMessage({
          type: 'success',
          text: `Breakdown Ticket ${response.ticket.ticketReference} filed. Covered under Active 2-Year Inverter Warranty: ₹0 Parts & Labor!`
        });
        await loadCustomerData();
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to submit service ticket.' });
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const projectStages = [
    { num: '1', title: 'Enquiry', status: 'Completed', detail: 'INQ/2024/0088' },
    { num: '2', title: 'Survey Approved', status: 'Completed', detail: '350 sq.ft • 22° Tilt' },
    { num: '3', title: 'Quote Confirmed', status: 'Completed', detail: '3 kW On-Grid • PM Surya Ghar' },
    { num: '4', title: 'Dispatched', status: 'Completed', detail: 'Serials Barcode Verified' },
    { num: '5', title: 'Installed & Active', status: 'Active', detail: '3,450 W Live Generation' }
  ];

  return (
    <div className="min-h-screen bg-[#F4F9F6] text-slate-900 font-sans">
      {/* 1. CUSTOMER TOP NAV */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#135D3B] to-[#0E462C] flex items-center justify-center text-white shadow-xs">
            <Sun className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-[#0F291E]">SolIMS</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-3 py-0.5 rounded-full bg-[#E6F4EC] text-[#135D3B] border border-[#135D3B]/20">
                Homeowner Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Client: {currentUser?.fullName || 'Sunil Agrawal'} • B-42, Sector 14, Noida
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Persona Switcher for Hackathon Judges */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-full border border-slate-200/80 text-xs">
            <span className="text-[10px] font-bold text-slate-500 px-2 uppercase">Switch:</span>
            <button
              onClick={() => switchPersonaRole('ADMIN')}
              className="px-3 py-1 rounded-full bg-white hover:bg-[#E6F4EC] text-[#135D3B] font-bold border border-slate-200 shadow-2xs cursor-pointer text-[11px]"
            >
              Director
            </button>
            <button
              onClick={() => switchPersonaRole('STAFF')}
              className="px-3 py-1 rounded-full bg-white hover:bg-[#E6F4EC] text-[#135D3B] font-bold border border-slate-200 shadow-2xs cursor-pointer text-[11px]"
            >
              Technician
            </button>
          </div>

          <button
            onClick={logoutUser}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 rounded-full border border-slate-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {feedbackMessage.text && (
          <div
            className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 shadow-2xs ${
              feedbackMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-[#E6F4EC] border-[#135D3B]/20 text-[#135D3B]'
            }`}
          >
            {feedbackMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#135D3B]" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* 2. PROJECT TRACKER RIBBON / HERO STRIP */}
        <section className="bg-gradient-to-r from-[#EBF5EE] via-[#F4F9F6] to-white border border-emerald-900/10 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/10 pb-3">
            <div>
              <span className="text-[11px] font-mono font-extrabold text-[#135D3B] uppercase tracking-wider">
                Project Reference: ORD/2024/0088
              </span>
              <h2 className="text-2xl font-black text-[#0F291E] mt-0.5">
                3 kW On-Grid Rooftop Solar System
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#E6F4EC] text-[#135D3B] font-semibold text-xs border border-[#135D3B]/20">
                <span className="w-2 h-2 rounded-full bg-[#135D3B] animate-ping" />
                <span>Installed & Powering Home</span>
              </span>
            </div>
          </div>

          {/* Ribbon Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            {projectStages.map((st, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  st.status === 'Active'
                    ? 'bg-[#135D3B] text-white border-[#135D3B] shadow-sm'
                    : 'bg-[#E6F4EC] border-[#135D3B]/20 text-[#0F291E]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      st.status === 'Active' ? 'bg-amber-400 text-slate-900' : 'bg-white text-[#135D3B]'
                    }`}
                  >
                    ✓
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      st.status === 'Active' ? 'text-emerald-200' : 'text-[#135D3B]'
                    }`}
                  >
                    Step {st.num}
                  </span>
                </div>
                <div className="font-black text-xs mt-2">{st.title}</div>
                <div
                  className={`text-[11px] font-medium mt-0.5 ${
                    st.status === 'Active' ? 'text-emerald-100' : 'text-slate-600'
                  }`}
                >
                  {st.detail}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. ROOF COMPLETION SIGN-OFF PROOF & ACTION BANNER */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Roof Installation Sign-off Proof Card (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#E6F4EC] rounded-xl text-[#135D3B]">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-[#0F291E]">
                  Rooftop Installation Completion & Digital Sign-off Proof
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold text-[#135D3B] bg-[#E6F4EC] px-2.5 py-0.5 rounded-full border border-[#135D3B]/20">
                Verified On-Site
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#F4F9F6] p-4 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tested Generation</span>
                <span className="text-base font-black text-[#135D3B] font-mono mt-0.5 block">
                  3,450 Watts
                </span>
                <span className="text-[10px] text-[#135D3B] font-semibold">Exceeds 3kW benchmark</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Lead Technician</span>
                <span className="font-extrabold text-[#0F291E] block mt-0.5">Ramesh Sharma</span>
                <span className="text-[10px] text-slate-500 font-medium">Certified Rooftop Lead</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Acceptance Date</span>
                <span className="font-mono font-bold text-slate-900 block mt-0.5">June 2024</span>
                <span className="text-[10px] text-[#135D3B] font-semibold">Active in Field (18 mos)</span>
              </div>
            </div>

            {/* Roof Photo & Digital Signature Showcase */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Roof Picture Frame */}
              <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-900 text-white relative">
                <div className="p-3 bg-slate-800/80 backdrop-blur-xs flex justify-between items-center text-[10px] font-mono">
                  <span>ROOF_SURVEY_PHOTO_01</span>
                  <span className="text-emerald-400 font-bold">RCC Flat Roof</span>
                </div>
                <div className="p-6 text-center space-y-2">
                  <div className="inline-flex p-3 bg-white/10 rounded-full border border-white/20">
                    <Sun className="w-8 h-8 text-amber-300" />
                  </div>
                  <div className="text-xs font-bold text-slate-200">6 × Mono PERC Panels Array</div>
                  <div className="text-[10px] text-slate-400">South-Facing • 22° Fixed Tilt Angle</div>
                </div>
              </div>

              {/* Digital Homeowner Screen Signature */}
              <div className="rounded-2xl border border-slate-200/80 p-4 bg-[#F4F9F6] space-y-2 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Homeowner Digital Touch Signature
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Digitally captured on technician tablet upon power test verification.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 text-center font-serif italic text-lg text-slate-800 shadow-2xs">
                  Sunil Agrawal
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-[#135D3B] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#135D3B]" />
                  <span>Legally Signed & Commissioned</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Action & Rainy Season Support (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#135D3B] to-[#0E462C] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-extrabold text-amber-300">
                <CloudRain className="w-4 h-4" />
                <span>Monsoon Priority Protection</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight leading-snug">
                Monsoon Rain Surge or Inverter Trip?
              </h3>
              <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                Your 3 kW system has an active 2-Year Full Replacement Inverter Warranty. Filing a monsoon service ticket guarantees ₹0 replacement parts and priority 24-hr technician dispatch.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="w-full py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-transform transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-slate-900" />
                <span>Report Rainy-Season Issue (₹0 Warranty) ➔</span>
              </button>

              <div className="p-3 bg-black/20 rounded-xl border border-white/10 text-[11px] text-emerald-100 flex items-center justify-between">
                <span>Active Warranty Support:</span>
                <span className="font-mono font-bold text-amber-300">1800-SOLAR-HELP</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. INSTALLED SERIAL HARDWARE & LIVE 2-YR / 20-YR WARRANTY CERTIFICATES */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-800">
                  <Award className="w-5 h-5 text-amber-700" />
                </div>
                <h3 className="font-black text-base text-[#0F291E]">
                  Hardware Serial Numbers & Live Warranty Countdown Certificates
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Warranty clocks auto-initialized upon warehouse dispatch. Zero paperwork required for warranty service.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-[#135D3B] bg-[#E6F4EC] px-3 py-1 rounded-full border border-[#135D3B]/20">
              3 Certified Assets
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Asset 1: Solar Panels (20 Years) */}
            <div className="p-5 rounded-2xl bg-[#F4F9F6] border border-slate-200/80 space-y-4 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">
                  PV Panels (6 Units)
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E6F4EC] text-[#135D3B] border border-[#135D3B]/20">
                  Active (20-Yr)
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-[#0F291E]">
                  Mono PERC 550W Half-Cut Solar Panels
                </h4>
                <div className="font-mono text-xs font-bold text-[#135D3B] mt-1">
                  Serial: PANEL-BATCH-2024-0088
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Duration:</span>
                  <span className="font-bold text-slate-900">20 Years (7,300 Days)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Elapsed Time:</span>
                  <span className="font-bold text-slate-700">~548 Days</span>
                </div>
                <div className="border-t border-slate-100 pt-1.5 flex justify-between font-black text-[#135D3B]">
                  <span>Remaining Warranty:</span>
                  <span className="font-mono text-sm">6,752 Days Left</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-medium">
                ✓ 84.8% performance output guaranteed at Year 25.
              </div>
            </div>

            {/* Asset 2: Smart Inverter (2 Years) */}
            <div className="p-5 rounded-2xl bg-[#E6F4EC]/60 border border-[#135D3B]/30 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-[#135D3B] uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-[#135D3B]/20">
                  Grid Inverter
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E6F4EC] text-[#135D3B] border border-[#135D3B]/20">
                  Active (2-Yr)
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-[#0F291E]">
                  SolIMS 3 kW Smart Grid-Tied Inverter
                </h4>
                <div className="font-mono text-xs font-bold text-[#135D3B] mt-1">
                  Serial: INV-2024-RAINY-ACTIVE
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Duration:</span>
                  <span className="font-bold text-slate-900">2 Years (730 Days)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Elapsed Time:</span>
                  <span className="font-bold text-slate-700">~548 Days (18 Mos)</span>
                </div>
                <div className="border-t border-slate-100 pt-1.5 flex justify-between font-black text-[#135D3B]">
                  <span>Remaining Warranty:</span>
                  <span className="font-mono text-sm text-[#135D3B]">182 Days Left</span>
                </div>
              </div>

              <div className="text-[10px] text-[#135D3B] font-bold">
                ✓ In-warranty service cost: ₹0 Parts + ₹0 Labor.
              </div>
            </div>

            {/* Asset 3: Safety Earthing & Surge Box (2 Years) */}
            <div className="p-5 rounded-2xl bg-[#F4F9F6] border border-slate-200/80 space-y-4 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">
                  Safety System
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E6F4EC] text-[#135D3B] border border-[#135D3B]/20">
                  Active (2-Yr)
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-[#0F291E]">
                  Dual DC/AC Lightning Surge Arrestor
                </h4>
                <div className="font-mono text-xs font-bold text-[#135D3B] mt-1">
                  Serial: SPD-EARTH-2024-0088
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Duration:</span>
                  <span className="font-bold text-slate-900">2 Years (730 Days)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Elapsed Time:</span>
                  <span className="font-bold text-slate-700">~548 Days</span>
                </div>
                <div className="border-t border-slate-100 pt-1.5 flex justify-between font-black text-[#135D3B]">
                  <span>Remaining Warranty:</span>
                  <span className="font-mono text-sm">182 Days Left</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-medium">
                ✓ High-voltage lightning surge protection verified.
              </div>
            </div>
          </div>
        </section>

        {/* 5. ACTIVE SERVICE TICKETS */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#135D3B]" />
              <h3 className="font-extrabold text-sm text-[#0F291E]">
                My Service & Maintenance Tickets ({customerTickets.length})
              </h3>
            </div>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="text-xs font-bold text-[#135D3B] hover:underline cursor-pointer"
            >
              + File New Ticket
            </button>
          </div>

          <div className="space-y-3">
            {customerTickets.map((ticket) => (
              <div
                key={ticket._id}
                className="p-4 bg-[#F4F9F6] rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-[#135D3B]">
                      {ticket.ticketReference}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-800 font-mono font-bold border border-rose-200">
                      {ticket.reportedFaultCode}
                    </span>
                    <span className="text-[10px] font-semibold text-[#135D3B] bg-[#E6F4EC] px-2.5 py-0.5 rounded-full border border-[#135D3B]/20">
                      Warranty Covered (₹0)
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium mt-1">{ticket.issueDescription}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Status</span>
                    <span
                      className={`text-[11px] font-semibold px-3 py-0.5 rounded-full ${
                        ticket.ticketWorkflowStatus === 'Done'
                          ? 'bg-[#E6F4EC] text-[#135D3B] border border-[#135D3B]/20'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {ticket.ticketWorkflowStatus === 'Done' ? 'Resolved' : ticket.ticketWorkflowStatus}
                    </span>
                  </div>
                  <div className="text-right border-l border-slate-200 pl-3">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Billed</span>
                    <span className="font-mono font-black text-[#135D3B]">₹0</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* REPORT ISSUE MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-[#135D3B]" />
                <h3 className="font-extrabold text-base text-[#0F291E]">
                  Report Monsoon / Inverter Issue
                </h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReportIssueSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Installed Hardware Asset
                </label>
                <input
                  type="text"
                  disabled
                  value="INV-2024-RAINY-ACTIVE (SolIMS 3kW Inverter - Active 2-Yr Warranty)"
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reported Inverter Fault Code
                </label>
                <select
                  value={reportedFaultCode}
                  onChange={(e) => setReportedFaultCode(e.target.value)}
                  className="odoo-input font-mono font-bold"
                >
                  <option value="ERR_INVERTER_GRID_FAIL">ERR_INVERTER_GRID_FAIL (Rain Surge)</option>
                  <option value="ERR_MOSFET_BURNOUT">ERR_MOSFET_BURNOUT (Thunderbolt)</option>
                  <option value="ERR_ZERO_POWER">ERR_ZERO_POWER (Earthing Trip)</option>
                  <option value="ERR_BATTERY_UNDERVOLT">ERR_BATTERY_UNDERVOLT (Monsoon Dark Sky)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Describe What Happened
                </label>
                <textarea
                  rows={3}
                  required
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="odoo-input font-medium"
                />
              </div>

              {/* Warranty Coverage Banner */}
              <div className="p-3.5 bg-[#E6F4EC] rounded-2xl border border-[#135D3B]/20 text-xs flex justify-between items-center text-[#135D3B]">
                <div>
                  <div className="font-extrabold">Active Warranty Evaluated: ₹0 Charge</div>
                  <div className="text-[10px] text-[#135D3B]">182 days remaining on 2-year warranty clock</div>
                </div>
                <span className="text-base font-black font-mono">₹0</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold text-xs px-5 py-2 shadow-sm cursor-pointer"
                >
                  Dispatch Priority Technician ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMySolarPortalView;
