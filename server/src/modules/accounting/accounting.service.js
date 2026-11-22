/**
 * @AUTHOR: Garima Mittal
 * @FILE: accounting.service.js
 * @RESPONSIBILITY: Aggregates Director month-end P&L, project margin metrics, subsidy receivables, and double-entry journals.
 * @DEPENDENCIES: journalEntry.model.js, order.model.js, ticket.model.js, sequenceRegistry.js, erpConfig.js
 */

import { JournalEntryModel } from './journalEntry.model.js';
import { OrderModel } from '../orders/order.model.js';
import { TicketModel } from '../service/ticket.model.js';
import { getNextSequenceNumber } from '../../core/sequenceRegistry.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';

export const generateDirectorMonthEndFinancialSummary = async (startDateFilter = null, endDateFilter = null) => {
  const queryConditions = {};
  if (startDateFilter || endDateFilter) {
    queryConditions.createdAt = {};
    if (startDateFilter) queryConditions.createdAt.$gte = new Date(startDateFilter);
    if (endDateFilter) queryConditions.createdAt.$lte = new Date(endDateFilter);
  }

  const allOrders = await OrderModel.find(queryConditions);
  const allTickets = await TicketModel.find(queryConditions);

  let cumulativeRevenue = 0;
  let cumulativeHardwareCogs = 0;
  let cumulativeLaborPayroll = 0;
  let cumulativeAdvanceCollected = 0;
  let cumulativeBalanceReceivable = 0;
  let cumulativeSubsidiesExpected = 0;

  const roundCurrency = (val) => Math.round((Number(val) || 0) * 100) / 100;

  const projectMarginAnalysisList = allOrders.map((order) => {
    cumulativeRevenue += order.grossTotalAmountInr || 0;
    cumulativeAdvanceCollected += order.advancePaymentAmountInr || 0;
    cumulativeBalanceReceivable += order.balancePaymentDueInr || 0;
    cumulativeSubsidiesExpected += order.estimatedSubsidyAmountInr || 0;

    // Estimate hardware cost (approx 68% of gross for solar EPC)
    const hardwareCost = roundCurrency(
      order.billOfMaterials
        .filter((b) => b.itemCategory !== 'SERVICE')
        .reduce((sum, b) => sum + (b.totalPriceInr || 0), 0)
    );

    const technicianCrewCost = roundCurrency((order.assignedTechnicians?.length || 0) * 2500); // estimated per job
    const netJobProfit = roundCurrency((order.grossTotalAmountInr || 0) - (hardwareCost + technicianCrewCost));
    const profitMarginPercentage = order.grossTotalAmountInr > 0
      ? Math.round((netJobProfit / order.grossTotalAmountInr) * 100)
      : 0;

    cumulativeHardwareCogs += hardwareCost;
    cumulativeLaborPayroll += technicianCrewCost;

    return {
      orderId: order._id,
      orderReference: order.orderReference || order.quotationReference,
      customerFullName: order.customerFullName,
      installationSiteAddress: order.installationSiteAddress || '',
      systemCapacityKw: order.systemCapacityKw,
      systemVariant: order.systemVariant,
      status: order.orderWorkflowStatus,
      grossRevenueInr: roundCurrency(order.grossTotalAmountInr),
      advanceCollectedInr: roundCurrency(order.advancePaymentAmountInr),
      balanceDueInr: roundCurrency(order.balancePaymentDueInr),
      hardwareCostInr: roundCurrency(hardwareCost),
      technicianLaborCostInr: roundCurrency(technicianCrewCost),
      netJobProfitInr: roundCurrency(netJobProfit),
      profitMarginPercentage,
      subsidyStatus: order.subsidyApplicationStatus
    };
  });

  const cumulativeWarrantyExpense = roundCurrency(
    allTickets
      .filter((t) => t.isUnderActiveWarranty)
      .reduce((sum, t) => sum + (t.sparePartCostInr || 5000), 0)
  );

  cumulativeRevenue = roundCurrency(cumulativeRevenue);
  cumulativeHardwareCogs = roundCurrency(cumulativeHardwareCogs);
  cumulativeLaborPayroll = roundCurrency(cumulativeLaborPayroll);
  cumulativeAdvanceCollected = roundCurrency(cumulativeAdvanceCollected);
  cumulativeBalanceReceivable = roundCurrency(cumulativeBalanceReceivable);
  cumulativeSubsidiesExpected = roundCurrency(cumulativeSubsidiesExpected);

  const overallNetProfit = roundCurrency(cumulativeRevenue - (cumulativeHardwareCogs + cumulativeLaborPayroll + cumulativeWarrantyExpense));

  return {
    kpis: {
      cumulativeRevenueInr: cumulativeRevenue,
      cumulativeHardwareCogsInr: cumulativeHardwareCogs,
      cumulativeLaborPayrollInr: cumulativeLaborPayroll,
      cumulativeWarrantyExpenseInr: cumulativeWarrantyExpense,
      overallNetProfitInr: overallNetProfit,
      netProfitMarginPercent: cumulativeRevenue > 0 ? Math.round((overallNetProfit / cumulativeRevenue) * 100) : 0,
      totalAdvanceCollectedInr: cumulativeAdvanceCollected,
      totalBalanceDueInr: cumulativeBalanceReceivable,
      totalSubsidiesExpectedInr: cumulativeSubsidiesExpected,
      unfinishedInstallationsCount: allOrders.filter((o) => !['Installed', 'Done'].includes(o.orderWorkflowStatus)).length,
      openTicketsCount: allTickets.filter((t) => t.ticketWorkflowStatus !== 'Done').length
    },
    projectMarginAnalysis: projectMarginAnalysisList,
    generatedTimestamp: new Date().toISOString()
  };
};

export const fetchDoubleEntryGeneralLedger = async () => {
  return JournalEntryModel.find().sort({ entryDate: -1 });
};
