/**
 * @AUTHOR: Garima Mittal
 * @FILE: DirectorDashboardView.jsx
 * @RESPONSIBILITY: Manages Scene 6: Director month-end P&L, project margins, subsidy tracker, and 1-click CSV export matching SolIMS Grid Forest-Emerald & Soft-Mint design.
 * @DEPENDENCIES: react, lucide-react, api.js, AuthContext.jsx
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DataTable, StatusPill } from '../../components/DataTable';

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
      'Net Job Profit (INR)',
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
      {/* Page Hero Strip: Soft-Mint Gradient Banner */}
      <div className="bg-gradient-to-r from-[#EBF5EE] via-[#F4F9F6] to-white border border-emerald-900/10 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#135D3B]">
            <BarChart3 className="w-4 h-4 text-[#135D3B]" />
            <span>Scene 6 — The Director's Month-End</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#0F291E] mt-1">
            Executive P&L, Job Profitability & Subsidy Tracking
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-1.5 leading-relaxed font-medium">
            Answers the Director's core questions in one click: which installations made or lost money, hardware vs payroll costs, government subsidy paperwork, and open repair tickets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Time Filter Pills */}
          <div className="bg-white/80 p-1 rounded-full border border-emerald-900/10 flex items-center text-xs shadow-2xs">
            {['DAY', 'WEEK', 'MONTH'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedTimePeriod(period)}
                className={`px-3.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  selectedTimePeriod === period
                    ? 'bg-[#135D3B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#135D3B]'
                }`}
              >
                {period === 'DAY' ? 'Today' : period === 'WEEK' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          <button
            onClick={exportDirectorPnlCsv}
            className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold text-xs px-5 py-2 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>1-Click CSV Export</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Revenue</div>
          <div className="text-2xl font-extrabold text-[#0F291E] mt-1 font-mono tracking-tight">
            ₹{(kpis.cumulativeRevenueInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#135D3B] font-bold mt-1">40 projects/mo avg</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hardware COGS</div>
          <div className="text-2xl font-extrabold text-[#0F291E] mt-1 font-mono tracking-tight">
            ₹{(kpis.cumulativeHardwareCogsInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">Panels, Inverters, Batteries</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Technician Payroll</div>
          <div className="text-2xl font-extrabold text-[#0F291E] mt-1 font-mono tracking-tight">
            ₹{(kpis.cumulativeLaborPayrollInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">15-crew field payroll</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Warranty Claims</div>
          <div className="text-2xl font-extrabold text-rose-700 mt-1 font-mono tracking-tight">
            ₹{(kpis.cumulativeWarrantyExpenseInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-rose-600 font-bold mt-1">Monsoon repair costs</div>
        </div>

        <div className="bg-[#E6F4EC]/60 p-5 rounded-2xl border border-[#135D3B]/20 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-extrabold text-[#135D3B] uppercase tracking-wider">Net Profit</div>
          <div className="text-2xl font-extrabold text-[#135D3B] mt-1 font-mono tracking-tight">
            ₹{(kpis.overallNetProfitInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-extrabold text-[#135D3B] mt-1">
            {kpis.netProfitMarginPercent || 0}% Profit Margin
          </div>
        </div>

        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-extrabold text-[#135D3B] uppercase tracking-wider">Pending Subsidies</div>
          <div className="text-2xl font-extrabold text-[#135D3B] mt-1 font-mono tracking-tight">
            ₹{(kpis.totalSubsidiesExpectedInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#135D3B] font-bold mt-1">PM Surya Ghar claims</div>
        </div>
      </div>

      {/* Sub-Tabs: P&L per Job vs Double-Entry General Ledger */}
      <div className="flex border-b border-emerald-900/10 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('PNL')}
          className={`pb-2.5 transition-colors cursor-pointer ${
            activeTab === 'PNL'
              ? 'text-[#135D3B] border-b-2 border-[#135D3B] font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Per-Installation Profit & Subsidy Matrix ({projectMargins.length})
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`pb-2.5 transition-colors cursor-pointer ${
            activeTab === 'LEDGER'
              ? 'text-[#135D3B] border-b-2 border-[#135D3B] font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Double-Entry General Ledger ({generalLedgerEntries.length} Balanced Entries)
        </button>
      </div>

      {activeTab === 'PNL' ? (
        <DataTable
          columns={[
            {
              key: 'orderReference',
              header: 'Project Ref',
              render: (job) => (
                <span className="font-mono font-extrabold text-[#135D3B]">{job.orderReference}</span>
              )
            },
            {
              key: 'customerFullName',
              header: 'Customer',
              render: (job) => <span className="font-bold text-[#0F291E]">{job.customerFullName}</span>
            },
            {
              key: 'systemCapacityKw',
              header: 'Size / Type',
              render: (job) => (
                <span className="font-medium text-slate-800">
                  {job.systemCapacityKw} kW {job.systemVariant}
                </span>
              )
            },
            {
              key: 'status',
              header: 'Status',
              render: (job) => <StatusPill status={job.status} />
            },
            {
              key: 'grossRevenueInr',
              header: 'Revenue',
              align: 'right',
              render: (job) => (
                <span className="font-mono font-extrabold text-[#0F291E]">
                  ₹{job.grossRevenueInr.toLocaleString('en-IN')}
                </span>
              )
            },
            {
              key: 'hardwareCostInr',
              header: 'Hardware COGS',
              align: 'right',
              render: (job) => (
                <span className="font-mono text-slate-700 font-medium">
                  ₹{job.hardwareCostInr.toLocaleString('en-IN')}
                </span>
              )
            },
            {
              key: 'technicianLaborCostInr',
              header: 'Labor Pay',
              align: 'right',
              render: (job) => (
                <span className="font-mono text-slate-700 font-medium">
                  ₹{job.technicianLaborCostInr.toLocaleString('en-IN')}
                </span>
              )
            },
            {
              key: 'netJobProfitInr',
              header: 'Net Profit',
              align: 'right',
              render: (job) => {
                const isProfitable = job.netJobProfitInr >= 0;
                return (
                  <span
                    className={`font-mono font-extrabold text-sm ${
                      isProfitable ? 'text-[#135D3B]' : 'text-rose-700'
                    }`}
                  >
                    ₹{job.netJobProfitInr.toLocaleString('en-IN')}
                  </span>
                );
              }
            },
            {
              key: 'profitMarginPercentage',
              header: 'Margin',
              align: 'right',
              render: (job) => (
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    job.profitMarginPercentage >= 25
                      ? 'bg-[#E6F4EC] text-[#135D3B] border border-[#135D3B]/20'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {job.profitMarginPercentage}%
                </span>
              )
            },
            {
              key: 'subsidyStatus',
              header: 'Govt Subsidy Status',
              render: (job) => (
                <span className="text-[10px] font-semibold text-[#135D3B] bg-[#E6F4EC] px-2.5 py-0.5 rounded-full border border-[#135D3B]/20">
                  {job.subsidyStatus}
                </span>
              )
            }
          ]}
          data={projectMargins}
          keyField="orderId"
          title="Per-Installation Profit & Subsidy Matrix"
          searchPlaceholder="Search project ref, customer..."
        />
      ) : (
        /* Double-Entry General Ledger */
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm space-y-4 p-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <h4 className="text-xs font-extrabold text-[#0F291E] uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#135D3B]" />
              <span>Immutable SolIMS Double-Entry General Ledger (Debits === Credits)</span>
            </h4>
            <span className="text-xs text-[#135D3B] font-mono font-bold bg-[#E6F4EC] px-2.5 py-0.5 rounded-full border border-[#135D3B]/20">
              Strict Parity Enforced
            </span>
          </div>

          <div className="space-y-3.5">
            {generalLedgerEntries.map((entry) => (
              <div key={entry._id} className="border border-slate-200/80 rounded-2xl p-4 bg-[#F4F9F6]/60 space-y-2.5 shadow-2xs">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-extrabold text-[#135D3B]">{entry.entryReference}</span>
                    <span className="text-slate-500 font-bold ml-2">[{entry.entryCategory}]</span>
                    <span className="text-[#0F291E] font-semibold ml-2">{entry.narrativeDescription}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono font-medium">
                    {new Date(entry.entryDate).toLocaleDateString()}
                  </span>
                </div>

                <table className="w-full text-left text-xs bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                  <thead className="bg-[#F4F9F6] text-slate-700 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2.5">Account Code</th>
                      <th className="p-2.5">Account Name</th>
                      <th className="p-2.5 text-right">Debit (₹)</th>
                      <th className="p-2.5 text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entry.journalLines.map((line, lIdx) => (
                      <tr key={lIdx}>
                        <td className="p-2.5 font-mono text-slate-600 font-semibold">{line.accountCode}</td>
                        <td className="p-2.5 font-bold text-[#0F291E]">{line.accountName}</td>
                        <td className="p-2.5 text-right font-mono font-extrabold text-[#0F291E]">
                          {line.debitAmountInr > 0 ? `₹${line.debitAmountInr.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-extrabold text-[#0F291E]">
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

export default DirectorDashboardView;
