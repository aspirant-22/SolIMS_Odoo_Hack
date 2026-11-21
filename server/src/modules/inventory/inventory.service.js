/**
 * @AUTHOR: Garima Mittal
 * @FILE: inventory.service.js
 * @RESPONSIBILITY: Manages warehouse serial scanning, double-entry stock movements, and automatic warranty clock initialization.
 * @DEPENDENCIES: serialAsset.model.js, stockMove.model.js, order.model.js, sequenceRegistry.js, socketEmitter.js, erpConfig.js
 */

import { SerialAssetModel } from './serialAsset.model.js';
import { StockMoveModel } from './stockMove.model.js';
import { OrderModel } from '../orders/order.model.js';
import { getNextSequenceNumber } from '../../core/sequenceRegistry.js';
import { emitErpEvent } from '../../core/socketEmitter.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';

export const scanAndValidateSerialForOrder = async (orderId, scannedSerialNumber, expectedComponentCategory) => {
  const targetOrder = await OrderModel.findById(orderId);
  if (!targetOrder) throw new Error('Order not found');

  const assetRecord = await SerialAssetModel.findOne({ serialNumber: scannedSerialNumber.trim().toUpperCase() });
  if (!assetRecord) {
    throw new Error(`Serial number [${scannedSerialNumber}] not found in warehouse inventory`);
  }

  if (assetRecord.assetCategory !== expectedComponentCategory) {
    throw new Error(`Category mismatch: Scanned item is ${assetRecord.assetCategory}, expected ${expectedComponentCategory}`);
  }

  if (assetRecord.assetStatus !== 'WAREHOUSE_STOCK' && assetRecord.allocatedOrderId?.toString() !== orderId) {
    throw new Error(`Hardware item ${scannedSerialNumber} is unavailable (Status: ${assetRecord.assetStatus})`);
  }

  assetRecord.assetStatus = 'ALLOCATED_FOR_DISPATCH';
  assetRecord.allocatedOrderId = targetOrder._id;
  assetRecord.orderReference = targetOrder.orderReference;
  await assetRecord.save();

  // Update BOM item allocated serials
  const matchingBomItem = targetOrder.billOfMaterials.find((item) => item.itemCategory === expectedComponentCategory);
  if (matchingBomItem && !matchingBomItem.allocatedSerialNumbers.includes(assetRecord.serialNumber)) {
    matchingBomItem.allocatedSerialNumbers.push(assetRecord.serialNumber);
    await targetOrder.save();
  }

  return { verifiedAsset: assetRecord, updatedOrder: targetOrder };
};

export const confirmWarehouseDispatchAndStartWarranty = async (orderId, scannedSerialNumbersList, dispatchNotes, dispatchingUserId) => {
  const targetOrder = await OrderModel.findById(orderId);
  if (!targetOrder) throw new Error('Order not found');

  const dispatchReference = await getNextSequenceNumber(ERP_SYSTEM_CONFIG.SEQUENCE_CODES.DISPATCH);
  const now = new Date();

  for (const serialString of scannedSerialNumbersList) {
    const assetRecord = await SerialAssetModel.findOne({ serialNumber: serialString });
    if (!assetRecord) continue;

    let warrantyDays = ERP_SYSTEM_CONFIG.WARRANTY_DAYS.INVERTER;
    if (assetRecord.assetCategory === 'SOLAR_PANELS') warrantyDays = ERP_SYSTEM_CONFIG.WARRANTY_DAYS.SOLAR_PANELS;
    if (assetRecord.assetCategory === 'BATTERY') warrantyDays = ERP_SYSTEM_CONFIG.WARRANTY_DAYS.BATTERY_STORAGE;

    const expiryTimestamp = new Date(now.getTime() + warrantyDays * 24 * 60 * 60 * 1000);

    assetRecord.assetStatus = 'DISPATCHED';
    assetRecord.customerFullName = targetOrder.customerFullName;
    assetRecord.customerPhoneNumber = targetOrder.customerPhoneNumber;
    assetRecord.installationSiteAddress = targetOrder.installationSiteAddress;
    assetRecord.orderReference = targetOrder.orderReference;
    assetRecord.dispatchConfirmedTimestamp = now;
    assetRecord.warrantyDurationDays = warrantyDays;
    assetRecord.warrantyExpiresTimestamp = expiryTimestamp;
    assetRecord.updatedBy = dispatchingUserId;
    await assetRecord.save();

    // Create immutable double-entry stock movement record
    await StockMoveModel.create({
      movementReference: `${dispatchReference}/${assetRecord.serialNumber}`,
      sourceLocationNode: 'WH/Stock',
      destinationLocationNode: 'Customers',
      assetSerialNumber: assetRecord.serialNumber,
      componentCategory: assetRecord.assetCategory,
      projectOrderReference: targetOrder.orderReference || targetOrder.quotationReference,
      dispatchedByTechnician: dispatchingUserId,
      notes: dispatchNotes || 'Hardware dispatched from central depot'
    });
  }

  targetOrder.orderWorkflowStatus = 'Dispatched';
  targetOrder.updatedBy = dispatchingUserId;
  await targetOrder.save();

  emitErpEvent('ORDER_DISPATCHED', { order: targetOrder, dispatchReference });
  return { order: targetOrder, dispatchReference };
};

export const fetchWarehouseInventory = async (filterQuery = {}) => {
  return SerialAssetModel.find(filterQuery).sort({ createdAt: -1 });
};
