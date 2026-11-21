/**
 * @AUTHOR: Garima Mittal
 * @FILE: inventory.routes.js
 * @RESPONSIBILITY: Express router defining routes for stock inventory, serial scanning, and dispatch processing.
 * @DEPENDENCIES: express, authMiddleware.js, rbacMiddleware.js, validateMiddleware.js, inventory.validation.js, inventory.controller.js
 */

import { Router } from 'express';
import { verifyAuthentication } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/rbacMiddleware.js';
import { validateRequestBody } from '../../middleware/validateMiddleware.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';
import {
  scanSerialForDispatchValidationSchema,
  confirmDispatchOrderValidationSchema
} from './inventory.validation.js';
import {
  handleScanSerialForOrder,
  handleConfirmDispatch,
  handleGetWarehouseInventory
} from './inventory.controller.js';

const inventoryApiRouter = Router();

inventoryApiRouter.get('/', verifyAuthentication, handleGetWarehouseInventory);

inventoryApiRouter.post(
  '/scan-serial',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN, ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS),
  validateRequestBody(scanSerialForDispatchValidationSchema),
  handleScanSerialForOrder
);

inventoryApiRouter.post(
  '/confirm-dispatch',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN, ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS),
  validateRequestBody(confirmDispatchOrderValidationSchema),
  handleConfirmDispatch
);

export { inventoryApiRouter };
