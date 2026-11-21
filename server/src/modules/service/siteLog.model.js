/**
 * @AUTHOR: Garima Mittal
 * @FILE: siteLog.model.js
 * @RESPONSIBILITY: Mongoose schema recording field installation execution logs, roof completion photos, and customer digital signatures.
 * @DEPENDENCIES: mongoose
 */

import mongoose from 'mongoose';

const siteExecutionLogSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectOrder',
      required: true
    },
    orderReference: {
      type: String,
      required: true
    },
    customerFullName: {
      type: String,
      required: true
    },
    installationStartTime: {
      type: Date,
      required: true
    },
    installationFinishTime: {
      type: Date,
      required: true
    },
    confirmedCapacityKw: {
      type: Number,
      required: true
    },
    powerGenerationTestedWatts: {
      type: Number,
      required: true
    },
    finishedRoofPhotos: [{
      type: String,
      required: true
    }],
    homeownerSignatureDataUrl: {
      type: String,
      required: true
    },
    technicianNotes: {
      type: String,
      default: ''
    },
    leadTechnicianUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    completionStatus: {
      type: String,
      enum: ['PENDING_SIGNATURE', 'CONFIRMED_AND_ACCEPTED'],
      default: 'CONFIRMED_AND_ACCEPTED'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

export const SiteLogModel = mongoose.model('SiteLog', siteExecutionLogSchema);
