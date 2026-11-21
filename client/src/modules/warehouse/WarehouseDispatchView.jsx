/**
 * @AUTHOR: Garima Mittal
 * @FILE: WarehouseDispatchView.jsx
 * @RESPONSIBILITY: Manages Scene 3: Warehouse serial number barcode scanner, BOM verification, and automated warranty clock initiation matching SolIMS Grid Forest-Emerald & Soft-Mint design.
 * @DEPENDENCIES: react, lucide-react, api.js, AuthContext.jsx
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Barcode,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  PackageCheck
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const WarehouseDispatchView = () => {
  const { setIsSystemProcessing } = useAuth();
  const [ordersAwaitingDispatch, setOrdersAwaitingDispatch] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [scannedInput, setScannedInput] = useState('');
  const [scannedSerialsList, setScannedSerialsList] = useState([]);
  const [availableStock, setAvailableStock] = useState([]);
  const [dispatchSuccessData, setDispatchSuccessData] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  const loadDispatchData = async () => {
    try {
      const [ordersRes, inventoryRes] = await Promise.all([
        executeHttpRequest('/api/orders'),
        executeHttpRequest('/api/inventory')
      ]);

      if (ordersRes.success) {
        const actionableOrders = (ordersRes.orders || []).filter(
          (o) => o.orderWorkflowStatus === 'Advance_Paid' || o.orderWorkflowStatus === 'Packed'
        );
        setOrdersAwaitingDispatch(actionableOrders);
        if (actionableOrders.length > 0 && !selectedOrder) {
          setSelectedOrder(actionableOrders[0]);
        }
      }

      if (inventoryRes.success) {
        setAvailableStock(inventoryRes.inventory || []);
      }
    } catch (err) {
      console.error('Failed to load dispatch data:', err);
    }
  };

  useEffect(() => {
    loadDispatchData();
  }, []);

  const handleScanSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!scannedInput.trim() || !selectedOrder) return;

    const targetSerial = scannedInput.trim().toUpperCase();
    if (scannedSerialsList.includes(targetSerial)) {
      setFeedbackMessage({ type: 'error', text: `Serial ${targetSerial} has already been scanned for this packing slip.` });
      return;
    }

    const stockItem = availableStock.find((s) => s.serialNumber === targetSerial);
    if (!stockItem) {
      setFeedbackMessage({ type: 'error', text: `Hardware barcode [${targetSerial}] not recognized in warehouse stock inventory.` });
      return;
    }

    setIsSystemProcessing(true);
    setFeedbackMessage({ type: '', text: '' });

    try {
      const response = await executeHttpRequest('/api/inventory/scan-serial', {
        method: 'POST',
        body: JSON.stringify({
          orderId: selectedOrder._id,
          scannedSerialNumber: targetSerial,
          expectedComponentCategory: stockItem.assetCategory
        })
      });

      if (response.success) {
        setScannedSerialsList((prev) => [...prev, targetSerial]);
        setScannedInput('');
        setFeedbackMessage({
          type: 'success',
          text: `Verified & Allocated: ${stockItem.assetCategory} (${targetSerial}) matched to BOM.`
        });
        setSelectedOrder(response.updatedOrder);
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Serial scanning failed' });
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const handleConfirmFinalDispatch = async () => {
    if (!selectedOrder || scannedSerialsList.length === 0) return;
    setIsSystemProcessing(true);
    try {
      const response = await executeHttpRequest('/api/inventory/confirm-dispatch', {
        method: 'POST',
        body: JSON.stringify({
          orderId: selectedOrder._id,
          scannedSerialNumbersList: scannedSerialsList,
          dispatchNotes: 'Verified and packed for customer rooftop installation site.'
        })
      });

      if (response.success) {
        setDispatchSuccessData({
          orderReference: response.order.orderReference,
          dispatchReference: response.dispatchReference,
          serials: scannedSerialsList,
          timestamp: new Date()
        });
        setScannedSerialsList([]);
        await loadDispatchData();
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Dispatch confirmation failed' });
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const triggerQuickScanDemo = (serial) => {
    setScannedInput(serial);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Hero Strip: Soft-Mint Gradient Banner */}
      <div className="bg-gradient-to-r from-[#EBF5EE] via-[#F4F9F6] to-white border border-emerald-900/10 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#135D3B]">
            <Truck className="w-4 h-4 text-[#135D3B]" />
            <span>Scene 3 — Dispatch Day & Serial Numbers</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#0F291E] mt-1">
            Warehouse Dispatch & Automated Warranty Clocks
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-1.5 leading-relaxed font-medium">
            Every inverter, battery, and panel batch is individually scanned prior to truck release. Upon delivery confirmation, the warranty clock starts automatically: 2 years for inverters & batteries, 20 years for solar panels.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-[#E6F4EC] text-[#135D3B] border border-[#135D3B]/20 px-3.5 py-1.5 text-xs font-mono font-semibold">
          <Clock className="w-4 h-4 text-[#135D3B]" />
          <span>Zero manual date entry required</span>
        </div>
      </div>

      {feedbackMessage.text && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border shadow-2xs ${
            feedbackMessage.type === 'success'
              ? 'bg-[#E6F4EC] text-[#135D3B] border-[#135D3B]/20'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#135D3B]" />
          ) : (
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Dispatch Success Alert Modal */}
      {dispatchSuccessData && (
        <div className="bg-[#E6F4EC]/80 border border-[#135D3B]/30 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-[#0F291E] font-extrabold text-sm">
            <PackageCheck className="w-5 h-5 text-[#135D3B]" />
            <span>Truck Dispatched & Warranty Clocks Active!</span>
          </div>
          <p className="text-xs text-slate-700 font-medium">
            Project Order <strong className="font-mono font-bold">{dispatchSuccessData.orderReference}</strong> has been marked as Dispatched under tracking reference <strong className="font-mono font-bold">{dispatchSuccessData.dispatchReference}</strong>.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs bg-white p-4 rounded-xl border border-[#135D3B]/20">
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Dispatched At:</span>
              <span className="font-bold text-slate-900">
                {new Date(dispatchSuccessData.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Inverter Warranty:</span>
              <span className="font-extrabold text-[#135D3B]">2 Years (730 Days)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Battery Warranty:</span>
              <span className="font-extrabold text-[#135D3B]">2 Years (730 Days)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Panels Warranty:</span>
              <span className="font-extrabold text-[#135D3B]">20 Years (7,300 Days)</span>
            </div>
          </div>
          <button
            onClick={() => setDispatchSuccessData(null)}
            className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold text-xs py-2 px-5 shadow-sm transition-all cursor-pointer"
          >
            Dismiss Confirmation
          </button>
        </div>
      )}

      {/* Main Scanner Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Orders Ready for Packing */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="p-4 bg-[#F4F9F6]/80 border-b border-emerald-900/10 font-extrabold text-xs text-[#0F291E] uppercase tracking-wide flex justify-between items-center">
            <span>Orders Ready to Pack ({ordersAwaitingDispatch.length})</span>
            <span className="text-[10px] text-[#135D3B] font-semibold bg-[#E6F4EC] border border-[#135D3B]/20 px-2.5 py-0.5 rounded-full">
              Advance Paid
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
            {ordersAwaitingDispatch.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-medium">
                No orders currently waiting for dispatch. (Advance payment required)
              </div>
            ) : (
              ordersAwaitingDispatch.map((order) => {
                const isSelected = selectedOrder?._id === order._id;
                return (
                  <div
                    key={order._id}
                    onClick={() => {
                      setSelectedOrder(order);
                      setScannedSerialsList([]);
                      setFeedbackMessage({ type: '', text: '' });
                    }}
                    className={`p-4 cursor-pointer transition-colors text-left ${
                      isSelected ? 'bg-[#E6F4EC]/60 border-l-4 border-[#135D3B]' : 'hover:bg-[#F4F9F6]/80'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-xs font-bold text-[#135D3B]">
                        {order.orderReference || order.quotationReference}
                      </span>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E6F4EC] text-[#135D3B] border border-[#135D3B]/20">
                        {order.orderWorkflowStatus}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-[#0F291E]">{order.customerFullName}</div>
                    <div className="text-xs text-slate-600 font-medium mt-0.5">
                      {order.systemCapacityKw} kW {order.systemVariant} • Advance: ₹{order.advancePaymentAmountInr.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Barcode Scanner & BOM Matching Slip */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          {selectedOrder ? (
            <>
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <span className="font-mono text-xs text-[#135D3B] font-extrabold">
                    {selectedOrder.orderReference || selectedOrder.quotationReference}
                  </span>
                  <h3 className="text-xl font-extrabold text-[#0F291E] tracking-tight mt-0.5">
                    Dispatch Packing Slip: {selectedOrder.customerFullName}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">{selectedOrder.installationSiteAddress}</p>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">System Configuration</div>
                  <div className="text-base font-extrabold text-[#135D3B]">
                    {selectedOrder.systemCapacityKw} kW {selectedOrder.systemVariant}
                  </div>
                </div>
              </div>

              {/* Barcode Input Terminal */}
              <div className="bg-[#F4F9F6] p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-[#0F291E] uppercase tracking-wide flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-[#135D3B]" />
                    <span>Scan Unit Serial Number (Laser / Barcode Reader)</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono font-medium">Press Enter to Validate</span>
                </div>

                <form onSubmit={handleScanSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={scannedInput}
                    onChange={(e) => setScannedInput(e.target.value)}
                    placeholder="Scan or type serial e.g. INV-2026-0036..."
                    className="odoo-input font-mono text-sm uppercase font-bold"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold text-xs px-6 py-2 shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    Verify
                  </button>
                </form>

                {/* Quick Scan Demo Shortcuts for Judges */}
                <div className="pt-2.5 border-t border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Scan Samples (From Warehouse Stock):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableStock
                      .filter((s) => s.assetStatus === 'WAREHOUSE_STOCK')
                      .slice(0, 6)
                      .map((stockItem) => (
                        <button
                          key={stockItem.serialNumber}
                          type="button"
                          onClick={() => triggerQuickScanDemo(stockItem.serialNumber)}
                          className="px-3 py-1 text-xs font-mono font-bold bg-white hover:bg-[#E6F4EC] hover:text-[#135D3B] border border-slate-300 rounded-full text-slate-800 transition-colors cursor-pointer shadow-2xs"
                        >
                          {stockItem.serialNumber} ({stockItem.assetCategory})
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Scanned Serials List & Required BOM Check */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-[#0F291E] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#135D3B]" />
                    <span>Hardware Units Scanned for Truck ({scannedSerialsList.length})</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    Warranty Clock will initialize upon confirmation
                  </span>
                </div>

                <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F4F9F6] border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wide">
                      <tr>
                        <th className="p-3">Serial Number</th>
                        <th className="p-3">Component Category</th>
                        <th className="p-3">Warranty Duration</th>
                        <th className="p-3 text-right">Verification Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scannedSerialsList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400 font-medium">
                            No serial numbers scanned yet for this dispatch.
                          </td>
                        </tr>
                      ) : (
                        scannedSerialsList.map((serial) => {
                          const stockItem = availableStock.find((s) => s.serialNumber === serial);
                          const durationText =
                            stockItem?.assetCategory === 'SOLAR_PANELS' ? '20 Years (7,300 Days)' : '2 Years (730 Days)';
                          return (
                            <tr key={serial} className="hover:bg-slate-50/80">
                              <td className="p-3 font-mono font-extrabold text-[#135D3B]">{serial}</td>
                              <td className="p-3 font-bold text-[#0F291E]">{stockItem?.assetCategory || 'INVERTER'}</td>
                              <td className="p-3 font-extrabold text-[#135D3B]">{durationText}</td>
                              <td className="p-3 text-right">
                                <span className="inline-flex items-center gap-1 text-[#135D3B] font-semibold bg-[#E6F4EC] px-2.5 py-0.5 rounded-full border border-[#135D3B]/20">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Allocated</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <div className="text-xs text-slate-600 font-medium">
                  Total project value: <strong className="text-[#0F291E] font-extrabold font-mono">₹{selectedOrder.grossTotalAmountInr.toLocaleString('en-IN')}</strong>
                </div>
                <button
                  onClick={handleConfirmFinalDispatch}
                  disabled={scannedSerialsList.length === 0}
                  className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold text-xs py-2.5 px-6 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Truck className="w-4 h-4" />
                  <span>Confirm Dispatch & Start Warranty Clocks</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-slate-400 text-xs font-medium">
              Select an advance-paid order on the left to begin serial scanning
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarehouseDispatchView;
