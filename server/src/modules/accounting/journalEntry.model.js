/**
 * @AUTHOR: Garima Mittal
 * @FILE: journalEntry.model.js
 * @RESPONSIBILITY: Mongoose schema enforcing immutable double-entry accounting ledger entries with debit/credit parity.
 * @DEPENDENCIES: mongoose
 */

import mongoose from 'mongoose';
import { auditPlugin } from '../../core/auditPlugin.js';

const journalLineItemSchema = new mongoose.Schema(
  {
    accountCode: { type: String, required: true },
    accountName: { type: String, required: true },
    debitAmountInr: { type: Number, required: true, default: 0 },
    creditAmountInr: { type: Number, required: true, default: 0 }
  },
  { _id: false }
);

const journalEntryRecordSchema = new mongoose.Schema(
  {
    entryReference: { type: String, required: true, unique: true },
    entryDate: { type: Date, required: true, default: Date.now },
    orderReference: { type: String, default: null },
    entryCategory: {
      type: String,
      enum: ['ADVANCE_PAYMENT', 'CUSTOMER_PAYMENT', 'EQUIPMENT_COGS', 'SERVICE_REVENUE', 'TECHNICIAN_PAYROLL', 'WARRANTY_EXPENSE', 'SUBSIDY_RECEIVABLE'],
      required: true
    },
    narrativeDescription: { type: String, required: true },
    journalLines: [journalLineItemSchema],
    totalDebitAmountInr: { type: Number, required: true },
    totalCreditAmountInr: { type: Number, required: true },
    isBalanced: { type: Boolean, required: true, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

journalEntryRecordSchema.pre('validate', function (nextValidationCallback) {
  const sumDebits = this.journalLines.reduce((accum, line) => accum + (line.debitAmountInr || 0), 0);
  const sumCredits = this.journalLines.reduce((accum, line) => accum + (line.creditAmountInr || 0), 0);

  this.totalDebitAmountInr = Math.round(sumDebits * 100) / 100;
  this.totalCreditAmountInr = Math.round(sumCredits * 100) / 100;

  if (Math.abs(this.totalDebitAmountInr - this.totalCreditAmountInr) > 0.01) {
    return nextValidationCallback(new Error(`Double-entry violation: Debits (₹${this.totalDebitAmountInr}) do not equal Credits (₹${this.totalCreditAmountInr})`));
  }
  this.isBalanced = true;
  return nextValidationCallback();
});

journalEntryRecordSchema.plugin(auditPlugin);

export const JournalEntryModel = mongoose.model('JournalEntry', journalEntryRecordSchema);
