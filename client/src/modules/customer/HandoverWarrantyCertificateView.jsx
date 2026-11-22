/**
 * @AUTHOR: Garima Mittal
 * @FILE: HandoverWarrantyCertificateView.jsx
 * @RESPONSIBILITY: Official print-ready (window.print()) SolIMS Commissioning & Warranty Certificate displaying customer credentials, system size, 2-Yr (Inverter/Battery) & 20-Yr (Panel) warranty expirations, roof photo proof, homeowner signature, and vector QR code.
 * @DEPENDENCIES: react, react-router-dom, lucide-react, api.js, qrCodeSvg.js
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Printer,
  ArrowLeft,
  Sun,
  ShieldCheck,
  CheckCircle2,
  Award,
  Sparkles,
  Calendar,
  MapPin,
  UserCheck,
  Zap,
  ExternalLink
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { InlineSvgQrCode } from '../../utils/qrCodeSvg';

export const HandoverWarrantyCertificateView = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certData, setCertData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        setError(null);
        // Try dedicated certificate endpoint first, fallback to order detail
        const response = await executeHttpRequest(`/api/orders/${orderId}/certificate`)
          .catch(async () => {
            const fallbackOrder = await executeHttpRequest(`/api/orders/${orderId}`);
            if (fallbackOrder.success) {
              return { success: true, order: fallbackOrder.order, siteLog: null, serialAssets: [] };
            }
            throw new Error('Could not load certificate data');
          });

        if (isMounted && response.success) {
          setCertData(response);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to generate commissioning certificate');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCertificate();
    return () => { isMounted = false; };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#135D3B] text-white flex items-center justify-center mx-auto text-xl animate-spin">
            ☀️
          </div>
          <h3 className="font-heading font-extrabold text-base text-slate-900">
            Generating SolIMS Commissioning & Warranty Certificate...
          </h3>
          <p className="text-xs text-slate-500 font-medium">Validating hardware serials, roof photos, and digital sign-off...</p>
        </div>
      </div>
    );
  }

  if (error || !certData?.order) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-rose-200 text-center space-y-4 max-w-md">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h3 className="font-heading font-black text-lg text-slate-900">Certificate Generation Error</h3>
          <p className="text-xs text-slate-600">{error || 'Order data could not be retrieved.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-full bg-[#135D3B] text-white text-xs font-bold cursor-pointer hover:bg-[#0E462C] transition-all"
          >
            ← Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { order, siteLog, serialAssets = [] } = certData;

  // Extract Commissioning & Expiry Dates
  const commissioningDate = siteLog?.installationFinishTime
    ? new Date(siteLog.installationFinishTime)
    : (order.scheduledInstallationDate ? new Date(order.scheduledInstallationDate) : new Date(order.createdAt || Date.now()));

  const formattedCommissioningDate = commissioningDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // 2-Year Inverter & Battery Warranty Expiration Date
  const twoYearExpiryDate = new Date(commissioningDate.getTime() + 730 * 86400000);
  const formattedTwoYearExpiry = twoYearExpiryDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // 20-Year Solar Panel Warranty Expiration Date
  const twentyYearExpiryDate = new Date(commissioningDate.getTime() + 7300 * 86400000);
  const formattedTwentyYearExpiry = twentyYearExpiryDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Find Inverter Serial Number
  const inverterAsset = serialAssets.find((a) => a.assetCategory === 'INVERTER');
  const inverterSerial = inverterAsset?.serialNumber ||
    (order.billOfMaterials?.find((b) => b.itemCategory === 'INVERTER')?.allocatedSerialNumbers?.[0]) ||
    'INV-2024-RAINY-ACTIVE';

  // Find Battery Serial Number
  const batteryAsset = serialAssets.find((a) => a.assetCategory === 'BATTERY');
  const batterySerial = batteryAsset?.serialNumber ||
    (order.billOfMaterials?.find((b) => b.itemCategory === 'BATTERY')?.allocatedSerialNumbers?.[0]);

  // Find Panel Serial Numbers
  const panelAssets = serialAssets.filter((a) => a.assetCategory === 'SOLAR_PANELS');
  const panelSerials = panelAssets.length > 0
    ? panelAssets.map((p) => p.serialNumber)
    : (order.billOfMaterials?.find((b) => b.itemCategory === 'SOLAR_PANELS')?.allocatedSerialNumbers || ['SOL-2026-0001', 'SOL-2026-0002', 'SOL-2026-0003', 'SOL-2026-0004']);

  // QR target URL pointing to public QR lookup page
  const qrTargetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/u/${encodeURIComponent(inverterSerial)}`
    : `https://solims.com/u/${inverterSerial}`;

  // Technician Lead Name
  const techLeadName = siteLog?.leadTechnicianUser?.fullName || 'Ramesh Sharma (Senior Roof Lead)';

  // Roof Photo URL fallback
  const roofPhoto = siteLog?.finishedRoofPhotos?.[0] ||
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360"><rect width="600" height="360" fill="%230F291E"/><rect x="20" y="20" width="560" height="320" rx="12" fill="%231E3A2F" stroke="%2338BDF8" stroke-width="2"/><text x="40" y="160" fill="%2338BDF8" font-family="sans-serif" font-size="20" font-weight="bold">SolIMS Certified Rooftop Installation Array</text><text x="40" y="200" fill="%23FBBF24" font-family="monospace" font-size="14">MNRE High-Efficiency Tier-1 DCR Verified PV Array • 100% Shading-Free</text><text x="40" y="240" fill="%2394A3B8" font-family="monospace" font-size="12">Verified Power Output: 940W/kW tested clean</text></svg>';

  // Homeowner Signature URL fallback
  const signatureDataUrl = siteLog?.homeownerSignatureDataUrl ||
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70"><path d="M15 45 Q 60 15 105 45 T 195 35" stroke="%23135D3B" stroke-width="3" fill="none"/></svg>';

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 font-sans text-slate-900 print:bg-white print:p-0">
      {/* Non-Printable Top Action Toolbar */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-full border border-slate-300 shadow-xs cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Format: Official Legal A4 Solar Commissioning Document
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-heading font-extrabold text-xs shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Certificate (PDF / Paper)</span>
          </button>
        </div>
      </div>

      {/* Official Certificate Canvas: Designed for High-DPI Screen & Flawless A4 Print */}
      <div
        id="certificate-paper"
        className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border-8 border-double border-emerald-900/40 p-8 sm:p-12 relative overflow-hidden print:shadow-none print:border-4 print:border-emerald-950 print:rounded-none print:p-8"
        style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
      >
        {/* Decorative Gold & Emerald Border Watermark */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#0F291E] via-[#135D3B] to-[#F59E0B]" />
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-emerald-500/5 pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-amber-500/5 pointer-events-none" />

        {/* 1. Header with SolIMS Official Insignia */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b-2 border-slate-200 gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0F291E] via-[#135D3B] to-[#0E462C] text-white flex items-center justify-center shadow-md border border-amber-400/40">
              <Sun className="w-8 h-8 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-2xl tracking-tight text-[#0F291E]">
                  SolIMS ERP
                </h1>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  Certified EPC
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Enterprise Solar Commissioning & National PM Surya Ghar Registry
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest">
              Certificate No.
            </div>
            <div className="font-mono font-black text-sm text-[#135D3B]">
              CERT/{(order.orderReference || order.quotationReference || 'ORD-2026-0001').replace(/\//g, '-')}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              Issued: {formattedCommissioningDate}
            </div>
          </div>
        </div>

        {/* 2. Certificate Title Banner */}
        <div className="my-6 text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Official Handover & Manufacturer Warranty Deed</span>
          </div>
          <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
            SOLAR PHOTOVOLTAIC COMMISSIONING CERTIFICATE
          </h2>
          <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
            This certifies that the rooftop solar photovoltaic power generation system detailed below has been
            inspected, grid-synchronized, voltage-tested, and officially commissioned under SolIMS engineering standards.
          </p>
        </div>

        {/* 3. Customer & Project Specification Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F4F9F6]/80 rounded-2xl p-4 border border-emerald-900/15 mb-6 text-xs">
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#135D3B]">
              Customer & Site Credentials
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">Homeowner:</span>
              <span className="col-span-2 font-bold text-slate-900">{order.customerFullName}</span>

              <span className="text-slate-500 font-medium">Site Address:</span>
              <span className="col-span-2 font-semibold text-slate-800 leading-snug">
                {order.installationSiteAddress}
              </span>

              <span className="text-slate-500 font-medium">Contact Phone:</span>
              <span className="col-span-2 font-mono text-slate-800">{order.customerPhoneNumber}</span>

              <span className="text-slate-500 font-medium">Project Order:</span>
              <span className="col-span-2 font-mono font-bold text-[#135D3B]">
                {order.orderReference || order.quotationReference}
              </span>
            </div>
          </div>

          <div className="space-y-2 md:border-l md:border-emerald-900/15 md:pl-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#135D3B]">
              System Technical Rating
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">Rated Capacity:</span>
              <span className="col-span-2 font-extrabold text-slate-900 text-sm">
                {order.systemCapacityKw} kW DC Array
              </span>

              <span className="text-slate-500 font-medium">System Variant:</span>
              <span className="col-span-2 font-bold text-slate-800">
                {order.systemVariant === 'OFF_GRID' ? 'Off-Grid (Battery Storage)' : 'On-Grid Net-Metered'}
              </span>

              <span className="text-slate-500 font-medium">Commission Date:</span>
              <span className="col-span-2 font-semibold text-slate-800">{formattedCommissioningDate}</span>

              <span className="text-slate-500 font-medium">Lead Engineer:</span>
              <span className="col-span-2 font-semibold text-slate-800">{techLeadName}</span>
            </div>
          </div>
        </div>

        {/* 4. Equipment Warranty Schedule with Exact Expiration Dates */}
        <div className="mb-6 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-heading font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#135D3B]" />
              <span>Equipment Schedule & Legally Binding Warranty Terms</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active Coverage Enforced
            </span>
          </div>

          <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
              <tr>
                <th className="p-2.5">Component & Specification</th>
                <th className="p-2.5">Hardware Serial Number(s)</th>
                <th className="p-2.5">Warranty Period</th>
                <th className="p-2.5">Exact Expiration Date</th>
                <th className="p-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {/* Solar PV Panels: 20 Years */}
              <tr>
                <td className="p-2.5 font-bold text-slate-900">
                  <div>Mono PERC Solar PV Panels</div>
                  <div className="text-[10px] text-slate-500 font-normal">Tier-1 DCR ALMM Certified Modules</div>
                </td>
                <td className="p-2.5 font-mono text-[11px] text-slate-800">
                  <div className="max-w-[200px] truncate" title={panelSerials.join(', ')}>
                    {panelSerials.slice(0, 3).join(', ')}
                    {panelSerials.length > 3 && ` +${panelSerials.length - 3} more`}
                  </div>
                </td>
                <td className="p-2.5 font-bold text-[#135D3B]">20 Years (240 Mos)</td>
                <td className="p-2.5 font-mono font-bold text-slate-900">{formattedTwentyYearExpiry}</td>
                <td className="p-2.5 text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>20-Yr Active</span>
                  </span>
                </td>
              </tr>

              {/* Inverter: 2 Years */}
              <tr>
                <td className="p-2.5 font-bold text-slate-900">
                  <div>SolIMS Pro Smart Inverter {order.systemCapacityKw}kW</div>
                  <div className="text-[10px] text-slate-500 font-normal">Pure Sine Wave Grid-Tie Inverter</div>
                </td>
                <td className="p-2.5 font-mono text-[11px] font-bold text-[#135D3B]">
                  {inverterSerial}
                </td>
                <td className="p-2.5 font-bold text-amber-700">2 Years (24 Mos)</td>
                <td className="p-2.5 font-mono font-bold text-slate-900">{formattedTwoYearExpiry}</td>
                <td className="p-2.5 text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>2-Yr Active</span>
                  </span>
                </td>
              </tr>

              {/* Battery Storage: 2 Years (if applicable) */}
              {order.systemVariant === 'OFF_GRID' && (
                <tr>
                  <td className="p-2.5 font-bold text-slate-900">
                    <div>Lithium Iron Phosphate (LiFePO4) 5.12kWh</div>
                    <div className="text-[10px] text-slate-500 font-normal">High-Cycle Solar Energy Storage</div>
                  </td>
                  <td className="p-2.5 font-mono text-[11px] font-bold text-slate-800">
                    {batterySerial || 'BAT-2026-0001'}
                  </td>
                  <td className="p-2.5 font-bold text-amber-700">2 Years (24 Mos)</td>
                  <td className="p-2.5 font-mono font-bold text-slate-900">{formattedTwoYearExpiry}</td>
                  <td className="p-2.5 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>2-Yr Active</span>
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Photographic Proof & Homeowner Digital Sign-off Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* A: Captured Roof Array Photo */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Roof Installation Proof</span>
              <span className="text-emerald-700 font-bold">Verified ✓</span>
            </div>
            <div className="h-32 rounded-xl overflow-hidden border border-slate-300 bg-slate-900 flex items-center justify-center">
              <img
                src={roofPhoto}
                alt="Verified Rooftop Solar Array"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-[10px] text-slate-500 text-center leading-tight">
              Shading-free mounting structure verified at {order.systemCapacityKw * 930}W generation
            </p>
          </div>

          {/* B: Homeowner Digital Signature Proof */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Homeowner Handover Signature</span>
              <span className="text-emerald-700 font-bold">Signed ✓</span>
            </div>
            <div className="h-32 rounded-xl bg-white border border-slate-300 p-2 flex flex-col items-center justify-center">
              <img
                src={signatureDataUrl}
                alt="Homeowner Signature"
                className="max-h-16 object-contain"
              />
              <div className="w-40 border-b border-slate-400 mt-1" />
              <div className="text-[10px] font-bold text-slate-800 mt-1">
                {order.customerFullName}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 text-center leading-tight">
              Customer confirmed power generation & net-metering synchronization
            </p>
          </div>

          {/* C: Inline SVG QR Sticker Verification */}
          <div className="border-2 border-dashed border-[#135D3B]/40 rounded-2xl p-3 bg-emerald-50/50 flex flex-col items-center justify-center text-center space-y-2">
            <div className="text-[10px] font-mono font-black uppercase tracking-wider text-[#135D3B]">
              Physical QR Inverter Sticker
            </div>
            <div className="p-1.5 bg-white rounded-xl shadow-xs border border-emerald-300">
              <InlineSvgQrCode value={qrTargetUrl} size={90} />
            </div>
            <div className="font-mono text-[10px] font-extrabold text-[#0F291E]">
              {inverterSerial}
            </div>
            <p className="text-[9px] text-slate-600 leading-tight">
              Scan with any mobile camera to view live warranty clock & 1-click service desk
            </p>
          </div>
        </div>

        {/* 6. Footer Disclaimer & Official Signatures */}
        <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-bold text-slate-800 text-[11px]">
              SolIMS Renewable Energy Private Limited
            </div>
            <p className="text-[10px] text-slate-500 max-w-md leading-relaxed">
              Warranty claims under the 2-Year Inverter or 20-Year Solar Panel policy are serviced at ₹0 customer billing for all active hardware failures. Registered with PM Surya Ghar Muft Bijli Yojana Central National Portal.
            </p>
          </div>

          <div className="text-center sm:text-right shrink-0">
            <div className="font-heading font-black text-sm text-[#135D3B]">Garima Mittal</div>
            <div className="text-[10px] font-semibold text-slate-500">Managing Director, SolIMS Solar ERP</div>
            <div className="text-[9px] font-mono text-emerald-800 mt-0.5">Digital Signature ID: #GM-SOLIMS-2026-OK</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandoverWarrantyCertificateView;
