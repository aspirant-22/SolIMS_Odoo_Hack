/**
 * @AUTHOR: Garima Mittal
 * @FILE: service.service.js
 * @RESPONSIBILITY: Manages technician roof signoffs, instant warranty lookups, and automated breakdown repair ticketing.
 * @DEPENDENCIES: siteLog.model.js, ticket.model.js, serialAsset.model.js, order.model.js, sequenceRegistry.js, socketEmitter.js, erpConfig.js
 */

import { SiteLogModel } from './siteLog.model.js';
import { TicketModel } from './ticket.model.js';
import { SerialAssetModel } from '../inventory/serialAsset.model.js';
import { OrderModel } from '../orders/order.model.js';
import { JournalEntryModel } from '../accounting/journalEntry.model.js';
import { getNextSequenceNumber } from '../../core/sequenceRegistry.js';
import { emitErpEvent } from '../../core/socketEmitter.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';
import { buildOrderScopeFilter, buildCustomerPhoneRegex } from '../../core/customerScope.js';

export const submitTechnicianRoofSignoff = async (signoffPayload, leadTechnicianId) => {
  const { orderId, installationStartTime, installationFinishTime, confirmedCapacityKw, powerGenerationTestedWatts, finishedRoofPhotos, homeownerSignatureDataUrl, technicianNotes } = signoffPayload;

  const orderRecord = await OrderModel.findById(orderId);
  if (!orderRecord) throw new Error('Order not found');

  const createdSiteLog = await SiteLogModel.create({
    orderId: orderRecord._id,
    orderReference: orderRecord.orderReference || orderRecord.quotationReference,
    customerFullName: orderRecord.customerFullName,
    installationStartTime: new Date(installationStartTime),
    installationFinishTime: new Date(installationFinishTime),
    confirmedCapacityKw,
    powerGenerationTestedWatts,
    finishedRoofPhotos,
    homeownerSignatureDataUrl,
    technicianNotes,
    leadTechnicianUser: leadTechnicianId,
    completionStatus: 'CONFIRMED_AND_ACCEPTED',
    updatedBy: leadTechnicianId
  });

  orderRecord.orderWorkflowStatus = 'Installed';
  orderRecord.updatedBy = leadTechnicianId;
  await orderRecord.save();

  // Update associated serials to ACTIVE_IN_FIELD
  await SerialAssetModel.updateMany(
    { orderReference: orderRecord.orderReference },
    { $set: { assetStatus: 'ACTIVE_IN_FIELD' } }
  );

  emitErpEvent('ROOF_INSTALLATION_COMPLETED', { siteLog: createdSiteLog, order: orderRecord });
  return createdSiteLog;
};

const buildCustomerAssetFilter = async (customerUser) => {
  const ownedOrders = await OrderModel.find(buildOrderScopeFilter(customerUser)).select('orderReference');
  const orderReferences = ownedOrders.map((o) => o.orderReference).filter(Boolean);
  const clauses = [{ assignedCustomerId: customerUser._id }];
  if (orderReferences.length > 0) clauses.push({ orderReference: { $in: orderReferences } });
  const phoneRegex = buildCustomerPhoneRegex(customerUser);
  if (phoneRegex) clauses.push({ customerPhoneNumber: phoneRegex });
  return { $or: clauses };
};

export const lookupAssetWarrantyStatus = async (searchCriteriaQuery = '', customerUser = null) => {
  const sanitizedQuery = (searchCriteriaQuery || '').trim();
  const escapedQuery = sanitizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const textFilter = {
    $or: [
      { serialNumber: { $regex: escapedQuery, $options: 'i' } },
      { customerFullName: { $regex: escapedQuery, $options: 'i' } },
      { customerPhoneNumber: { $regex: escapedQuery, $options: 'i' } },
      { orderReference: { $regex: escapedQuery, $options: 'i' } }
    ]
  };

  let assetFilter = textFilter;
  if (customerUser) {
    // Customers only ever see their own hardware; an email / blank search simply lists everything they own
    const ownedFilter = await buildCustomerAssetFilter(customerUser);
    assetFilter = sanitizedQuery && !sanitizedQuery.includes('@') ? { $and: [textFilter, ownedFilter] } : ownedFilter;
  }

  const foundAssets = await SerialAssetModel.find(assetFilter);

  const now = new Date();
  return foundAssets.map((asset) => {
    const isUnderWarranty = asset.warrantyExpiresTimestamp && new Date(asset.warrantyExpiresTimestamp) > now;
    const remainingDays = asset.warrantyExpiresTimestamp
      ? Math.max(0, Math.ceil((new Date(asset.warrantyExpiresTimestamp) - now) / (1000 * 60 * 60 * 24)))
      : 0;

    let estimatedPartCost = 0;
    if (!isUnderWarranty) {
      if (asset.assetCategory === 'INVERTER') estimatedPartCost = ERP_SYSTEM_CONFIG.BOM_TEMPLATES.DEFAULT_INVERTER_OUT_OF_WARRANTY_COST_INR;
      if (asset.assetCategory === 'BATTERY') estimatedPartCost = ERP_SYSTEM_CONFIG.BOM_TEMPLATES.DEFAULT_BATTERY_OUT_OF_WARRANTY_COST_INR;
    }

    const estimatedLaborCost = isUnderWarranty ? 0 : ERP_SYSTEM_CONFIG.BOM_TEMPLATES.OUT_OF_WARRANTY_VISIT_FEE_INR;

    return {
      assetId: asset._id,
      serialNumber: asset.serialNumber,
      assetCategory: asset.assetCategory,
      modelDesignation: asset.modelDesignation,
      customerFullName: asset.customerFullName,
      customerPhoneNumber: asset.customerPhoneNumber,
      installationSiteAddress: asset.installationSiteAddress,
      orderReference: asset.orderReference,
      dispatchConfirmedTimestamp: asset.dispatchConfirmedTimestamp,
      warrantyDurationDays: asset.warrantyDurationDays,
      warrantyExpiresTimestamp: asset.warrantyExpiresTimestamp,
      isUnderActiveWarranty: isUnderWarranty,
      remainingWarrantyDays: remainingDays,
      estimatedPartCostInr: estimatedPartCost,
      estimatedLaborCostInr: estimatedLaborCost,
      totalBillableCostInr: estimatedPartCost + estimatedLaborCost
    };
  });
};

export const createBreakdownServiceTicket = async (ticketDetails, creatorUserId, customerUser = null) => {
  const { targetSerialNumber, reportedFaultCode, issueDescription } = ticketDetails;
  const assetRecord = await SerialAssetModel.findOne({ serialNumber: targetSerialNumber.trim().toUpperCase() });
  if (!assetRecord) throw new Error(`Serial number ${targetSerialNumber} not found`);

  if (customerUser) {
    const ownedMatch = await SerialAssetModel.exists({
      $and: [{ _id: assetRecord._id }, await buildCustomerAssetFilter(customerUser)]
    });
    if (!ownedMatch) {
      const ownershipError = new Error('You can only report issues for hardware installed at your own home.');
      ownershipError.statusCode = 403;
      throw ownershipError;
    }
  }

  const now = new Date();
  const isUnderWarranty = assetRecord.warrantyExpiresTimestamp && new Date(assetRecord.warrantyExpiresTimestamp) > now;

  let sparePartCost = 0;
  if (!isUnderWarranty) {
    if (assetRecord.assetCategory === 'INVERTER') sparePartCost = ERP_SYSTEM_CONFIG.BOM_TEMPLATES.DEFAULT_INVERTER_OUT_OF_WARRANTY_COST_INR;
    if (assetRecord.assetCategory === 'BATTERY') sparePartCost = ERP_SYSTEM_CONFIG.BOM_TEMPLATES.DEFAULT_BATTERY_OUT_OF_WARRANTY_COST_INR;
  }
  const laborCharge = isUnderWarranty ? 0 : ERP_SYSTEM_CONFIG.BOM_TEMPLATES.OUT_OF_WARRANTY_VISIT_FEE_INR;
  const totalPayable = sparePartCost + laborCharge;

  const ticketRef = await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.TICKET);
  const createdTicket = await TicketModel.create({
    ticketReference: ticketRef,
    customerFullName: assetRecord.customerFullName || 'Unknown Customer',
    customerPhoneNumber: assetRecord.customerPhoneNumber || 'Unknown Phone',
    installationSiteAddress: assetRecord.installationSiteAddress || 'N/A',
    targetSerialNumber: assetRecord.serialNumber,
    assetCategory: assetRecord.assetCategory,
    reportedFaultCode,
    issueDescription,
    isUnderActiveWarranty: isUnderWarranty,
    warrantyExpiryDate: assetRecord.warrantyExpiresTimestamp || new Date(),
    sparePartCostInr: sparePartCost,
    laborChargeCostInr: laborCharge,
    totalPayableAmountInr: totalPayable,
    paymentStatus: (!isUnderWarranty && totalPayable > 0) ? 'PENDING' : 'NOT_REQUIRED',
    ticketWorkflowStatus: 'Draft',
    updatedBy: creatorUserId
  });

  emitErpEvent('BREAKDOWN_TICKET_CREATED', { ticket: createdTicket });
  return createdTicket;
};

export const recordServiceTicketPayment = async (ticketId, paymentPayload, recordingUserId) => {
  const ticketRecord = await TicketModel.findById(ticketId);
  if (!ticketRecord) throw new Error('Ticket not found');

  if (ticketRecord.paymentStatus === 'PAID') {
    return ticketRecord;
  }

  const { paymentMode = 'UPI', transactionReference = `TXN-${Date.now()}`, paymentAmountInr } = paymentPayload;
  const collectedAmount = paymentAmountInr || ticketRecord.totalPayableAmountInr;

  ticketRecord.paymentStatus = 'PAID';
  ticketRecord.paymentDetails = {
    paymentMode,
    transactionReference,
    paidAmountInr: collectedAmount,
    paidTimestamp: new Date()
  };
  ticketRecord.ticketWorkflowStatus = 'Parts_Replaced';
  ticketRecord.updatedBy = recordingUserId;
  await ticketRecord.save();

  // Immutable Double-Entry Ledger Posting: Cash/Bank (Debit) vs Service Revenue (Credit)
  const journalRef = await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.JOURNAL);
  await JournalEntryModel.create({
    entryReference: journalRef,
    orderReference: ticketRecord.targetSerialNumber,
    entryCategory: 'SERVICE_REVENUE',
    narrativeDescription: `Out-of-warranty repair fee collected via ${paymentMode} ref: ${transactionReference} for ticket ${ticketRecord.ticketReference} (${ticketRecord.customerFullName})`,
    journalLines: [
      { accountCode: '1010', accountName: 'Cash & Bank Balance', debitAmountInr: collectedAmount, creditAmountInr: 0 },
      { accountCode: '4010', accountName: 'Service & Repair Revenue', debitAmountInr: 0, creditAmountInr: collectedAmount }
    ],
    totalDebitAmountInr: collectedAmount,
    totalCreditAmountInr: collectedAmount,
    isBalanced: true,
    updatedBy: recordingUserId
  });

  emitErpEvent('TICKET_PAYMENT_RECORDED', { ticket: ticketRecord });
  return ticketRecord;
};

export const resolveServiceTicketWithConfirmation = async (ticketId, resolutionNotes, customerConfirmedWorking, resolvingUserId) => {
  const ticketRecord = await TicketModel.findById(ticketId);
  if (!ticketRecord) throw new Error('Ticket not found');

  // Guardrail 1: Customer must confirm normal generation
  if (customerConfirmedWorking !== true) {
    const error = new Error('Customer confirmation required: Customer must confirm system is generating power normally before resolving ticket');
    error.statusCode = 400;
    throw error;
  }

  // Guardrail 2: Out-of-warranty ticket payment gate
  if (!ticketRecord.isUnderActiveWarranty && ticketRecord.totalPayableAmountInr > 0 && ticketRecord.paymentStatus !== 'PAID') {
    const error = new Error(`Payment required: Out-of-warranty ticket ${ticketRecord.ticketReference} requires customer payment of ₹${ticketRecord.totalPayableAmountInr.toLocaleString('en-IN')} before closure`);
    error.statusCode = 400;
    throw error;
  }

  ticketRecord.ticketWorkflowStatus = 'Done';
  ticketRecord.resolutionConfirmationByCustomer = true;
  ticketRecord.technicianResolutionNotes = resolutionNotes;
  ticketRecord.resolvedTimestamp = new Date();
  ticketRecord.updatedBy = resolvingUserId;
  await ticketRecord.save();

  emitErpEvent('TICKET_RESOLVED', { ticket: ticketRecord });
  return ticketRecord;
};

export const fetchAllServiceTickets = async (filterQuery = {}, customerUser = null) => {
  let resolvedFilter = filterQuery;
  if (customerUser) {
    const ownedAssets = await SerialAssetModel.find(await buildCustomerAssetFilter(customerUser)).select('serialNumber');
    const clauses = [{ targetSerialNumber: { $in: ownedAssets.map((a) => a.serialNumber) } }];
    const phoneRegex = buildCustomerPhoneRegex(customerUser);
    if (phoneRegex) clauses.push({ customerPhoneNumber: phoneRegex });
    resolvedFilter = { $or: clauses };
  }
  return TicketModel.find(resolvedFilter).sort({ createdAt: -1 });
};

export const lookupPublicSerialAsset = async (serialNumber) => {
  const sanitized = String(serialNumber || '').trim();
  const asset = await SerialAssetModel.findOne({
    serialNumber: { $regex: new RegExp(`^${sanitized}$`, 'i') }
  }).lean();

  if (!asset) {
    const error = new Error(`Equipment asset with serial number "${sanitized}" not found in registry`);
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  const isUnderWarranty = asset.warrantyExpiresTimestamp && new Date(asset.warrantyExpiresTimestamp) > now;
  const remainingDays = asset.warrantyExpiresTimestamp
    ? Math.max(0, Math.ceil((new Date(asset.warrantyExpiresTimestamp) - now) / 86400000))
    : 0;
  const expiredDays = !isUnderWarranty && asset.warrantyExpiresTimestamp
    ? Math.max(0, Math.ceil((now - new Date(asset.warrantyExpiresTimestamp)) / 86400000))
    : 0;

  let estimatedPartCost = 0;
  if (!isUnderWarranty) {
    if (asset.assetCategory === 'INVERTER') {
      estimatedPartCost = ERP_SYSTEM_CONFIG.BOM_TEMPLATES.DEFAULT_INVERTER_OUT_OF_WARRANTY_COST_INR;
    } else if (asset.assetCategory === 'BATTERY') {
      estimatedPartCost = ERP_SYSTEM_CONFIG.BOM_TEMPLATES.DEFAULT_BATTERY_OUT_OF_WARRANTY_COST_INR;
    }
  }
  const estimatedLaborCost = isUnderWarranty ? 0 : ERP_SYSTEM_CONFIG.BOM_TEMPLATES.OUT_OF_WARRANTY_VISIT_FEE_INR;

  return {
    serialNumber: asset.serialNumber,
    assetCategory: asset.assetCategory,
    modelDesignation: asset.modelDesignation,
    assetStatus: asset.assetStatus,
    customerFullName: asset.customerFullName || 'Verified Homeowner Client',
    customerPhoneNumber: asset.customerPhoneNumber || '',
    installationSiteAddress: asset.installationSiteAddress || 'Registered Rooftop Array',
    orderReference: asset.orderReference || 'ORD/2026/0001',
    dispatchConfirmedTimestamp: asset.dispatchConfirmedTimestamp || asset.createdAt,
    warrantyDurationDays: asset.warrantyDurationDays || 730,
    warrantyExpiresTimestamp: asset.warrantyExpiresTimestamp,
    isUnderActiveWarranty: isUnderWarranty,
    warrantyStatus: isUnderWarranty ? 'UNDER WARRANTY' : 'EXPIRED',
    remainingWarrantyDays: remainingDays,
    expiredDays: expiredDays,
    estimatedPartCostInr: estimatedPartCost,
    estimatedLaborCostInr: estimatedLaborCost,
    totalBillableCostInr: estimatedPartCost + estimatedLaborCost
  };
};

export const createPublicServiceTicket = async (ticketData) => {
  const { targetSerialNumber, reportedFaultCode, issueDescription, customerFullName, customerPhoneNumber } = ticketData;
  const asset = await SerialAssetModel.findOne({
    serialNumber: { $regex: new RegExp(`^${String(targetSerialNumber || '').trim()}$`, 'i') }
  });

  const now = new Date();
  const isUnderWarranty = asset?.warrantyExpiresTimestamp ? new Date(asset.warrantyExpiresTimestamp) > now : false;

  let sparePartCost = 0;
  if (!isUnderWarranty) {
    if (asset?.assetCategory === 'INVERTER') sparePartCost = ERP_SYSTEM_CONFIG.BOM_TEMPLATES.DEFAULT_INVERTER_OUT_OF_WARRANTY_COST_INR;
    if (asset?.assetCategory === 'BATTERY') sparePartCost = ERP_SYSTEM_CONFIG.BOM_TEMPLATES.DEFAULT_BATTERY_OUT_OF_WARRANTY_COST_INR;
  }
  const laborCharge = isUnderWarranty ? 0 : ERP_SYSTEM_CONFIG.BOM_TEMPLATES.OUT_OF_WARRANTY_VISIT_FEE_INR;
  const totalPayable = sparePartCost + laborCharge;

  const ticketRef = await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.TICKET);

  const createdTicket = await TicketModel.create({
    ticketReference: ticketRef,
    customerFullName: customerFullName || asset?.customerFullName || 'Verified Homeowner',
    customerPhoneNumber: customerPhoneNumber || asset?.customerPhoneNumber || '+91 98000 00000',
    installationSiteAddress: asset?.installationSiteAddress || 'Registered Solar Rooftop',
    targetSerialNumber: asset?.serialNumber || targetSerialNumber,
    assetCategory: asset?.assetCategory || 'INVERTER',
    reportedFaultCode: reportedFaultCode || 'ERR_INVERTER_GRID_FAIL',
    issueDescription: issueDescription || 'Monsoon downpour caused inverter to trip. Generation stopped.',
    isUnderActiveWarranty: isUnderWarranty,
    warrantyExpiryDate: asset?.warrantyExpiresTimestamp || new Date(),
    sparePartCostInr: sparePartCost,
    laborChargeCostInr: laborCharge,
    totalPayableAmountInr: totalPayable,
    paymentStatus: (!isUnderWarranty && totalPayable > 0) ? 'PENDING' : 'NOT_REQUIRED',
    ticketWorkflowStatus: 'Draft'
  });

  emitErpEvent('BREAKDOWN_TICKET_CREATED', { ticket: createdTicket });
  return createdTicket;
};
