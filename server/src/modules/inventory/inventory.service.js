/**
 * @AUTHOR: Garima Mittal
 * @FILE: inventory.service.js
 * @RESPONSIBILITY: Manages warehouse serial scanning, live quantity stock levels, restocking, packing-slip equipment reservation, double-entry stock movements and warranty clock initialisation.
 * @DEPENDENCIES: serialAsset.model.js, stockMove.model.js, stockItem.model.js, order.model.js, sequenceRegistry.js, socketEmitter.js, erpConfig.js
 */

import { SerialAssetModel } from './serialAsset.model.js';
import { StockMoveModel } from './stockMove.model.js';
import { StockItemModel } from './stockItem.model.js';
import { OrderModel } from '../orders/order.model.js';
import { UserModel } from '../auth/user.model.js';
import { getNextSequenceNumber } from '../../core/sequenceRegistry.js';
import { emitErpEvent } from '../../core/socketEmitter.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';
import { buildHttpError } from '../../core/customerScope.js';

const DISPATCHABLE_ORDER_STATUSES = ['Advance_Paid', 'BALANCE_DUE', 'Packed'];

export const DEFAULT_STOCK_CATALOG = Object.freeze([
  { sku: 'PNL-DCR-540W', itemName: 'Solar Panel DCR 540W Mono PERC', stockGroup: 'SOLAR_PANELS', bomCategory: 'SOLAR_PANELS', capacityKw: 0.54, unitOfMeasure: 'Panels', availableUnits: 180, reservedUnits: 12, lowStockThreshold: 30 },
  { sku: 'INV-ONG-3KW', itemName: '3kW On-Grid Inverter', stockGroup: 'ON_GRID_INVERTERS', bomCategory: 'INVERTER', capacityKw: 3, unitOfMeasure: 'Units', availableUnits: 24, reservedUnits: 3, lowStockThreshold: 6 },
  { sku: 'INV-ONG-5KW', itemName: '5kW On-Grid Inverter', stockGroup: 'ON_GRID_INVERTERS', bomCategory: 'INVERTER', capacityKw: 5, unitOfMeasure: 'Units', availableUnits: 15, reservedUnits: 2, lowStockThreshold: 6 },
  { sku: 'INV-HYB-3KW', itemName: '3kW Hybrid Inverter', stockGroup: 'OFF_GRID_INVERTERS', bomCategory: 'INVERTER', capacityKw: 3, unitOfMeasure: 'Units', availableUnits: 9, reservedUnits: 1, lowStockThreshold: 4 },
  { sku: 'INV-HYB-5KW', itemName: '5kW Hybrid Inverter', stockGroup: 'OFF_GRID_INVERTERS', bomCategory: 'INVERTER', capacityKw: 5, unitOfMeasure: 'Units', availableUnits: 12, reservedUnits: 2, lowStockThreshold: 4 },
  { sku: 'BAT-LFP-150', itemName: 'Lithium LiFePO4 48V 150Ah Solar Battery', stockGroup: 'LITHIUM_BATTERIES', bomCategory: 'BATTERY', unitOfMeasure: 'Units', availableUnits: 6, reservedUnits: 2, lowStockThreshold: 8 },
  { sku: 'BAT-LFP-100', itemName: 'Lithium LiFePO4 48V 100Ah Solar Battery', stockGroup: 'LITHIUM_BATTERIES', bomCategory: 'BATTERY', unitOfMeasure: 'Units', availableUnits: 0, reservedUnits: 0, lowStockThreshold: 6 },
  { sku: 'MPT-060A', itemName: 'MPPT 60A Solar Charge Controller', stockGroup: 'MPPT_CONTROLLERS', bomCategory: 'CHARGE_CONTROLLER', unitOfMeasure: 'Units', availableUnits: 14, reservedUnits: 1, lowStockThreshold: 5 },
  { sku: 'MPT-040A', itemName: 'MPPT 40A Solar Charge Controller', stockGroup: 'MPPT_CONTROLLERS', bomCategory: 'CHARGE_CONTROLLER', unitOfMeasure: 'Units', availableUnits: 3, reservedUnits: 0, lowStockThreshold: 5 },
  { sku: 'STD-GALV-KW', itemName: 'Galvanized Mounting Metal Stands (per kW set)', stockGroup: 'MOUNTING_STANDS', bomCategory: 'STANDS', unitOfMeasure: 'Sets', availableUnits: 40, reservedUnits: 4, lowStockThreshold: 10 },
  { sku: 'BOX-ACDB-DCDB', itemName: 'AC/DC Wiring Box (ACDB + DCDB with surge protection)', stockGroup: 'WIRING_EARTHING', bomCategory: 'WIRING_BOX', unitOfMeasure: 'Sets', availableUnits: 22, reservedUnits: 2, lowStockThreshold: 8 },
  { sku: 'ERT-CHEM-KIT', itemName: 'Chemical Earthing Kit with Lightning Arrestor', stockGroup: 'WIRING_EARTHING', bomCategory: 'SAFETY_EARTHING', unitOfMeasure: 'Kits', availableUnits: 4, reservedUnits: 1, lowStockThreshold: 10 }
]);

const SELECTABLE_DISPATCH_CATEGORIES = ['SOLAR_PANELS', 'INVERTER', 'BATTERY', 'CHARGE_CONTROLLER'];
export const getSelectableDispatchCategories = () => [...SELECTABLE_DISPATCH_CATEGORIES];

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

/* ------------------------------------------------------------------ *
 *  Quantity stock levels (Inventory Stock panel + packing-slip guard)
 * ------------------------------------------------------------------ */

export const ensureStockCatalogSeeded = async () => {
  const existingCount = await StockItemModel.estimatedDocumentCount();
  if (existingCount === 0) {
    await StockItemModel.insertMany(DEFAULT_STOCK_CATALOG);
  }
};

const decorateStockItem = (itemDocument) => {
  const item = itemDocument.toObject ? itemDocument.toObject() : itemDocument;
  return {
    ...item,
    isOutOfStock: item.availableUnits <= 0,
    isLowStock: item.availableUnits > 0 && item.availableUnits <= item.lowStockThreshold
  };
};

export const fetchStockLevels = async () => {
  await ensureStockCatalogSeeded();
  const items = await StockItemModel.find({}).sort({ stockGroup: 1, itemName: 1 });
  return items.map(decorateStockItem);
};

export const restockStockItem = async (stockItemId, quantityToAdd, note, restockingUserId) => {
  const quantity = Number(quantityToAdd);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw buildHttpError(400, 'Please enter a whole number of units greater than 0.');
  }
  if (quantity > 100000) {
    throw buildHttpError(400, 'That restock quantity is too large. Please enter 100,000 units or fewer.');
  }

  const actor = restockingUserId ? await UserModel.findById(restockingUserId).select('fullName') : null;
  const updatedItem = await StockItemModel.findByIdAndUpdate(
    stockItemId,
    {
      $inc: { availableUnits: quantity },
      $set: { updatedBy: restockingUserId || null },
      $push: {
        restockHistory: {
          $each: [{
            quantityAdded: quantity,
            restockedAt: new Date(),
            restockedBy: restockingUserId || null,
            restockedByName: actor?.fullName || 'System',
            note: (note || '').slice(0, 200)
          }],
          $slice: -25
        }
      }
    },
    { new: true }
  );
  if (!updatedItem) throw buildHttpError(404, 'That stock item could not be found.');

  emitErpEvent('STOCK_RESTOCKED', { stockItem: updatedItem, quantityAdded: quantity });
  return decorateStockItem(updatedItem);
};

const outOfStockMessage = (itemName, available, required) =>
  available <= 0
    ? `Insufficient stock: ${itemName} is currently out of stock in the warehouse.`
    : `Insufficient stock: ${itemName} is currently out of stock in the warehouse. (Needed ${required}, only ${available} available.)`;

/**
 * Packing-slip equipment assignment. Moves units from Available -> Reserved atomically and blocks the
 * assignment when any item is out of stock or the requested quantity exceeds what is on the shelf.
 */
export const reserveEquipmentForOrder = async (orderId, selections, assigningUserId) => {
  const targetOrder = await OrderModel.findById(orderId);
  if (!targetOrder) throw buildHttpError(404, 'Order not found');
  if (!DISPATCHABLE_ORDER_STATUSES.includes(targetOrder.orderWorkflowStatus)) {
    throw buildHttpError(409, 'Equipment can only be assigned to an order after its advance payment is recorded.');
  }

  const requestedByItem = new Map();
  for (const selection of selections) {
    const quantity = Number(selection.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw buildHttpError(400, 'Each equipment quantity must be a whole number greater than 0.');
    }
    requestedByItem.set(String(selection.stockItemId), (requestedByItem.get(String(selection.stockItemId)) || 0) + quantity);
  }

  const previousPlanByItem = new Map();
  if (targetOrder.dispatchEquipmentReserved) {
    targetOrder.dispatchEquipmentPlan.forEach((planItem) => {
      previousPlanByItem.set(String(planItem.stockItemId), (previousPlanByItem.get(String(planItem.stockItemId)) || 0) + planItem.quantity);
    });
  }

  // Pre-check (counting units this same order already holds as effectively available)
  const stockDocuments = await StockItemModel.find({ _id: { $in: [...requestedByItem.keys()] } });
  const stockLookup = new Map(stockDocuments.map((doc) => [String(doc._id), doc]));
  for (const [itemId, requiredQuantity] of requestedByItem.entries()) {
    const stockDoc = stockLookup.get(itemId);
    if (!stockDoc) throw buildHttpError(404, 'One of the selected equipment items no longer exists in the warehouse catalog.');
    const effectiveAvailable = stockDoc.availableUnits + (previousPlanByItem.get(itemId) || 0);
    if (effectiveAvailable <= 0 || requiredQuantity > effectiveAvailable) {
      throw buildHttpError(409, outOfStockMessage(stockDoc.itemName, effectiveAvailable, requiredQuantity));
    }
  }

  // Release previous reservation, then reserve the new plan (atomic guard on every item)
  for (const [itemId, quantity] of previousPlanByItem.entries()) {
    await StockItemModel.updateOne({ _id: itemId }, { $inc: { availableUnits: quantity, reservedUnits: -quantity } });
  }

  const appliedReservations = [];
  try {
    for (const [itemId, quantity] of requestedByItem.entries()) {
      const reserved = await StockItemModel.findOneAndUpdate(
        { _id: itemId, availableUnits: { $gte: quantity } },
        { $inc: { availableUnits: -quantity, reservedUnits: quantity }, $set: { updatedBy: assigningUserId || null } },
        { new: true }
      );
      if (!reserved) {
        const latest = await StockItemModel.findById(itemId);
        throw buildHttpError(409, outOfStockMessage(latest?.itemName || 'Selected equipment', latest?.availableUnits || 0, quantity));
      }
      appliedReservations.push({ itemId, quantity });
    }
  } catch (reservationError) {
    // Roll back partial reservations and restore the previous plan
    for (const { itemId, quantity } of appliedReservations) {
      await StockItemModel.updateOne({ _id: itemId }, { $inc: { availableUnits: quantity, reservedUnits: -quantity } });
    }
    for (const [itemId, quantity] of previousPlanByItem.entries()) {
      await StockItemModel.updateOne({ _id: itemId }, { $inc: { availableUnits: -quantity, reservedUnits: quantity } });
    }
    throw reservationError;
  }

  targetOrder.dispatchEquipmentPlan = [...requestedByItem.entries()].map(([itemId, quantity]) => ({
    stockItemId: itemId,
    itemName: stockLookup.get(itemId).itemName,
    stockGroup: stockLookup.get(itemId).stockGroup,
    quantity
  }));
  targetOrder.dispatchEquipmentReserved = true;
  targetOrder.updatedBy = assigningUserId;
  await targetOrder.save();

  emitErpEvent('EQUIPMENT_RESERVED', { order: targetOrder });
  return { order: targetOrder, stock: await fetchStockLevels() };
};

export const confirmWarehouseDispatchAndStartWarranty = async (orderId, scannedSerialNumbersList, dispatchNotes, dispatchingUserId) => {
  const targetOrder = await OrderModel.findById(orderId);
  if (!targetOrder) throw buildHttpError(404, 'Order not found');

  if (!DISPATCHABLE_ORDER_STATUSES.includes(targetOrder.orderWorkflowStatus)) {
    throw buildHttpError(409, 'This order is not ready for dispatch yet. Please record the advance payment first.');
  }
  if (!targetOrder.dispatchEquipmentReserved || targetOrder.dispatchEquipmentPlan.length === 0) {
    throw buildHttpError(409, 'Please assign the equipment items to the packing slip before confirming dispatch.');
  }

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
    assetRecord.assignedCustomerId = targetOrder.customerUserId || assetRecord.assignedCustomerId;
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

  // Consume the reserved units: Reserved -> dispatched (leaves the warehouse)
  for (const planItem of targetOrder.dispatchEquipmentPlan) {
    await StockItemModel.updateOne(
      { _id: planItem.stockItemId },
      { $inc: { reservedUnits: -planItem.quantity, totalDispatchedUnits: planItem.quantity } }
    );
  }
  targetOrder.dispatchEquipmentReserved = false;

  targetOrder.orderWorkflowStatus = 'Dispatched';
  targetOrder.updatedBy = dispatchingUserId;
  await targetOrder.save();

  emitErpEvent('ORDER_DISPATCHED', { order: targetOrder, dispatchReference });
  return { order: targetOrder, dispatchReference };
};

export const fetchWarehouseInventory = async (filterQuery = {}) => {
  return SerialAssetModel.find(filterQuery).sort({ createdAt: -1 });
};
