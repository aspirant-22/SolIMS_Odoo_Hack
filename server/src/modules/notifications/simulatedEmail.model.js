/**
 * @AUTHOR: Garima Mittal
 * @FILE: simulatedEmail.model.js
 * @RESPONSIBILITY: Mongoose schema persisting zero-config simulated email dispatches, credentials, and progressive onboarding records for offline hackathon demonstration.
 * @DEPENDENCIES: mongoose
 */

import mongoose from 'mongoose';

const simulatedEmailEntitySchema = new mongoose.Schema(
  {
    emailReference: {
      type: String,
      required: true,
      unique: true
    },
    to: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    recipientName: {
      type: String,
      required: true,
      trim: true
    },
    from: {
      type: String,
      default: 'SolIMS Solar Operations <notifications@solims.com>'
    },
    subject: {
      type: String,
      required: true
    },
    stage: {
      type: String,
      enum: ['STAGE_1_INQUIRY', 'STAGE_2_ACTIVATION', 'SYSTEM_NOTIFICATION'],
      default: 'STAGE_1_INQUIRY'
    },
    stageTitle: {
      type: String,
      default: 'Stage 1: Solar Assessment & Tracking Access'
    },
    previewText: {
      type: String,
      default: ''
    },
    htmlContent: {
      type: String,
      required: true
    },
    textContent: {
      type: String,
      required: true
    },
    magicLink: {
      type: String,
      default: ''
    },
    credentials: {
      email: { type: String, default: '' },
      temporaryPassword: { type: String, default: '' },
      portalUrl: { type: String, default: '' }
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['Lead', 'Order', 'User', 'None'],
        default: 'None'
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      },
      referenceCode: {
        type: String,
        default: ''
      }
    },
    status: {
      type: String,
      enum: ['DELIVERED_SIMULATED', 'READ'],
      default: 'DELIVERED_SIMULATED'
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export const SimulatedEmailModel = mongoose.model('SimulatedEmail', simulatedEmailEntitySchema);
