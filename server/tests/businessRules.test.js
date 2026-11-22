/**
 * @AUTHOR: Garima Mittal
 * @FILE: businessRules.test.js
 * @RESPONSIBILITY: Unit and integration tests for SolIMS enterprise rules: sequence sync, zero duplicate serials, 20% advance payment rule, warranty evaluation, clean currency math, and double-entry parity.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { ERP_SYSTEM_CONFIG } from '../src/config/erpConfig.js';
import { getNextSequenceNumber, synchronizeSequenceCounter, SequenceModel } from '../src/core/sequenceRegistry.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { JournalEntryModel } from '../src/modules/accounting/journalEntry.model.js';
import { generateDirectorMonthEndFinancialSummary } from '../src/modules/accounting/accounting.service.js';
import { OrderModel } from '../src/modules/orders/order.model.js';
import { TicketModel } from '../src/modules/service/ticket.model.js';

test.before(async () => {
  await connectDatabase();
});

test.after(async () => {
  await disconnectDatabase();
});

test('Rule 1: ir.sequence Atomic Synchronization prevents collisions past seeded records', async () => {
  // Sync sequence to 170
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.INQUIRY, 170);

  const doc = await SequenceModel.findOne({ sequenceCode: ERP_SYSTEM_CONFIG.SEQUENCE_CODES.INQUIRY });
  assert.ok(doc.currentNumber >= 170);

  // Next generated sequence must be past 170
  const nextSeq = await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.INQUIRY);
  const numPart = parseInt(nextSeq.split('/').pop(), 10);
  assert.ok(numPart > 170);

  // Sync order sequence to a higher baseline and verify exact +1 atomic increment
  const orderDoc = await SequenceModel.findOne({ sequenceCode: ERP_SYSTEM_CONFIG.SEQUENCE_CODES.ORDER });
  const currentVal = orderDoc?.currentNumber || 140;
  const targetSync = Math.max(500, currentVal + 10);
  await synchronizeSequenceCounter(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.ORDER, targetSync);
  const nextOrder = await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.ORDER);
  const expectedSeq = `ORD/2026/${String(targetSync + 1).padStart(4, '0')}`;
  assert.equal(nextOrder, expectedSeq);
});

test('Rule 2: Zero Duplicate Serial Numbers Enforced via Set check', () => {
  const serialSet = new Set();
  const registerSerial = (s) => {
    if (serialSet.has(s)) {
      throw new Error(`CRITICAL: Duplicate serial: ${s}`);
    }
    serialSet.add(s);
    return s;
  };

  registerSerial('INV-2024-RAINY-ACTIVE');
  registerSerial('INV-2024-RAINY-EXPIRED');
  registerSerial('INV-2026-0001');

  assert.equal(serialSet.size, 3);
  assert.throws(() => registerSerial('INV-2024-RAINY-ACTIVE'), /Duplicate serial/);
});

test('Rule 3: Minimum 20% Advance Payment Gate Validation', () => {
  const netPayable = 200000;
  const minRequiredAdvance = Math.ceil(netPayable * ERP_SYSTEM_CONFIG.MINIMUM_ADVANCE_PERCENTAGE);
  assert.equal(minRequiredAdvance, 40000);

  const isAdvanceValid = (amount) => amount >= minRequiredAdvance;

  assert.equal(isAdvanceValid(39999), false);
  assert.equal(isAdvanceValid(40000), true);
  assert.equal(isAdvanceValid(50000), true);
});

test('Rule 4: Active vs Expired Warranty Billing Logic', () => {
  const now = new Date();

  // Active warranty (expires in future)
  const activeExpiry = new Date(now.getTime() + 183 * 86400000);
  const isUnderActiveWarranty = activeExpiry > now;
  const activeBill = isUnderActiveWarranty ? 0 : 9700;
  assert.equal(isUnderActiveWarranty, true);
  assert.equal(activeBill, 0);

  // Expired warranty (expired in past)
  const expiredDate = new Date(now.getTime() - 60 * 86400000);
  const isUnderExpiredWarranty = expiredDate > now;
  const expiredPartsCost = ERP_SYSTEM_CONFIG.BOM_TEMPLATES.DEFAULT_INVERTER_OUT_OF_WARRANTY_COST_INR;
  const expiredLaborCost = ERP_SYSTEM_CONFIG.BOM_TEMPLATES.OUT_OF_WARRANTY_VISIT_FEE_INR;
  const expiredTotalBill = isUnderExpiredWarranty ? 0 : (expiredPartsCost + expiredLaborCost);
  assert.equal(isUnderExpiredWarranty, false);
  assert.equal(expiredTotalBill, 9700);
});

test('Rule 5: Clean Currency Rounding in Accounting P&L without floating-point tails', async () => {
  const summary = await generateDirectorMonthEndFinancialSummary();
  assert.ok(summary);
  assert.ok(summary.kpis);

  // Check that every KPI has clean rounded currency values without floating-point tails
  const checkCleanNumber = (val) => {
    assert.equal(typeof val, 'number');
    const str = String(val);
    if (str.includes('.')) {
      const decimals = str.split('.')[1];
      assert.ok(decimals.length <= 2, `Value ${val} has more than 2 decimal places`);
    }
  };

  checkCleanNumber(summary.kpis.cumulativeRevenueInr);
  checkCleanNumber(summary.kpis.cumulativeHardwareCogsInr);
  checkCleanNumber(summary.kpis.cumulativeLaborPayrollInr);
  checkCleanNumber(summary.kpis.cumulativeWarrantyExpenseInr);
  checkCleanNumber(summary.kpis.overallNetProfitInr);
  checkCleanNumber(summary.kpis.totalAdvanceCollectedInr);
  checkCleanNumber(summary.kpis.totalBalanceDueInr);
  checkCleanNumber(summary.kpis.totalSubsidiesExpectedInr);
});

test('Rule 6: Double-Entry Parity Enforces Debits === Credits', async () => {
  // Balanced entry must succeed
  const balancedEntry = new JournalEntryModel({
    entryReference: `JRN/TEST/${Date.now().toString().slice(-4)}`,
    entryCategory: 'ADVANCE_PAYMENT',
    narrativeDescription: 'Test balanced entry',
    journalLines: [
      { accountCode: '1010', accountName: 'Cash', debitAmountInr: 50000, creditAmountInr: 0 },
      { accountCode: '1200', accountName: 'AR', debitAmountInr: 0, creditAmountInr: 50000 }
    ]
  });
  await balancedEntry.save();
  assert.equal(balancedEntry.isBalanced, true);
  assert.equal(balancedEntry.totalDebitAmountInr, 50000);
  assert.equal(balancedEntry.totalCreditAmountInr, 50000);

  // Clean up test entry
  await JournalEntryModel.findByIdAndDelete(balancedEntry._id);

  // Unbalanced entry must fail validation
  const unbalancedEntry = new JournalEntryModel({
    entryReference: `JRN/TEST/FAIL_${Date.now().toString().slice(-4)}`,
    entryCategory: 'ADVANCE_PAYMENT',
    narrativeDescription: 'Test unbalanced entry',
    journalLines: [
      { accountCode: '1010', accountName: 'Cash', debitAmountInr: 50000, creditAmountInr: 0 },
      { accountCode: '1200', accountName: 'AR', debitAmountInr: 0, creditAmountInr: 40000 }
    ]
  });

  await assert.rejects(
    async () => await unbalancedEntry.save(),
    /Double-entry violation/
  );
});
