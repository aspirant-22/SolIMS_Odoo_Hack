/**
 * @AUTHOR: Garima Mittal
 * @FILE: WarrantyLookupTicketView.jsx
 * @RESPONSIBILITY: Manages Scene 5: Instant rainy season warranty lookup, automated ₹0 vs billed repairs, and tickets.
 * @DEPENDENCIES: react, lucide-react, api.js, AuthContext.jsx
 */

import React, { useState, useEffect } from 'react';
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
  Clock
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const WarrantyLookupTicketView = () => {
  const { setIsSystemProcessing } = useAuth();
  const [searchQuery, setSearchQuery] = useState('INV-2024-RAINY-ACTIVE');
  const [searchResults, setSearchResults] = useState([]);
  const [ticketsList, setTicketsList] = useState([]);
  const [selectedAssetForTicket, setSelectedAssetForTicket] = useState(null);
  const [faultCodeInput, setFaultCodeInput] = useState('ERR_INVERTER_GRID_FAIL');
  const [issueDescriptionInput, setIssueDescriptionInput] = useState('Monsoon continuous downpour tripped inverter. Zero home generation.');
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedTicketForResolve, setSelectedTicketForResolve] = useState(null);
  const [resolutionNotesInput, setResolutionNotesInput] = useState('Replaced DC surge module under manufacturer warranty. Power generation restored.');
  const [customerConfirmedCheckbox, setCustomerConfirmedCheckbox] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState('');

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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#4A2545] to-[#714B67] rounded-xl p-6 text-white flex flex-wrap items-center justify-between gap-4 shadow-md border border-[#4A2545]">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
            <CloudRain className="w-4 h-4 text-amber-300" />
            <span>Scene 5 — The Rainy Season Breakdown</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white mt-1">
            Live Warranty Evaluation & Auto-Billing Engine
          </h2>
          <p className="text-xs text-purple-100 max-w-2xl mt-1.5 leading-relaxed font-medium">
            During heavy rain or lightning, customer calls with zero power. Support searches the inverter serial in seconds: If under warranty, replacement costs ₹0; if expired, parts and labor are billed automatically.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-lg border border-white/20 text-xs font-mono font-semibold">
          <Receipt className="w-4 h-4 text-amber-300" />
          <span>Automated ₹0 vs Billable Split</span>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 bg-purple-50 border border-purple-200 text-[#714B67] text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Instant Search Bar & 1-Click Judge Scenarios */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Hardware Serial (e.g. INV-2024-RAINY-ACTIVE), Customer Name, or Phone..."
              className="odoo-input pl-10 text-xs font-bold text-slate-900"
            />
          </div>
          <button
            onClick={() => handleSearch(searchQuery)}
            className="odoo-btn-primary text-xs px-6 py-2.5 shadow-sm"
          >
            Instant Lookup
          </button>
        </div>

        {/* 1-Click Demo Scenarios for Hackathon Evaluation */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Judge Test Scenarios:</span>
          </span>

          <button
            onClick={() => {
              setSearchQuery('INV-2024-RAINY-ACTIVE');
              handleSearch('INV-2024-RAINY-ACTIVE');
            }}
            className="px-3 py-1.5 text-xs font-extrabold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 transition-colors cursor-pointer shadow-xs"
          >
            ⚡ Scenario A: 18-Mo Inverter (Rainy Active Warranty: ₹0)
          </button>

          <button
            onClick={() => {
              setSearchQuery('INV-2024-RAINY-EXPIRED');
              handleSearch('INV-2024-RAINY-EXPIRED');
            }}
            className="px-3 py-1.5 text-xs font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg border border-rose-300 transition-colors cursor-pointer shadow-xs"
          >
            ⚠️ Scenario B: 26-Mo Inverter (Expired Warranty: Billed ₹9,700)
          </button>
        </div>
      </div>

      {/* Live Search Results Card */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Live Warranty Evaluation Results ({searchResults.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((asset) => (
              <div
                key={asset.assetId}
                className={`bg-white rounded-xl border p-5 shadow-sm space-y-4 ${
                  asset.isUnderActiveWarranty ? 'border-emerald-300' : 'border-rose-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#714B67]">
                      {asset.serialNumber}
                    </span>
                    <h4 className="font-extrabold text-base text-slate-900 mt-0.5">{asset.customerFullName}</h4>
                    <p className="text-xs text-slate-600 font-medium">{asset.installationSiteAddress}</p>
                  </div>

                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                      asset.isUnderActiveWarranty
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {asset.isUnderActiveWarranty ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span>ACTIVE WARRANTY ({asset.remainingWarrantyDays} Days Left)</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-700" />
                        <span>WARRANTY EXPIRED</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Financial Auto-Calculation Breakdown */}
                <div className="bg-slate-50/90 rounded-xl p-4 text-xs space-y-2 border border-slate-200">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Component Category:</span>
                    <span className="font-bold text-slate-900">{asset.assetCategory}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Replacement Hardware / Parts:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {asset.isUnderActiveWarranty ? '₹0 (100% Covered)' : `₹${asset.estimatedPartCostInr.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Technician Visit & Labor Fee:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {asset.isUnderActiveWarranty ? '₹0 (100% Covered)' : `₹${asset.estimatedLaborCostInr.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-extrabold pt-2 border-t border-slate-200">
                    <span className="text-slate-900">Total Cost to Customer:</span>
                    <span
                      className={`font-mono text-base ${
                        asset.isUnderActiveWarranty ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold'
                      }`}
                    >
                      ₹{asset.totalBillableCostInr.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-500 font-mono font-medium">
                    Order Ref: {asset.orderReference}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedAssetForTicket(asset);
                      setIsTicketModalOpen(true);
                    }}
                    className="odoo-btn-primary gap-1.5 text-xs py-2 px-3.5 shadow-sm"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Create Breakdown Ticket</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Service Tickets Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-sm space-y-2">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-[#714B67]" />
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
              Active Breakdown Tickets ({ticketsList.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Tracked until customer confirmation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Ticket Ref</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Target Serial</th>
                <th className="p-3">Fault Code</th>
                <th className="p-3">Warranty State</th>
                <th className="p-3 text-right">Customer Bill</th>
                <th className="p-3">Workflow</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ticketsList.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/80">
                  <td className="p-3 font-mono font-extrabold text-[#714B67]">{t.ticketReference}</td>
                  <td className="p-3 font-bold text-slate-900">{t.customerFullName}</td>
                  <td className="p-3 font-mono text-slate-700 font-semibold">{t.targetSerialNumber}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 font-mono font-bold border border-rose-200">
                      {t.reportedFaultCode}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        t.isUnderActiveWarranty ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {t.isUnderActiveWarranty ? 'Under Warranty (₹0)' : 'Out of Warranty (Billed)'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-extrabold text-slate-900">
                    ₹{t.totalPayableAmountInr.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        t.ticketWorkflowStatus === 'Done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {t.ticketWorkflowStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {t.ticketWorkflowStatus !== 'Done' ? (
                      <button
                        onClick={() => {
                          setSelectedTicketForResolve(t);
                          setIsResolveModalOpen(true);
                        }}
                        className="odoo-btn-secondary text-[11px] py-1.5 px-3"
                      >
                        Resolve Ticket
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirmed Working</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {isTicketModalOpen && selectedAssetForTicket && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-slate-900">
                Create Breakdown Ticket ({selectedAssetForTicket.serialNumber})
              </h3>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
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

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-700 font-semibold">Calculated Charge to Customer:</span>
                <span className="font-mono font-extrabold text-base text-[#714B67]">
                  ₹{selectedAssetForTicket.totalBillableCostInr.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="odoo-btn-outline text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="odoo-btn-primary text-xs">
                  Dispatch Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Ticket Modal */}
      {isResolveModalOpen && selectedTicketForResolve && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-slate-900">
                Resolve Ticket {selectedTicketForResolve.ticketReference}
              </h3>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveTicketSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Technician Resolution Actions</label>
                <textarea
                  rows={2}
                  value={resolutionNotesInput}
                  onChange={(e) => setResolutionNotesInput(e.target.value)}
                  className="odoo-input font-medium"
                />
              </div>

              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <input
                  type="checkbox"
                  id="customerConfirm"
                  checked={customerConfirmedCheckbox}
                  onChange={(e) => setCustomerConfirmedCheckbox(e.target.checked)}
                  className="rounded text-[#714B67] focus:ring-[#714B67] w-4 h-4"
                />
                <label htmlFor="customerConfirm" className="text-emerald-950 font-bold text-xs cursor-pointer">
                  Customer confirms system is generating power normally
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="odoo-btn-outline text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="odoo-btn-secondary text-xs">
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
