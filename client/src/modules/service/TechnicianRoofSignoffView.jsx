/**
 * @AUTHOR: Garima Mittal
 * @FILE: TechnicianRoofSignoffView.jsx (Service Module)
 * @RESPONSIBILITY: Manages Scene 4: Mobile-optimized field installation signoff, roof photos, and digital canvas signature capture matching SolIMS Grid Forest-Emerald & Soft-Mint design.
 * @DEPENDENCIES: react, lucide-react, api.js, AuthContext.jsx
 */

import React, { useState, useEffect, useRef } from 'react';
import { Wrench as KWrench, Sun as KSun, Zap as KZap, PenLine as KPenLine } from 'lucide-react';
import { KpiCard, KpiStrip } from '../../components/KpiCard';
import { AlertBanner } from '../../components/AlertBanner';
import {
  FileCheck2,
  Camera,
  PenTool,
  Clock,
  Zap,
  CheckCircle,
  RotateCcw,
  AlertCircle,
  UploadCloud,
  Trash2,
  Video,
  VideoOff,
  X
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_VERIFIED_ROOF_PHOTOS = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231E293B"/><rect x="40" y="60" width="520" height="280" rx="8" fill="%230F172A" stroke="%2338BDF8" stroke-width="2"/><g fill="%230284C7" stroke="%2338BDF8" stroke-width="1.5"><rect x="60" y="80" width="110" height="110" rx="4"/><rect x="190" y="80" width="110" height="110" rx="4"/><rect x="320" y="80" width="110" height="110" rx="4"/><rect x="450" y="80" width="90" height="110" rx="4"/><rect x="60" y="210" width="110" height="110" rx="4"/><rect x="190" y="210" width="110" height="110" rx="4"/><rect x="320" y="210" width="110" height="110" rx="4"/><rect x="450" y="210" width="90" height="110" rx="4"/></g><rect x="0" y="350" width="600" height="50" fill="%230F172A" opacity="0.9"/><text x="20" y="380" fill="%23FBBF24" font-family="monospace" font-size="14" font-weight="bold">SolIMS Verified Roof Angle %231 • East Azimuth Array • 100%25 Shading Free</text></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230F172A"/><rect x="40" y="60" width="520" height="280" rx="8" fill="%231E293B" stroke="%2322C55E" stroke-width="2"/><g fill="%23135D3B" stroke="%2386EFAC" stroke-width="1.5"><rect x="70" y="90" width="120" height="100" rx="4"/><rect x="210" y="90" width="120" height="100" rx="4"/><rect x="350" y="90" width="120" height="100" rx="4"/><rect x="70" y="210" width="120" height="100" rx="4"/><rect x="210" y="210" width="120" height="100" rx="4"/><rect x="350" y="210" width="120" height="100" rx="4"/></g><rect x="0" y="350" width="600" height="50" fill="%230F172A" opacity="0.9"/><text x="20" y="380" fill="%2334D399" font-family="monospace" font-size="14" font-weight="bold">SolIMS Verified Roof Angle %232 • DC String Inverter &amp; Double Anchor Grounding</text></svg>'
];

export const TechnicianRoofSignoffView = () => {
  const { setIsSystemProcessing } = useAuth();
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [startTime, setStartTime] = useState('09:30');
  const [finishTime, setFinishTime] = useState('16:45');
  const [confirmedCapacityKw, setConfirmedCapacityKw] = useState(3);
  const [powerGenerationWatts, setPowerGenerationWatts] = useState(2850);
  const [roofPhotosList, setRoofPhotosList] = useState(DEFAULT_VERIFIED_ROOF_PHOTOS);
  const [technicianNotes, setTechnicianNotes] = useState('All array stands double-anchored. Inverter synced to grid, zero earth leakage.');
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Live Camera state & refs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeCameraStream, setActiveCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Backward-compatible aliases
  const isCameraActive = isCameraOpen;
  const setIsCameraActive = setIsCameraOpen;
  const cameraStream = activeCameraStream;
  const setCameraStream = setActiveCameraStream;

  // Canvas signature state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignatureDrawn, setHasSignatureDrawn] = useState(false);

  // Fix videoRef Timing Race Condition
  useEffect(() => {
    if (isCameraOpen && videoRef.current && activeCameraStream) {
      videoRef.current.srcObject = activeCameraStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(() => {});
      };
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraOpen, activeCameraStream]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (activeCameraStream) {
        activeCameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeCameraStream]);

  // Camera start / stop / capture handlers
  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera device access is not supported by this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      setActiveCameraStream(stream);
      setIsCameraOpen(true);
    } catch (err) {
      console.warn('Camera access unavailable:', err);
      setCameraError('Camera access denied or unavailable on this device. Use the fallback file uploader below.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (activeCameraStream) {
      activeCameraStream.getTracks().forEach((track) => track.stop());
      setActiveCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const applyWatermarkAndSave = (sourceCanvas, label = 'Live Roof Proof') => {
    const ctx = sourceCanvas.getContext('2d');
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;

    // Burn semi-transparent bottom banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(0, height - 38, width, 38);

    // Green verification indicator
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.arc(18, height - 19, 5, 0, Math.PI * 2);
    ctx.fill();

    // Timestamp & Watermark string
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px monospace';
    const timestamp = new Date().toLocaleString();
    ctx.fillText(`SolIMS Verified • ${timestamp} • ${label}`, 32, height - 14);

    const base64Jpeg = sourceCanvas.toDataURL('image/jpeg', 0.7);
    setRoofPhotosList((prev) => [...prev, base64Jpeg]);
    setCameraError('');
  };

  const snapPhotoFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Black-Frame / Privacy-Shutter Detector
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let isPureBlack = true;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) {
          isPureBlack = false;
          break;
        }
      }

      if (isPureBlack) {
        setCameraError('Camera lens appears covered or shutter is closed — check your laptop camera switch or use Upload Image');
        return;
      }
    } catch (err) {
      console.warn('Could not inspect canvas pixels:', err);
    }

    applyWatermarkAndSave(canvas, 'Live Camera Capture');
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 640;
          canvas.height = img.height || 480;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          applyWatermarkAndSave(canvas, 'Technician Upload');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

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
      <div className="page-hero flex flex-wrap items-center justify-between gap-4">
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

      <KpiStrip>
        <KpiCard label="Jobs on roster" value={activeOrders.length} icon={KWrench} tone="sky" trend="dispatched" hint="to commission" />
        <KpiCard label="Confirmed capacity" value={confirmedCapacityKw + ' kW'} icon={KSun} tone="amber" trend="as installed" hint="system size" />
        <KpiCard label="Live generation" value={Number(powerGenerationWatts || 0).toLocaleString('en-IN') + ' W'} icon={KZap} tone="emerald" trend="wattage test" trendDir="up" hint="commissioning" />
        <KpiCard label="Signature" value={hasSignatureDrawn ? 'Captured' : 'Pending'} icon={KPenLine} tone={hasSignatureDrawn ? 'emerald' : 'amber'} trend={hasSignatureDrawn ? 'ready to submit' : 'needs client'} trendDir={hasSignatureDrawn ? 'up' : 'flat'} hint="digital sign-off" />
      </KpiStrip>

      <AlertBanner
        type="error"
        message={errorMessage}
        onDismiss={() => setErrorMessage('')}
      />

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
          <div className="space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <label className="text-xs font-extrabold text-[#0F291E] uppercase tracking-wide flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#135D3B]" />
                <span>Finished Roof Inspection Photos ({roofPhotosList.length})</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Upload from device storage"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                  <span>Upload Image</span>
                </button>

                {!isCameraOpen ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold text-xs px-4 py-1.5 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-300" />
                    <span>📸 Capture Live Roof Photo</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs px-3.5 py-1.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <VideoOff className="w-3.5 h-3.5" />
                    <span>Close Camera</span>
                  </button>
                )}
              </div>
            </div>

            {cameraError && (
              <AlertBanner
                type="warning"
                message={cameraError}
                onDismiss={() => setCameraError('')}
              />
            )}

            {/* Live Camera Viewfinder */}
            {isCameraOpen && (
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#135D3B] bg-slate-950 shadow-lg p-2 flex flex-col items-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => videoRef.current?.play().catch(() => {})}
                  className="w-full max-h-72 rounded-xl object-contain bg-black"
                />
                <div className="w-full flex items-center justify-between pt-3 px-2">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>LIVE_VIEWFINDER_ACTIVE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold px-4 py-1.5 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={snapPhotoFromCamera}
                      className="rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-5 py-1.5 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Snap Photo</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Photo Thumbnails */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {roofPhotosList.map((photoUrl, idx) => (
                <div key={idx} className="relative rounded-2xl overflow-hidden border border-slate-200 group aspect-video bg-slate-100 shadow-2xs">
                  <img src={photoUrl} alt={`Roof Angle #${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 text-white p-1.5 text-[11px] text-center font-mono font-bold flex items-center justify-between px-2.5">
                    <span>Angle #{idx + 1} • Verified</span>
                    {roofPhotosList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setRoofPhotosList((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-200 p-0.5 rounded cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
