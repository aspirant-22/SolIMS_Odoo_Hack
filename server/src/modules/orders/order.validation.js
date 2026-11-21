/**
 * @AUTHOR: Garima Mittal
 * @FILE: order.validation.js
 * @RESPONSIBILITY: Zod boundary schemas for generating quotes, capturing payments, assigning specialised crews, and updating order status.
 * @DEPENDENCIES: zod
 */

import { z } from 'zod';

export const INVALID_AMOUNT_MESSAGE = 'Invalid input: Please enter a valid positive number.';

// Accepts numbers or numeric strings ("45000", "45,000.50"); rejects NaN, negatives, zero, special characters, empty.
const toStrictNumber = (rawValue) => {
  if (typeof rawValue === 'number') return rawValue;
  if (typeof rawValue === 'string') {
    const cleaned = rawValue.trim().replace(/,/g, '');
    if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN;
    return Number(cleaned);
  }
  return Number.NaN;
};

const positiveAmountSchema = z.preprocess(
  toStrictNumber,
  z.number({ invalid_type_error: INVALID_AMOUNT_MESSAGE, required_error: INVALID_AMOUNT_MESSAGE })
    .refine((n) => Number.isFinite(n), INVALID_AMOUNT_MESSAGE)
    .refine((n) => n > 0, INVALID_AMOUNT_MESSAGE)
);

// Accept legacy/alternate payload keys (advanceAmountInr, advancePaid, amount) and map them to paymentAmountInr.
const normalizePaymentPayload = (rawBody) => {
  if (!rawBody || typeof rawBody !== 'object') return rawBody;
  const aliasKeys = ['paymentAmountInr', 'advanceAmountInr', 'advancePaid', 'amount'];
  const foundKey = aliasKeys.find((key) => rawBody[key] !== undefined);
  return { ...rawBody, paymentAmountInr: foundKey ? rawBody[foundKey] : undefined };
};

const paymentModeSchema = z.string().trim().min(2).max(30).optional().default('UPI');
const transactionReferenceSchema = z.string().trim().max(60).optional();

export const generateQuoteFromLeadValidationSchema = z.object({
  leadInquiryId: z.string().min(1, 'Lead inquiry ID required'),
  customDiscountInr: z.number().nonnegative('Discount cannot be negative.').optional().default(0)
});

export const captureOrderPaymentValidationSchema = z.preprocess(
  normalizePaymentPayload,
  z.object({
    paymentAmountInr: positiveAmountSchema,
    paymentMode: paymentModeSchema,
    transactionReference: transactionReferenceSchema
  })
);

export const recordOrderPaymentValidationSchema = captureOrderPaymentValidationSchema;

const technicianIdSchema = (label) =>
  z.string({ required_error: `Please select a ${label}.`, invalid_type_error: `Please select a ${label}.` })
    .trim()
    .regex(/^[a-f\d]{24}$/i, `Please select a ${label}.`);

export const assignInstallationCrewValidationSchema = z.object({
  inverterTechnician: technicianIdSchema('Inverter Specialist'),
  rooftopTechnician: technicianIdSchema('Rooftop Mounting Technician'),
  wiringTechnician: technicianIdSchema('High-Voltage Wiring Technician'),
  scheduledInstallationDate: z
    .string({ required_error: 'Please choose a scheduled installation date.' })
    .trim()
    .min(1, 'Please choose a scheduled installation date.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Please enter a valid installation date.')
});

export const updateSubsidyStatusValidationSchema = z.object({
  subsidyStatus: z.enum(['NOT_SUBMITTED', 'DOCUMENTS_VERIFIED', 'INSPECTION_PENDING', 'SUBSIDY_DISBURSED'])
});
