/**
 * @AUTHOR: Garima Mittal
 * @FILE: accounting.validation.js
 * @RESPONSIBILITY: Zod boundary schemas for manual journal entries and director financial date filtering.
 * @DEPENDENCIES: zod
 */

import { z } from 'zod';

const journalLineValidationSchema = z.object({
  accountCode: z.string().min(1),
  accountName: z.string().min(2),
  debitAmountInr: z.number().min(0),
  creditAmountInr: z.number().min(0)
});

export const createManualJournalEntryValidationSchema = z.object({
  entryCategory: z.enum([
    'ADVANCE_PAYMENT',
    'EQUIPMENT_COGS',
    'SERVICE_REVENUE',
    'TECHNICIAN_PAYROLL',
    'WARRANTY_EXPENSE',
    'SUBSIDY_RECEIVABLE'
  ]),
  narrativeDescription: z.string().min(5),
  orderReference: z.string().optional().default(null),
  journalLines: z.array(journalLineValidationSchema).min(2, 'Journal entry requires at least 2 balanced lines')
});
