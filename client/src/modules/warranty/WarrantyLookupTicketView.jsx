/**
 * @AUTHOR: Garima Mittal
 * @FILE: WarrantyLookupTicketView.jsx
 * @RESPONSIBILITY: Manages Scene 5: Instant rainy season warranty lookup, automated ₹0 vs billed repairs, and tickets matching SolIMS Grid Forest-Emerald & Soft-Mint design.
 * @DEPENDENCIES: react, lucide-react, api.js, AuthContext.jsx
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search as KSearch, ShieldCheck as KShieldCheck, AlertTriangle as KAlertTriangle, Wrench as KWrench } from 'lucide-react';
import { WarrantyCertificateCard } from '../../components/WarrantyCertificateCard';
import { KpiCard, KpiStrip } from '../../components/KpiCard';
import {
  ShieldCheck,
  Search,
  CloudRain,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  Wrench,
  Sparkles,
  Ticket,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DataTable, StatusPill } from '../../components/DataTable';
import { AlertBanner } from '../../components/AlertBanner';

export const WarrantyLookupTicketView = () => {
  const { setIsSystemProcessing } = useAuth();
  const [searchQuery, setSearchQuery] = useState('INV-2024-RAINY-ACTIVE');
  const [searchResults, setSearchResults] = useState([]);
  const [resultsPage, setResultsPage] = useState(1);
  const RESULTS_PAGE_SIZE = 25;
  const [ticketsList, setTicketsList] = useState([]);
  const [selectedAssetForTicket, setSelectedAssetForTicket] = useState(null);
  const [faultCodeInput, setFaultCodeInput] = useState('ERR_INVERTER_GRID_FAIL');
  const [issueDescriptionInput, setIssueDescriptionInput] = useState('Monsoon continuous downpour tripped inverter. Zero home generation.');
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedTicketForResolve, setSelectedTicketForResolve] = useState(null);
  const [resolutionNotesInput, setResolutionNotesInput] = useState('Replaced DC surge module under manufacturer warranty. Power generation restored.');
  const [customerConfirmedCheckbox, setCustomerConfirmedCheckbox] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Payment gate state for out-of-warranty tickets
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTicketForPayment, setSelectedTicketForPayment] = useState(null);
  const [paymentModeInput, setPaymentModeInput] = useState('UPI');
  const [transactionRefInput, setTransactionRefInput] = useState('');

  const loadTickets = async () => {
    try {
      const response = await executeHttpRequest('/api/service/tickets');
      if (response.success) {
        setTicketsList(response.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    }
  };

  useEffect(() => {
    loadTickets();
    handleSearch(searchQuery);
  }, []);

  const handleSearch = async (queryText) => {
    const q = queryText || searchQuery;
    if (!q.trim()) return;
    setIsSystemProcessing(true);
    setFeedbackMessage('');
    try {
      const response = await executeHttpRequest(`/api/service/warranty-lookup?query=${encodeURIComponent(q.trim())}`);
      if (response.success) {
        setSearchResults(response.results || []);
        setResultsPage(1);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssetForTicket) return;
    setIsSystemProcessing(true);
    try {
      const response = await executeHttpRequest('/api/service/tickets', {
        method: 'POST',
        body: JSON.stringify({
          targetSerialNumber: selectedAssetForTicket.serialNumber,
          reportedFaultCode: faultCodeInput,
          issueDescription: issueDescriptionInput
        })
      });
      if (response.success) {
        setIsTicketModalOpen(false);
        setFeedbackMessage(`Created Breakdown Ticket ${response.ticket.ticketReference} for ${response.ticket.customerFullName}`);
        await loadTickets();
      }
    } catch (err) {
      setFeedbackMessage(err.message || 'Ticket creation failed');
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicketForPayment) return;
    setIsSystemProcessing(true);
    try {
      const response = await executeHttpRequest(`/api/service/tickets/${selectedTicketForPayment._id}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          paymentMode: paymentModeInput,
          transactionReference: transactionRefInput || `TXN-${Date.now().toString().slice(-6)}`,
          paymentAmountInr: selectedTicketForPayment.totalPayableAmountInr
        })
      });
      if (response.success) {
        setIsPaymentModalOpen(false);
        setFeedbackMessage(
          `Customer payment of ₹${selectedTicketForPayment.totalPayableAmountInr.toLocaleString('en-IN')} recorded successfully via ${paymentModeInput}. Balanced double-entry general ledger entry posted.`
        );
        await loadTickets();
      }
    } catch (err) {
      setFeedbackMessage(err.message || 'Payment recording failed');
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const handleResolveTicketSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicketForResolve) return;
    setIsSystemProcessing(true);
    try {
      const response = await executeHttpRequest(`/api/service/tickets/${selectedTicketForResolve._id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          resolutionNotes: resolutionNotesInput,
          customerConfirmedWorking: customerConfirmedCheckbox
        })
      });
      if (response.success) {
        setIsResolveModalOpen(false);
        setFeedbackMessage(`Ticket ${response.ticket.ticketReference} resolved and confirmed by customer.`);
        await loadTickets();
      }
    } catch (err) {
      setFeedbackMessage(err.message || 'Ticket resolution failed');
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
            <CloudRain className="w-4 h-4 text-[#135D3B]" />
            <span>Scene 5 — The Rainy Season Breakdown</span>
          </div>
          <h2 className="font-heading text-2xl font-black tracking-tight text-slate-900 mt-1">
            Live Warranty Evaluation & Auto-Billing Engine
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-1.5 leading-relaxed font-normal">
            During heavy rain or lightning, customer calls with zero power. Support searches the inverter serial in seconds: If under warranty, replacement costs ₹0; if expired, parts and labor are billed automatically.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-1.5 text-xs font-mono font-medium">
          <Receipt className="w-4 h-4 text-slate-500" />
          <span>Automated ₹0 vs Billable Split</span>
        </div>
      </div>

      <KpiStrip>
        <KpiCard label="Assets looked up" value={searchResults.length} icon={KSearch} tone="sky" trend="live" hint="current search" />
        <KpiCard label="Under warranty" value={searchResults.filter((a) => a.isUnderActiveWarranty).length} icon={KShieldCheck} tone="emerald" trend="₹0 billed" trendDir="up" hint="covered repairs" />
        <KpiCard label="Expired" value={searchResults.filter((a) => !a.isUnderActiveWarranty).length} icon={KAlertTriangle} tone="rose" trend="auto-billed" trendDir="down" hint="parts + labor" />
        <KpiCard label="Open tickets" value={ticketsList.filter((t) => t.ticketWorkflowStatus !== 'Done').length} icon={KWrench} tone="amber" trend={ticketsList.length + ' total'} hint="service queue" />
      </KpiStrip>

      <AlertBanner
        type="success"
        message={feedbackMessage}
        onDismiss={() => setFeedbackMessage('')}
      />

      {/* Instant Search Bar & 1-Click Judge Scenarios */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Hardware Serial (e.g. INV-2024-RAINY-ACTIVE), Customer Name, or Phone..."
              className="odoo-input pl-10 text-xs font-bold text-slate-900 rounded-full"
            />
          </div>
          <button
            onClick={() => handleSearch(searchQuery)}
            className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold text-xs px-6 py-2.5 shadow-sm transition-all cursor-pointer"
          >
            Instant Lookup
          </button>
        </div>

        {/* 1-Click Demo Scenarios for Hackathon Evaluation */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Judge Test Scenarios:</span>
          </span>

          <button
            onClick={() => {
              setSearchQuery('INV-2024-RAINY-ACTIVE');
              handleSearch('INV-2024-RAINY-ACTIVE');
            }}
            className="rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            ⚡ Scenario A: 18-Mo Inverter (Rainy Active Warranty: ₹0)
          </button>

          <button
            onClick={() => {
              setSearchQuery('INV-2024-RAINY-EXPIRED');
              handleSearch('INV-2024-RAINY-EXPIRED');
            }}
            className="rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            ⚠️ Scenario B: 26-Mo Inverter (Expired Warranty: Billed ₹9,700)
          </button>
        </div>
      </div>

      {/* Live Search Results Card */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xs font-bold text-slate-900 uppercase tracking-wider">
              Live Warranty Evaluation Results ({searchResults.length})
            </h3>
            {searchResults.length > RESULTS_PAGE_SIZE && (
              <span className="text-[11px] text-slate-500 font-medium">
                Page {resultsPage} of {Math.max(1, Math.ceil(searchResults.length / RESULTS_PAGE_SIZE))}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults
              .slice((resultsPage - 1) * RESULTS_PAGE_SIZE, resultsPage * RESULTS_PAGE_SIZE)
              .map((asset) => (
                <WarrantyCertificateCard
                  key={asset.assetId}
                  asset={asset}
                  onCreateTicket={() => {
                    setSelectedAssetForTicket(asset);
                    setIsTicketModalOpen(true);
                  }}
                />
              ))}
          </div>

          {searchResults.length > RESULTS_PAGE_SIZE && (
            <div className="p-3 bg-[#F4F9F6]/80 rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing {(resultsPage - 1) * RESULTS_PAGE_SIZE + 1} to{' '}
                {Math.min(resultsPage * RESULTS_PAGE_SIZE, searchResults.length)} of {searchResults.length} assets
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setResultsPage((p) => Math.max(1, p - 1))}
                  disabled={resultsPage === 1}
                  className="p-1 rounded-full border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold px-1.5 tabular-nums">
                  {resultsPage} / {Math.max(1, Math.ceil(searchResults.length / RESULTS_PAGE_SIZE))}
                </span>
                <button
                  type="button"
                  onClick={() => setResultsPage((p) => Math.min(Math.ceil(searchResults.length / RESULTS_PAGE_SIZE), p + 1))}
                  disabled={resultsPage === Math.ceil(searchResults.length / RESULTS_PAGE_SIZE)}
                  className="p-1 rounded-full border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Service Tickets Table */}
      <DataTable
        columns={[
          {
            key: 'ticketReference',
            header: 'Ticket Ref',
            render: (t) => (
              <span className="font-mono font-extrabold text-[#135D3B]">{t.ticketReference}</span>
            )
          },
          {
            key: 'customerFullName',
            header: 'Customer',
            render: (t) => <span className="font-bold text-[#0F291E]">{t.customerFullName}</span>
          },
          {
            key: 'targetSerialNumber',
            header: 'Target Serial',
            render: (t) => (
              <span className="font-mono text-slate-700 font-semibold">{t.targetSerialNumber}</span>
            )
          },
          {
            key: 'reportedFaultCode',
            header: 'Fault Code',
            render: (t) => (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 font-mono font-bold border border-rose-200">
                {t.reportedFaultCode}
              </span>
            )
          },
          {
            key: 'isUnderActiveWarranty',
            header: 'Warranty State',
            render: (t) => (
              <span
                className={`text-[10px] font-semibold px-3 py-0.5 rounded-full ${
                  t.isUnderActiveWarranty
                    ? 'bg-[#E6F4EC] text-[#135D3B] border border-[#135D3B]/20'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {t.isUnderActiveWarranty ? 'Under Warranty (₹0)' : 'Out of Warranty (Billed)'}
              </span>
            )
          },
          {
            key: 'totalPayableAmountInr',
            header: 'Customer Bill',
            align: 'right',
            render: (t) => (
              <span className="font-mono font-extrabold text-[#0F291E]">
                ₹{t.totalPayableAmountInr.toLocaleString('en-IN')}
              </span>
            )
          },
          {
            key: 'paymentStatus',
            header: 'Payment Gate',
            render: (t) => {
              if (t.isUnderActiveWarranty || t.totalPayableAmountInr === 0) {
                return (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    ₹0 Covered
                  </span>
                );
              }
              const isPaid = t.paymentStatus === 'PAID';
              return (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    isPaid
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {isPaid ? '✓ Paid' : '⚠️ Payment Pending'}
                </span>
              );
            }
          },
          {
            key: 'ticketWorkflowStatus',
            header: 'Workflow',
            render: (t) => <StatusPill status={t.ticketWorkflowStatus} />
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            sortable: false,
            render: (t) => {
              if (t.ticketWorkflowStatus === 'Done') {
                return (
                  <span className="text-xs font-bold text-[#135D3B] flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmed Working</span>
                  </span>
                );
              }

              const isOutOfWarranty = !t.isUnderActiveWarranty && t.totalPayableAmountInr > 0;
              const isPaymentPending = isOutOfWarranty && t.paymentStatus !== 'PAID';

              return (
                <div className="flex items-center justify-end gap-2">
                  {isPaymentPending ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTicketForPayment(t);
                        setTransactionRefInput(`TXN-${Date.now().toString().slice(-6)}`);
                        setIsPaymentModalOpen(true);
                      }}
                      className="rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] py-1.5 px-3 transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                    >
                      <span>💳 Record Payment (₹{t.totalPayableAmountInr.toLocaleString('en-IN')})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTicketForResolve(t);
                        setCustomerConfirmedCheckbox(false);
                        setIsResolveModalOpen(true);
                      }}
                      className="rounded-full border border-[#135D3B] text-[#135D3B] hover:bg-emerald-50 font-semibold text-[11px] py-1.5 px-3 transition-all cursor-pointer"
                    >
                      Resolve Ticket
                    </button>
                  )}
                </div>
              );
            }
          }
        ]}
        data={ticketsList}
        keyField="_id"
        title="Active Breakdown Tickets"
        subtitle="Tracked until customer confirmation"
        icon={Ticket}
        searchPlaceholder="Search ticket, customer, serial..."
        pageSize={25}
      />

      {/* Create Ticket Modal */}
      {isTicketModalOpen && selectedAssetForTicket && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-[#0F291E]">
                Create Breakdown Ticket ({selectedAssetForTicket.serialNumber})
              </h3>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer</label>
                <input
                  type="text"
                  disabled
                  value={selectedAssetForTicket.customerFullName}
                  className="odoo-input bg-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reported Inverter Fault Code</label>
                <select
                  value={faultCodeInput}
                  onChange={(e) => setFaultCodeInput(e.target.value)}
                  className="odoo-input font-mono font-bold"
                >
                  <option value="ERR_INVERTER_GRID_FAIL">ERR_INVERTER_GRID_FAIL (Rain Surge)</option>
                  <option value="ERR_MOSFET_BURNOUT">ERR_MOSFET_BURNOUT (Thunderbolt)</option>
                  <option value="ERR_ZERO_POWER">ERR_ZERO_POWER (Earthing Fault)</option>
                  <option value="ERR_BATTERY_UNDERVOLT">ERR_BATTERY_UNDERVOLT (Battery Drain)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Issue Description</label>
                <textarea
                  rows={2}
                  value={issueDescriptionInput}
                  onChange={(e) => setIssueDescriptionInput(e.target.value)}
                  className="odoo-input font-medium"
                />
              </div>

              <div className="p-3.5 bg-[#F4F9F6] rounded-2xl border border-slate-200/80 flex justify-between items-center">
                <span className="text-slate-700 font-semibold">Calculated Charge to Customer:</span>
                <span className="font-mono font-extrabold text-base text-[#135D3B]">
                  ₹{selectedAssetForTicket.totalBillableCostInr.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-4 py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold px-5 py-2 text-xs shadow-sm cursor-pointer"
                >
                  Dispatch Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Customer Payment Modal */}
      {isPaymentModalOpen && selectedTicketForPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-[#0F291E] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#135D3B]" />
                <span>Record Customer Payment ({selectedTicketForPayment.ticketReference})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950">
                <div className="font-bold flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-amber-700" />
                  <span>Out-of-Warranty Repair Billing Gate</span>
                </div>
                <div className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Recording payment unlocks ticket closure and automatically creates a balanced double-entry JournalEntry (Debit Bank 1010 / Credit Revenue 4010).
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  disabled
                  value={selectedTicketForPayment.customerFullName}
                  className="odoo-input bg-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Billable Amount (INR)</label>
                <input
                  type="text"
                  disabled
                  value={`₹${selectedTicketForPayment.totalPayableAmountInr.toLocaleString('en-IN')}`}
                  className="odoo-input bg-slate-100 font-mono font-black text-rose-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentModeInput}
                  onChange={(e) => setPaymentModeInput(e.target.value)}
                  className="odoo-input font-bold"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="BANK_TRANSFER">Bank IMPS / NEFT Transfer</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transaction Reference / UTR Number</label>
                <input
                  type="text"
                  required
                  value={transactionRefInput}
                  onChange={(e) => setTransactionRefInput(e.target.value)}
                  placeholder="e.g. UPI/1234567890 or CASH-RCP-01"
                  className="odoo-input font-mono font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-4 py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 text-xs shadow-sm cursor-pointer"
                >
                  Record ₹{selectedTicketForPayment.totalPayableAmountInr.toLocaleString('en-IN')} & Post Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Ticket Modal */}
      {isResolveModalOpen && selectedTicketForResolve && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-[#0F291E]">
                Resolve Ticket {selectedTicketForResolve.ticketReference}
              </h3>
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveTicketSubmit} className="space-y-3.5 text-xs">
              {/* Payment Gate Notice if Out of Warranty and not paid */}
              {!selectedTicketForResolve.isUnderActiveWarranty &&
                selectedTicketForResolve.totalPayableAmountInr > 0 &&
                selectedTicketForResolve.paymentStatus !== 'PAID' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold leading-relaxed">
                    ⚠️ Payment Gate Active: Out-of-warranty ticket requires customer payment of ₹
                    {selectedTicketForResolve.totalPayableAmountInr.toLocaleString('en-IN')} before closure. Please record payment first.
                  </div>
                )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Technician Resolution Actions</label>
                <textarea
                  rows={2}
                  value={resolutionNotesInput}
                  onChange={(e) => setResolutionNotesInput(e.target.value)}
                  className="odoo-input font-medium"
                />
              </div>

              <div className="flex items-start gap-2.5 p-3.5 bg-[#E6F4EC] rounded-2xl border border-[#135D3B]/20">
                <input
                  type="checkbox"
                  id="customerConfirm"
                  checked={customerConfirmedCheckbox}
                  onChange={(e) => setCustomerConfirmedCheckbox(e.target.checked)}
                  className="mt-0.5 rounded text-[#135D3B] focus:ring-[#135D3B] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="customerConfirm" className="text-[#0F291E] font-bold text-xs cursor-pointer">
                  Customer confirms system is generating power normally (Mandatory Sign-off Gate)
                </label>
              </div>

              {!customerConfirmedCheckbox && (
                <p className="text-[11px] text-amber-700 font-medium">
                  ⚠️ Customer confirmation of power generation is strictly required before ticket can be resolved & closed.
                </p>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-4 py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !customerConfirmedCheckbox ||
                    (!selectedTicketForResolve.isUnderActiveWarranty &&
                      selectedTicketForResolve.totalPayableAmountInr > 0 &&
                      selectedTicketForResolve.paymentStatus !== 'PAID')
                  }
                  className={`rounded-full font-semibold px-5 py-2 text-xs shadow-sm transition-all ${
                    customerConfirmedCheckbox &&
                    (selectedTicketForResolve.isUnderActiveWarranty ||
                      selectedTicketForResolve.totalPayableAmountInr === 0 ||
                      selectedTicketForResolve.paymentStatus === 'PAID')
                      ? 'bg-[#135D3B] hover:bg-[#0E462C] text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Confirm & Close Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarrantyLookupTicketView;
