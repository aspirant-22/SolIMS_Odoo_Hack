/**
 * @AUTHOR: Garima Mittal
 * @FILE: service.validation.js
 * @RESPONSIBILITY: Zod boundary schemas for roof signoff logging, warranty lookups, and support ticket progression.
 * @DEPENDENCIES: zod
 */

import { z } from 'zod';

export const submitRoofSignoffValidationSchema = z.object({
  orderId: z.string().min(1, 'Project order ID required'),
  installationStartTime: z.string().min(1, 'Start time required'),
  installationFinishTime: z.string().min(1, 'Finish time required'),
  confirmedCapacityKw: z.number().int().min(1).max(5),
  powerGenerationTestedWatts: z.number().positive('Power generation must be verified'),
  finishedRoofPhotos: z.array(z.string()).min(1, 'At least 1 roof photo required'),
  homeownerSignatureDataUrl: z.string().min(10, 'Homeowner digital signature required'),
  technicianNotes: z.string().optional().default('')
});

export const createServiceTicketValidationSchema = z.object({
  targetSerialNumber: z.string().min(3, 'Target serial number required'),
  reportedFaultCode: z.string().default('ERR_ZERO_POWER'),
  issueDescription: z.string().min(5, 'Issue description required')
});

export const recordTicketPaymentValidationSchema = z.object({
  paymentMode: z.enum(['UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD']).default('UPI'),
  transactionReference: z.string().min(2, 'Transaction reference required'),
  paymentAmountInr: z.number().positive().optional()
});

export const resolveTicketValidationSchema = z.object({
  resolutionNotes: z.string().min(3, 'Resolution notes required'),
  customerConfirmedWorking: z.boolean()
});
