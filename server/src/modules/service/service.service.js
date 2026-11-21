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
import { getNextSequenceNumber } from '../../core/sequenceRegistry.js';
import { emitErpEvent } from '../../core/socketEmitter.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';

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

export const lookupAssetWarrantyStatus = async (searchCriteriaQuery) => {
  const sanitizedQuery = searchCriteriaQuery.trim();
  const foundAssets = await SerialAssetModel.find({
    $or: [
      { serialNumber: { $regex: sanitizedQuery, $options: 'i' } },
      { customerFullName: { $regex: sanitizedQuery, $options: 'i' } },
      { customerPhoneNumber: { $regex: sanitizedQuery, $options: 'i' } },
      { orderReference: { $regex: sanitizedQuery, $options: 'i' } }
    ]
  });

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

export const createBreakdownServiceTicket = async (ticketDetails, creatorUserId) => {
  const { targetSerialNumber, reportedFaultCode, issueDescription } = ticketDetails;
  const assetRecord = await SerialAssetModel.findOne({ serialNumber: targetSerialNumber.trim().toUpperCase() });
  if (!assetRecord) throw new Error(`Serial number ${targetSerialNumber} not found`);

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
    ticketWorkflowStatus: 'Draft',
    updatedBy: creatorUserId
  });

  emitErpEvent('BREAKDOWN_TICKET_CREATED', { ticket: createdTicket });
  return createdTicket;
};

export const resolveServiceTicketWithConfirmation = async (ticketId, resolutionNotes, customerConfirmedWorking, resolvingUserId) => {
  const ticketRecord = await TicketModel.findById(ticketId);
  if (!ticketRecord) throw new Error('Ticket not found');

  ticketRecord.ticketWorkflowStatus = 'Done';
  ticketRecord.resolutionConfirmationByCustomer = customerConfirmedWorking;
  ticketRecord.technicianResolutionNotes = resolutionNotes;
  ticketRecord.resolvedTimestamp = new Date();
  ticketRecord.updatedBy = resolvingUserId;
  await ticketRecord.save();

  emitErpEvent('TICKET_RESOLVED', { ticket: ticketRecord });
  return ticketRecord;
};

export const fetchAllServiceTickets = async (filterQuery = {}) => {
  return TicketModel.find(filterQuery).sort({ createdAt: -1 });
};
