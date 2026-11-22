/**
 * @AUTHOR: Garima Mittal
 * @FILE: accounting.routes.js
 * @RESPONSIBILITY: Express router defining Director P&L analytics, margin calculations, subsidies, and general ledger endpoints.
 * @DEPENDENCIES: express, authMiddleware.js, rbacMiddleware.js, accounting.controller.js
 */

import { Router } from 'express';
import { verifyAuthentication } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/rbacMiddleware.js';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';
import {
  handleGetDirectorSummary,
  handleGetDirectorPnl,
  handleGetSubsidySummary,
  handleGetGeneralLedger
} from './accounting.controller.js';

const accountingApiRouter = Router();

// Director Executive P&L endpoints
accountingApiRouter.get(
  '/director-summary',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN, ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS),
  handleGetDirectorSummary
);

accountingApiRouter.get(
  '/pnl',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN, ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS),
  handleGetDirectorPnl
);

// PM Surya Ghar Subsidies Endpoint with Period Filtering
accountingApiRouter.get(
  '/subsidies',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN, ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS),
  handleGetSubsidySummary
);

// General Ledger Endpoint
accountingApiRouter.get(
  '/ledger',
  verifyAuthentication,
  authorizeRoles(ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN, ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS),
  handleGetGeneralLedger
);

export { accountingApiRouter };
