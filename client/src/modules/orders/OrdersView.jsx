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
  Layers,
  Mail,
  Sparkles,
  Key,
  Calendar,
  Award,
  ExternalLink
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DataTable, StatusPill } from '../../components/DataTable';
import { formatCurrencyInr } from '../../erpClientConfig';
import { AlertBanner } from '../../components/AlertBanner';
import {
  validateAdvanceAmount,
  validatePaymentAgainstBalance,
  validateDateField
} from '../../utils/validators';

export const OrdersView = () => {
  const { currentUser, setIsSystemProcessing } = useAuth();
  const [ordersList, setOrdersList] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [advanceAmountInput, setAdvanceAmountInput] = useState(50000);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isLeftoverModalOpen, setIsLeftoverModalOpen] = useState(false);
  const [leftoverAmountInput, setLeftoverAmountInput] = useState(0);
  const [leftoverPaymentMode, setLeftoverPaymentMode] = useState('UPI');
  const [leftoverTxnRef, setLeftoverTxnRef] = useState('');
  const [isAssignCrewModalOpen, setIsAssignCrewModalOpen] = useState(false);
  const [scheduledDateInput, setScheduledDateInput] = useState('2026-11-28');
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });
  const [techniciansList, setTechniciansList] = useState([]);
  const [inverterTechId, setInverterTechId] = useState('');
  const [rooftopTechId, setRooftopTechId] = useState('');
  const [wiringTechId, setWiringTechId] = useState('');

  const loadAllOrders = async () => {
    try {
      const [ordersRes, techsRes] = await Promise.all([
        executeHttpRequest('/api/orders'),
        executeHttpRequest('/api/orders/technicians').catch(() => ({ success: false, technicians: [] }))
      ]);
      if (ordersRes.success) {
        setOrdersList(ordersRes.orders || []);
        if (ordersRes.orders?.length > 0) {
          setSelectedOrder((prev) => {
            if (!prev) return ordersRes.orders[0];
            return ordersRes.orders.find((o) => o._id === prev._id) || ordersRes.orders[0];
          });
        }
      }
      if (techsRes.success && techsRes.technicians?.length > 0) {
        setTechniciansList(techsRes.technicians);
      }
    } catch (err) {
      console.error('Failed to load orders / technicians:', err);
    }
  };

  useEffect(() => {
    loadAllOrders();
  }, []);

  const openCrewModal = () => {
    if (!selectedOrder) return;
    const defaultTechId = techniciansList[0]?._id || '';
    const secondTechId = techniciansList[1]?._id || defaultTechId;
    const thirdTechId = techniciansList[2]?._id || defaultTechId;

    setInverterTechId(
      (typeof selectedOrder.inverterTechnician === 'object' ? selectedOrder.inverterTechnician?._id : selectedOrder.inverterTechnician) || defaultTechId
    );
    setRooftopTechId(
      (typeof selectedOrder.rooftopTechnician === 'object' ? selectedOrder.rooftopTechnician?._id : selectedOrder.rooftopTechnician) || secondTechId
    );
    setWiringTechId(
      (typeof selectedOrder.wiringTechnician === 'object' ? selectedOrder.wiringTechnician?._id : selectedOrder.wiringTechnician) || thirdTechId
    );
    setScheduledDateInput(
      selectedOrder.scheduledInstallationDate
        ? new Date(selectedOrder.scheduledInstallationDate).toISOString().slice(0, 10)
        : '2026-11-28'
    );
    setIsAssignCrewModalOpen(true);
  };

  const handleCaptureAdvanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const validation = validateAdvanceAmount(advanceAmountInput, selectedOrder.netPayableAmountInr);
    if (!validation.ok) {
      setFeedbackMessage({ type: 'error', text: validation.error });
      return;
    }

    setIsSystemProcessing(true);
    setFeedbackMessage({ type: '', text: '' });
    try {
      const response = await executeHttpRequest(`/api/orders/${selectedOrder._id}/advance-payment`, {
        method: 'POST',
        body: JSON.stringify({
          paymentAmountInr: validation.value,
          paymentMode: 'UPI',
          transactionReference: `UPI-ADV-${Date.now().toString().slice(-6)}`
        })
      });
      if (response.success && response.order) {
        setIsAdvanceModalOpen(false);
        setSelectedOrder(response.order);
        setFeedbackMessage({
          type: 'success',
          text: `Advance payment of ₹${validation.value.toLocaleString('en-IN')} recorded successfully! Double-entry JournalEntry posted (Debit 1010 Bank / Credit 1200 Accounts Receivable). Remaining balance updated.`
        });
        await loadAllOrders();
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Payment capture failed' });
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const handleCaptureLeftoverSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const validation = validatePaymentAgainstBalance(leftoverAmountInput, selectedOrder.balancePaymentDueInr);
    if (!validation.ok) {
      setFeedbackMessage({ type: 'error', text: validation.error });
      return;
    }

    setIsSystemProcessing(true);
    setFeedbackMessage({ type: '', text: '' });
    try {
      const response = await executeHttpRequest(`/api/orders/${selectedOrder._id}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          paymentAmountInr: validation.value,
          paymentMode: leftoverPaymentMode,
          transactionReference: leftoverTxnRef || `${leftoverPaymentMode}/2026/BAL${Date.now().toString().slice(-6)}`
        })
      });
      if (response.success && response.order) {
        setIsLeftoverModalOpen(false);
        setSelectedOrder(response.order);
        setFeedbackMessage({
          type: 'success',
          text: `Leftover balance payment of ₹${validation.value.toLocaleString('en-IN')} recorded successfully! Double-entry JournalEntry posted (Debit 1010 Bank / Credit 1200 Accounts Receivable). Remaining balance updated.`
        });
        await loadAllOrders();
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Leftover payment recording failed' });
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const handleActivateCustomerSubmit = async () => {
    if (!selectedOrder) return;
    setIsSystemProcessing(true);
    setFeedbackMessage({ type: '', text: '' });
    try {
      const response = await executeHttpRequest(`/api/orders/${selectedOrder._id}/activate-customer`, {
        method: 'POST'
      });
      if (response.success) {
        setSelectedOrder(response.order);
        setFeedbackMessage({
          type: 'success',
          text: `Stage 2 Customer Account Activated! Welcome email dispatched to ${response.order.customerEmailAddress}.`
        });
        await loadAllOrders();
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Customer activation failed' });
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const hasAssignedCrew = Boolean(
    selectedOrder?.inverterTechnician ||
    selectedOrder?.rooftopTechnician ||
    selectedOrder?.wiringTechnician ||
    (selectedOrder?.assignedTechnicians && selectedOrder.assignedTechnicians.length > 0)
  );

  const handleAssignCrewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const dateErr = validateDateField(scheduledDateInput, 'Scheduled Installation Date', { allowPast: false });
    if (dateErr) {
      setFeedbackMessage({ type: 'error', text: dateErr });
      return;
    }

    if (!inverterTechId || !rooftopTechId || !wiringTechId) {
      setFeedbackMessage({ type: 'error', text: 'Please select all 3 specialized technicians (Inverter, Rooftop, and Wiring).' });
      return;
    }

    setIsSystemProcessing(true);
    setFeedbackMessage({ type: '', text: '' });
    try {
      const response = await executeHttpRequest(`/api/orders/${selectedOrder._id}/assign-crew`, {
        method: 'POST',
        body: JSON.stringify({
          inverterTechnician: inverterTechId,
          rooftopTechnician: rooftopTechId,
          wiringTechnician: wiringTechId,
          scheduledInstallationDate: scheduledDateInput
        })
      });
      if (response.success && response.order) {
        setIsAssignCrewModalOpen(false);
        setSelectedOrder(response.order);
        setFeedbackMessage({
          type: 'success',
          text: hasAssignedCrew
            ? `Installation crew and schedule modified successfully! Changes logged to immutable audit trail.`
            : `Specialized 3-technician crew assigned successfully for ${new Date(scheduledDateInput).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}!`
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
          className={`font-mono font-bold tabular-nums ${
            row.balancePaymentDueInr > 0 ? 'text-amber-800' : 'text-emerald-700'
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
    },
    {
      key: 'onboardingStage',
      header: 'Portal Access',
      render: (row) => {
        const isStage2 = row.onboardingStage === 'STAGE_2_ACTIVATED' || row.customerUserId;
        return (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              isStage2
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {isStage2 ? 'Stage 2 Active ✓' : 'Stage 1 Pending'}
          </span>
        );
      }
    },
    {
      key: 'certificate',
      header: 'Certificate',
      render: (row) => {
        const canView = ['Installed', 'Done', 'Dispatched'].includes(row.orderWorkflowStatus);
        if (!canView) return <span className="text-slate-400 text-xs">—</span>;
        return (
          <a
            href={`/certificate/${row._id}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#135D3B] hover:text-[#0E462C] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs transition-colors"
            title="View Official Commissioning & Warranty Certificate"
          >
            <Award className="w-3 h-3 text-[#135D3B]" />
            <span>Certificate</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
          </a>
        );
      }
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Page Hero Strip: Clean White Surface */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Module: Orders & BOM
            </span>
            <span className="text-xs text-slate-500 font-mono">ir.sequence seq_order</span>
          </div>
          <h2 className="font-heading text-2xl font-black tracking-tight mt-1 text-slate-900">
            Confirmed Solar Orders & BOM Breakdown
          </h2>
          <p className="text-xs text-slate-600 mt-1 font-normal">
            Auto-generated proposals, advance payment locks, warehouse dispatch authorizations, and crew dispatch.
          </p>
        </div>
      </div>

      <AlertBanner
        type={feedbackMessage.type}
        message={feedbackMessage.text}
        onDismiss={() => setFeedbackMessage({ type: '', text: '' })}
      />

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
            pageSize={25}
          />
        </div>

        {/* Selected Order Detail Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-5">
          {selectedOrder ? (
            <>
              <div className="border-b border-slate-200 pb-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                    {selectedOrder.orderReference || selectedOrder.quotationReference}
                  </span>
                  <StatusPill status={selectedOrder.orderWorkflowStatus} />
                </div>
                <h3 className="font-heading text-base font-bold text-slate-900 mt-1">
                  {selectedOrder.customerFullName}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedOrder.installationSiteAddress}
                </p>
              </div>

              {/* Financial Snapshot */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross System Price:</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrencyInr(selectedOrder.grossTotalAmountInr)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>PM Surya Ghar Subsidy:</span>
                  <span className="font-mono font-bold tabular-nums">
                    - {formatCurrencyInr(selectedOrder.estimatedSubsidyAmountInr)}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                  <span>Net Payable Amount:</span>
                  <span className="font-mono text-sm text-emerald-700 font-black tabular-nums">
                    {formatCurrencyInr(selectedOrder.netPayableAmountInr)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Advance Received:</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrencyInr(selectedOrder.advancePaymentAmountInr)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Balance Due:</span>
                  <span className="font-mono font-bold text-amber-800 tabular-nums">
                    {formatCurrencyInr(selectedOrder.balancePaymentDueInr)}
                  </span>
                </div>
              </div>

              {/* Commissioning Certificate Link */}
              {['Installed', 'Done', 'Dispatched'].includes(selectedOrder.orderWorkflowStatus) && (
                <a
                  href={`/certificate/${selectedOrder._id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#0F291E] to-[#135D3B] hover:opacity-95 text-white font-heading font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>Print Commissioning & Warranty Certificate</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                </a>
              )}

              {/* Stage 2 Progressive Onboarding Card */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[#0F291E]">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Stage 2: Customer Portal</span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      selectedOrder.onboardingStage === 'STAGE_2_ACTIVATED' || selectedOrder.customerUserId
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {selectedOrder.onboardingStage === 'STAGE_2_ACTIVATED' || selectedOrder.customerUserId
                      ? 'Portal Active ✓'
                      : 'Pending Activation'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  {selectedOrder.onboardingStage === 'STAGE_2_ACTIVATED' || selectedOrder.customerUserId
                    ? `Homeowner account provisioned for ${selectedOrder.customerEmailAddress}. 20-yr warranty, live milestone stream & roof sign-off unlocked.`
                    : `Capture advance payment (or click activate) to provision client credentials and dispatch Stage 2 simulated welcome email.`}
                </p>

                <button
                  type="button"
                  onClick={handleActivateCustomerSubmit}
                  className="w-full py-2 rounded-full bg-white hover:bg-emerald-50 text-[#135D3B] font-bold border border-emerald-300 shadow-2xs text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {selectedOrder.onboardingStage === 'STAGE_2_ACTIVATED' || selectedOrder.customerUserId
                      ? 'Resend Stage 2 Credentials Email'
                      : 'Activate Customer Portal (Stage 2)'}
                  </span>
                </button>
              </div>

              {/* Permanent Assigned Installation Crew & Schedule Card */}
              {((selectedOrder.assignedTechnicians && selectedOrder.assignedTechnicians.length > 0) ||
                selectedOrder.inverterTechnician ||
                selectedOrder.rooftopTechnician ||
                selectedOrder.wiringTechnician ||
                selectedOrder.scheduledInstallationDate) && (
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-300 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-[#0F291E]">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Specialized Installation Crew & Schedule</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Crew Assigned ✓
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {/* Inverter Specialist */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {selectedOrder.inverterTechnician?.fullName ||
                            (typeof selectedOrder.inverterTechnician === 'string' ? 'Specialist Assigned' : 'Ramesh Sharma')}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {selectedOrder.inverterTechnician?.phoneNumber || '+91 98765 43210'}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#135D3B] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Inverter Specialist
                      </span>
                    </div>

                    {/* Rooftop Mounting Technician */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {selectedOrder.rooftopTechnician?.fullName ||
                            (typeof selectedOrder.rooftopTechnician === 'string' ? 'Specialist Assigned' : 'Amit Verma')}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {selectedOrder.rooftopTechnician?.phoneNumber || '+91 98111 22334'}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#135D3B] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Rooftop Mounting Lead
                      </span>
                    </div>

                    {/* High-Voltage Wiring Technician */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {selectedOrder.wiringTechnician?.fullName ||
                            (typeof selectedOrder.wiringTechnician === 'string' ? 'Specialist Assigned' : 'Vikram Singh')}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {selectedOrder.wiringTechnician?.phoneNumber || '+91 98444 55667'}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#135D3B] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        HV Wiring Technician
                      </span>
                    </div>

                    {selectedOrder.scheduledInstallationDate && (
                      <div className="text-[11px] text-slate-700 font-medium flex items-center gap-1.5 pt-1 border-t border-emerald-200/60">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>
                          Scheduled Installation Date:{' '}
                          <strong className="text-slate-900 font-bold">
                            {new Date(selectedOrder.scheduledInstallationDate).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Immutable Crew & Schedule Modification Log Card */}
              {selectedOrder.crewModificationLog?.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                      Crew & Schedule Modification Log ({selectedOrder.crewModificationLog.length})
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Immutable Audit Trail</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedOrder.crewModificationLog.map((logEntry, idx) => (
                      <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-slate-500 text-[10px]">
                          <span className="font-bold text-slate-700">
                            {logEntry.action} by {logEntry.changedByName || 'Director'}
                          </span>
                          <span>
                            {new Date(logEntry.changedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        {logEntry.changes?.map((ch, chIdx) => (
                          <div key={chIdx} className="text-slate-600">
                            <strong className="text-slate-800">{ch.label}:</strong> {ch.oldValue} ➔{' '}
                            <strong className="text-emerald-700">{ch.newValue}</strong>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                {selectedOrder.orderWorkflowStatus === 'Draft' && (
                  <button
                    onClick={() => {
                      const minAdv = Math.ceil(selectedOrder.netPayableAmountInr * 0.2);
                      setAdvanceAmountInput(minAdv);
                      setIsAdvanceModalOpen(true);
                    }}
                    className="w-full rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold px-5 py-2.5 shadow-sm text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-amber-300" />
                    <span>Capture Advance Payment (Min 20%)</span>
                  </button>
                )}

                {selectedOrder.balancePaymentDueInr > 0 && selectedOrder.orderWorkflowStatus !== 'Draft' && (
                  <button
                    onClick={() => {
                      setLeftoverAmountInput(selectedOrder.balancePaymentDueInr);
                      setLeftoverTxnRef(`UPI/2026/BAL${Math.floor(100000 + Math.random() * 900000)}`);
                      setIsLeftoverModalOpen(true);
                    }}
                    className="w-full rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 shadow-sm text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Record Leftover / Balance Payment ({formatCurrencyInr(selectedOrder.balancePaymentDueInr)})</span>
                  </button>
                )}

                {selectedOrder.orderWorkflowStatus !== 'Draft' && selectedOrder.orderWorkflowStatus !== 'Cancelled' && (
                  <button
                    onClick={openCrewModal}
                    className="w-full rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-5 py-2.5 shadow-xs text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{hasAssignedCrew ? 'Modify Installation Crew and Date' : 'Assign Installation Crew and Date'}</span>
                  </button>
                )}
              </div>

              {/* BOM Components List */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase text-slate-700 tracking-wider">
                  Bill of Materials ({selectedOrder.billOfMaterials?.length || 0} items)
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {selectedOrder.billOfMaterials?.map((bomItem, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{bomItem.componentName}</div>
                        <div className="text-[10px] text-slate-500 font-mono tabular-nums">
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
              Capturing 20% or more advance triggers double-entry journal entry and transitions order from Draft to Advance_Paid / BALANCE_DUE.
            </p>
            <form onSubmit={handleCaptureAdvanceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Advance Amount (₹) — Minimum 20%: {formatCurrencyInr(Math.ceil(selectedOrder.netPayableAmountInr * 0.2))}
                </label>
                <input
                  type="number"
                  required
                  value={advanceAmountInput}
                  onChange={(e) => setAdvanceAmountInput(e.target.value)}
                  className="odoo-input font-mono font-bold text-sm"
                  placeholder="Enter advance amount"
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

      {/* Leftover / Balance Payment Modal */}
      {isLeftoverModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md p-6 space-y-4">
            <h3 className="font-extrabold text-base text-[#0F291E]">
              Record Leftover / Balance Payment ({selectedOrder.orderReference || selectedOrder.quotationReference})
            </h3>
            <p className="text-xs text-slate-600">
              Record remaining balance payment before or upon site commissioning. Immutable double-entry posting: Debit 1010 Bank / Credit 1200 Accounts Receivable.
            </p>
            <form onSubmit={handleCaptureLeftoverSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Payment Amount (₹) — Remaining Balance: {formatCurrencyInr(selectedOrder.balancePaymentDueInr)}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedOrder.balancePaymentDueInr}
                  value={leftoverAmountInput}
                  onChange={(e) => setLeftoverAmountInput(e.target.value)}
                  className="odoo-input font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={leftoverPaymentMode}
                  onChange={(e) => setLeftoverPaymentMode(e.target.value)}
                  className="odoo-input font-bold"
                >
                  <option value="UPI">UPI Payment</option>
                  <option value="NetBanking">NetBanking / NEFT / RTGS</option>
                  <option value="Cheque">Bank Cheque</option>
                  <option value="Cash">Cash Deposit</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  required
                  value={leftoverTxnRef}
                  onChange={(e) => setLeftoverTxnRef(e.target.value)}
                  className="odoo-input font-mono text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLeftoverModalOpen(false)}
                  className="rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-4 py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold px-5 py-2 text-xs shadow-sm cursor-pointer"
                >
                  Confirm Leftover Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Specialized 3-Technician Crew Assignment Modal */}
      {isAssignCrewModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-base text-[#0F291E]">
                {hasAssignedCrew ? 'Modify Installation Crew and Date' : 'Assign Installation Crew and Date'}
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                {selectedOrder.orderReference || selectedOrder.quotationReference}
              </span>
            </div>

            <form onSubmit={handleAssignCrewSubmit} className="space-y-3.5 text-xs">
              {/* 1. Inverter Specialist */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Inverter Specialist (`inverterTechnician`) *
                </label>
                <select
                  value={inverterTechId}
                  onChange={(e) => setInverterTechId(e.target.value)}
                  className="odoo-input font-bold"
                  required
                >
                  {techniciansList.map((tech) => (
                    <option key={tech._id} value={tech._id}>
                      {tech.fullName} ({tech.assignedSpecialization || 'Inverter Lead'}) {tech.phoneNumber ? `• ${tech.phoneNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Rooftop Mounting Technician */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. Rooftop Mounting Technician (`rooftopTechnician`) *
                </label>
                <select
                  value={rooftopTechId}
                  onChange={(e) => setRooftopTechId(e.target.value)}
                  className="odoo-input font-bold"
                  required
                >
                  {techniciansList.map((tech) => (
                    <option key={tech._id} value={tech._id}>
                      {tech.fullName} ({tech.assignedSpecialization || 'Rooftop Installer'}) {tech.phoneNumber ? `• ${tech.phoneNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. High-Voltage Wiring Technician */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  3. High-Voltage Wiring Technician (`wiringTechnician`) *
                </label>
                <select
                  value={wiringTechId}
                  onChange={(e) => setWiringTechId(e.target.value)}
                  className="odoo-input font-bold"
                  required
                >
                  {techniciansList.map((tech) => (
                    <option key={tech._id} value={tech._id}>
                      {tech.fullName} ({tech.assignedSpecialization || 'HV Wiring Specialist'}) {tech.phoneNumber ? `• ${tech.phoneNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled Installation Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Scheduled Installation Date *</label>
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
                  {hasAssignedCrew ? 'Modify Installation Crew and Date' : 'Assign Installation Crew and Date'}
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
