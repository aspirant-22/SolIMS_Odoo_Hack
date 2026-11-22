/**
 * @AUTHOR: Garima Mittal
 * @FILE: DirectorDashboardView.jsx
 * @RESPONSIBILITY: Manages Scene 6: Director month-end P&L, project margins, subsidy tracker, and 1-click CSV export matching SolIMS Grid Forest-Emerald & Soft-Mint design.
 * @DEPENDENCIES: react, lucide-react, api.js, AuthContext.jsx
 */

import React, { useState, useEffect, useMemo } from 'react';
import { RevenueBreakdown } from '../../components/RevenueBreakdown';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Award,
  Zap,
  Lock
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DataTable, StatusPill } from '../../components/DataTable';
import { AlertBanner } from '../../components/AlertBanner';

export const DirectorDashboardView = () => {
  const { setIsSystemProcessing } = useAuth();
  const [financialSummary, setFinancialSummary] = useState(null);
  const [subsidiesData, setSubsidiesData] = useState(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('MONTH');
  const [generalLedgerEntries, setGeneralLedgerEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('PNL');
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
  const [ledgerCurrentPage, setLedgerCurrentPage] = useState(1);
  const LEDGER_PAGE_SIZE = 25;

  // PM Surya Ghar 4-Point Subsidy Compliance Checklist state
  const [selectedJobForSubsidy, setSelectedJobForSubsidy] = useState(null);
  const [complianceChecks, setComplianceChecks] = useState({
    dcrPanelVerified: false,
    serialsLinked: false,
    roofPhotoProof: false,
    homeownerSigned: false
  });
  const [subsidyFeedbackMsg, setSubsidyFeedbackMsg] = useState({ type: '', text: '' });
  const [updatingSubsidy, setUpdatingSubsidy] = useState(false);

  const loadFinancialData = async () => {
    setIsSystemProcessing(true);
    try {
      const [summaryResult, subsidiesResult, ledgerResult] = await Promise.allSettled([
        executeHttpRequest(`/api/accounting/pnl?period=${selectedTimePeriod}`),
        executeHttpRequest(`/api/accounting/subsidies?period=${selectedTimePeriod}`),
        executeHttpRequest('/api/accounting/ledger')
      ]);

      if (summaryResult.status === 'fulfilled' && summaryResult.value?.success) {
        setFinancialSummary(summaryResult.value.summary);
      } else if (summaryResult.status === 'rejected') {
        console.warn('Failed to load P&L summary:', summaryResult.reason);
      }

      if (subsidiesResult.status === 'fulfilled' && subsidiesResult.value?.success) {
        setSubsidiesData(subsidiesResult.value);
      } else if (subsidiesResult.status === 'rejected') {
        console.warn('Failed to load subsidies summary:', subsidiesResult.reason);
      }

      if (ledgerResult.status === 'fulfilled' && ledgerResult.value?.success) {
        setGeneralLedgerEntries(ledgerResult.value.ledger || []);
      } else if (ledgerResult.status === 'rejected') {
        console.warn('Failed to load ledger:', ledgerResult.reason);
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

  const filteredLedgerEntries = useMemo(() => {
    if (!ledgerSearchQuery.trim()) return generalLedgerEntries;
    const q = ledgerSearchQuery.toLowerCase().trim();
    return generalLedgerEntries.filter((entry) => {
      return (
        (entry.entryReference && entry.entryReference.toLowerCase().includes(q)) ||
        (entry.entryCategory && entry.entryCategory.toLowerCase().includes(q)) ||
        (entry.narrativeDescription && entry.narrativeDescription.toLowerCase().includes(q)) ||
        (entry.orderReference && entry.orderReference.toLowerCase().includes(q)) ||
        (entry.journalLines && entry.journalLines.some((l) =>
          (l.accountCode && l.accountCode.toLowerCase().includes(q)) ||
          (l.accountName && l.accountName.toLowerCase().includes(q))
        ))
      );
    });
  }, [generalLedgerEntries, ledgerSearchQuery]);

  const totalLedgerPages = Math.max(1, Math.ceil(filteredLedgerEntries.length / LEDGER_PAGE_SIZE));
  const paginatedLedger = useMemo(() => {
    const start = (ledgerCurrentPage - 1) * LEDGER_PAGE_SIZE;
    return filteredLedgerEntries.slice(start, start + LEDGER_PAGE_SIZE);
  }, [filteredLedgerEntries, ledgerCurrentPage]);

  useEffect(() => {
    if (ledgerCurrentPage > totalLedgerPages) {
      setLedgerCurrentPage(1);
    }
  }, [totalLedgerPages, ledgerCurrentPage]);

  const exportDirectorPnlCsv = () => {
    if (!financialSummary?.projectMarginAnalysis) return;

    const headers = [
      'Project Order Reference',
      'Customer Full Name',
      'Installation Site Address',
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

    const escapeCsvCell = (val) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const csvRows = financialSummary.projectMarginAnalysis.map((row) => [
      escapeCsvCell(row.orderReference),
      escapeCsvCell(row.customerFullName),
      escapeCsvCell(row.installationSiteAddress),
      escapeCsvCell(row.systemCapacityKw),
      escapeCsvCell(row.systemVariant),
      escapeCsvCell(row.status),
      escapeCsvCell(row.grossRevenueInr),
      escapeCsvCell(row.hardwareCostInr),
      escapeCsvCell(row.technicianLaborCostInr),
      escapeCsvCell(row.netJobProfitInr),
      escapeCsvCell(`${row.profitMarginPercentage}%`),
      escapeCsvCell(row.advanceCollectedInr),
      escapeCsvCell(row.balanceDueInr),
      escapeCsvCell(row.subsidyStatus)
    ]);

    const csvContentString = [
      headers.map(escapeCsvCell).join(','),
      ...csvRows.map((e) => e.join(','))
    ].join('\r\n');

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

  const openSubsidyModal = (job) => {
    setSelectedJobForSubsidy(job);
    setComplianceChecks({
      dcrPanelVerified: Boolean(job.subsidyCompliance?.dcrPanelVerified ?? (job.subsidyStatus === 'SUBSIDY_DISBURSED')),
      serialsLinked: Boolean(job.subsidyCompliance?.serialsLinked ?? (job.subsidyStatus === 'SUBSIDY_DISBURSED' || job.status !== 'Draft')),
      roofPhotoProof: Boolean(job.subsidyCompliance?.roofPhotoProof ?? ['Installed', 'Done'].includes(job.status)),
      homeownerSigned: Boolean(job.subsidyCompliance?.homeownerSigned ?? ['Installed', 'Done'].includes(job.status))
    });
    setSubsidyFeedbackMsg({ type: '', text: '' });
  };

  const handleUpdateSubsidyStatus = async (newStatus) => {
    if (!selectedJobForSubsidy) return;
    try {
      setUpdatingSubsidy(true);
      setSubsidyFeedbackMsg({ type: '', text: '' });

      const res = await executeHttpRequest(`/api/orders/${selectedJobForSubsidy.orderId}/subsidy`, {
        method: 'PATCH',
        body: JSON.stringify({
          newStatus,
          complianceChecks
        })
      });

      if (res.success) {
        setSubsidyFeedbackMsg({
          type: 'success',
          text: `PM Surya Ghar subsidy status updated to "${newStatus}" successfully!`
        });
        await loadFinancialData();
        setTimeout(() => {
          setSelectedJobForSubsidy(null);
        }, 1500);
      }
    } catch (err) {
      setSubsidyFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to update subsidy compliance status.'
      });
    } finally {
      setUpdatingSubsidy(false);
    }
  };

  const allChecksPassed =
    complianceChecks.dcrPanelVerified &&
    complianceChecks.serialsLinked &&
    complianceChecks.roofPhotoProof &&
    complianceChecks.homeownerSigned;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Page Hero Strip: Clean White Surface */}
      <div className="page-hero flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <BarChart3 className="w-4 h-4 text-[#135D3B]" />
            <span>Scene 6 — Executive Governance</span>
          </div>
          <h2 className="font-heading text-2xl font-black tracking-tight text-slate-900 mt-1">
            Executive P&L, Job Margins & Subsidy Tracking
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-1.5 leading-relaxed font-normal">
            Answers the Director's core questions in one click: which installations made or lost money, hardware vs payroll costs, government subsidy paperwork, and open repair tickets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Time Filter Pills: Passes TODAY, WEEK, or MONTH to /api/accounting/pnl and /api/accounting/subsidies */}
          <div className="bg-slate-100 p-1 rounded-full border border-slate-200 flex items-center text-xs shadow-2xs">
            {[
              { id: 'TODAY', label: 'Today' },
              { id: 'WEEK', label: 'This Week' },
              { id: 'MONTH', label: 'This Month' }
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setSelectedTimePeriod(id)}
                className={`px-3.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  selectedTimePeriod === id
                    ? 'bg-[#135D3B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Revenue</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight tabular-nums">
            ₹{(kpis.cumulativeRevenueInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">40 projects/mo avg</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hardware COGS</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight tabular-nums">
            ₹{(kpis.cumulativeHardwareCogsInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Panels, Inverters, Batteries</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Technician Payroll</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight tabular-nums">
            ₹{(kpis.cumulativeLaborPayrollInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">15-crew field payroll</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Warranty Claims</div>
          <div className="text-2xl font-black text-rose-700 mt-1 font-mono tracking-tight tabular-nums">
            ₹{(kpis.cumulativeWarrantyExpenseInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">Monsoon repair costs</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Net Profit</div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono tracking-tight tabular-nums">
            ₹{(kpis.overallNetProfitInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-bold text-emerald-700 mt-1 tabular-nums">
            {kpis.netProfitMarginPercent || 0}% Profit Margin
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending Subsidies</div>
          <div className="text-2xl font-black text-amber-700 mt-1 font-mono tracking-tight tabular-nums">
            ₹{(kpis.totalSubsidiesExpectedInr || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-800 font-semibold mt-1">PM Surya Ghar claims</div>
        </div>
      </div>

      <RevenueBreakdown kpis={kpis} projectMargins={projectMargins} />

      {/* Sub-Tabs: P&L per Job vs Double-Entry General Ledger */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
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
                <span className="font-mono font-bold text-slate-900 tabular-nums">{job.orderReference}</span>
              )
            },
            {
              key: 'customerFullName',
              header: 'Customer',
              render: (job) => <span className="font-bold text-slate-900">{job.customerFullName}</span>
            },
            {
              key: 'systemCapacityKw',
              header: 'Size / Type',
              render: (job) => (
                <span className="font-medium text-slate-800 tabular-nums">
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
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  ₹{job.grossRevenueInr.toLocaleString('en-IN')}
                </span>
              )
            },
            {
              key: 'hardwareCostInr',
              header: 'Hardware COGS',
              align: 'right',
              render: (job) => (
                <span className="font-mono text-slate-700 font-medium tabular-nums">
                  ₹{job.hardwareCostInr.toLocaleString('en-IN')}
                </span>
              )
            },
            {
              key: 'technicianLaborCostInr',
              header: 'Labor Pay',
              align: 'right',
              render: (job) => (
                <span className="font-mono text-slate-700 font-medium tabular-nums">
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
                    className={`font-mono font-bold text-sm tabular-nums ${
                      isProfitable ? 'text-emerald-700' : 'text-rose-700'
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
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full tabular-nums border ${
                    job.profitMarginPercentage >= 25
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
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
                <div className="flex items-center gap-1.5">
                  <StatusPill status={job.subsidyStatus} />
                  <button
                    onClick={() => openSubsidyModal(job)}
                    className="p-1 rounded-full text-slate-400 hover:text-[#135D3B] hover:bg-emerald-50 transition-colors cursor-pointer"
                    title="Open PM Surya Ghar 4-Point Subsidy Compliance Gate"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            }
          ]}
          data={projectMargins}
          keyField="orderId"
          title="Per-Installation Profit & Subsidy Matrix"
          searchPlaceholder="Search project ref, customer..."
          pageSize={25}
        />
      ) : (
        /* Double-Entry General Ledger */
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm space-y-4 p-5 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-slate-200 gap-3">
            <div>
              <h4 className="text-xs font-heading font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-[#135D3B]" />
                <span>Immutable SolIMS Double-Entry General Ledger (Debits === Credits)</span>
              </h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {filteredLedgerEntries.length} balanced journal entries across all solar project transactions
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={ledgerSearchQuery}
                  onChange={(e) => {
                    setLedgerSearchQuery(e.target.value);
                    setLedgerCurrentPage(1);
                  }}
                  placeholder="Search ref, account, category..."
                  className="w-full bg-white text-xs pl-8 pr-7 py-1.5 rounded-full border border-slate-300 font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#135D3B] focus:ring-1 focus:ring-[#135D3B]"
                />
                {ledgerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setLedgerSearchQuery('');
                      setLedgerCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-xs text-emerald-800 font-mono font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                Strict Parity Enforced ✓
              </span>
            </div>
          </div>

          <div className="space-y-3.5 flex-1">
            {paginatedLedger.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">
                No ledger entries found matching search query.
              </div>
            ) : (
              paginatedLedger.map((entry) => (
                <div key={entry._id} className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/70 space-y-2.5 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">{entry.entryReference}</span>
                      <span className="text-slate-500 font-bold ml-2">[{entry.entryCategory}]</span>
                      <span className="text-slate-900 font-semibold ml-2">{entry.narrativeDescription}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono font-medium tabular-nums">
                      {new Date(entry.entryDate).toLocaleDateString()}
                    </span>
                  </div>

                  <table className="w-full text-left text-xs bg-white rounded-xl border border-slate-200/90 overflow-hidden">
                    <thead className="bg-slate-50 text-slate-700 text-[10px] uppercase font-bold">
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
                          <td className="p-2.5 font-mono text-slate-600 font-semibold tabular-nums">{line.accountCode}</td>
                          <td className="p-2.5 font-bold text-slate-900">{line.accountName}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                            {line.debitAmountInr > 0 ? `₹${line.debitAmountInr.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                            {line.creditAmountInr > 0 ? `₹${line.creditAmountInr.toLocaleString('en-IN')}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>

          {/* Smooth 25-Ledger-Entries-Per-Page Pagination */}
          {filteredLedgerEntries.length > 0 && (
            <div className="p-3 bg-[#F4F9F6]/80 rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing {(ledgerCurrentPage - 1) * LEDGER_PAGE_SIZE + 1} to{' '}
                {Math.min(ledgerCurrentPage * LEDGER_PAGE_SIZE, filteredLedgerEntries.length)} of {filteredLedgerEntries.length} entries
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLedgerCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={ledgerCurrentPage === 1}
                  className="p-1 rounded-full border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold px-1.5 tabular-nums">
                  {ledgerCurrentPage} / {totalLedgerPages}
                </span>
                <button
                  type="button"
                  onClick={() => setLedgerCurrentPage((p) => Math.min(totalLedgerPages, p + 1))}
                  disabled={ledgerCurrentPage === totalLedgerPages}
                  className="p-1 rounded-full border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PM Surya Ghar 4-Point Subsidy Readiness Gate Modal */}
      {selectedJobForSubsidy && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl animate-slideUp">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-black text-base text-slate-900">
                      PM Surya Ghar Subsidy Readiness Gate
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      National Portal
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Project: <span className="font-mono font-bold text-slate-900">{selectedJobForSubsidy.orderReference}</span> • {selectedJobForSubsidy.customerFullName} ({selectedJobForSubsidy.systemCapacityKw} kW)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedJobForSubsidy(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert / Feedback message */}
            {subsidyFeedbackMsg.text && (
              <AlertBanner
                type={subsidyFeedbackMsg.type}
                message={subsidyFeedbackMsg.text}
                onDismiss={() => setSubsidyFeedbackMsg({ type: '', text: '' })}
              />
            )}

            {/* Status summary banner */}
            <div
              className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 ${
                allChecksPassed
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {allChecksPassed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <span>
                  {allChecksPassed
                    ? '✓ All 4 PM Surya Ghar compliance prerequisites verified! Claim is unlocked for submission & disbursement.'
                    : '⚠️ Subsidy Disbursement Blocked: All 4 checklist checkpoints must pass before claim can be Submitted or Disbursed.'}
                </span>
              </div>
              <span className="font-mono font-bold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-800 shrink-0">
                {Object.values(complianceChecks).filter(Boolean).length} / 4 Checks
              </span>
            </div>

            {/* The 4-Point Compliance Checklist */}
            <div className="space-y-3">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                4-Point Subsidy Compliance Checklist (Strict Gate)
              </div>

              {/* Check 1: DCR Panel Verified */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={complianceChecks.dcrPanelVerified}
                  onChange={(e) =>
                    setComplianceChecks((prev) => ({ ...prev, dcrPanelVerified: e.target.checked }))
                  }
                  className="mt-0.5 w-4 h-4 rounded text-[#135D3B] focus:ring-[#135D3B] cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>1. DCR Panel Verified</span>
                    {complianceChecks.dcrPanelVerified && (
                      <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        PASSED
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 font-medium text-[11px] mt-0.5">
                    Domestic Content Requirement verified. Solar PV modules certified under MNRE ALMM List 1 with certified cell origin.
                  </p>
                </div>
              </label>

              {/* Check 2: Serials Linked */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={complianceChecks.serialsLinked}
                  onChange={(e) =>
                    setComplianceChecks((prev) => ({ ...prev, serialsLinked: e.target.checked }))
                  }
                  className="mt-0.5 w-4 h-4 rounded text-[#135D3B] focus:ring-[#135D3B] cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>2. Serials Linked</span>
                    {complianceChecks.serialsLinked && (
                      <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        PASSED
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 font-medium text-[11px] mt-0.5">
                    Hardware serial barcodes (Panels, Smart Inverter, Battery) barcode scanned and verified in warehouse dispatch.
                  </p>
                </div>
              </label>

              {/* Check 3: Roof Photo Proof */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={complianceChecks.roofPhotoProof}
                  onChange={(e) =>
                    setComplianceChecks((prev) => ({ ...prev, roofPhotoProof: e.target.checked }))
                  }
                  className="mt-0.5 w-4 h-4 rounded text-[#135D3B] focus:ring-[#135D3B] cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>3. Roof Photo Proof</span>
                    {complianceChecks.roofPhotoProof && (
                      <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        PASSED
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 font-medium text-[11px] mt-0.5">
                    High-resolution rooftop array photos verified on-site with zero shading and proper azimuth/tilt alignment.
                  </p>
                </div>
              </label>

              {/* Check 4: Homeowner Signed */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={complianceChecks.homeownerSigned}
                  onChange={(e) =>
                    setComplianceChecks((prev) => ({ ...prev, homeownerSigned: e.target.checked }))
                  }
                  className="mt-0.5 w-4 h-4 rounded text-[#135D3B] focus:ring-[#135D3B] cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>4. Homeowner Signed</span>
                    {complianceChecks.homeownerSigned && (
                      <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        PASSED
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 font-medium text-[11px] mt-0.5">
                    Digital customer handover and power generation acceptance signature recorded and verified.
                  </p>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedJobForSubsidy(null)}
                className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!allChecksPassed || updatingSubsidy}
                  onClick={() => handleUpdateSubsidyStatus('SUBMITTED')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    allChecksPassed
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title={allChecksPassed ? 'Submit claim to National PM Surya Ghar Portal' : 'All 4 checks required'}
                >
                  Submit to National Portal
                </button>

                <button
                  type="button"
                  disabled={!allChecksPassed || updatingSubsidy}
                  onClick={() => handleUpdateSubsidyStatus('SUBSIDY_DISBURSED')}
                  className={`px-5 py-2 rounded-full text-xs font-bold shadow-sm transition-all ${
                    allChecksPassed
                      ? 'bg-[#135D3B] hover:bg-[#0E462C] text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title={allChecksPassed ? 'Mark subsidy as disbursed from Central Government' : 'All 4 checks required'}
                >
                  {updatingSubsidy ? 'Updating...' : 'Mark Subsidy Disbursed'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectorDashboardView;
