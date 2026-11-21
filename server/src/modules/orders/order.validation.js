/**
 * @AUTHOR: Garima Mittal
 * @FILE: order.validation.js
 * @RESPONSIBILITY: Zod boundary schemas for generating quotes, capturing payments, and updating order status.
 * @DEPENDENCIES: zod
 */

import { z } from 'zod';

export const generateQuoteFromLeadValidationSchema = z.object({
  leadInquiryId: z.string().min(1, 'Lead inquiry ID required'),
  customDiscountInr: z.number().nonnegative().optional().default(0)
});

export const captureOrderPaymentValidationSchema = z.object({
  paymentAmountInr: z.number().positive('Payment amount must be greater than zero'),
  paymentMode: z.enum(['UPI', 'NEFT_RTGS', 'CHEQUE', 'CASH', 'CREDIT_CARD']),
  transactionReference: z.string().min(3, 'Transaction reference required')
});

export const assignInstallationCrewValidationSchema = z.object({
  technicianIdsArray: z.array(z.string()).min(1, 'At least one technician must be assigned'),
  scheduledInstallationDate: z.string().min(1, 'Scheduled date required')
});

export const updateSubsidyStatusValidationSchema = z.object({
  subsidyStatus: z.enum(['NOT_SUBMITTED', 'DOCUMENTS_VERIFIED', 'INSPECTION_PENDING', 'SUBSIDY_DISBURSED'])
});
