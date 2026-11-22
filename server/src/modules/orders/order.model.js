/**
 * @AUTHOR: Garima Mittal
 * @FILE: order.model.js
 * @RESPONSIBILITY: Mongoose schema defining commercial quotations, confirmed project orders, BOM line items, payments, specialised installation crews and the immutable crew modification log.
 * @DEPENDENCIES: mongoose, erpConfig.js
 */

import mongoose from 'mongoose';
import { auditPlugin } from '../../core/auditPlugin.js';

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

const paymentRecordSchema = new mongoose.Schema(
  {
    paymentKind: { type: String, enum: ['ADVANCE', 'BALANCE'], required: true },
    amountInr: { type: Number, required: true },
    paymentMode: { type: String, default: 'UPI' },
    transactionReference: { type: String, default: '' },
    invoiceReference: { type: String, default: '' },
    recordedAt: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    recordedByName: { type: String, default: '' }
  },
  { _id: false }
);

const crewChangeSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    label: { type: String, required: true },
    oldValue: { type: String, default: '' },
    newValue: { type: String, default: '' }
  },
  { _id: false }
);

// Append-only audit trail: entries are only ever pushed by order.service.js, never edited or removed.
const crewModificationLogEntrySchema = new mongoose.Schema(
  {
    action: { type: String, enum: ['ASSIGNED', 'MODIFIED'], required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    changedByName: { type: String, default: '' },
    changes: [crewChangeSchema]
  },
  { _id: false }
);

const dispatchPlanItemSchema = new mongoose.Schema(
  {
    stockItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockItem', required: true },
    itemName: { type: String, required: true },
    stockGroup: { type: String, default: '' },
    quantity: { type: Number, required: true }
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
    paymentHistory: [paymentRecordSchema],
    // Lifecycle: Draft -> Advance_Paid -> BALANCE_DUE (leftover pay) -> Packed -> Dispatched -> Installed -> Done
    orderWorkflowStatus: {
      type: String,
      enum: ['Draft', 'Advance_Paid', 'BALANCE_DUE', 'Packed', 'Dispatched', 'Installed', 'Done', 'Cancelled'],
      default: 'Draft',
      required: true
    },
    assignedTechnicians: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    inverterTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rooftopTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    wiringTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    scheduledInstallationDate: { type: Date, default: null },
    crewModificationLog: [crewModificationLogEntrySchema],
    dispatchEquipmentPlan: [dispatchPlanItemSchema],
    dispatchEquipmentReserved: { type: Boolean, default: false },
    subsidyApplicationStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'DOCUMENTS_VERIFIED', 'INSPECTION_PENDING', 'SUBMITTED', 'SUBSIDY_DISBURSED'],
      default: 'NOT_SUBMITTED'
    },
    subsidyCompliance: {
      dcrPanelVerified: { type: Boolean, default: false },
      serialsLinked: { type: Boolean, default: false },
      roofPhotoProof: { type: Boolean, default: false },
      homeownerSigned: { type: Boolean, default: false }
    },
    subsidyDisbursedDate: { type: Date, default: null },
    customerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    onboardingStage: {
      type: String,
      enum: ['PENDING_ACTIVATION', 'STAGE_2_ACTIVATED'],
      default: 'PENDING_ACTIVATION'
    },
    stage2EmailDispatchedAt: { type: Date, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false }
);

// Friendly aliases used by the QA brief: advancePaid / balanceDue
projectOrderEntitySchema.virtual('advancePaid').get(function advancePaidAlias() {
  return this.advancePaymentAmountInr;
});
projectOrderEntitySchema.virtual('balanceDue').get(function balanceDueAlias() {
  return this.balancePaymentDueInr;
});

projectOrderEntitySchema.plugin(auditPlugin);

export const OrderModel = mongoose.model('ProjectOrder', projectOrderEntitySchema);
