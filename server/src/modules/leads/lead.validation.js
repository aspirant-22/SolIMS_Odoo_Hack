/**
 * @AUTHOR: Garima Mittal
 * @FILE: lead.validation.js
 * @RESPONSIBILITY: Zod boundary schemas for inquiry intake, survey scheduling, measurements and approvals with plain-language field errors.
 * @DEPENDENCIES: zod
 */

import { z } from 'zod';

const PHONE_MESSAGE = 'Phone number must be exactly 10 digits (for example 9811000000).';
const POSITIVE_MESSAGE = (label) => `${label} must be a number greater than 0.`;

const positiveNumber = (label) =>
  z.number({ invalid_type_error: POSITIVE_MESSAGE(label), required_error: POSITIVE_MESSAGE(label) })
    .refine((n) => Number.isFinite(n) && n > 0, POSITIVE_MESSAGE(label));

export const createLeadInquiryValidationSchema = z.object({
  customerFullName: z.string().trim().min(2, 'Customer name must be at least 2 characters.'),
  customerPhoneNumber: z.string().trim().refine((value) => {
    const digits = value.replace(/\D/g, '');
    if (!/^[+\d\s()-]+$/.test(value)) return false;
    return digits.length === 10 || (digits.length === 12 && digits.startsWith('91')) || (digits.length === 11 && digits.startsWith('0'));
  }, PHONE_MESSAGE),
  customerEmailAddress: z.string().trim().email('Please enter a valid email address (for example name@example.com).'),
  installationSiteAddress: z.string().trim().min(5, 'Please enter the full site address (at least 5 characters).'),
  approximateRoofAreaSqFt: positiveNumber('Roof area'),
  averageMonthlyElectricityBillInr: positiveNumber('Monthly electricity bill'),
  requestedCapacityKw: z.number().int().min(1, 'System size must be between 1 and 5 kW.').max(5, 'System size must be between 1 and 5 kW.'),
  requestedVariant: z.enum(['ON_GRID', 'OFF_GRID']),
  isSubsidyEligible: z.boolean().default(true)
});

export const scheduleSurveyValidationSchema = z.object({
  technicianUserId: z.string().min(1, 'Please select a technician for the survey.'),
  scheduledVisitDate: z.string().optional()
});

export const recordSurveyResultsValidationSchema = z.object({
  azimuthDirection: z.enum(['South', 'South-West', 'South-East', 'West', 'East', 'North']),
  tiltAngleDegrees: z.number({ invalid_type_error: 'Tilt angle must be a number between 0 and 90.' })
    .min(0, 'Tilt angle must be between 0 and 90 degrees.')
    .max(90, 'Tilt angle must be between 0 and 90 degrees.'),
  cableDistanceMeters: positiveNumber('Cable distance'),
  shadowFreeAreaSqFt: positiveNumber('Shadow-free area'),
  roofStructureType: z.enum(['RCC Flat', 'Tin Shade', 'Sloped Tile', 'Industrial Metal Sheet']),
  gridConnectionVoltage: z.enum(['Single-Phase 230V', 'Three-Phase 415V']),
  surveyRemarks: z.string().optional().default('')
});

export const approveSurveyValidationSchema = z.object({
  isApproved: z.boolean(),
  rejectionReason: z.string().optional().default('')
});
