/**
 * @AUTHOR: Garima Mittal
 * @FILE: order.routes.js
 * @RESPONSIBILITY: Express router defining routes for auto-BOM quote generation, advance payments, and crew assignments.
 * @DEPENDENCIES: express, authMiddleware.js, rbacMiddleware.js, validateMiddleware.js, order.validation.js, order.controller.js
 */

import { Router } from 'express';
import { verifyAuthentication } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/rbacMiddleware.js';
import { validateRequestBody } from '../../middleware/validateMiddleware.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';
import {
  generateQuoteFromLeadValidationSchema,
  captureOrderPaymentValidationSchema,
  assignInstallationCrewValidationSchema
} from './order.validation.js';
import {
  handleGenerateQuote,
  handleCaptureAdvancePayment,
  handleAssignCrew,
  handleGetAllOrders,
  handleGetOrderById
} from './order.controller.js';

const orderApiRouter = Router();

orderApiRouter.get('/', verifyAuthentication, handleGetAllOrders);
orderApiRouter.get('/:id', verifyAuthentication, handleGetOrderById);

orderApiRouter.post(
  '/generate-quote',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN, ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS),
  validateRequestBody(generateQuoteFromLeadValidationSchema),
  handleGenerateQuote
);

orderApiRouter.post(
  '/:id/advance-payment',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN, ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS),
  validateRequestBody(captureOrderPaymentValidationSchema),
  handleCaptureAdvancePayment
);

orderApiRouter.post(
  '/:id/assign-crew',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN, ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS),
  validateRequestBody(assignInstallationCrewValidationSchema),
  handleAssignCrew
);

export { orderApiRouter };
