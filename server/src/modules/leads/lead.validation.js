/**
 * @AUTHOR: Garima Mittal
 * @FILE: lead.validation.js
 * @RESPONSIBILITY: Zod boundary schemas for creating inquiries, scheduling site visits, and recording survey outcomes.
 * @DEPENDENCIES: zod
 */

import { z } from 'zod';

export const createLeadInquiryValidationSchema = z.object({
  customerFullName: z.string().min(2, 'Customer name must be at least 2 characters'),
  customerPhoneNumber: z.string().min(10, 'Valid 10-digit phone number required'),
  customerEmailAddress: z.string().email('Valid email address required'),
  installationSiteAddress: z.string().min(5, 'Site address required'),
  approximateRoofAreaSqFt: z.number().positive('Roof area must be greater than 0'),
  averageMonthlyElectricityBillInr: z.number().nonnegative('Electricity bill cannot be negative'),
  requestedCapacityKw: z.number().int().min(1).max(5),
  requestedVariant: z.enum(['ON_GRID', 'OFF_GRID']),
  isSubsidyEligible: z.boolean().default(true)
});

export const scheduleSurveyValidationSchema = z.object({
  technicianUserId: z.string().min(1, 'Technician assignment required'),
  scheduledVisitDate: z.string().optional()
});

export const recordSurveyResultsValidationSchema = z.object({
  azimuthDirection: z.enum(['South', 'South-West', 'South-East', 'West', 'East', 'North']),
  tiltAngleDegrees: z.number().min(0).max(90),
  cableDistanceMeters: z.number().positive(),
  shadowFreeAreaSqFt: z.number().positive(),
  roofStructureType: z.enum(['RCC Flat', 'Tin Shade', 'Sloped Tile', 'Industrial Metal Sheet']),
  gridConnectionVoltage: z.enum(['Single-Phase 230V', 'Three-Phase 415V']),
  surveyRemarks: z.string().optional().default('')
});

export const approveSurveyValidationSchema = z.object({
  isApproved: z.boolean(),
  rejectionReason: z.string().optional().default('')
});
