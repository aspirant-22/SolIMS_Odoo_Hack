/**
 * @AUTHOR: Garima Mittal
 * @FILE: WarehouseDispatchView.jsx
 * @RESPONSIBILITY: Manages Scene 3: Warehouse serial number barcode scanner, BOM verification, and automated warranty clock initiation.
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
      {/* Top Banner */}
      <div className="bg-linear-to-r from-[#008784] to-[#714B67] rounded-xl p-5 text-white flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
            <Truck className="w-4 h-4" />
            <span>Scene 3 — Dispatch Day & Serial Numbers</span>
          </div>
          <h2 className="text-xl font-bold mt-1">Warehouse Dispatch & Automated Warranty Clocks</h2>
          <p className="text-xs text-white/80 max-w-2xl mt-1">
            Every inverter, battery, and panel batch is individually scanned prior to truck release. Upon delivery confirmation, the warranty clock starts automatically: 2 years for inverters & batteries, 20 years for solar panels.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 text-xs font-mono">
          <Clock className="w-4 h-4 text-amber-300" />
          <span>Zero manual date entry required</span>
        </div>
      </div>

      {feedbackMessage.text && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center gap-2 border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Dispatch Success Alert Modal */}
      {dispatchSuccessData && (
        <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            <span>Truck Dispatched & Warranty Clocks Active!</span>
          </div>
          <p className="text-xs text-emerald-800">
            Project Order <strong className="font-mono">{dispatchSuccessData.orderReference}</strong> has been marked as Dispatched under tracking reference <strong className="font-mono">{dispatchSuccessData.dispatchReference}</strong>.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-lg border border-emerald-200">
            <div>
              <span className="text-gray-500 block text-[11px]">Dispatched At:</span>
              <span className="font-semibold text-gray-900">
                {new Date(dispatchSuccessData.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">Inverter Warranty:</span>
              <span className="font-bold text-[#714B67]">2 Years (730 Days)</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">Battery Warranty:</span>
              <span className="font-bold text-[#714B67]">2 Years (730 Days)</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[11px]">Panels Warranty:</span>
              <span className="font-bold text-emerald-700">20 Years (7,300 Days)</span>
            </div>
          </div>
          <button
            onClick={() => setDispatchSuccessData(null)}
            className="odoo-btn-primary text-xs py-1.5 px-3"
          >
            Dismiss Confirmation
          </button>
        </div>
      )}

      {/* Main Scanner Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Orders Ready for Packing */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="p-3 bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-700 uppercase tracking-wide flex justify-between items-center">
            <span>Orders Ready to Pack ({ordersAwaitingDispatch.length})</span>
            <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
              Advance Paid
            </span>
          </div>

          <div className="divide-y divide-gray-100 max-h-[550px] overflow-y-auto">
            {ordersAwaitingDispatch.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
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
                    className={`p-3.5 cursor-pointer transition-colors text-left ${
                      isSelected ? 'bg-[#008784]/5 border-l-4 border-[#008784]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-xs font-bold text-[#008784]">
                        {order.orderReference || order.quotationReference}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {order.orderWorkflowStatus}
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-gray-900">{order.customerFullName}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {order.systemCapacityKw} kW {order.systemVariant} • Advance: ₹{order.advancePaymentAmountInr.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Barcode Scanner & BOM Matching Slip */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-6">
          {selectedOrder ? (
            <>
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-gray-200 gap-3">
                <div>
                  <span className="font-mono text-xs text-[#008784] font-bold">
                    {selectedOrder.orderReference || selectedOrder.quotationReference}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">
                    Dispatch Packing Slip: {selectedOrder.customerFullName}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedOrder.installationSiteAddress}</p>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-gray-400">System Configuration</div>
                  <div className="text-sm font-bold text-[#714B67]">
                    {selectedOrder.systemCapacityKw} kW {selectedOrder.systemVariant}
                  </div>
                </div>
              </div>

              {/* Barcode Input Terminal */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-[#714B67]" />
                    <span>Scan Unit Serial Number (Laser / Barcode Reader)</span>
                  </label>
                  <span className="text-[10px] text-gray-500 font-mono">Press Enter to Validate</span>
                </div>

                <form onSubmit={handleScanSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={scannedInput}
                    onChange={(e) => setScannedInput(e.target.value)}
                    placeholder="Scan or type serial e.g. INV-2026-0036..."
                    className="odoo-input font-mono text-sm uppercase font-semibold"
                    autoFocus
                  />
                  <button type="submit" className="odoo-btn-primary text-xs px-4">
                    Verify
                  </button>
                </form>

                {/* Quick Scan Demo Shortcuts for Judges */}
                <div className="pt-2 border-t border-gray-200/80">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Scan Samples (From Warehouse Stock):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableStock
                      .filter((s) => s.assetStatus === 'WAREHOUSE_STOCK')
                      .slice(0, 6)
                      .map((stockItem) => (
                        <button
                          key={stockItem.serialNumber}
                          type="button"
                          onClick={() => triggerQuickScanDemo(stockItem.serialNumber)}
                          className="px-2 py-1 text-[10px] font-mono font-medium bg-white hover:bg-[#714B67]/10 hover:text-[#714B67] border border-gray-300 rounded text-gray-700 transition-colors cursor-pointer"
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
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#714B67]" />
                    <span>Hardware Units Scanned for Truck ({scannedSerialsList.length})</span>
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    Warranty Clock will initialize upon confirmation
                  </span>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                      <tr>
                        <th className="p-2.5">Serial Number</th>
                        <th className="p-2.5">Component Category</th>
                        <th className="p-2.5">Warranty Duration</th>
                        <th className="p-2.5 text-right">Verification Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {scannedSerialsList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-gray-400">
                            No serial numbers scanned yet for this dispatch.
                          </td>
                        </tr>
                      ) : (
                        scannedSerialsList.map((serial) => {
                          const stockItem = availableStock.find((s) => s.serialNumber === serial);
                          const durationText =
                            stockItem?.assetCategory === 'SOLAR_PANELS' ? '20 Years (7,300 Days)' : '2 Years (730 Days)';
                          return (
                            <tr key={serial} className="hover:bg-gray-50">
                              <td className="p-2.5 font-mono font-bold text-[#714B67]">{serial}</td>
                              <td className="p-2.5 font-medium">{stockItem?.assetCategory || 'INVERTER'}</td>
                              <td className="p-2.5 font-semibold text-emerald-700">{durationText}</td>
                              <td className="p-2.5 text-right">
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
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
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Total project value: ₹{selectedOrder.grossTotalAmountInr.toLocaleString('en-IN')}
                </div>
                <button
                  onClick={handleConfirmFinalDispatch}
                  disabled={scannedSerialsList.length === 0}
                  className="odoo-btn-primary gap-2 text-xs py-2 px-5 disabled:opacity-50"
                >
                  <Truck className="w-4 h-4" />
                  <span>Confirm Dispatch & Start Warranty Clocks</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-gray-400 text-xs">
              Select an advance-paid order on the left to begin serial scanning
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
