/**
 * @AUTHOR: Garima Mittal
 * @FILE: accounting.controller.js
 * @RESPONSIBILITY: Express controllers delivering financial metrics, P&L, subsidies, and general ledger entries.
 * @DEPENDENCIES: accounting.service.js
 */

import {
  generateDirectorMonthEndFinancialSummary,
  fetchDirectorSubsidySummary,
  fetchDoubleEntryGeneralLedger
} from './accounting.service.js';

export const handleGetDirectorSummary = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { period, timePeriod, startDate, endDate } = httpRequest.query;
    const filterPeriod = period || timePeriod || startDate;
    const summary = await generateDirectorMonthEndFinancialSummary(filterPeriod, endDate);
    return httpResponse.status(200).json({ success: true, period: period || 'MONTH', summary });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetDirectorPnl = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { period, timePeriod, startDate, endDate } = httpRequest.query;
    const filterPeriod = period || timePeriod || startDate;
    const summary = await generateDirectorMonthEndFinancialSummary(filterPeriod, endDate);
    return httpResponse.status(200).json({ success: true, period: period || 'MONTH', summary });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetSubsidySummary = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { period, timePeriod, startDate } = httpRequest.query;
    const filterPeriod = period || timePeriod || startDate;
    const subsidies = await fetchDirectorSubsidySummary(filterPeriod);
    return httpResponse.status(200).json({ success: true, ...subsidies });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetGeneralLedger = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const entries = await fetchDoubleEntryGeneralLedger();
    return httpResponse.status(200).json({ success: true, count: entries.length, ledger: entries });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};
