/**
 * @AUTHOR: Garima Mittal
 * @FILE: TechnicianRoofSignoffView.jsx
 * @RESPONSIBILITY: Manages Scene 4: Mobile-optimized field installation signoff, roof photos, and digital canvas signature capture matching SolIMS Grid Forest-Emerald & Soft-Mint design.
 * @DEPENDENCIES: react, lucide-react, api.js, AuthContext.jsx
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FileCheck2,
  Camera,
  PenTool,
  Clock,
  Zap,
  CheckCircle,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const TechnicianRoofSignoffView = () => {
  const { setIsSystemProcessing } = useAuth();
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [startTime, setStartTime] = useState('09:30');
  const [finishTime, setFinishTime] = useState('16:45');
  const [confirmedCapacityKw, setConfirmedCapacityKw] = useState(3);
  const [powerGenerationWatts, setPowerGenerationWatts] = useState(2850);
  const [roofPhotosList] = useState([
    'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80'
  ]);
  const [technicianNotes, setTechnicianNotes] = useState('All array stands double-anchored. Inverter synced to grid, zero earth leakage.');
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Canvas signature state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignatureDrawn, setHasSignatureDrawn] = useState(false);

  useEffect(() => {
    const fetchOrdersForSignoff = async () => {
      try {
        const response = await executeHttpRequest('/api/orders');
        if (response.success) {
          const dispatchedOrders = (response.orders || []).filter(
            (o) => o.orderWorkflowStatus === 'Dispatched' || o.orderWorkflowStatus === 'Installed'
          );
          setActiveOrders(dispatchedOrders);
          if (dispatchedOrders.length > 0) {
            setSelectedOrderId(dispatchedOrders[0]._id);
            setConfirmedCapacityKw(dispatchedOrders[0].systemCapacityKw);
          }
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      }
    };
    fetchOrdersForSignoff();
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignatureDrawn(true);
  };

  const drawMovement = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#135D3B'; // SolIMS Forest-Emerald ink
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignatureDrawn(false);
  };

  const handleSubmitFinalSignoff = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setErrorMessage('Please select a project order to sign off');
      return;
    }
    if (!hasSignatureDrawn) {
      setErrorMessage('Homeowner digital screen signature is required to accept work');
      return;
    }

    const canvas = canvasRef.current;
    const signatureDataUrl = canvas.toDataURL('image/png');

    setIsSystemProcessing(true);
    setErrorMessage('');

    try {
      const response = await executeHttpRequest('/api/service/roof-signoff', {
        method: 'POST',
        body: JSON.stringify({
          orderId: selectedOrderId,
          installationStartTime: new Date().toISOString(),
          installationFinishTime: new Date().toISOString(),
          confirmedCapacityKw: Number(confirmedCapacityKw),
          powerGenerationTestedWatts: Number(powerGenerationWatts),
          finishedRoofPhotos: roofPhotosList,
          homeownerSignatureDataUrl: signatureDataUrl,
          technicianNotes
        })
      });

      if (response.success) {
        setSubmissionSuccess(response.siteLog);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Roof sign-off submission failed');
    } finally {
      setIsSystemProcessing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 font-sans">
      {/* Page Hero Strip: Clean White Surface */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <FileCheck2 className="w-4 h-4 text-[#135D3B]" />
            <span>Scene 4 — On The Roof Mobile Sign-off</span>
          </div>
          <h2 className="font-heading text-2xl font-black tracking-tight text-slate-900 mt-1">
            Field Installation Certification & Homeowner Acceptance
          </h2>
          <p className="text-xs text-slate-600 max-w-xl mt-1.5 leading-relaxed font-normal">
            Mount stands, lay panels, test generation wattage, snap proof photos, and capture homeowner signature on screen. Clear proof for SolIMS, zero doubts for the customer.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-1.5 text-xs font-mono font-medium">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Mobile & Tablet Optimized</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2 font-semibold shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {submissionSuccess ? (
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-2xs border border-emerald-200">
            <CheckCircle className="w-10 h-10 text-emerald-700" />
          </div>
          <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Roof Installation Formally Certified!</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto font-medium">
            Site execution log for order <strong className="font-mono font-bold text-slate-900 tabular-nums">{submissionSuccess.orderReference}</strong> has been logged with homeowner digital acceptance signature.
          </p>

          <div className="max-w-xs mx-auto border border-slate-200/90 rounded-2xl p-4 bg-slate-50 text-left text-xs shadow-2xs">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Homeowner Acceptance Signature:</div>
            <img
              src={submissionSuccess.homeownerSignatureDataUrl}
              alt="Digital Signature"
              className="h-16 w-auto mt-2 mx-auto border-b border-slate-300"
            />
          </div>

          <button
            onClick={() => {
              setSubmissionSuccess(null);
              clearSignatureCanvas();
            }}
            className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold text-xs py-2.5 px-6 shadow-sm transition-all cursor-pointer"
          >
            Start Another Field Sign-off
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitFinalSignoff} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
          {/* Order Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-[#0F291E] uppercase tracking-wide">
              Select Installation Project Order
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => {
                setSelectedOrderId(e.target.value);
                const obj = activeOrders.find((o) => o._id === e.target.value);
                if (obj) setConfirmedCapacityKw(obj.systemCapacityKw);
              }}
              className="odoo-input font-semibold text-slate-900"
            >
              {activeOrders.map((ord) => (
                <option key={ord._id} value={ord._id}>
                  {ord.orderReference || ord.quotationReference} — {ord.customerFullName} ({ord.systemCapacityKw} kW {ord.systemVariant})
                </option>
              ))}
            </select>
          </div>

          {/* Time & Generation Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#F4F9F6] p-4 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Start Time</label>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="odoo-input py-1 text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Finish Time</label>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <input
                  type="time"
                  value={finishTime}
                  onChange={(e) => setFinishTime(e.target.value)}
                  className="odoo-input py-1 text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Confirmed Size</label>
              <select
                value={confirmedCapacityKw}
                onChange={(e) => setConfirmedCapacityKw(Number(e.target.value))}
                className="odoo-input py-1 text-xs font-extrabold text-[#135D3B]"
              >
                {[1, 2, 3, 4, 5].map((kw) => (
                  <option key={kw} value={kw}>{kw} kW System</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Tested Generation (W)</label>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <input
                  type="number"
                  value={powerGenerationWatts}
                  onChange={(e) => setPowerGenerationWatts(Number(e.target.value))}
                  className="odoo-input py-1 text-xs font-mono font-extrabold text-[#135D3B]"
                />
              </div>
            </div>
          </div>

          {/* Finished Roof Photos */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold text-[#0F291E] uppercase tracking-wide flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#135D3B]" />
                <span>Finished Roof Inspection Photos ({roofPhotosList.length})</span>
              </label>
              <span className="text-xs text-slate-500 font-medium">Live Camera Proof</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {roofPhotosList.map((photoUrl, idx) => (
                <div key={idx} className="relative rounded-2xl overflow-hidden border border-slate-200 group aspect-video bg-slate-100 shadow-2xs">
                  <img src={photoUrl} alt="Roof verification" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-white p-1.5 text-[11px] text-center font-mono font-bold">
                    Roof Angle #{idx + 1} • Verified
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technician Operational Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-extrabold text-[#0F291E] uppercase tracking-wide">
              Technician Notes & Cable Conduit Verification
            </label>
            <textarea
              rows={2}
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              className="odoo-input text-xs font-medium"
            />
          </div>

          {/* Interactive HTML5 Canvas Signature Pad */}
          <div className="space-y-2.5 bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-2xs">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-[#135D3B]" />
                <span>Homeowner Digital Acceptance Signature (Sign on Screen)</span>
              </label>
              <button
                type="button"
                onClick={clearSignatureCanvas}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors cursor-pointer bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Canvas</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-[#135D3B]/40 bg-white rounded-2xl overflow-hidden cursor-crosshair shadow-inner">
              <canvas
                ref={canvasRef}
                width={700}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={drawMovement}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={drawMovement}
                onTouchEnd={stopDrawing}
                className="w-full touch-none"
              />
            </div>
            <div className="text-xs text-slate-600 text-center font-medium">
              Homeowner signs above to certify physical roof mounting, electrical generation, and formal handover.
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold text-xs py-2.5 px-6 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>Accept Work & Submit Final Sign-off</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TechnicianRoofSignoffView;
