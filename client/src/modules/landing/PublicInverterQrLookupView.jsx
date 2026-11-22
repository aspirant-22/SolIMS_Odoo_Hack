/**
 * @AUTHOR: Garima Mittal
 * @FILE: PublicInverterQrLookupView.jsx
 * @RESPONSIBILITY: Public, mobile-friendly QR scan landing page (/u/:serialNumber) displaying live equipment warranty status, installation date, and 1-click Rainy-Season Service Ticket filing.
 * @DEPENDENCIES: react, react-router-dom, lucide-react, api.js, qrCodeSvg.js
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sun,
  ShieldCheck,
  AlertTriangle,
  CloudRain,
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  X,
  Phone,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { InlineSvgQrCode } from '../../utils/qrCodeSvg';

export const PublicInverterQrLookupView = () => {
  const { serialNumber } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assetData, setAssetData] = useState(null);

  // Service ticket filing state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [reportedFaultCode, setReportedFaultCode] = useState('ERR_INVERTER_GRID_FAIL');
  const [issueDescription, setIssueDescription] = useState('Heavy monsoon rain downpour caused inverter grid fault. Solar power generation offline.');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [ticketConfirmation, setTicketConfirmation] = useState(null);

  const fetchAsset = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await executeHttpRequest(`/api/service/public-lookup/${encodeURIComponent(serialNumber)}`);
      if (res.success && res.asset) {
        setAssetData(res.asset);
        setCustomerName(res.asset.customerFullName || '');
        setCustomerPhone(res.asset.customerPhoneNumber || '');
      } else {
        throw new Error(res.message || 'Equipment record not found');
      }
    } catch (err) {
      setError(err.message || 'Unable to lookup serial asset');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsset();
  }, [serialNumber]);

  const handleFileTicketSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingTicket(true);
      const res = await executeHttpRequest('/api/service/public-ticket', {
        method: 'POST',
        body: JSON.stringify({
          targetSerialNumber: assetData.serialNumber,
          reportedFaultCode,
          issueDescription,
          customerFullName: customerName || assetData.customerFullName,
          customerPhoneNumber: customerPhone || assetData.customerPhoneNumber
        })
      });

      if (res.success && res.ticket) {
        setTicketConfirmation(res.ticket);
        setIsTicketModalOpen(false);
      }
    } catch (err) {
      alert(err.message || 'Failed to file service ticket');
    } finally {
      setSubmittingTicket(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center space-y-4 max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-[#135D3B] flex items-center justify-center mx-auto text-amber-300 animate-spin">
            <Sun className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-black text-lg text-slate-100">
            Verifying Equipment QR Sticker...
          </h3>
          <p className="text-xs text-slate-400">
            Scanning SolIMS National Solar Registry for serial: <span className="font-mono text-emerald-400">{serialNumber}</span>
          </p>
        </div>
      </div>
    );
  }

  if (error || !assetData) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="bg-slate-800 p-8 rounded-3xl border border-rose-500/30 text-center space-y-4 max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="font-heading font-black text-lg text-slate-100">Serial Asset Not Found</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            No equipment registry entry found for serial number <span className="font-mono text-rose-300 font-bold">{serialNumber}</span>. Please verify the QR sticker or contact SolIMS support.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-full bg-slate-700 hover:bg-slate-600 font-bold text-xs cursor-pointer transition-all"
          >
            Go to SolIMS Homepage
          </button>
        </div>
      </div>
    );
  }

  const isUnderWarranty = assetData.isUnderActiveWarranty;
  const dispatchDateFormatted = assetData.dispatchConfirmedTimestamp
    ? new Date(assetData.dispatchConfirmedTimestamp).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Commissioned in Field';

  const expiryDateFormatted = assetData.warrantyExpiresTimestamp
    ? new Date(assetData.warrantyExpiresTimestamp).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Lifetime';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-md w-full mx-auto space-y-4 my-auto">
        {/* Brand Header */}
        <header className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#135D3B] to-[#0E462C] flex items-center justify-center text-white shadow-xs">
              <Sun className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="font-heading font-black text-sm tracking-tight text-white block">SolIMS</span>
              <span className="text-[10px] text-emerald-400 block font-mono font-bold leading-none">QR Asset Registry</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            NFC / QR Live
          </span>
        </header>

        {/* Live Ticket Confirmation Banner if just filed */}
        {ticketConfirmation && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-4 space-y-2 animate-slideUp">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Breakdown Service Ticket Created!</span>
            </div>
            <div className="font-mono text-base font-black text-emerald-300">
              Ticket Ref: {ticketConfirmation.ticketReference}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {ticketConfirmation.isUnderActiveWarranty ? (
                <span className="text-emerald-400 font-semibold">
                  🎉 Covered under Active Inverter Warranty: ₹0 Parts & Labor visit! A technician crew has been dispatched.
                </span>
              ) : (
                <span className="text-amber-300 font-semibold">
                  ⚠️ Out-of-warranty inspection registered. Billed at standard ₹9,700 (₹8,500 parts + ₹1,200 visit).
                </span>
              )}
            </p>
          </div>
        )}

        {/* Hero Card: Live Warranty Evaluation Banner */}
        <div
          className={`rounded-3xl p-6 border shadow-2xl space-y-4 relative overflow-hidden ${
            isUnderWarranty
              ? 'bg-gradient-to-br from-[#0F291E] via-[#135D3B] to-[#0E462C] border-emerald-400/40'
              : 'bg-gradient-to-br from-slate-900 via-rose-950/70 to-slate-900 border-rose-500/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-200">
                Equipment Serial Number
              </span>
              <h2 className="font-mono font-black text-xl text-white tracking-tight">
                {assetData.serialNumber}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              {isUnderWarranty ? (
                <ShieldCheck className="w-7 h-7 text-emerald-300" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-rose-400" />
              )}
            </div>
          </div>

          {/* Warranty Status Pill */}
          <div className="space-y-1.5 pt-2 border-t border-white/15">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Warranty Status:</span>
              <span
                className={`font-mono text-xs font-black uppercase px-3 py-1 rounded-full border ${
                  isUnderWarranty
                    ? 'bg-emerald-400 text-slate-950 border-white'
                    : 'bg-rose-500 text-white border-rose-300'
                }`}
              >
                {assetData.warrantyStatus}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{isUnderWarranty ? 'Remaining Clock:' : 'Time Expired:'}</span>
              <span className="font-mono font-bold text-white tabular-nums">
                {isUnderWarranty
                  ? `${assetData.remainingWarrantyDays} Days Remaining`
                  : `Expired ${assetData.expiredDays} Days Ago`}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Coverage Expiry:</span>
              <span className="font-mono font-semibold text-white">{expiryDateFormatted}</span>
            </div>
          </div>
        </div>

        {/* Equipment & Site Specifications */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 text-xs">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Equipment Registry Details
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Model Designation:</span>
              <span className="font-semibold text-white text-right">{assetData.modelDesignation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Asset Category:</span>
              <span className="font-bold text-emerald-400">{assetData.assetCategory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Installation Date:</span>
              <span className="font-semibold text-white">{dispatchDateFormatted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Order Reference:</span>
              <span className="font-mono font-bold text-emerald-300">{assetData.orderReference}</span>
            </div>
            <div className="flex justify-between items-start pt-1 border-t border-slate-800">
              <span className="text-slate-400">Site Location:</span>
              <span className="font-medium text-slate-200 text-right max-w-[200px] truncate" title={assetData.installationSiteAddress}>
                {assetData.installationSiteAddress}
              </span>
            </div>
          </div>
        </div>

        {/* Primary 1-Click CTA: File Rainy-Season Service Ticket */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => setIsTicketModalOpen(true)}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-[#135D3B] to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-heading font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <CloudRain className="w-5 h-5 text-amber-300 animate-bounce" />
            <span>File Rainy-Season Service Ticket</span>
          </button>
          <p className="text-[11px] text-slate-400 text-center font-medium">
            {isUnderWarranty
              ? '⚡ Active 2-Year Inverter Warranty: Absorbed at ₹0 customer billing!'
              : '⚠️ Warranty Expired: Out-of-warranty inspection billed at standard ₹9,700'}
          </p>
        </div>

        {/* View Commissioning Certificate CTA */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              if (assetData.orderReference) {
                navigate(`/certificate/${assetData.orderReference.replace(/\//g, '-')}`);
              }
            }}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Official Commissioning Certificate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] text-slate-600 py-3 border-t border-slate-900 mt-6">
        SolIMS Solar ERP • Punjab & North India Rooftop Solar Network • Garima Mittal
      </footer>

      {/* 1-Click Ticket Filing Modal / Sheet */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-slate-100 space-y-4 shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm text-white">File Breakdown Service Ticket</h3>
                  <p className="text-[10px] text-slate-400">Serial: {assetData.serialNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFileTicketSubmit} className="space-y-3.5 text-xs">
              {/* Coverage Banner */}
              <div
                className={`p-3 rounded-xl border text-xs font-semibold ${
                  isUnderWarranty
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                }`}
              >
                {isUnderWarranty ? (
                  <span>✓ Covered under Active Manufacturer Warranty: ₹0 Parts & Labor Visit</span>
                ) : (
                  <span>⚠️ Out-of-Warranty: Billed at standard ₹9,700 (₹8,500 parts + ₹1,200 visit)</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Reported Monsoon Fault Code:
                </label>
                <select
                  value={reportedFaultCode}
                  onChange={(e) => setReportedFaultCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="ERR_INVERTER_GRID_FAIL">ERR_INVERTER_GRID_FAIL - Inverter Grid Synchronization Trip</option>
                  <option value="ERR_EARTHING_LEAKAGE">ERR_EARTHING_LEAKAGE - Rain Moisture / Ground Isolation Leakage</option>
                  <option value="ERR_ZERO_POWER">ERR_ZERO_POWER - Red Light Glowing, 0 Watts Generation</option>
                  <option value="ERR_MOSFET_BURNOUT">ERR_MOSFET_BURNOUT - Lightning / Thunder Surge Damage</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Issue Description:
                </label>
                <textarea
                  rows={3}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Customer Name:</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-medium focus:outline-hidden focus:border-emerald-500"
                    placeholder="Homeowner Name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Phone Number:</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-medium focus:outline-hidden focus:border-emerald-500"
                    placeholder="+91 98..."
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="px-6 py-2 rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-bold text-xs shadow-md cursor-pointer transition-all disabled:opacity-50"
                >
                  {submittingTicket ? 'Filing Ticket...' : 'Confirm & Dispatch Crew'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicInverterQrLookupView;
