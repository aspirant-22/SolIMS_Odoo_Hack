/**
 * @AUTHOR: Garima Mittal
 * @FILE: inventory.routes.js
 * @RESPONSIBILITY: Express router defining routes for stock inventory, restocking, packing-slip reservation, serial scanning, and dispatch processing.
 * @DEPENDENCIES: express, authMiddleware.js, rbacMiddleware.js, validateMiddleware.js, inventory.validation.js, inventory.controller.js
 */

import { Router } from 'express';
import { verifyAuthentication } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/rbacMiddleware.js';
import { validateRequestBody } from '../../middleware/validateMiddleware.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';
import {
  scanSerialForDispatchValidationSchema,
  confirmDispatchOrderValidationSchema,
  restockStockItemValidationSchema,
  reserveEquipmentValidationSchema
} from './inventory.validation.js';
import {
  handleScanSerialForOrder,
  handleConfirmDispatch,
  handleGetWarehouseInventory,
  handleGetStockLevels,
  handleRestockItem,
  handleReserveEquipment
} from './inventory.controller.js';
import { handlePublicUnitLookup } from '../service/service.controller.js';

const { ADMIN, OPERATIONS, STAFF } = ERP_SYSTEM_CONFIG.RBAC_ROLES;
const inventoryApiRouter = Router();

// Public unauthenticated serial warranty lookup alias: GET /api/inventory/public/:serialNumber
inventoryApiRouter.get('/public/:serialNumber', handlePublicUnitLookup);

// Serialised hardware list (warehouse scanner + warranty desk). Customers never see warehouse data.
inventoryApiRouter.get('/', verifyAuthentication, authorizeRoles(ADMIN, OPERATIONS, STAFF), handleGetWarehouseInventory);

// Quantity stock levels - Director & Operations only
inventoryApiRouter.get('/stock', verifyAuthentication, authorizeRoles(ADMIN, OPERATIONS), handleGetStockLevels);

inventoryApiRouter.post(
  '/stock/reserve',
  verifyAuthentication,
  authorizeRoles(ADMIN, OPERATIONS),
  validateRequestBody(reserveEquipmentValidationSchema),
  handleReserveEquipment
);

inventoryApiRouter.post(
  '/stock/:id/restock',
  verifyAuthentication,
  authorizeRoles(ADMIN, OPERATIONS),
  validateRequestBody(restockStockItemValidationSchema),
  handleRestockItem
);

inventoryApiRouter.post(
  '/scan-serial',
  verifyAuthentication,
  authorizeRoles(ADMIN, OPERATIONS),
  validateRequestBody(scanSerialForDispatchValidationSchema),
  handleScanSerialForOrder
);

inventoryApiRouter.post(
  '/confirm-dispatch',
  verifyAuthentication,
  authorizeRoles(ADMIN, OPERATIONS),
  validateRequestBody(confirmDispatchOrderValidationSchema),
  handleConfirmDispatch
);

export { inventoryApiRouter };
