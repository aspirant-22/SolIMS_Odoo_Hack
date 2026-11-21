/**
 * @AUTHOR: Garima Mittal
 * @FILE: order.service.js
 * @RESPONSIBILITY: Auto-generates exact Bill of Materials, manages commercial quotes, captures advance payments, and schedules crews.
 * @DEPENDENCIES: order.model.js, lead.model.js, sequenceRegistry.js, socketEmitter.js, journalEntry.model.js, erpConfig.js
 */

import { OrderModel } from './order.model.js';
import { LeadModel } from '../leads/lead.model.js';
import { JournalEntryModel } from '../accounting/journalEntry.model.js';
import { getNextSequenceNumber } from '../../core/sequenceRegistry.js';
import { emitErpEvent } from '../../core/socketEmitter.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';

export const computeAutomatedBillOfMaterials = (capacityKw, systemVariant) => {
  const panelQuantity = capacityKw * ERP_SYSTEM_CONFIG.BOM_TEMPLATES.PANEL_COUNT_PER_KW;
  const panelUnitPrice = 11000;
  const inverterUnitPrice = capacityKw * 12000 + 10000;
  const standsUnitPrice = 4500;
  const wiringUnitPrice = 3500;
  const earthingUnitPrice = 4000;
  const installationFee = capacityKw * 3500;

  const generatedBomList = [
    {
      componentName: `Mono PERC 550W Half-Cut Solar Panels (Batch of ${panelQuantity})`,
      itemCategory: 'SOLAR_PANELS',
      quantityRequired: panelQuantity,
      unitOfMeasure: 'Panels',
      unitPriceInr: panelUnitPrice,
      totalPriceInr: panelQuantity * panelUnitPrice,
      requiresSerialTracking: true,
      allocatedSerialNumbers: []
    },
    {
      componentName: `${capacityKw} kW Smart Solar Inverter (${systemVariant === 'OFF_GRID' ? 'Hybrid' : 'Grid-Tied'})`,
      itemCategory: 'INVERTER',
      quantityRequired: 1,
      unitOfMeasure: 'Unit',
      unitPriceInr: inverterUnitPrice,
      totalPriceInr: inverterUnitPrice,
      requiresSerialTracking: true,
      allocatedSerialNumbers: []
    },
    {
      componentName: `Galvanized High-Wind Elevated Roof Mounting Stands (${capacityKw} kW)`,
      itemCategory: 'STANDS',
      quantityRequired: capacityKw,
      unitOfMeasure: 'Sets',
      unitPriceInr: standsUnitPrice,
      totalPriceInr: capacityKw * standsUnitPrice,
      requiresSerialTracking: false,
      allocatedSerialNumbers: []
    },
    {
      componentName: 'Dual ACDB & DCDB Surge Protection Distribution Enclosures',
      itemCategory: 'WIRING_BOX',
      quantityRequired: 1,
      unitOfMeasure: 'Set',
      unitPriceInr: wiringUnitPrice,
      totalPriceInr: wiringUnitPrice,
      requiresSerialTracking: false,
      allocatedSerialNumbers: []
    },
    {
      componentName: 'Pure Copper Chemical Earthing Kit with Lightning Arrestor',
      itemCategory: 'SAFETY_EARTHING',
      quantityRequired: 1,
      unitOfMeasure: 'Kit',
      unitPriceInr: earthingUnitPrice,
      totalPriceInr: earthingUnitPrice,
      requiresSerialTracking: false,
      allocatedSerialNumbers: []
    },
    {
      componentName: 'Site Engineering, Roof Mounting & Net-Metering Testing Service',
      itemCategory: 'SERVICE',
      quantityRequired: 1,
      unitOfMeasure: 'Project',
      unitPriceInr: installationFee,
      totalPriceInr: installationFee,
      requiresSerialTracking: false,
      allocatedSerialNumbers: []
    }
  ];

  if (systemVariant === 'OFF_GRID') {
    const batteryCount = capacityKw >= 3 ? 2 : 1;
    const batteryUnitPrice = 32000;
    const controllerUnitPrice = 8500;

    generatedBomList.push({
      componentName: `Deep Cycle LiFePO4 48V 150Ah Solar Battery Bank`,
      itemCategory: 'BATTERY',
      quantityRequired: batteryCount,
      unitOfMeasure: 'Units',
      unitPriceInr: batteryUnitPrice,
      totalPriceInr: batteryCount * batteryUnitPrice,
      requiresSerialTracking: true,
      allocatedSerialNumbers: []
    });

    generatedBomList.push({
      componentName: `Smart MPPT 60A Solar Charge Controller`,
      itemCategory: 'CHARGE_CONTROLLER',
      quantityRequired: 1,
      unitOfMeasure: 'Unit',
      unitPriceInr: controllerUnitPrice,
      totalPriceInr: controllerUnitPrice,
      requiresSerialTracking: true,
      allocatedSerialNumbers: []
    });
  }

  return generatedBomList;
};

export const calculateEstimatedSubsidyAmount = (capacityKw, isSubsidyEligible) => {
  if (!isSubsidyEligible) return 0;
  if (capacityKw === 1) return ERP_SYSTEM_CONFIG.SUBSIDY_BENCHMARKS.UP_TO_1KW_INR;
  if (capacityKw === 2) return ERP_SYSTEM_CONFIG.SUBSIDY_BENCHMARKS.UP_TO_2KW_INR;
  return ERP_SYSTEM_CONFIG.SUBSIDY_BENCHMARKS.THREE_KW_AND_ABOVE_INR;
};

export const generateQuoteForLeadInquiry = async (leadInquiryId, customDiscountInr = 0, creatorUserId) => {
  const leadRecord = await LeadModel.findById(leadInquiryId);
  if (!leadRecord) throw new Error('Lead inquiry not found');
  if (leadRecord.inquiryWorkflowStatus !== 'Approved') {
    throw new Error('Guardrail violation: Quotation can only be generated after technical survey approval');
  }

  const generatedQuoteRef = await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.QUOTE);
  const calculatedBom = computeAutomatedBillOfMaterials(leadRecord.requestedCapacityKw, leadRecord.requestedVariant);
  const grossTotal = calculatedBom.reduce((sum, item) => sum + item.totalPriceInr, 0) - customDiscountInr;
  const subsidyAmount = calculateEstimatedSubsidyAmount(leadRecord.requestedCapacityKw, leadRecord.isSubsidyEligible);
  const netPayable = Math.max(0, grossTotal - subsidyAmount);

  const createdOrderQuote = await OrderModel.create({
    quotationReference: generatedQuoteRef,
    leadInquiryId: leadRecord._id,
    customerFullName: leadRecord.customerFullName,
    customerPhoneNumber: leadRecord.customerPhoneNumber,
    customerEmailAddress: leadRecord.customerEmailAddress,
    installationSiteAddress: leadRecord.installationSiteAddress,
    systemCapacityKw: leadRecord.requestedCapacityKw,
    systemVariant: leadRecord.requestedVariant,
    billOfMaterials: calculatedBom,
    grossTotalAmountInr: grossTotal,
    estimatedSubsidyAmountInr: subsidyAmount,
    netPayableAmountInr: netPayable,
    balancePaymentDueInr: netPayable,
    orderWorkflowStatus: 'Draft',
    updatedBy: creatorUserId
  });

  leadRecord.inquiryWorkflowStatus = 'Quoted';
  leadRecord.quoteGeneratedReference = generatedQuoteRef;
  await leadRecord.save();

  emitErpEvent('QUOTATION_GENERATED', { quote: createdOrderQuote });
  return createdOrderQuote;
};

export const processAdvancePaymentForOrder = async (orderId, paymentAmountInr, paymentMode, transactionReference, recordingUserId) => {
  const orderRecord = await OrderModel.findById(orderId);
  if (!orderRecord) throw new Error('Order not found');

  const minimumRequiredAdvance = orderRecord.netPayableAmountInr * ERP_SYSTEM_CONFIG.MINIMUM_ADVANCE_PERCENTAGE;
  if (paymentAmountInr < minimumRequiredAdvance) {
    throw new Error(`Minimum advance requirement not met: Required ₹${minimumRequiredAdvance.toLocaleString('en-IN')}`);
  }

  if (!orderRecord.orderReference) {
    orderRecord.orderReference = await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.ORDER);
  }

  orderRecord.advancePaymentAmountInr += paymentAmountInr;
  orderRecord.balancePaymentDueInr = Math.max(0, orderRecord.netPayableAmountInr - orderRecord.advancePaymentAmountInr);
  orderRecord.orderWorkflowStatus = 'Advance_Paid';
  orderRecord.updatedBy = recordingUserId;
  await orderRecord.save();

  // Immutable Double-Entry Ledger Posting: Bank (Debit) vs Customer Advance Liability (Credit)
  const journalRef = await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.JOURNAL);
  await JournalEntryModel.create({
    entryReference: journalRef,
    orderReference: orderRecord.orderReference,
    entryCategory: 'ADVANCE_PAYMENT',
    narrativeDescription: `Advance payment collected via ${paymentMode} ref: ${transactionReference} for ${orderRecord.customerFullName}`,
    journalLines: [
      { accountCode: '1010', accountName: 'Cash / Bank Current Account', debitAmountInr: paymentAmountInr, creditAmountInr: 0 },
      { accountCode: '2010', accountName: 'Customer Advance Liabilities', debitAmountInr: 0, creditAmountInr: paymentAmountInr }
    ],
    updatedBy: recordingUserId
  });

  emitErpEvent('ORDER_CONFIRMED', { order: orderRecord });
  return orderRecord;
};

export const assignCrewToProjectOrder = async (orderId, technicianIdsArray, scheduledInstallationDate, assigningUserId) => {
  const orderRecord = await OrderModel.findById(orderId);
  if (!orderRecord) throw new Error('Order not found');

  orderRecord.assignedTechnicians = technicianIdsArray;
  orderRecord.scheduledInstallationDate = new Date(scheduledInstallationDate);
  orderRecord.updatedBy = assigningUserId;
  await orderRecord.save();

  emitErpEvent('CREW_ASSIGNED', { order: orderRecord });
  return orderRecord;
};

export const fetchAllProjectOrders = async (filterQuery = {}) => {
  return OrderModel.find(filterQuery)
    .populate('assignedTechnicians', 'fullName email phoneNumber')
    .sort({ createdAt: -1 });
};

export const fetchProjectOrderById = async (orderId) => {
  return OrderModel.findById(orderId)
    .populate('assignedTechnicians', 'fullName email phoneNumber');
};
