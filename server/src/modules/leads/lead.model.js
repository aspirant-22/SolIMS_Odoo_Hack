/**
 * @AUTHOR: Garima Mittal
 * @FILE: lead.model.js
 * @RESPONSIBILITY: Mongoose schema representing rooftop solar inquiries, technical feasibility surveys, and approval workflows.
 * @DEPENDENCIES: mongoose, erpConfig.js
 */

import mongoose from 'mongoose';

const roofSurveySpecsSchema = new mongoose.Schema(
  {
    azimuthDirection: {
      type: String,
      enum: ['South', 'South-West', 'South-East', 'West', 'East', 'North'],
      default: 'South'
    },
    tiltAngleDegrees: {
      type: Number,
      default: 0
    },
    cableDistanceMeters: {
      type: Number,
      default: 0
    },
    shadowFreeAreaSqFt: {
      type: Number,
      default: 0
    },
    roofStructureType: {
      type: String,
      enum: ['RCC Flat', 'Tin Shade', 'Sloped Tile', 'Industrial Metal Sheet'],
      default: 'RCC Flat'
    },
    gridConnectionVoltage: {
      type: String,
      enum: ['Single-Phase 230V', 'Three-Phase 415V'],
      default: 'Single-Phase 230V'
    },
    surveyRemarks: {
      type: String,
      default: ''
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    surveyCompletedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const leadInquiryEntitySchema = new mongoose.Schema(
  {
    inquiryReference: {
      type: String,
      required: true,
      unique: true
    },
    customerFullName: {
      type: String,
      required: true,
      trim: true
    },
    customerPhoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    customerEmailAddress: {
      type: String,
      lowercase: true,
      trim: true
    },
    installationSiteAddress: {
      type: String,
      required: true
    },
    approximateRoofAreaSqFt: {
      type: Number,
      required: true
    },
    averageMonthlyElectricityBillInr: {
      type: Number,
      required: true
    },
    requestedCapacityKw: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      required: true
    },
    requestedVariant: {
      type: String,
      enum: ['ON_GRID', 'OFF_GRID'],
      default: 'ON_GRID'
    },
    isSubsidyEligible: {
      type: Boolean,
      default: true
    },
    inquiryWorkflowStatus: {
      type: String,
      enum: ['Draft', 'Survey_Scheduled', 'Survey_Completed', 'Approved', 'Quoted', 'Rejected'],
      default: 'Draft',
      required: true
    },
    surveyDetails: {
      type: roofSurveySpecsSchema,
      default: () => ({})
    },
    quoteGeneratedReference: {
      type: String,
      default: null
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

export const LeadModel = mongoose.model('Lead', leadInquiryEntitySchema);
