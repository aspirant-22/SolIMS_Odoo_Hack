/**
 * @AUTHOR: Garima Mittal
 * @FILE: DirectorDashboardView.jsx
 * @RESPONSIBILITY: Manages Scene 6: Director month-end P&L, project margins, subsidy tracker, and 1-click CSV export.
 * @DEPENDENCIES: react, lucide-react, api.js, AuthContext.jsx
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  AlertOctagon,
  Clock,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const DirectorDashboardView = () => {
  const { setIsSystemProcessing } = useAuth();
  const [financialSummary, setFinancialSummary] = useState(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('MONTH');
  const [generalLedgerEntries, setGeneralLedgerEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('PNL');

  const loadFinancialData = async () => {
    setIsSystemProcessing(true);
    try {
      const [summaryRes, ledgerRes] = await Promise.all([
        executeHttpRequest('/api/accounting/director-summary'),
        executeHttpRequest('/api/accounting/ledger')
      ]);

      if (summaryRes.success) {
        setFinancialSummary(summaryRes.summary);
      }
      if (ledgerRes.success) {
        setGeneralLedgerEntries(ledgerRes.ledger || []);
      }
    } catch (err) {
      console.error('Failed to load financial summary:', err);
    } finally {
      setIsSystemProcessing(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [selectedTimePeriod]);

  // 1-Click CSV Export Functionality
  const exportDirectorPnlCsv = () => {
    if (!financialSummary?.projectMarginAnalysis) return;

    const headers = [
      'Project Order Reference',
      'Customer Full Name',
      'System Capacity (kW)',
      'Variant',
      'Workflow Status',
      'Gross Revenue (INR)',
      'Hardware COGS (INR)',
      'Technician Labor (INR)',
      'Net Profit (INR)',
      'Margin (%)',
      'Advance Collected (INR)',
      'Balance Due (INR)',
      'Subsidy Status'
    ];

    const csvRows = financialSummary.projectMarginAnalysis.map((row) => [
      `"${row.orderReference}"`,
      `"${row.customerFullName}"`,
      row.systemCapacityKw,
      row.systemVariant,
      row.status,
      row.grossRevenueInr,
      row.hardwareCostInr,
      row.technicianLaborCostInr,
      row.netJobProfitInr,
      `${row.profitMarginPercentage}%`,
      row.advanceCollectedInr,
      row.balanceDueInr,
      row.subsidyStatus
    ]);

    const csvContentString = [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContentString], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', downloadUrl);
    linkElement.setAttribute('download', `SolIMS_Director_Executive_PnL_${selectedTimePeriod}_2026.csv`);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  const kpis = financialSummary?.kpis || {};
  const projectMargins = financialSummary?.projectMarginAnalysis || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-[#714B67] to-[#008784] rounded-xl p-5 text-white flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
            <BarChart3 className="w-4 h-4" />
            <span>Scene 6 — The Director's Month-End</span>
          </div>
          <h2 className="text-xl font-bold mt-1">Executive P&L, Job Profitability & Subsidy Tracking</h2>
          <p className="text-xs text-white/80 max-w-2xl mt-1">
            Answers the Director's core questions in one click: which installations made or lost money, hardware vs payroll costs, government subsidy paperwork, and open repair tickets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Filter Pills */}
          <div className="bg-white/10 p-1 rounded-lg border border-white/20 flex items-center text-xs">
            {['DAY', 'WEEK', 'MONTH'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedTimePeriod(period)}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedTimePeriod === period ? 'bg-white text-[#714B67] font-bold shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                {period === 'DAY' ? 'Today' : period === 'WEEK' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          <button
            onClick={exportDirectorPnlCsv}
            className="bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>1-Click CSV Export</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Gross Revenue</div>
          <div className="text-lg font-bold text-gray-900 mt-1 font-mono">
            ₹{(kpis.cumulativeRevenueInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">40 projects/mo avg</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Hardware COGS</div>
          <div className="text-lg font-bold text-gray-900 mt-1 font-mono">
            ₹{(kpis.cumulativeHardwareCogsInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Panels, Inverters, Batteries</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Technician Payroll</div>
          <div className="text-lg font-bold text-gray-900 mt-1 font-mono">
            ₹{(kpis.cumulativeLaborPayrollInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">15-crew field payroll</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Warranty Claims</div>
          <div className="text-lg font-bold text-rose-700 mt-1 font-mono">
            ₹{(kpis.cumulativeWarrantyExpenseInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-rose-600 mt-1">Monsoon repair costs</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-300 shadow-2xs bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Net Profit</div>
          <div className="text-lg font-bold text-emerald-700 mt-1 font-mono">
            ₹{(kpis.overallNetProfitInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] font-bold text-emerald-600 mt-1">
            {kpis.netProfitMarginPercent || 0}% Profit Margin
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-2xs bg-purple-50/20">
          <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wide">Pending Subsidies</div>
          <div className="text-lg font-bold text-[#714B67] mt-1 font-mono">
            ₹{(kpis.totalSubsidiesExpectedInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-purple-600 mt-1">PM Surya Ghar claims</div>
        </div>
      </div>

      {/* Sub-Tabs: P&L per Job vs Double-Entry General Ledger */}
      <div className="flex border-b border-gray-200 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('PNL')}
          className={`pb-2 transition-colors cursor-pointer ${
            activeTab === 'PNL' ? 'text-[#714B67] border-b-2 border-[#714B67]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Per-Installation Profit & Subsidy Matrix ({projectMargins.length})
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`pb-2 transition-colors cursor-pointer ${
            activeTab === 'LEDGER' ? 'text-[#714B67] border-b-2 border-[#714B67]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Double-Entry General Ledger ({generalLedgerEntries.length} Balanced Entries)
        </button>
      </div>

      {activeTab === 'PNL' ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                <tr>
                  <th className="p-3">Project Ref</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Size / Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Revenue</th>
                  <th className="p-3 text-right">Hardware COGS</th>
                  <th className="p-3 text-right">Labor Pay</th>
                  <th className="p-3 text-right">Net Profit</th>
                  <th className="p-3 text-right">Margin</th>
                  <th className="p-3">Govt Subsidy Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projectMargins.map((job) => {
                  const isProfitable = job.netJobProfitInr >= 0;
                  return (
                    <tr key={job.orderId} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-[#714B67]">{job.orderReference}</td>
                      <td className="p-3 font-medium text-gray-900">{job.customerFullName}</td>
                      <td className="p-3 font-medium">
                        {job.systemCapacityKw} kW {job.systemVariant}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            job.status === 'Installed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : job.status === 'Dispatched'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">
                        ₹{job.grossRevenueInr.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right font-mono text-gray-600">
                        ₹{job.hardwareCostInr.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right font-mono text-gray-600">
                        ₹{job.technicianLaborCostInr.toLocaleString('en-IN')}
                      </td>
                      <td
                        className={`p-3 text-right font-mono font-bold ${
                          isProfitable ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        ₹{job.netJobProfitInr.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            job.profitMarginPercentage >= 25
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {job.profitMarginPercentage}%
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {job.subsidyStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Double-Entry General Ledger */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs space-y-4 p-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#714B67]" />
              <span>Immutable Odoo Double-Entry General Ledger (Debits === Credits)</span>
            </h4>
            <span className="text-[10px] text-gray-400 font-mono">Pre-validated strict parity</span>
          </div>

          <div className="space-y-3">
            {generalLedgerEntries.map((entry) => (
              <div key={entry._id} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#714B67]">{entry.entryReference}</span>
                    <span className="text-gray-500 ml-2">[{entry.entryCategory}]</span>
                    <span className="text-gray-700 font-medium ml-2">{entry.narrativeDescription}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {new Date(entry.entryDate).toLocaleDateString()}
                  </span>
                </div>

                <table className="w-full text-left text-xs bg-white rounded border border-gray-200">
                  <thead className="bg-gray-100 text-gray-500 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="p-2">Account Code</th>
                      <th className="p-2">Account Name</th>
                      <th className="p-2 text-right">Debit (₹)</th>
                      <th className="p-2 text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entry.journalLines.map((line, lIdx) => (
                      <tr key={lIdx}>
                        <td className="p-2 font-mono text-gray-600">{line.accountCode}</td>
                        <td className="p-2 font-medium text-gray-800">{line.accountName}</td>
                        <td className="p-2 text-right font-mono">
                          {line.debitAmountInr > 0 ? `₹${line.debitAmountInr.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="p-2 text-right font-mono">
                          {line.creditAmountInr > 0 ? `₹${line.creditAmountInr.toLocaleString('en-IN')}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
