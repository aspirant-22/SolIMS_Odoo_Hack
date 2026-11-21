/**
 * @AUTHOR: Garima Mittal
 * @FILE: lead.routes.js
 * @RESPONSIBILITY: Express router defining inquiry endpoints, survey measurements, and approval security gates.
 * @DEPENDENCIES: express, authMiddleware.js, rbacMiddleware.js, validateMiddleware.js, lead.validation.js, lead.controller.js
 */

import { Router } from 'express';
import { verifyAuthentication } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/rbacMiddleware.js';
import { validateRequestBody } from '../../middleware/validateMiddleware.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';
import {
  createLeadInquiryValidationSchema,
  scheduleSurveyValidationSchema,
  recordSurveyResultsValidationSchema,
  approveSurveyValidationSchema
} from './lead.validation.js';
import {
  handleCreateInquiry,
  handleScheduleSurvey,
  handleRecordSurveyResults,
  handleApproveSurvey,
  handleGetAllInquiries,
  handleGetInquiryById
} from './lead.controller.js';

const leadApiRouter = Router();

leadApiRouter.post('/', validateRequestBody(createLeadInquiryValidationSchema), handleCreateInquiry);
leadApiRouter.get('/', verifyAuthentication, handleGetAllInquiries);
leadApiRouter.get('/:id', verifyAuthentication, handleGetInquiryById);

leadApiRouter.post(
  '/:id/schedule-survey',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN, ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS),
  validateRequestBody(scheduleSurveyValidationSchema),
  handleScheduleSurvey
);

leadApiRouter.post(
  '/:id/record-survey',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN, ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS, ERP_SYSTEM_CONFIG.RBAC_ROLES.STAFF),
  validateRequestBody(recordSurveyResultsValidationSchema),
  handleRecordSurveyResults
);

leadApiRouter.post(
  '/:id/approve-survey',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN, ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS),
  validateRequestBody(approveSurveyValidationSchema),
  handleApproveSurvey
);

export { leadApiRouter };
