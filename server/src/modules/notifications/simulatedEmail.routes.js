/**
 * @AUTHOR: Garima Mittal
 * @FILE: simulatedEmail.routes.js
 * @RESPONSIBILITY: Express router defining endpoints for simulated email inspection, preview, test dispatches, and outbox operations.
 * @DEPENDENCIES: express, simulatedEmail.controller.js
 */

import { Router } from 'express';
import {
  handleGetAllSimulatedEmails,
  handleGetSimulatedEmailById,
  handleMarkSimulatedEmailRead,
  handleClearAllSimulatedEmails,
  handleTriggerTestEmail
} from './simulatedEmail.controller.js';

const simulatedEmailApiRouter = Router();

simulatedEmailApiRouter.get('/', handleGetAllSimulatedEmails);
simulatedEmailApiRouter.post('/test-dispatch', handleTriggerTestEmail);
simulatedEmailApiRouter.delete('/', handleClearAllSimulatedEmails);
simulatedEmailApiRouter.get('/:id', handleGetSimulatedEmailById);
simulatedEmailApiRouter.post('/:id/mark-read', handleMarkSimulatedEmailRead);

export { simulatedEmailApiRouter };
