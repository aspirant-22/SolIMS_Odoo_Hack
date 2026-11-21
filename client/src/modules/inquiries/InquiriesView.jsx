/**
 * @AUTHOR: Garima Mittal
 * @FILE: InquiriesView.jsx
 * @RESPONSIBILITY: Manages Scene 1 & 2: Rooftop inquiries, technician survey scheduling, approval gates, and auto-BOM quotes matching the SolIMS Forest-Emerald & Soft-Mint design.
 * @DEPENDENCIES: react, lucide-react, api.js, AuthContext.jsx
 */

import React, { useState, useEffect } from 'react';
import { Sun as KSun, Clock as KClock, MapPin as KMapPin, CheckCircle2 as KCheckCircle2 } from 'lucide-react';
import { KpiCard, KpiStrip } from '../../components/KpiCard';
import {
  Sun,
  Plus,
  Compass,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Zap
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getStatusBadgeStyle } from '../../erpClientConfig';
import { AlertBanner } from '../../components/AlertBanner';

export const InquiriesView = () => {
  const { setIsSystemProcessing } = useAuth();
  const [inquiriesList, setInquiriesList] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [generatedQuoteResult, setGeneratedQuoteResult] = useState(null);
  const [advanceAmountInput, setAdvanceAmountInput] = useState(50000);
  const [errorMessage, setErrorMessage] = useState('');

  // New inquiry form state
  const [newInquiryData, setNewInquiryData] = useState({
    customerFullName: '',
    customerPhoneNumber: '',
    customerEmailAddress: '',
    installationSiteAddress: '',
    approximateRoofAreaSqFt: 350,
    averageMonthlyElectricityBillInr: 4500,
    requestedCapacityKw: 3,
    requestedVariant: 'ON_GRID',
    isSubsidyEligible: true
  });

  // Survey measurements state
  const [surveyData, setSurveyData] = useState({
    azimuthDirection: 'South',
    tiltAngleDegrees: 22,
    cableDistanceMeters: 25,
    shadowFreeAreaSqFt: 320,
    roofStructureType: 'RCC Flat',
    gridConnectionVoltage: 'Single-Phase 230V',
    surveyRemarks: 'Optimal southern azimuth with unobstructed sun window.'
  });

  const loadAllInquiries = async () => {
    try {
      const response = await executeHttpRequest('/api/leads');
      if (response.success) {
        setInquiriesList(response.leads || []);
        if (response.leads?.length > 0 && !selectedInquiry) {
          setSelectedInquiry(response.leads[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    }
  };

  useEffect(() => {
    loadAllInquiries();
  }, []);

  const handleCreateInquirySubmit = async (e) => {
    e.preventDefault();
    setIsSystemProcessing(true);
    try {
      const response = await executeHttpRequest('/api/leads', {
        method: 'POST',
        body: JSON.stringify(newInquiryData)
      });
      if (response.success) {
        setIsCreateModalOpen(false);
        await loadAllInquiries();
        setSelectedInquiry(response.lead);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Creation failed');
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const handleRecordSurveySubmit = async (e) => {
    e.preventDefault();
    if (!selectedInquiry) return;
    setIsSystemProcessing(true);
    try {
      const response = await executeHttpRequest(`/api/leads/${selectedInquiry._id}/record-survey`, {
        method: 'POST',
        body: JSON.stringify(surveyData)
      });
      if (response.success) {
        setIsSurveyModalOpen(false);
        setSelectedInquiry(response.lead);
        await loadAllInquiries();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Survey submission failed');
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const handleApproveSurvey = async (isApproved) => {
    if (!selectedInquiry) return;
    setIsSystemProcessing(true);
    try {
      const response = await executeHttpRequest(`/api/leads/${selectedInquiry._id}/approve-survey`, {
        method: 'POST',
        body: JSON.stringify({ isApproved, rejectionReason: isApproved ? '' : 'Technical roof unsuitable' })
      });
      if (response.success) {
        setSelectedInquiry(response.lead);
        await loadAllInquiries();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Approval update failed');
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const handleGenerateQuoteClick = async () => {
    if (!selectedInquiry) return;
    setIsSystemProcessing(true);
    setErrorMessage('');
    try {
      const response = await executeHttpRequest('/api/orders/generate-quote', {
        method: 'POST',
        body: JSON.stringify({ leadInquiryId: selectedInquiry._id })
      });
      if (response.success) {
        setGeneratedQuoteResult(response.quote);
        setIsQuoteModalOpen(true);
        await loadAllInquiries();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Quote generation blocked');
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const handleConfirmAdvancePayment = async () => {
    if (!generatedQuoteResult) return;
    setIsSystemProcessing(true);
    try {
      const response = await executeHttpRequest(`/api/orders/${generatedQuoteResult._id}/advance-payment`, {
        method: 'POST',
        body: JSON.stringify({
          paymentAmountInr: Number(advanceAmountInput),
          paymentMode: 'UPI',
          transactionReference: `UPI-ADV-${Date.now().toString().slice(-6)}`
        })
      });
      if (response.success) {
        setIsQuoteModalOpen(false);
        alert(`Advance payment confirmed! Project Order ${response.order.orderReference} created. Warehouse packing unlocked.`);
        await loadAllInquiries();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Advance payment capture failed');
    } finally {
      setIsSystemProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Page Hero Strip: Clean White Surface */}
      <div className="page-hero flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Sun className="w-4 h-4 text-[#135D3B]" />
            <span>Scene 1 & 2 — The Rooftop Inquiry & Auto-BOM Kit</span>
          </div>
          <h2 className="font-heading text-2xl font-black tracking-tight text-slate-900 mt-1">
            Inquiry Intake, Survey Feasibility & Proposal Engine
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-1.5 leading-relaxed font-normal">
            Enforces strict governance guardrails: Quotation generation is strictly blocked until a qualified technician visits the site, records tilt/azimuth measurements, and operations validates technical feasibility.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage('');
            setIsCreateModalOpen(true);
          }}
          className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold text-xs px-5 py-2.5 shadow-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Rooftop Inquiry</span>
        </button>
      </div>

      <KpiStrip>
        <KpiCard label="Total inquiries" value={inquiriesList.length} icon={KSun} tone="slate" trend="live" hint="all rooftops" />
        <KpiCard label="Draft / scheduled" value={inquiriesList.filter((i) => ['Draft', 'Survey_Scheduled'].includes(i.inquiryWorkflowStatus)).length} icon={KClock} tone="amber" trend="awaiting survey" hint="pending action" />
        <KpiCard label="Survey done" value={inquiriesList.filter((i) => i.inquiryWorkflowStatus === 'Survey_Completed').length} icon={KMapPin} tone="sky" trend="ready to quote" trendDir="up" hint="BOM next" />
        <KpiCard label="Approved" value={inquiriesList.filter((i) => i.inquiryWorkflowStatus === 'Approved').length} icon={KCheckCircle2} tone="emerald" trend="converted" trendDir="up" hint="to orders" />
      </KpiStrip>

      <AlertBanner
        type="error"
        message={errorMessage}
        onDismiss={() => setErrorMessage('')}
      />

      {/* Main Grid: Inquiries List & Detail Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List Pane */}
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-heading font-bold text-xs text-slate-900 uppercase tracking-wide flex justify-between items-center">
            <span>Inquiry Records ({inquiriesList.length})</span>
            <span className="text-[11px] text-slate-600 font-mono font-medium bg-white px-2.5 py-0.5 rounded-full border border-slate-200">ir.sequence</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {inquiriesList.map((lead) => {
              const isSelected = selectedInquiry?._id === lead._id;
              const badgeStyle = getStatusBadgeStyle(lead.inquiryWorkflowStatus);
              return (
                <div
                  key={lead._id}
                  onClick={() => setSelectedInquiry(lead)}
                  className={`p-4 cursor-pointer transition-colors text-left ${
                    isSelected ? 'bg-slate-100/90 border-l-4 border-[#135D3B]' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                      {lead.inquiryReference}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-3 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                    >
                      {lead.inquiryWorkflowStatus}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-900">{lead.customerFullName}</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5 tabular-nums">
                    {lead.requestedCapacityKw} kW {lead.requestedVariant} • ₹{lead.averageMonthlyElectricityBillInr.toLocaleString('en-IN')}/mo
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
          {selectedInquiry ? (
            <>
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <span className="font-mono text-xs text-[#135D3B] font-extrabold">
                    {selectedInquiry.inquiryReference}
                  </span>
                  <h3 className="text-xl font-extrabold text-[#0F291E] tracking-tight mt-0.5">{selectedInquiry.customerFullName}</h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">{selectedInquiry.installationSiteAddress}</p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedInquiry.inquiryWorkflowStatus === 'Approved' && (
                    <button
                      onClick={handleGenerateQuoteClick}
                      className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold px-5 py-2 text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Auto-Generate BOM Quote</span>
                    </button>
                  )}

                  {selectedInquiry.inquiryWorkflowStatus === 'Survey_Completed' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveSurvey(true)}
                        className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold px-5 py-2 text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve Survey</span>
                      </button>
                      <button
                        onClick={() => handleApproveSurvey(false)}
                        className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-full border border-rose-200 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {(selectedInquiry.inquiryWorkflowStatus === 'Draft' ||
                    selectedInquiry.inquiryWorkflowStatus === 'Survey_Scheduled') && (
                    <button
                      onClick={() => setIsSurveyModalOpen(true)}
                      className="rounded-full border border-[#135D3B] text-[#135D3B] hover:bg-emerald-50 font-semibold px-5 py-2 text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Compass className="w-4 h-4" />
                      <span>Record Survey Measurements</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Inquiry Specifications Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#F4F9F6] p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Requested Capacity</div>
                  <div className="text-lg font-extrabold text-[#0F291E] mt-1">
                    {selectedInquiry.requestedCapacityKw} kW
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">System Variant</div>
                  <div className="text-lg font-extrabold text-[#0F291E] mt-1">
                    {selectedInquiry.requestedVariant}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Roof Area</div>
                  <div className="text-lg font-extrabold text-[#0F291E] mt-1">
                    {selectedInquiry.approximateRoofAreaSqFt} sq.ft
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Monthly Bill</div>
                  <div className="text-lg font-extrabold text-[#0F291E] mt-1">
                    ₹{selectedInquiry.averageMonthlyElectricityBillInr.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Survey Technical Measurements Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-[#0F291E] uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#135D3B]" />
                  <span>Technical Roof Feasibility Survey</span>
                </h4>

                {selectedInquiry.surveyDetails?.surveyCompletedAt ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 bg-[#E6F4EC]/60 p-4 rounded-2xl border border-[#135D3B]/20 text-xs">
                    <div>
                      <span className="text-slate-600 font-medium block">Azimuth Direction:</span>
                      <span className="font-extrabold text-[#0F291E] text-sm">
                        {selectedInquiry.surveyDetails.azimuthDirection}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium block">Tilt Angle:</span>
                      <span className="font-extrabold text-[#0F291E] text-sm">
                        {selectedInquiry.surveyDetails.tiltAngleDegrees}°
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium block">Cable Distance:</span>
                      <span className="font-extrabold text-[#0F291E] text-sm">
                        {selectedInquiry.surveyDetails.cableDistanceMeters} meters
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium block">Shadow-Free Area:</span>
                      <span className="font-extrabold text-[#0F291E] text-sm">
                        {selectedInquiry.surveyDetails.shadowFreeAreaSqFt} sq.ft
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium block">Roof Structure:</span>
                      <span className="font-extrabold text-[#0F291E] text-sm">
                        {selectedInquiry.surveyDetails.roofStructureType}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium block">Grid Voltage:</span>
                      <span className="font-extrabold text-[#0F291E] text-sm">
                        {selectedInquiry.surveyDetails.gridConnectionVoltage}
                      </span>
                    </div>
                    <div className="col-span-2 md:col-span-3 text-slate-700 italic border-t border-[#135D3B]/20 pt-2.5 mt-1 font-medium">
                      "{selectedInquiry.surveyDetails.surveyRemarks || 'Site measurements verified.'}"
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-950">Survey Pending Technician Site Visit</div>
                      <p className="mt-0.5 text-amber-800 font-medium">
                        A certified technician must visit the rooftop, measure solar azimuth, tilt degrees, and cable drop before this lead can be approved for commercial quoting.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-500 text-xs font-medium">
              Select an inquiry on the left to inspect details
            </div>
          )}
        </div>
      </div>

      {/* New Inquiry Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#0F291E]">New Homeowner Rooftop Inquiry</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInquirySubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    required
                    value={newInquiryData.customerFullName}
                    onChange={(e) => setNewInquiryData({ ...newInquiryData, customerFullName: e.target.value })}
                    className="odoo-input"
                    placeholder="e.g. Ramesh Chandra"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={newInquiryData.customerPhoneNumber}
                    onChange={(e) => setNewInquiryData({ ...newInquiryData, customerPhoneNumber: e.target.value })}
                    className="odoo-input"
                    placeholder="+91 98110 00000"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newInquiryData.customerEmailAddress}
                  onChange={(e) => setNewInquiryData({ ...newInquiryData, customerEmailAddress: e.target.value })}
                  className="odoo-input"
                  placeholder="ramesh@example.com"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Site Address</label>
                <textarea
                  required
                  rows={2}
                  value={newInquiryData.installationSiteAddress}
                  onChange={(e) => setNewInquiryData({ ...newInquiryData, installationSiteAddress: e.target.value })}
                  className="odoo-input"
                  placeholder="House No, Street, City, State"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">System Size (kW)</label>
                  <select
                    value={newInquiryData.requestedCapacityKw}
                    onChange={(e) => setNewInquiryData({ ...newInquiryData, requestedCapacityKw: Number(e.target.value) })}
                    className="odoo-input font-semibold"
                  >
                    {[1, 2, 3, 4, 5].map((kw) => (
                      <option key={kw} value={kw}>{kw} kW</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grid Variant</label>
                  <select
                    value={newInquiryData.requestedVariant}
                    onChange={(e) => setNewInquiryData({ ...newInquiryData, requestedVariant: e.target.value })}
                    className="odoo-input font-semibold"
                  >
                    <option value="ON_GRID">On-Grid (Connected)</option>
                    <option value="OFF_GRID">Off-Grid (Battery Bank)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approx Roof Area (sq.ft)</label>
                  <input
                    type="number"
                    value={newInquiryData.approximateRoofAreaSqFt}
                    onChange={(e) => setNewInquiryData({ ...newInquiryData, approximateRoofAreaSqFt: Number(e.target.value) })}
                    className="odoo-input font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Bill (₹)</label>
                  <input
                    type="number"
                    value={newInquiryData.averageMonthlyElectricityBillInr}
                    onChange={(e) => setNewInquiryData({ ...newInquiryData, averageMonthlyElectricityBillInr: Number(e.target.value) })}
                    className="odoo-input font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-4 py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold px-5 py-2 text-xs shadow-sm cursor-pointer"
                >
                  Save Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Survey Measurements Modal */}
      {isSurveyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#0F291E]">Record Field Survey Measurements</h3>
              <button
                onClick={() => setIsSurveyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordSurveySubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Azimuth Direction</label>
                  <select
                    value={surveyData.azimuthDirection}
                    onChange={(e) => setSurveyData({ ...surveyData, azimuthDirection: e.target.value })}
                    className="odoo-input font-semibold"
                  >
                    <option value="South">South (Best Yield)</option>
                    <option value="South-West">South-West</option>
                    <option value="South-East">South-East</option>
                    <option value="West">West</option>
                    <option value="East">East</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tilt Angle (Degrees)</label>
                  <input
                    type="number"
                    value={surveyData.tiltAngleDegrees}
                    onChange={(e) => setSurveyData({ ...surveyData, tiltAngleDegrees: Number(e.target.value) })}
                    className="odoo-input font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cable Distance (Meters)</label>
                  <input
                    type="number"
                    value={surveyData.cableDistanceMeters}
                    onChange={(e) => setSurveyData({ ...surveyData, cableDistanceMeters: Number(e.target.value) })}
                    className="odoo-input font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shadow-Free Area (sq.ft)</label>
                  <input
                    type="number"
                    value={surveyData.shadowFreeAreaSqFt}
                    onChange={(e) => setSurveyData({ ...surveyData, shadowFreeAreaSqFt: Number(e.target.value) })}
                    className="odoo-input font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Roof Structure Type</label>
                  <select
                    value={surveyData.roofStructureType}
                    onChange={(e) => setSurveyData({ ...surveyData, roofStructureType: e.target.value })}
                    className="odoo-input font-semibold"
                  >
                    <option value="RCC Flat">RCC Flat Roof</option>
                    <option value="Tin Shade">Tin Shade</option>
                    <option value="Sloped Tile">Sloped Tile</option>
                    <option value="Industrial Metal Sheet">Industrial Metal Sheet</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grid Voltage</label>
                  <select
                    value={surveyData.gridConnectionVoltage}
                    onChange={(e) => setSurveyData({ ...surveyData, gridConnectionVoltage: e.target.value })}
                    className="odoo-input font-semibold"
                  >
                    <option value="Single-Phase 230V">Single-Phase 230V</option>
                    <option value="Three-Phase 415V">Three-Phase 415V</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSurveyModalOpen(false)}
                  className="rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-4 py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold px-5 py-2 text-xs shadow-sm cursor-pointer"
                >
                  Submit Survey Measurements
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto-BOM Quote Proposal Modal */}
      {isQuoteModalOpen && generatedQuoteResult && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <span className="font-mono text-xs font-bold text-[#135D3B]">
                  {generatedQuoteResult.quotationReference}
                </span>
                <h3 className="font-extrabold text-lg text-[#0F291E]">
                  Commercial Proposal & Auto-Populated BOM
                </h3>
              </div>
              <button
                onClick={() => setIsQuoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* BOM Table */}
            <div>
              <div className="text-xs font-extrabold text-[#0F291E] uppercase tracking-wider mb-2">
                System Bill of Materials ({generatedQuoteResult.systemCapacityKw} kW {generatedQuoteResult.systemVariant})
              </div>
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F9F6] border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5">Component / Hardware</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {generatedQuoteResult.billOfMaterials.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-2.5 font-bold text-[#0F291E]">{item.componentName}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-mono text-slate-700 font-semibold border border-slate-200">
                            {item.itemCategory}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-medium text-slate-800">{item.quantityRequired} {item.unitOfMeasure}</td>
                        <td className="p-2.5 text-right font-mono text-slate-800">₹{item.unitPriceInr.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-[#0F291E]">₹{item.totalPriceInr.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-[#F4F9F6] p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-700 font-medium">
                <span>Gross Equipment & EPC Total:</span>
                <span className="font-mono font-bold text-[#0F291E]">₹{generatedQuoteResult.grossTotalAmountInr.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#135D3B] font-semibold">
                <span>National Rooftop Solar Subsidy (Est.):</span>
                <span className="font-mono font-bold">- ₹{generatedQuoteResult.estimatedSubsidyAmountInr.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-[#0F291E] pt-2 border-t border-slate-200">
                <span>Net Payable by Homeowner:</span>
                <span className="font-mono text-[#135D3B] text-base">₹{generatedQuoteResult.netPayableAmountInr.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Advance Payment Collector (Scene 2 Unlock) */}
            <div className="p-4 bg-[#E6F4EC]/60 border border-[#135D3B]/20 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#135D3B]">
                <CreditCard className="w-4 h-4 text-[#135D3B]" />
                <span>Scene 2 Unlock: Collect Advance Payment (Min 20% required)</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Once customer pays advance, warehouse sees what to pack and installation crew sees the job on their schedule automatically without phone calls.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={advanceAmountInput}
                  onChange={(e) => setAdvanceAmountInput(e.target.value)}
                  className="odoo-input max-w-[160px] text-xs font-mono font-bold"
                  placeholder="Advance Amount"
                />
                <button
                  onClick={handleConfirmAdvancePayment}
                  className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold text-xs py-2 px-5 shadow-sm transition-all cursor-pointer"
                >
                  Confirm Advance & Dispatch to Warehouse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InquiriesView;
