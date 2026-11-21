/**
 * @AUTHOR: Garima Mittal
 * @FILE: order.model.js
 * @RESPONSIBILITY: Mongoose schema defining commercial quotations, confirmed project orders, BOM line items, and payment status.
 * @DEPENDENCIES: mongoose, erpConfig.js
 */

import mongoose from 'mongoose';

const billOfMaterialItemSchema = new mongoose.Schema(
  {
    componentName: { type: String, required: true },
    itemCategory: {
      type: String,
      enum: ['SOLAR_PANELS', 'INVERTER', 'BATTERY', 'CHARGE_CONTROLLER', 'STANDS', 'WIRING_BOX', 'SAFETY_EARTHING', 'SERVICE'],
      required: true
    },
    quantityRequired: { type: Number, required: true },
    unitOfMeasure: { type: String, default: 'Units' },
    unitPriceInr: { type: Number, required: true },
    totalPriceInr: { type: Number, required: true },
    requiresSerialTracking: { type: Boolean, default: false },
    allocatedSerialNumbers: [{ type: String }]
  },
  { _id: false }
);

const projectOrderEntitySchema = new mongoose.Schema(
  {
    quotationReference: { type: String, required: true, unique: true },
    orderReference: { type: String, default: null, sparse: true },
    leadInquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    customerFullName: { type: String, required: true },
    customerPhoneNumber: { type: String, required: true },
    customerEmailAddress: { type: String, required: true },
    installationSiteAddress: { type: String, required: true },
    systemCapacityKw: { type: Number, enum: [1, 2, 3, 4, 5], required: true },
    systemVariant: { type: String, enum: ['ON_GRID', 'OFF_GRID'], required: true },
    billOfMaterials: [billOfMaterialItemSchema],
    grossTotalAmountInr: { type: Number, required: true },
    estimatedSubsidyAmountInr: { type: Number, default: 0 },
    netPayableAmountInr: { type: Number, required: true },
    advancePaymentAmountInr: { type: Number, default: 0 },
    balancePaymentDueInr: { type: Number, required: true },
    orderWorkflowStatus: {
      type: String,
      enum: ['Draft', 'Advance_Paid', 'Packed', 'Dispatched', 'Installed', 'Done', 'Cancelled'],
      default: 'Draft',
      required: true
    },
    assignedTechnicians: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    scheduledInstallationDate: { type: Date, default: null },
    subsidyApplicationStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'DOCUMENTS_VERIFIED', 'INSPECTION_PENDING', 'SUBSIDY_DISBURSED'],
      default: 'NOT_SUBMITTED'
    },
    subsidyDisbursedDate: { type: Date, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export const OrderModel = mongoose.model('ProjectOrder', projectOrderEntitySchema);
