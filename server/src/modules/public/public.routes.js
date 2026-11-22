/**
 * @AUTHOR: Garima Mittal
 * @FILE: public.routes.js
 * @RESPONSIBILITY: Public, unauthenticated API router for mobile QR sticker unit warranty lookup and field breakdown ticket submission.
 * @DEPENDENCIES: express, service.controller.js
 */

import { Router } from 'express';
import { handlePublicUnitLookup, handleCreatePublicTicket } from '../service/service.controller.js';

const publicApiRouter = Router();

// Unauthenticated mobile QR scanner hardware lookup
// GET /api/public/unit/:serialNumber
publicApiRouter.get('/unit/:serialNumber', handlePublicUnitLookup);

// Unauthenticated mobile field breakdown ticket filing
// POST /api/public/ticket
publicApiRouter.post('/ticket', handleCreatePublicTicket);

export { publicApiRouter };
