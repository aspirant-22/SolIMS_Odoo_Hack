/**
 * @AUTHOR: Garima Mittal
 * @FILE: service.routes.js
 * @RESPONSIBILITY: Express router defining routes for mobile roof signoffs, warranty queries, and repair tickets.
 * @DEPENDENCIES: express, authMiddleware.js, rbacMiddleware.js, validateMiddleware.js, service.validation.js, service.controller.js
 */

import { Router } from 'express';
import { verifyAuthentication } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/rbacMiddleware.js';
import { validateRequestBody } from '../../middleware/validateMiddleware.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';
import {
  submitRoofSignoffValidationSchema,
  createServiceTicketValidationSchema,
  recordTicketPaymentValidationSchema,
  resolveTicketValidationSchema
} from './service.validation.js';
import {
  handleSubmitRoofSignoff,
  handleWarrantyLookup,
  handleCreateTicket,
  handleRecordTicketPayment,
  handleResolveTicket,
  handleGetAllTickets,
  handlePublicSerialLookup,
  handleCreatePublicTicket
} from './service.controller.js';

const serviceApiRouter = Router();

// Public QR Sticker Inverter & Asset Lookup (zero-auth for mobile scanning in field)
serviceApiRouter.get('/public-lookup/:serialNumber', handlePublicSerialLookup);
serviceApiRouter.post('/public-ticket', handleCreatePublicTicket);

serviceApiRouter.get('/tickets', verifyAuthentication, handleGetAllTickets);
serviceApiRouter.get('/warranty-lookup', verifyAuthentication, handleWarrantyLookup);

serviceApiRouter.post(
  '/roof-signoff',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN, ERP_SYSTEM_CONFIG.RBAC_ROLES.STAFF, ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS),
  validateRequestBody(submitRoofSignoffValidationSchema),
  handleSubmitRoofSignoff
);

serviceApiRouter.post(
  '/tickets',
  verifyAuthentication,
  validateRequestBody(createServiceTicketValidationSchema),
  handleCreateTicket
);

serviceApiRouter.post(
  '/tickets/:id/payment',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN, ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS, ERP_SYSTEM_CONFIG.RBAC_ROLES.STAFF),
  validateRequestBody(recordTicketPaymentValidationSchema),
  handleRecordTicketPayment
);

serviceApiRouter.post(
  '/tickets/:id/resolve',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN, ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS, ERP_SYSTEM_CONFIG.RBAC_ROLES.STAFF),
  validateRequestBody(resolveTicketValidationSchema),
  handleResolveTicket
);

export { serviceApiRouter };
