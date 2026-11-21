/**
 * @AUTHOR: Garima Mittal
 * @FILE: diagnostics.routes.js
 * @RESPONSIBILITY: Express router defining administrator-only system telemetry and runtime diagnostics endpoints.
 * @DEPENDENCIES: express, authMiddleware.js, rbacMiddleware.js, diagnostics.controller.js
 */

import { Router } from 'express';
import { verifyAuthentication } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/rbacMiddleware.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';
import { handleGetSystemTelemetry } from './diagnostics.controller.js';

const diagnosticsApiRouter = Router();

diagnosticsApiRouter.get(
  '/telemetry',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN),
  handleGetSystemTelemetry
);

export { diagnosticsApiRouter };
