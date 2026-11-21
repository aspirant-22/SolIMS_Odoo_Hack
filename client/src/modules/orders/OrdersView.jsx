/**
 * @AUTHOR: Garima Mittal
 * @FILE: OrdersView.jsx
 * @RESPONSIBILITY: Manages confirmed project orders, BOM inspections, advance payment records, and technician scheduling matching SolIMS Grid Forest-Emerald & Soft-Mint design.
 * @DEPENDENCIES: react, lucide-react, api.js, AuthContext.jsx, DataTable.jsx, erpClientConfig.js
 */

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  UserCheck,
  Layers
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DataTable, StatusPill } from '../../components/DataTable';
import { formatCurrencyInr } from '../../erpClientConfig';

export const OrdersView = () => {
  const { currentUser, setIsSystemProcessing } = useAuth();
  const [ordersList, setOrdersList] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [advanceAmountInput, setAdvanceAmountInput] = useState(50000);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isAssignCrewModalOpen, setIsAssignCrewModalOpen] = useState(false);
  const [scheduledDateInput, setScheduledDateInput] = useState('2026-11-28');
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  const loadAllOrders = async () => {
    try {
      const response = await executeHttpRequest('/api/orders');
      if (response.success) {
        setOrdersList(response.orders || []);
        if (response.orders?.length > 0 && !selectedOrder) {
          setSelectedOrder(response.orders[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  useEffect(() => {
    loadAllOrders();
  }, []);

  const handleCaptureAdvanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsSystemProcessing(true);
    setFeedbackMessage({ type: '', text: '' });
    try {
      const response = await executeHttpRequest(`/api/orders/${selectedOrder._id}/advance-payment`, {
        method: 'POST',
        body: JSON.stringify({ advanceAmountInr: Number(advanceAmountInput) })
      });
      if (response.success) {
        setIsAdvanceModalOpen(false);
        setSelectedOrder(response.order);
        setFeedbackMessage({
          type: 'success',
          text: `Advance payment captured. Generated order reference ${response.order.orderReference || response.order.quotationReference}.`
        });
        await loadAllOrders();
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Payment capture failed' });
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const handleAssignCrewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsSystemProcessing(true);
    setFeedbackMessage({ type: '', text: '' });
    try {
      const response = await executeHttpRequest(`/api/orders/${selectedOrder._id}/assign-crew`, {
        method: 'POST',
        body: JSON.stringify({
          technicianUserIds: [currentUser?._id],
          scheduledInstallationDate: scheduledDateInput
        })
      });
      if (response.success) {
        setIsAssignCrewModalOpen(false);
        setSelectedOrder(response.order);
        setFeedbackMessage({
          type: 'success',
          text: `Crew assigned for installation on ${scheduledDateInput}.`
        });
        await loadAllOrders();
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Crew assignment failed' });
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const columns = [
    {
      key: 'orderReference',
      header: 'Reference',
      render: (row) => (
        <span className="font-mono font-extrabold text-[#135D3B]">
          {row.orderReference || row.quotationReference}
        </span>
      )
    },
    {
      key: 'customerFullName',
      header: 'Customer',
      render: (row) => (
        <div>
          <div className="font-bold text-[#0F291E]">{row.customerFullName}</div>
          <div className="text-[11px] text-slate-500 font-medium">{row.customerPhoneNumber}</div>
        </div>
      )
    },
    {
      key: 'systemCapacityKw',
      header: 'Capacity & Grid',
      render: (row) => (
        <span className="font-semibold text-slate-800">
          {row.systemCapacityKw} kW {row.systemVariant}
        </span>
      )
    },
    {
      key: 'netPayableAmountInr',
      header: 'Net Total',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-extrabold text-[#0F291E]">
          {formatCurrencyInr(row.netPayableAmountInr)}
        </span>
      )
    },
    {
      key: 'balancePaymentDueInr',
      header: 'Balance Due',
      align: 'right',
      render: (row) => (
        <span
          className={`font-mono font-bold ${
            row.balancePaymentDueInr > 0 ? 'text-amber-700' : 'text-[#135D3B]'
          }`}
        >
          {formatCurrencyInr(row.balancePaymentDueInr)}
        </span>
      )
    },
    {
      key: 'orderWorkflowStatus',
      header: 'Status',
      render: (row) => <StatusPill status={row.orderWorkflowStatus} />
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Hero Strip: Soft-Mint Gradient Banner */}
      <div className="bg-gradient-to-r from-[#EBF5EE] via-[#F4F9F6] to-white border border-emerald-900/10 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#E6F4EC] text-[#135D3B] border border-[#135D3B]/20">
              Module: Orders & BOM
            </span>
            <span className="text-xs text-slate-500 font-mono">ir.sequence seq_order</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1 text-[#0F291E]">
            Confirmed Solar Orders & BOM Breakdown
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Auto-generated proposals, advance payment locks, warehouse dispatch authorizations, and crew dispatch.
          </p>
        </div>
      </div>

      {feedbackMessage.text && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            feedbackMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-[#E6F4EC] border-[#135D3B]/20 text-[#135D3B]'
          }`}
        >
          {feedbackMessage.type === 'error' ? '⚠️' : '✓'} {feedbackMessage.text}
        </div>
      )}

      {/* Main Grid: Orders Table & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={ordersList}
            keyField="_id"
            title="Confirmed Project Orders"
            icon={Layers}
            onRowClick={(row) => setSelectedOrder(row)}
            selectedRowId={selectedOrder?._id}
            searchPlaceholder="Search customer, ref, or status..."
          />
        </div>

        {/* Selected Order Detail Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
          {selectedOrder ? (
            <>
              <div className="border-b border-slate-200 pb-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-extrabold text-[#135D3B]">
                    {selectedOrder.orderReference || selectedOrder.quotationReference}
                  </span>
                  <StatusPill status={selectedOrder.orderWorkflowStatus} />
                </div>
                <h3 className="text-base font-extrabold text-[#0F291E] mt-1">
                  {selectedOrder.customerFullName}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedOrder.installationSiteAddress}
                </p>
              </div>

              {/* Financial Snapshot */}
              <div className="bg-[#F4F9F6] p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross System Price:</span>
                  <span className="font-mono font-bold text-[#0F291E]">
                    {formatCurrencyInr(selectedOrder.grossTotalAmountInr)}
                  </span>
                </div>
                <div className="flex justify-between text-[#135D3B] font-semibold">
                  <span>PM Surya Ghar Subsidy:</span>
                  <span className="font-mono font-bold">
                    - {formatCurrencyInr(selectedOrder.estimatedSubsidyAmountInr)}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-[#0F291E]">
                  <span>Net Payable Amount:</span>
                  <span className="font-mono text-sm text-[#135D3B]">
                    {formatCurrencyInr(selectedOrder.netPayableAmountInr)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Advance Received:</span>
                  <span className="font-mono font-bold text-[#135D3B]">
                    {formatCurrencyInr(selectedOrder.advancePaymentAmountInr)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Balance Due:</span>
                  <span className="font-mono font-bold text-amber-700">
                    {formatCurrencyInr(selectedOrder.balancePaymentDueInr)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {selectedOrder.orderWorkflowStatus === 'Draft' && (
                  <button
                    onClick={() => setIsAdvanceModalOpen(true)}
                    className="w-full rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold px-5 py-2.5 shadow-sm text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-amber-300" />
                    <span>Capture Advance Payment (Min 20%)</span>
                  </button>
                )}

                {(selectedOrder.orderWorkflowStatus === 'Advance_Paid' ||
                  selectedOrder.orderWorkflowStatus === 'Packed') && (
                  <button
                    onClick={() => setIsAssignCrewModalOpen(true)}
                    className="w-full rounded-full border border-[#135D3B] text-[#135D3B] hover:bg-emerald-50 font-semibold px-5 py-2.5 shadow-xs text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Assign Installation Crew & Date</span>
                  </button>
                )}
              </div>

              {/* BOM Components List */}
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold uppercase text-[#0F291E] tracking-wider">
                  Bill of Materials ({selectedOrder.billOfMaterials?.length || 0} items)
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {selectedOrder.billOfMaterials?.map((bomItem, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#F4F9F6] rounded-xl border border-slate-200/80 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-[#0F291E]">{bomItem.componentName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {bomItem.quantityRequired} {bomItem.unitOfMeasure} • {bomItem.itemCategory}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        {formatCurrencyInr(bomItem.totalPriceInr)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">
              Select an order to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* Advance Payment Modal */}
      {isAdvanceModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md p-6 space-y-4">
            <h3 className="font-extrabold text-base text-[#0F291E]">
              Capture Advance Payment ({selectedOrder.quotationReference})
            </h3>
            <p className="text-xs text-slate-600">
              Capturing 20% or more advance triggers double-entry journal entry and transitions order from Draft to Advance_Paid.
            </p>
            <form onSubmit={handleCaptureAdvanceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Advance Amount (₹) — Min 20%: {formatCurrencyInr(selectedOrder.netPayableAmountInr * 0.2)}
                </label>
                <input
                  type="number"
                  required
                  value={advanceAmountInput}
                  onChange={(e) => setAdvanceAmountInput(e.target.value)}
                  className="odoo-input font-mono font-bold text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-4 py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold px-5 py-2 text-xs shadow-sm cursor-pointer"
                >
                  Confirm Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Crew Modal */}
      {isAssignCrewModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md p-6 space-y-4">
            <h3 className="font-extrabold text-base text-[#0F291E]">Assign Installation Crew</h3>
            <form onSubmit={handleAssignCrewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Scheduled Installation Date</label>
                <input
                  type="date"
                  required
                  value={scheduledDateInput}
                  onChange={(e) => setScheduledDateInput(e.target.value)}
                  className="odoo-input font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAssignCrewModalOpen(false)}
                  className="rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-4 py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold px-5 py-2 text-xs shadow-sm cursor-pointer"
                >
                  Confirm Crew Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersView;
