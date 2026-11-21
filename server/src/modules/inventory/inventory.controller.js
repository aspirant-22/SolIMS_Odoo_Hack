/**
 * @AUTHOR: Garima Mittal
 * @FILE: inventory.controller.js
 * @RESPONSIBILITY: Express controllers handling HTTP requests for warehouse stock levels, restocking, packing-slip reservation, serial scanning, and dispatch confirmation.
 * @DEPENDENCIES: inventory.service.js
 */

import {
  scanAndValidateSerialForOrder,
  confirmWarehouseDispatchAndStartWarranty,
  fetchWarehouseInventory,
  fetchStockLevels,
  restockStockItem,
  reserveEquipmentForOrder
} from './inventory.service.js';

export const handleScanSerialForOrder = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { orderId, scannedSerialNumber, expectedComponentCategory } = httpRequest.validatedBody;
    const result = await scanAndValidateSerialForOrder(orderId, scannedSerialNumber, expectedComponentCategory);
    return httpResponse.status(200).json({ success: true, ...result });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleConfirmDispatch = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { orderId, scannedSerialNumbersList, dispatchNotes } = httpRequest.validatedBody;
    const result = await confirmWarehouseDispatchAndStartWarranty(
      orderId,
      scannedSerialNumbersList,
      dispatchNotes,
      httpRequest.authenticatedUser._id
    );
    return httpResponse.status(200).json({ success: true, ...result });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetWarehouseInventory = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const stockList = await fetchWarehouseInventory();
    return httpResponse.status(200).json({ success: true, count: stockList.length, inventory: stockList });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleGetStockLevels = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const stockItems = await fetchStockLevels();
    return httpResponse.status(200).json({ success: true, count: stockItems.length, stock: stockItems });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleRestockItem = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { quantity, note } = httpRequest.validatedBody;
    const stockItem = await restockStockItem(httpRequest.params.id, quantity, note, httpRequest.authenticatedUser._id);
    return httpResponse.status(200).json({ success: true, stockItem });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};

export const handleReserveEquipment = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { orderId, selections } = httpRequest.validatedBody;
    const result = await reserveEquipmentForOrder(orderId, selections, httpRequest.authenticatedUser._id);
    return httpResponse.status(200).json({ success: true, ...result });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};
