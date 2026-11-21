/**
 * @AUTHOR: Garima Mittal
 * @FILE: auth.routes.js
 * @RESPONSIBILITY: Express router defining endpoints for user login, demo persona switcher, and session inspection.
 * @DEPENDENCIES: express, validateMiddleware.js, authMiddleware.js, auth.validation.js, auth.controller.js
 */

import { Router } from 'express';
import { validateRequestBody } from '../../middleware/validateMiddleware.js';
import { verifyAuthentication } from '../../middleware/authMiddleware.js';
import {
  userLoginValidationSchema,
  demoPersonaSwitchValidationSchema
} from './auth.validation.js';
import {
  handleUserLogin,
  handleDemoPersonaSwitch,
  handleUserLogout,
  handleGetSessionProfile,
  handleMagicLogin
} from './auth.controller.js';

const authApiRouter = Router();

authApiRouter.post('/login', validateRequestBody(userLoginValidationSchema), handleUserLogin);
authApiRouter.post('/switch-persona', validateRequestBody(demoPersonaSwitchValidationSchema), handleDemoPersonaSwitch);
authApiRouter.post('/magic-login', handleMagicLogin);
authApiRouter.get('/magic-login', handleMagicLogin);
authApiRouter.post('/logout', handleUserLogout);
authApiRouter.get('/profile', verifyAuthentication, handleGetSessionProfile);

export { authApiRouter };
