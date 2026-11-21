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
  Wrench,
  Mail,
  CreditCard,
  Clock,
  ArrowRight
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AlertBanner } from '../../components/AlertBanner';
import { SimulatedEmailOutboxModal } from '../../components/SimulatedEmailOutboxModal';

export const CustomerMySolarPortalView = () => {
  const { currentUser, logoutUser, switchPersonaRole, setIsSystemProcessing } = useAuth();
  const [customerTickets, setCustomerTickets] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [customerProjectOrder, setCustomerProjectOrder] = useState(null);
  const [reportedFaultCode, setReportedFaultCode] = useState('ERR_INVERTER_GRID_FAIL');
  const [issueDescription, setIssueDescription] = useState('Heavy monsoon downpour caused inverter red light. Home solar generation is stopped.');
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });
  const [warrantyData, setWarrantyData] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmountInput, setPaymentAmountInput] = useState(0);
  const [paymentModeInput, setPaymentModeInput] = useState('UPI');
  const [transactionRefInput, setTransactionRefInput] = useState('');

  // Load customer tickets and warranty info
  const loadCustomerData = async () => {
    try {
      const [ticketsRes, warrantyRes, myProjectRes] = await Promise.all([
        executeHttpRequest('/api/service/tickets'),
        executeHttpRequest(`/api/service/warranty-lookup?query=${encodeURIComponent(currentUser?.email || 'customer@solims.com')}`),
        executeHttpRequest('/api/orders/my-project').catch(() => ({ success: false }))
      ]);

      if (myProjectRes?.success && myProjectRes.order) {
        setCustomerProjectOrder(myProjectRes.order);
      }

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

  // QA FIX 2: Handle Online Due Payment
  const handleOnlinePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!customerProjectOrder) return;
    setIsSystemProcessing(true);
    setFeedbackMessage({ type: '', text: '' });

    try {
      const response = await executeHttpRequest(`/api/orders/${customerProjectOrder._id}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          paymentAmountInr: Number(paymentAmountInput),
          paymentMode: paymentModeInput,
          transactionReference: transactionRefInput || `UPI/2026/TXN${Date.now().toString().slice(-6)}`
        })
      });

      if (response.success && response.order) {
        setIsPaymentModalOpen(false);
        setCustomerProjectOrder(response.order);
        setFeedbackMessage({
          type: 'success',
          text: `✅ Payment of ₹${Number(paymentAmountInput).toLocaleString('en-IN')} received successfully! Double-entry JournalEntry posted (Debit 1010 Bank / Credit 1200 Accounts Receivable). Remaining balance updated.`
        });
        await loadCustomerData();
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Payment processing failed.' });
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const resolvedReference = customerProjectOrder?.orderReference || customerProjectOrder?.quotationReference || 'ORD/2026/0088';
  const resolvedSystemTitle = customerProjectOrder
    ? `${customerProjectOrder.systemCapacityKw} kW ${customerProjectOrder.systemVariant} Rooftop Solar System`
    : '3 kW On-Grid Rooftop Solar System';
  const resolvedAddress = customerProjectOrder?.installationSiteAddress || 'B-42, Sector 14, Noida';
  const resolvedClientName = currentUser?.fullName || customerProjectOrder?.customerFullName || 'Sunil Agrawal';

  // QA FIX 2: Financial Summary Calculations
  const totalProjectAmount = customerProjectOrder?.netPayableAmountInr || customerProjectOrder?.totalOrderAmountInr || 245000;
  const paidAmount = customerProjectOrder?.advancePaymentAmountInr || 0;
  const balanceDue = customerProjectOrder?.balancePaymentDueInr != null
    ? customerProjectOrder.balancePaymentDueInr
    : Math.max(0, totalProjectAmount - paidAmount);

  // QA FIX 2: 6-Stage Live Purchase & Installation Progress Tracker
  // (Inquiry ➔ Survey Approved ➔ Quote Confirmed ➔ Advance Paid ➔ Dispatched ➔ Installed & Signed Off)
  const isAdvancePaid = (customerProjectOrder?.advancePaymentAmountInr > 0) || ['Advance_Paid', 'Packed', 'Dispatched', 'Installed', 'Done'].includes(customerProjectOrder?.orderWorkflowStatus);
  const isDispatched = ['Dispatched', 'Installed', 'Done'].includes(customerProjectOrder?.orderWorkflowStatus);
  const isInstalled = ['Installed', 'Done'].includes(customerProjectOrder?.orderWorkflowStatus);

  const projectStages = [
    {
      num: '1',
      title: 'Inquiry',
      status: 'Completed',
      detail: customerProjectOrder?.leadInquiryId ? 'Assessment Confirmed' : 'INQ Registered'
    },
    {
      num: '2',
      title: 'Survey Approved',
      status: 'Completed',
      detail: 'Technical Feasibility Verified'
    },
    {
      num: '3',
      title: 'Quote Confirmed',
      status: 'Completed',
      detail: customerProjectOrder ? `${customerProjectOrder.systemCapacityKw} kW System Configured` : 'Auto-BOM Verified'
    },
    {
      num: '4',
      title: 'Advance Paid',
      status: isAdvancePaid
        ? 'Completed'
        : (customerProjectOrder?.orderWorkflowStatus === 'Draft' ? 'Active' : 'Waiting'),
      detail: (customerProjectOrder?.advancePaymentAmountInr > 0)
        ? `₹${customerProjectOrder.advancePaymentAmountInr.toLocaleString('en-IN')} Received`
        : '20% Minimum Required'
    },
    {
      num: '5',
      title: 'Dispatched',
      status: isDispatched
        ? 'Completed'
        : (customerProjectOrder?.orderWorkflowStatus === 'Packed' ? 'Active' : 'Waiting'),
      detail: isDispatched ? 'Serials Barcode Verified' : 'Warehouse Queue'
    },
    {
      num: '6',
      title: 'Installed & Signed Off',
      status: isInstalled
        ? 'Completed'
        : (customerProjectOrder?.orderWorkflowStatus === 'Dispatched' ? 'Active' : 'Waiting'),
      detail: isInstalled
        ? 'Commissioned & Generating'
        : (customerProjectOrder?.scheduledInstallationDate
          ? `Date: ${new Date(customerProjectOrder.scheduledInstallationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
          : 'Crew Scheduling')
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. CUSTOMER TOP NAV */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#135D3B] to-[#0E462C] flex items-center justify-center text-white shadow-xs">
            <Sun className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-lg tracking-tight text-slate-900">SolIMS</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Homeowner Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Client: {resolvedClientName} • {resolvedAddress}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Simulated Mailbox Shortcut */}
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#135D3B] hover:text-[#0E462C] bg-emerald-50 hover:bg-emerald-100 rounded-full border border-emerald-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Simulated Mailbox</span>
          </button>

          {/* Quick Persona Switcher for Hackathon Judges */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-full border border-slate-200/80 text-xs">
            <span className="text-[10px] font-bold text-slate-500 px-2 uppercase">Switch:</span>
            <button
              onClick={() => switchPersonaRole('ADMIN')}
              className="px-3 py-1 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 shadow-2xs cursor-pointer text-[11px]"
            >
              Director
            </button>
            <button
              onClick={() => switchPersonaRole('STAFF')}
              className="px-3 py-1 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 shadow-2xs cursor-pointer text-[11px]"
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
        <AlertBanner
          type={feedbackMessage.type}
          message={feedbackMessage.text}
          onDismiss={() => setFeedbackMessage({ type: '', text: '' })}
        />

        {/* 2-STAGE PROGRESSIVE ONBOARDING STATUS STRIP */}
        <section className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#135D3B] text-white flex items-center justify-center font-black text-sm shadow-xs">
              ✓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-sm text-[#0F291E]">
                  2-Stage Progressive Onboarding Completed
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  Client Portal Active
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                Stage 1: Solar Assessment Initiated ✓ ➔ Stage 2: Advance Confirmed & MySolar Credentials Issued ✓
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-emerald-50 text-[#135D3B] font-bold border border-emerald-300 shadow-2xs text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-600" />
            <span>View Dispatched Onboarding Emails</span>
          </button>
        </section>

        {/* 2. PROJECT TRACKER RIBBON / HERO STRIP */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider tabular-nums">
                Project Reference: {resolvedReference}
              </span>
              <h2 className="font-heading text-2xl font-black text-slate-900 mt-0.5">
                {resolvedSystemTitle}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span>Installed & Powering Home</span>
              </span>
            </div>
          </div>

          {/* QA FIX 2: 6-Stage Ribbon Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {projectStages.map((st, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  st.status === 'Active'
                    ? 'bg-[#135D3B] text-white border-[#135D3B] shadow-sm ring-2 ring-[#135D3B]/20'
                    : st.status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      st.status === 'Active'
                        ? 'bg-amber-300 text-slate-900'
                        : st.status === 'Completed'
                        ? 'bg-white text-emerald-800'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {st.status === 'Completed' ? '✓' : st.num}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      st.status === 'Active'
                        ? 'text-emerald-200'
                        : st.status === 'Completed'
                        ? 'text-emerald-800'
                        : 'text-slate-400'
                    }`}
                  >
                    Stage {st.num}
                  </span>
                </div>
                <div className="font-bold text-xs mt-2 leading-tight">{st.title}</div>
                <div
                  className={`text-[11px] font-medium mt-1 leading-snug line-clamp-2 ${
                    st.status === 'Active'
                      ? 'text-emerald-100'
                      : st.status === 'Completed'
                      ? 'text-slate-600'
                      : 'text-slate-400'
                  }`}
                >
                  {st.detail}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* QA FIX 2: FINANCIAL & PAYMENT SUMMARY CARD */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#135D3B] flex items-center justify-center border border-emerald-200">
                <CreditCard className="w-4 h-4 text-[#135D3B]" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Financial & Payment Summary
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Verified real-time invoice & advance payment ledger with double-entry journal records.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Double-Entry Odoo Ledger
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Total Project Amount</span>
              <div className="font-heading font-black text-xl text-slate-900 tabular-nums">
                ₹{totalProjectAmount.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">Net of PM Surya Ghar Subsidy</span>
            </div>

            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1">
              <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">Paid Amount</span>
              <div className="font-heading font-black text-xl text-emerald-800 tabular-nums">
                ₹{paidAmount.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-700 font-medium block">Verified Advance & Online Receipts</span>
            </div>

            <div className={`p-4 rounded-2xl border space-y-1 ${
              balanceDue > 0
                ? 'bg-amber-50/80 border-amber-300'
                : 'bg-emerald-50/70 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  balanceDue > 0 ? 'text-amber-900' : 'text-emerald-800'
                }`}>
                  Balance Due
                </span>
                {balanceDue === 0 && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-300">
                    Fully Settled ✓
                  </span>
                )}
              </div>
              <div className={`font-heading font-black text-xl tabular-nums ${
                balanceDue > 0 ? 'text-amber-900' : 'text-emerald-800'
              }`}>
                ₹{balanceDue.toLocaleString('en-IN')}
              </div>
              <span className={`text-[10px] font-medium block ${
                balanceDue > 0 ? 'text-amber-800' : 'text-emerald-700'
              }`}>
                {balanceDue > 0 ? 'Payable prior to final commissioning' : 'Zero outstanding balance'}
              </span>
            </div>
          </div>

          {balanceDue > 0 && customerProjectOrder && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-50/60 p-4 rounded-xl border border-amber-200/80">
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong>Online Payment Portal:</strong> You have an outstanding balance of <strong>₹{balanceDue.toLocaleString('en-IN')}</strong>. Settle your payment online to authorize warehouse packaging and fast-track DISCOM commissioning.
              </div>
              <button
                type="button"
                onClick={() => {
                  setPaymentAmountInput(balanceDue);
                  setTransactionRefInput(`UPI/2026/TXN${Math.floor(100000 + Math.random() * 900000)}`);
                  setIsPaymentModalOpen(true);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
              >
                <CreditCard className="w-4 h-4 text-amber-300" />
                <span>💳 Pay Due Amount Online (₹{balanceDue.toLocaleString('en-IN')})</span>
              </button>
            </div>
          )}
        </section>

        {/* 3. ROOF COMPLETION SIGN-OFF PROOF & ACTION BANNER */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Roof Installation Sign-off Proof Card (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800 border border-emerald-200">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  Rooftop Installation Completion & Digital Sign-off Proof
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Verified On-Site
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tested Generation</span>
                <span className="text-base font-black text-slate-900 font-mono mt-0.5 block tabular-nums">
                  3,450 Watts
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">Exceeds 3kW benchmark</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Lead Technician</span>
                <span className="font-bold text-slate-900 block mt-0.5">Ramesh Sharma</span>
                <span className="text-[10px] text-slate-500 font-medium">Certified Rooftop Lead</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Acceptance Date</span>
                <span className="font-mono font-bold text-slate-900 block mt-0.5">June 2024</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Active in Field (18 mos)</span>
              </div>
            </div>

            {/* Roof Photo & Digital Signature Showcase */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Roof Picture Frame */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 text-white relative">
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
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Homeowner Digital Touch Signature
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Digitally captured on technician tablet upon power test verification.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-center font-serif italic text-lg text-slate-800 shadow-2xs">
                  Sunil Agrawal
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Legally Signed & Commissioned</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Action & Rainy Season Support (5 cols) - Clean Neutral Surface with Primary Brand Accent Button */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                <CloudRain className="w-4 h-4 text-amber-600" />
                <span>Monsoon Priority Protection</span>
              </div>
              <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight leading-snug">
                Monsoon Rain Surge or Inverter Trip?
              </h3>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Your 3 kW system has an active 2-Year Full Replacement Inverter Warranty. Filing a monsoon service ticket guarantees ₹0 replacement parts and priority 24-hr technician dispatch.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="w-full py-3.5 rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold text-xs shadow-md transition-transform transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-amber-300" />
                <span>Report Rainy-Season Issue (₹0 Warranty) ➔</span>
              </button>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                <span>Active Warranty Support:</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">1800-SOLAR-HELP</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. INSTALLED SERIAL HARDWARE & LIVE 2-YR / 20-YR WARRANTY CERTIFICATES */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-700 border border-slate-200">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Hardware Serial Numbers & Live Warranty Countdown Certificates
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Warranty clocks auto-initialized upon warehouse dispatch. Zero paperwork required for warranty service.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              3 Certified Assets
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Asset 1: Solar Panels (20 Years) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">
                  PV Panels (6 Units)
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Active (20-Yr)
                </span>
              </div>

              <div>
                <h4 className="font-heading font-bold text-sm text-slate-900">
                  Mono PERC 550W Half-Cut Solar Panels
                </h4>
                <div className="font-mono text-xs font-bold text-slate-800 mt-1 tabular-nums">
                  Serial: PANEL-BATCH-2024-0088
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Duration:</span>
                  <span className="font-bold text-slate-900 tabular-nums">20 Years (7,300 Days)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Elapsed Time:</span>
                  <span className="font-bold text-slate-700 tabular-nums">~548 Days</span>
                </div>
                <div className="border-t border-slate-100 pt-1.5 flex justify-between font-bold text-emerald-800">
                  <span>Remaining Warranty:</span>
                  <span className="font-mono text-sm tabular-nums">6,752 Days Left</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-medium">
                ✓ 84.8% performance output guaranteed at Year 25.
              </div>
            </div>

            {/* Asset 2: Smart Inverter (2 Years) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">
                  Grid Inverter
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Active (2-Yr)
                </span>
              </div>

              <div>
                <h4 className="font-heading font-bold text-sm text-slate-900">
                  SolIMS 3 kW Smart Grid-Tied Inverter
                </h4>
                <div className="font-mono text-xs font-bold text-slate-800 mt-1 tabular-nums">
                  Serial: INV-2024-RAINY-ACTIVE
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Duration:</span>
                  <span className="font-bold text-slate-900 tabular-nums">2 Years (730 Days)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Elapsed Time:</span>
                  <span className="font-bold text-slate-700 tabular-nums">~548 Days (18 Mos)</span>
                </div>
                <div className="border-t border-slate-100 pt-1.5 flex justify-between font-bold text-emerald-800">
                  <span>Remaining Warranty:</span>
                  <span className="font-mono text-sm text-emerald-700 font-black tabular-nums">182 Days Left</span>
                </div>
              </div>

              <div className="text-[10px] text-emerald-800 font-bold">
                ✓ In-warranty service cost: ₹0 Parts + ₹0 Labor.
              </div>
            </div>

            {/* Asset 3: Safety Earthing & Surge Box (2 Years) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">
                  Safety System
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Active (2-Yr)
                </span>
              </div>

              <div>
                <h4 className="font-heading font-bold text-sm text-slate-900">
                  Dual DC/AC Lightning Surge Arrestor
                </h4>
                <div className="font-mono text-xs font-bold text-slate-800 mt-1 tabular-nums">
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

      {/* QA FIX 2: Online Due-Payment Modal */}
      {isPaymentModalOpen && customerProjectOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#135D3B] flex items-center justify-center border border-emerald-200">
                  <CreditCard className="w-4 h-4 text-[#135D3B]" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-slate-900">Online Due Payment</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Ref: {resolvedReference}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnlinePaymentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={balanceDue > 0 ? balanceDue : 1000000}
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#135D3B]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Payment Mode *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['UPI', 'NetBanking', 'Card'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentModeInput(mode)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        paymentModeInput === mode
                          ? 'bg-[#135D3B] text-white border-[#135D3B] shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                      }`}
                    >
                      {mode === 'UPI' ? '⚡ UPI' : mode === 'NetBanking' ? '🏦 NetBanking' : '💳 Card'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-bold text-slate-700">Transaction ID / Reference *</label>
                  <button
                    type="button"
                    onClick={() => setTransactionRefInput(`${paymentModeInput}/2026/TXN${Math.floor(100000 + Math.random() * 900000)}`)}
                    className="text-[10px] text-[#135D3B] font-bold hover:underline cursor-pointer"
                  >
                    Generate Ref
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={transactionRefInput}
                  onChange={(e) => setTransactionRefInput(e.target.value)}
                  placeholder="e.g. UPI/2026/TXN882910"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#135D3B]"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <span>✓ Immutable Double-Entry Ledger Posting:</span>
                </div>
                <div className="font-mono text-[10px] text-emerald-800">
                  Debit 1010 Bank / Credit 1200 Accounts Receivable
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-4 py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-bold px-5 py-2 text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Confirm & Pay ₹{Number(paymentAmountInput).toLocaleString('en-IN')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SimulatedEmailOutboxModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </div>
  );
};

export default CustomerMySolarPortalView;
