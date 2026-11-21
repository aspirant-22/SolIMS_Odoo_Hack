/**
 * @AUTHOR: Garima Mittal
 * @FILE: auth.validation.js
 * @RESPONSIBILITY: Zod boundary schemas for authenticating users and demo persona switching requests.
 * @DEPENDENCIES: zod, erpConfig.js
 */

import { z } from 'zod';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';

export const userLoginValidationSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must contain at least 6 characters')
});

export const demoPersonaSwitchValidationSchema = z.object({
  targetRole: z.enum([
    ERP_SYSTEM_CONFIG.RBAC_ROLES.ADMIN,
    ERP_SYSTEM_CONFIG.RBAC_ROLES.OPERATIONS,
    ERP_SYSTEM_CONFIG.RBAC_ROLES.STAFF,
    ERP_SYSTEM_CONFIG.RBAC_ROLES.CUSTOMER
  ])
});
