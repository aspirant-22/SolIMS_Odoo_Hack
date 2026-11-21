/**
 * @AUTHOR: Garima Mittal
 * @FILE: accounting.controller.js
 * @RESPONSIBILITY: Express controllers delivering financial metrics, general ledger entries, and CSV export records.
 * @DEPENDENCIES: accounting.service.js
 */

import {
  generateDirectorMonthEndFinancialSummary,
  fetchDoubleEntryGeneralLedger
} from './accounting.service.js';

export const handleGetDirectorSummary = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { startDate, endDate } = httpRequest.query;
    const summary = await generateDirectorMonthEndFinancialSummary(startDate, endDate);
    return httpResponse.status(200).json({ success: true, summary });
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
