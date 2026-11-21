/**
 * @AUTHOR: Garima Mittal
 * @FILE: InquiriesView.jsx
 * @RESPONSIBILITY: Manages Scene 1 & 2: Rooftop inquiries, technician survey scheduling, approval gates, and auto-BOM quotes.
 * @DEPENDENCIES: react, lucide-react, api.js, AuthContext.jsx
 */

import React, { useState, useEffect } from 'react';
import {
  Sun,
  Plus,
  Compass,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Zap
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const InquiriesView = () => {
  const { currentUser, setIsSystemProcessing } = useAuth();
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Problem Statement Scene Anchor */}
      <div className="bg-linear-to-r from-[#714B67] to-[#008784] rounded-xl p-5 text-white flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
            <Sun className="w-4 h-4" />
            <span>Scene 1 & 2 — The Rooftop Inquiry & Auto-BOM Kit</span>
          </div>
          <h2 className="text-xl font-bold mt-1">Inquiry Intake, Survey Feasibility & Proposal Engine</h2>
          <p className="text-xs text-white/80 max-w-2xl mt-1">
            Enforces Odoo governance guardrails: Quotation generation is strictly blocked until a qualified technician visits the site, records tilt/azimuth measurements, and operations validates technical feasibility.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage('');
            setIsCreateModalOpen(true);
          }}
          className="bg-white hover:bg-gray-100 text-[#714B67] font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Rooftop Inquiry</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Inquiries List & Detail Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List Pane */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="p-3 bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-700 uppercase tracking-wide flex justify-between items-center">
            <span>Inquiry Records ({inquiriesList.length})</span>
            <span className="text-[10px] text-gray-400 font-mono">ir.sequence</span>
          </div>

          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {inquiriesList.map((lead) => {
              const isSelected = selectedInquiry?._id === lead._id;
              return (
                <div
                  key={lead._id}
                  onClick={() => setSelectedInquiry(lead)}
                  className={`p-3.5 cursor-pointer transition-colors text-left ${
                    isSelected ? 'bg-[#714B67]/5 border-l-4 border-[#714B67]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs font-bold text-[#714B67]">
                      {lead.inquiryReference}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        lead.inquiryWorkflowStatus === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : lead.inquiryWorkflowStatus === 'Quoted'
                          ? 'bg-purple-100 text-purple-800'
                          : lead.inquiryWorkflowStatus === 'Survey_Completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {lead.inquiryWorkflowStatus}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-gray-900">{lead.customerFullName}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {lead.requestedCapacityKw} kW {lead.requestedVariant} • ₹{lead.averageMonthlyElectricityBillInr.toLocaleString('en-IN')}/mo
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-6">
          {selectedInquiry ? (
            <>
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-gray-200 gap-3">
                <div>
                  <span className="font-mono text-xs text-[#714B67] font-bold">
                    {selectedInquiry.inquiryReference}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">{selectedInquiry.customerFullName}</h3>
                  <p className="text-xs text-gray-500">{selectedInquiry.installationSiteAddress}</p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedInquiry.inquiryWorkflowStatus === 'Approved' && (
                    <button
                      onClick={handleGenerateQuoteClick}
                      className="odoo-btn-primary gap-1.5 text-xs"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Auto-Generate BOM Quote</span>
                    </button>
                  )}

                  {selectedInquiry.inquiryWorkflowStatus === 'Survey_Completed' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleApproveSurvey(true)}
                        className="odoo-btn-secondary gap-1 text-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve Survey</span>
                      </button>
                      <button
                        onClick={() => handleApproveSurvey(false)}
                        className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold rounded-md border border-rose-200"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {(selectedInquiry.inquiryWorkflowStatus === 'Draft' ||
                    selectedInquiry.inquiryWorkflowStatus === 'Survey_Scheduled') && (
                    <button
                      onClick={() => setIsSurveyModalOpen(true)}
                      className="odoo-btn-secondary gap-1.5 text-xs"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Record Survey Measurements</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Inquiry Specifications Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/70 p-4 rounded-lg border border-gray-200/80">
                <div>
                  <div className="text-[11px] text-gray-500">Requested Capacity</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">
                    {selectedInquiry.requestedCapacityKw} kW
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">System Variant</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">
                    {selectedInquiry.requestedVariant}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">Roof Area</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">
                    {selectedInquiry.approximateRoofAreaSqFt} sq.ft
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">Avg Monthly Bill</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">
                    ₹{selectedInquiry.averageMonthlyElectricityBillInr.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Survey Technical Measurements Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#714B67]" />
                  <span>Technical Roof Feasibility Survey</span>
                </h4>

                {selectedInquiry.surveyDetails?.surveyCompletedAt ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-emerald-50/50 p-4 rounded-lg border border-emerald-200 text-xs">
                    <div>
                      <span className="text-gray-500 block">Azimuth Direction:</span>
                      <span className="font-bold text-emerald-900">
                        {selectedInquiry.surveyDetails.azimuthDirection}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Tilt Angle:</span>
                      <span className="font-bold text-emerald-900">
                        {selectedInquiry.surveyDetails.tiltAngleDegrees}°
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Cable Distance:</span>
                      <span className="font-bold text-emerald-900">
                        {selectedInquiry.surveyDetails.cableDistanceMeters} meters
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Shadow-Free Area:</span>
                      <span className="font-bold text-emerald-900">
                        {selectedInquiry.surveyDetails.shadowFreeAreaSqFt} sq.ft
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Roof Structure:</span>
                      <span className="font-bold text-emerald-900">
                        {selectedInquiry.surveyDetails.roofStructureType}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Grid Voltage:</span>
                      <span className="font-bold text-emerald-900">
                        {selectedInquiry.surveyDetails.gridConnectionVoltage}
                      </span>
                    </div>
                    <div className="col-span-2 md:col-span-3 text-gray-600 italic border-t border-emerald-200/60 pt-2 mt-1">
                      "{selectedInquiry.surveyDetails.surveyRemarks || 'Site measurements verified.'}"
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">Survey Pending Technician Site Visit</div>
                      <p className="mt-0.5 text-amber-700">
                        A certified technician must visit the rooftop, measure solar azimuth, tilt degrees, and cable drop before this lead can be approved for commercial quoting.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-gray-400 text-xs">
              Select an inquiry on the left to inspect details
            </div>
          )}
        </div>
      </div>

      {/* New Inquiry Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">New Homeowner Rooftop Inquiry</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInquirySubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Customer Full Name</label>
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
                  <label className="block font-medium text-gray-700 mb-1">Phone Number</label>
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
                <label className="block font-medium text-gray-700 mb-1">Email Address</label>
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
                <label className="block font-medium text-gray-700 mb-1">Site Address</label>
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
                  <label className="block font-medium text-gray-700 mb-1">System Size (kW)</label>
                  <select
                    value={newInquiryData.requestedCapacityKw}
                    onChange={(e) => setNewInquiryData({ ...newInquiryData, requestedCapacityKw: Number(e.target.value) })}
                    className="odoo-input"
                  >
                    {[1, 2, 3, 4, 5].map((kw) => (
                      <option key={kw} value={kw}>{kw} kW</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Grid Variant</label>
                  <select
                    value={newInquiryData.requestedVariant}
                    onChange={(e) => setNewInquiryData({ ...newInquiryData, requestedVariant: e.target.value })}
                    className="odoo-input"
                  >
                    <option value="ON_GRID">On-Grid (Connected)</option>
                    <option value="OFF_GRID">Off-Grid (Battery Bank)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Approx Roof Area (sq.ft)</label>
                  <input
                    type="number"
                    value={newInquiryData.approximateRoofAreaSqFt}
                    onChange={(e) => setNewInquiryData({ ...newInquiryData, approximateRoofAreaSqFt: Number(e.target.value) })}
                    className="odoo-input"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Monthly Bill (₹)</label>
                  <input
                    type="number"
                    value={newInquiryData.averageMonthlyElectricityBillInr}
                    onChange={(e) => setNewInquiryData({ ...newInquiryData, averageMonthlyElectricityBillInr: Number(e.target.value) })}
                    className="odoo-input"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="odoo-btn-outline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="odoo-btn-primary text-xs"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">Record Field Survey Measurements</h3>
              <button
                onClick={() => setIsSurveyModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordSurveySubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Azimuth Direction</label>
                  <select
                    value={surveyData.azimuthDirection}
                    onChange={(e) => setSurveyData({ ...surveyData, azimuthDirection: e.target.value })}
                    className="odoo-input"
                  >
                    <option value="South">South (Best Yield)</option>
                    <option value="South-West">South-West</option>
                    <option value="South-East">South-East</option>
                    <option value="West">West</option>
                    <option value="East">East</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Tilt Angle (Degrees)</label>
                  <input
                    type="number"
                    value={surveyData.tiltAngleDegrees}
                    onChange={(e) => setSurveyData({ ...surveyData, tiltAngleDegrees: Number(e.target.value) })}
                    className="odoo-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Cable Distance (Meters)</label>
                  <input
                    type="number"
                    value={surveyData.cableDistanceMeters}
                    onChange={(e) => setSurveyData({ ...surveyData, cableDistanceMeters: Number(e.target.value) })}
                    className="odoo-input"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Shadow-Free Area (sq.ft)</label>
                  <input
                    type="number"
                    value={surveyData.shadowFreeAreaSqFt}
                    onChange={(e) => setSurveyData({ ...surveyData, shadowFreeAreaSqFt: Number(e.target.value) })}
                    className="odoo-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Roof Structure Type</label>
                  <select
                    value={surveyData.roofStructureType}
                    onChange={(e) => setSurveyData({ ...surveyData, roofStructureType: e.target.value })}
                    className="odoo-input"
                  >
                    <option value="RCC Flat">RCC Flat Roof</option>
                    <option value="Tin Shade">Tin Shade</option>
                    <option value="Sloped Tile">Sloped Tile</option>
                    <option value="Industrial Metal Sheet">Industrial Metal Sheet</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Grid Voltage</label>
                  <select
                    value={surveyData.gridConnectionVoltage}
                    onChange={(e) => setSurveyData({ ...surveyData, gridConnectionVoltage: e.target.value })}
                    className="odoo-input"
                  >
                    <option value="Single-Phase 230V">Single-Phase 230V</option>
                    <option value="Three-Phase 415V">Three-Phase 415V</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSurveyModalOpen(false)}
                  className="odoo-btn-outline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="odoo-btn-secondary text-xs"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <div>
                <span className="font-mono text-xs font-bold text-[#714B67]">
                  {generatedQuoteResult.quotationReference}
                </span>
                <h3 className="font-bold text-base text-gray-900">
                  Commercial Proposal & Auto-Populated BOM
                </h3>
              </div>
              <button
                onClick={() => setIsQuoteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* BOM Table */}
            <div>
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                System Bill of Materials ({generatedQuoteResult.systemCapacityKw} kW {generatedQuoteResult.systemVariant})
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                    <tr>
                      <th className="p-2.5">Component / Hardware</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {generatedQuoteResult.billOfMaterials.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2.5 font-medium text-gray-900">{item.componentName}</td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 font-mono text-gray-600">
                            {item.itemCategory}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">{item.quantityRequired} {item.unitOfMeasure}</td>
                        <td className="p-2.5 text-right font-mono">₹{item.unitPriceInr.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono font-semibold">₹{item.totalPriceInr.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Gross Equipment & EPC Total:</span>
                <span className="font-mono font-semibold">₹{generatedQuoteResult.grossTotalAmountInr.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>National Rooftop Solar Subsidy (Est.):</span>
                <span className="font-mono font-bold">- ₹{generatedQuoteResult.estimatedSubsidyAmountInr.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Net Payable by Homeowner:</span>
                <span className="font-mono text-[#714B67]">₹{generatedQuoteResult.netPayableAmountInr.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Advance Payment Collector (Scene 2 Unlock) */}
            <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                <CreditCard className="w-4 h-4 text-[#714B67]" />
                <span>Scene 2 Unlock: Collect Advance Payment (Min 20% required)</span>
              </div>
              <p className="text-[11px] text-purple-700">
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
                  className="odoo-btn-primary text-xs py-2"
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
