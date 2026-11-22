/**
 * @AUTHOR: Garima Mittal
 * @FILE: guardrails.test.js
 * @RESPONSIBILITY: Zero-dependency Node built-in test suite verifying core SolIMS ERP business rules & guardrails.
 * @RULES_VERIFIED:
 *   (a) Quote blocked prior to technical survey approval
 *   (b) Advance payment <20% strictly blocked
 *   (c) Warranty clock auto-calculation across hardware categories (2-Yr Inverter/Battery, 20-Yr Solar Panels)
 *   (d) 18-mo ₹0 vs 26-mo ₹9,700 ticket billing logic
 *   (e) Double-entry general ledger Debit === Credit balance enforcement
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { ERP_SYSTEM_CONFIG } from '../src/config/erpConfig.js';

// --- Domain Logic Functions for Pure Unit Verification ---

/**
 * Guardrail A: Quotation Gate
 * Validates that quotes can only be generated after survey is Approved.
 */
export const validateQuoteGenerationEligibility = (lead) => {
  const statusNormalized = String(lead?.inquiryWorkflowStatus || lead?.status || '').toUpperCase();
  const isEligible = ['APPROVED', 'QUOTED'].includes(statusNormalized) || Boolean(lead?.quoteGeneratedReference);
  if (!isEligible) {
    throw new Error('Guardrail violation: Quotation can only be generated after technical survey approval');
  }
  return true;
};

/**
 * Guardrail B: Minimum 20% Advance Gate
 */
export const validateAdvancePaymentGate = (paymentAmount, netPayableAmount) => {
  const minRequiredAdvance = Math.ceil(netPayableAmount * ERP_SYSTEM_CONFIG.MINIMUM_ADVANCE_PERCENTAGE);
  if (paymentAmount < minRequiredAdvance) {
    throw new Error(
      `Advance payment must be at least 20% of the total quote amount (Minimum: ₹${minRequiredAdvance.toLocaleString('en-IN')})`
    );
  }
  if (paymentAmount > netPayableAmount) {
    throw new Error('Advance payment cannot exceed net payable amount');
  }
  return { valid: true, minRequiredAdvance };
};

/**
 * Guardrail C: Warranty Clock Auto-Calculation
 */
export const calculateWarrantyClock = (assetCategory, dispatchDate, referenceDate = new Date()) => {
  let durationDays = 730; // default 2 years
  if (assetCategory === 'SOLAR_PANELS') {
    durationDays = ERP_SYSTEM_CONFIG.WARRANTY_DAYS.SOLAR_PANELS; // 7300 days (20 years)
  } else if (assetCategory === 'INVERTER') {
    durationDays = ERP_SYSTEM_CONFIG.WARRANTY_DAYS.INVERTER; // 730 days (2 years)
  } else if (assetCategory === 'BATTERY') {
    durationDays = ERP_SYSTEM_CONFIG.WARRANTY_DAYS.BATTERY_STORAGE; // 730 days (2 years)
  } else if (assetCategory === 'CHARGE_CONTROLLER') {
    durationDays = ERP_SYSTEM_CONFIG.WARRANTY_DAYS.CHARGE_CONTROLLER; // 1095 days (3 years)
  }

  const dispatchMs = new Date(dispatchDate).getTime();
  const expiryTimestamp = new Date(dispatchMs + durationDays * 86400000);
  const refMs = new Date(referenceDate).getTime();
  const isUnderActiveWarranty = expiryTimestamp.getTime() > refMs;
  const remainingDays = isUnderActiveWarranty
    ? Math.max(0, Math.ceil((expiryTimestamp.getTime() - refMs) / 86400000))
    : 0;

  return {
    durationDays,
    warrantyExpiresTimestamp: expiryTimestamp,
    isUnderActiveWarranty,
    remainingDays
  };
};

/**
 * Guardrail D: 18-Month vs 26-Month Ticket Repair Billing
 */
export const evaluateTicketRepairBilling = (assetCategory, isUnderActiveWarranty) => {
  if (isUnderActiveWarranty) {
    return {
      sparePartCostInr: 0,
      laborChargeCostInr: 0,
      totalPayableAmountInr: 0,
      paymentStatus: 'NOT_REQUIRED',
      coverageSummary: 'Covered under Manufacturer Warranty: ₹0 Parts & Labor'
    };
  }

  let sparePartCost = 0;
  if (assetCategory === 'INVERTER') {
    sparePartCost = ERP_SYSTEM_CONFIG.BOM_TEMPLATES.DEFAULT_INVERTER_OUT_OF_WARRANTY_COST_INR; // 8500
  } else if (assetCategory === 'BATTERY') {
    sparePartCost = ERP_SYSTEM_CONFIG.BOM_TEMPLATES.DEFAULT_BATTERY_OUT_OF_WARRANTY_COST_INR; // 15000
  }
  const laborCharge = ERP_SYSTEM_CONFIG.BOM_TEMPLATES.OUT_OF_WARRANTY_VISIT_FEE_INR; // 1200
  const totalPayable = sparePartCost + laborCharge;

  return {
    sparePartCostInr: sparePartCost,
    laborChargeCostInr: laborCharge,
    totalPayableAmountInr: totalPayable,
    paymentStatus: 'PENDING',
    coverageSummary: `Out-of-warranty: Parts ₹${sparePartCost} + Labor ₹${laborCharge} = ₹${totalPayable}`
  };
};

/**
 * Guardrail E: Double-Entry Parity Validator
 */
export const validateDoubleEntryBalance = (journalLines) => {
  if (!Array.isArray(journalLines) || journalLines.length < 2) {
    throw new Error('Double-entry violation: A journal entry must contain at least 2 lines');
  }

  const totalDebits = journalLines.reduce((sum, line) => sum + (Number(line.debitAmountInr) || 0), 0);
  const totalCredits = journalLines.reduce((sum, line) => sum + (Number(line.creditAmountInr) || 0), 0);

  const roundedDebits = Math.round(totalDebits * 100) / 100;
  const roundedCredits = Math.round(totalCredits * 100) / 100;

  if (Math.abs(roundedDebits - roundedCredits) > 0.01) {
    throw new Error(
      `Double-entry violation: Total debits (₹${roundedDebits}) must strictly equal total credits (₹${roundedCredits})`
    );
  }

  return {
    isBalanced: true,
    totalDebitAmountInr: roundedDebits,
    totalCreditAmountInr: roundedCredits
  };
};

// --- Test Suite Execution ---

test('(a) Quote blocked prior to survey approval', () => {
  // 1. Unapproved stages must be blocked
  assert.throws(
    () => validateQuoteGenerationEligibility({ inquiryWorkflowStatus: 'Draft' }),
    /Quotation can only be generated after technical survey approval/
  );

  assert.throws(
    () => validateQuoteGenerationEligibility({ inquiryWorkflowStatus: 'Survey_Scheduled' }),
    /Quotation can only be generated after technical survey approval/
  );

  assert.throws(
    () => validateQuoteGenerationEligibility({ inquiryWorkflowStatus: 'Survey_Completed' }),
    /Quotation can only be generated after technical survey approval/
  );

  // 2. Approved stage must succeed
  const resultApproved = validateQuoteGenerationEligibility({ inquiryWorkflowStatus: 'Approved' });
  assert.equal(resultApproved, true);

  // 3. Existing quote reference must allow re-quote
  const resultQuoted = validateQuoteGenerationEligibility({
    inquiryWorkflowStatus: 'Quoted',
    quoteGeneratedReference: 'QT/2026/0001'
  });
  assert.equal(resultQuoted, true);
});

test('(b) <20% advance blocked', () => {
  const netPayable = 200000;
  const required20Percent = 40000;

  // 19.999% advance (₹39,999) must be rejected
  assert.throws(
    () => validateAdvancePaymentGate(39999, netPayable),
    /Advance payment must be at least 20%/
  );

  // ₹0 advance must be rejected
  assert.throws(
    () => validateAdvancePaymentGate(0, netPayable),
    /Advance payment must be at least 20%/
  );

  // Exact 20% advance (₹40,000) must pass
  const validExact = validateAdvancePaymentGate(40000, netPayable);
  assert.equal(validExact.valid, true);
  assert.equal(validExact.minRequiredAdvance, required20Percent);

  // >20% advance (₹50,000, 25%) must pass
  const validHigher = validateAdvancePaymentGate(50000, netPayable);
  assert.equal(validHigher.valid, true);

  // >100% advance (₹2,50,000) must be rejected
  assert.throws(
    () => validateAdvancePaymentGate(250000, netPayable),
    /cannot exceed net payable/
  );
});

test('(c) Warranty clock auto-calculation', () => {
  const baseDate = new Date('2026-06-01T00:00:00Z');

  // Inverter: 2 years (730 days)
  const inverterClock = calculateWarrantyClock('INVERTER', baseDate, baseDate);
  assert.equal(inverterClock.durationDays, 730);
  assert.equal(inverterClock.isUnderActiveWarranty, true);
  assert.equal(inverterClock.remainingDays, 730);

  // Battery: 2 years (730 days)
  const batteryClock = calculateWarrantyClock('BATTERY', baseDate, baseDate);
  assert.equal(batteryClock.durationDays, 730);
  assert.equal(batteryClock.isUnderActiveWarranty, true);

  // Solar Panels: 20 years (7300 days)
  const panelClock = calculateWarrantyClock('SOLAR_PANELS', baseDate, baseDate);
  assert.equal(panelClock.durationDays, 7300);
  assert.equal(panelClock.isUnderActiveWarranty, true);
  assert.equal(panelClock.remainingDays, 7300);

  // Active check after 18 months (547 days): should have 183 days left
  const dateAfter18Mo = new Date(baseDate.getTime() + 547 * 86400000);
  const active18Mo = calculateWarrantyClock('INVERTER', baseDate, dateAfter18Mo);
  assert.equal(active18Mo.isUnderActiveWarranty, true);
  assert.equal(active18Mo.remainingDays, 183);

  // Expired check after 26 months (790 days): should be expired
  const dateAfter26Mo = new Date(baseDate.getTime() + 790 * 86400000);
  const expired26Mo = calculateWarrantyClock('INVERTER', baseDate, dateAfter26Mo);
  assert.equal(expired26Mo.isUnderActiveWarranty, false);
  assert.equal(expired26Mo.remainingDays, 0);
});

test('(d) 18-mo ₹0 vs 26-mo ₹9,700 ticket billing', () => {
  // Scenario A: 18-month inverter breakdown under active warranty -> ₹0
  const active18MoBilling = evaluateTicketRepairBilling('INVERTER', true);
  assert.equal(active18MoBilling.sparePartCostInr, 0);
  assert.equal(active18MoBilling.laborChargeCostInr, 0);
  assert.equal(active18MoBilling.totalPayableAmountInr, 0);
  assert.equal(active18MoBilling.paymentStatus, 'NOT_REQUIRED');

  // Scenario B: 26-month inverter breakdown with expired warranty -> ₹9,700 (₹8,500 + ₹1,200)
  const expired26MoBilling = evaluateTicketRepairBilling('INVERTER', false);
  assert.equal(expired26MoBilling.sparePartCostInr, 8500);
  assert.equal(expired26MoBilling.laborChargeCostInr, 1200);
  assert.equal(expired26MoBilling.totalPayableAmountInr, 9700);
  assert.equal(expired26MoBilling.paymentStatus, 'PENDING');

  // Scenario C: Battery out of warranty -> ₹15,200 (₹14,000 parts + ₹1,200 labor)
  const batteryExpiredBilling = evaluateTicketRepairBilling('BATTERY', false);
  assert.equal(batteryExpiredBilling.sparePartCostInr, ERP_SYSTEM_CONFIG.BOM_TEMPLATES.DEFAULT_BATTERY_OUT_OF_WARRANTY_COST_INR);
  assert.equal(batteryExpiredBilling.laborChargeCostInr, 1200);
  assert.equal(batteryExpiredBilling.totalPayableAmountInr, 15200);
});

test('(e) Double-entry Debit === Credit ledger balance', () => {
  // 1. Strictly balanced entry must pass
  const balancedLines = [
    { accountCode: '1010', accountName: 'Cash & Bank', debitAmountInr: 50000, creditAmountInr: 0 },
    { accountCode: '1200', accountName: 'Accounts Receivable', debitAmountInr: 0, creditAmountInr: 50000 }
  ];
  const balancedResult = validateDoubleEntryBalance(balancedLines);
  assert.equal(balancedResult.isBalanced, true);
  assert.equal(balancedResult.totalDebitAmountInr, 50000);
  assert.equal(balancedResult.totalCreditAmountInr, 50000);

  // 2. Multi-line compound balanced entry must pass
  const compoundLines = [
    { accountCode: '1010', accountName: 'Cash & Bank', debitAmountInr: 40000, creditAmountInr: 0 },
    { accountCode: '1210', accountName: 'Subsidy Receivable', debitAmountInr: 30000, creditAmountInr: 0 },
    { accountCode: '4010', accountName: 'Solar Revenue', debitAmountInr: 0, creditAmountInr: 70000 }
  ];
  const compoundResult = validateDoubleEntryBalance(compoundLines);
  assert.equal(compoundResult.isBalanced, true);
  assert.equal(compoundResult.totalDebitAmountInr, 70000);
  assert.equal(compoundResult.totalCreditAmountInr, 70000);

  // 3. Unbalanced entry must fail validation
  const unbalancedLines = [
    { accountCode: '1010', accountName: 'Cash & Bank', debitAmountInr: 50000, creditAmountInr: 0 },
    { accountCode: '1200', accountName: 'Accounts Receivable', debitAmountInr: 0, creditAmountInr: 45000 }
  ];
  assert.throws(
    () => validateDoubleEntryBalance(unbalancedLines),
    /Double-entry violation: Total debits.*must strictly equal total credits/
  );

  // 4. Single-line entry must fail validation
  assert.throws(
    () => validateDoubleEntryBalance([{ accountCode: '1010', debitAmountInr: 5000, creditAmountInr: 0 }]),
    /must contain at least 2 lines/
  );
});
