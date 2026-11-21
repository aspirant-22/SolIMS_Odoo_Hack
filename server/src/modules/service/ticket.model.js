/**
 * @AUTHOR: Garima Mittal
 * @FILE: ticket.model.js
 * @RESPONSIBILITY: Mongoose schema tracking customer breakdown tickets, live warranty evaluations, and automated repair billing.
 * @DEPENDENCIES: mongoose, erpConfig.js
 */

import mongoose from 'mongoose';
import { auditPlugin } from '../../core/auditPlugin.js';

const serviceTicketEntitySchema = new mongoose.Schema(
  {
    ticketReference: {
      type: String,
      required: true,
      unique: true
    },
    customerFullName: {
      type: String,
      required: true
    },
    customerPhoneNumber: {
      type: String,
      required: true
    },
    installationSiteAddress: {
      type: String,
      required: true
    },
    targetSerialNumber: {
      type: String,
      required: true
    },
    assetCategory: {
      type: String,
      enum: ['INVERTER', 'BATTERY', 'CHARGE_CONTROLLER', 'SOLAR_PANELS'],
      required: true
    },
    reportedFaultCode: {
      type: String,
      default: 'ERR_ZERO_POWER'
    },
    issueDescription: {
      type: String,
      required: true
    },
    isUnderActiveWarranty: {
      type: Boolean,
      required: true
    },
    warrantyExpiryDate: {
      type: Date,
      required: true
    },
    sparePartCostInr: {
      type: Number,
      required: true,
      default: 0
    },
    laborChargeCostInr: {
      type: Number,
      required: true,
      default: 0
    },
    totalPayableAmountInr: {
      type: Number,
      required: true,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'NOT_REQUIRED'],
      default: 'NOT_REQUIRED',
      required: true
    },
    paymentDetails: {
      paymentMode: { type: String, default: null },
      transactionReference: { type: String, default: null },
      paidAmountInr: { type: Number, default: 0 },
      paidTimestamp: { type: Date, default: null }
    },
    ticketWorkflowStatus: {
      type: String,
      enum: ['Draft', 'Diagnosed', 'Parts_Replaced', 'Done', 'Cancelled'],
      default: 'Draft',
      required: true
    },
    resolutionConfirmationByCustomer: {
      type: Boolean,
      default: false
    },
    assignedTechnicianUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    technicianResolutionNotes: {
      type: String,
      default: ''
    },
    resolvedTimestamp: {
      type: Date,
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

serviceTicketEntitySchema.plugin(auditPlugin);

export const TicketModel = mongoose.model('ServiceTicket', serviceTicketEntitySchema);
