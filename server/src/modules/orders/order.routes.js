/**
 * @AUTHOR: Garima Mittal
 * @FILE: order.routes.js
 * @RESPONSIBILITY: Express router defining routes for auto-BOM quote generation, advance/leftover payments, and specialised crew assignments.
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
  recordOrderPaymentValidationSchema,
  assignInstallationCrewValidationSchema
} from './order.validation.js';
import {
  handleGenerateQuote,
  handleGetQuoteByLead,
  handleCaptureAdvancePayment,
  handleRecordOrderPayment,
  handleAssignCrew,
  handleGetAllOrders,
  handleGetOrderById,
  handleActivateCustomerAccount,
  handleResendStage2Email,
  handleGetMyProjectOrder,
  handleGetMyPortalBundle,
  handleGetAllTechnicians,
  handleUpdateOrderSubsidy,
  handleGetOrderCertificate
} from './order.controller.js';

const { ADMIN, OPERATIONS, CUSTOMER, STAFF } = ERP_SYSTEM_CONFIG.RBAC_ROLES;
const orderApiRouter = Router();

orderApiRouter.get('/technicians', verifyAuthentication, authorizeRoles(ADMIN, OPERATIONS, STAFF), handleGetAllTechnicians);
orderApiRouter.get('/my-project', verifyAuthentication, authorizeRoles(CUSTOMER), handleGetMyProjectOrder);
orderApiRouter.get('/my-portal', verifyAuthentication, authorizeRoles(CUSTOMER), handleGetMyPortalBundle);
orderApiRouter.get('/by-lead/:leadId', verifyAuthentication, authorizeRoles(ADMIN, OPERATIONS), handleGetQuoteByLead);
orderApiRouter.get('/:id/certificate', handleGetOrderCertificate);
orderApiRouter.patch('/:id/subsidy', verifyAuthentication, authorizeRoles(ADMIN, OPERATIONS), handleUpdateOrderSubsidy);
orderApiRouter.get('/', verifyAuthentication, handleGetAllOrders);
orderApiRouter.get('/:id', verifyAuthentication, handleGetOrderById);

orderApiRouter.post(
  '/:id/payment',
  verifyAuthentication,
  authorizeRoles(CUSTOMER, ADMIN, OPERATIONS),
  validateRequestBody(recordOrderPaymentValidationSchema),
  handleRecordOrderPayment
);
orderApiRouter.post(
  '/:id/activate-customer',
  verifyAuthentication,
  authorizeRoles(ADMIN, OPERATIONS),
  handleActivateCustomerAccount
);
orderApiRouter.post(
  '/:id/resend-stage2-email',
  verifyAuthentication,
  authorizeRoles(ADMIN, OPERATIONS),
  handleResendStage2Email
);

orderApiRouter.post(
  '/generate-quote',
  verifyAuthentication,
  authorizeRoles(ADMIN, OPERATIONS),
  validateRequestBody(generateQuoteFromLeadValidationSchema),
  handleGenerateQuote
);

orderApiRouter.post(
  '/:id/advance-payment',
  verifyAuthentication,
  authorizeRoles(ADMIN, OPERATIONS),
  validateRequestBody(captureOrderPaymentValidationSchema),
  handleCaptureAdvancePayment
);

orderApiRouter.post(
  '/:id/assign-crew',
  verifyAuthentication,
  authorizeRoles(ADMIN, OPERATIONS),
  validateRequestBody(assignInstallationCrewValidationSchema),
  handleAssignCrew
);

export { orderApiRouter };
