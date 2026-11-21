/**
 * @AUTHOR: Garima Mittal
 * @FILE: server.js
 * @RESPONSIBILITY: Configures Express HTTP application, Socket.IO gateway, middleware pipelines, and API routing.
 * @DEPENDENCIES: express, cors, helmet, cookie-parser, socket.io, db.js, erpConfig.js
 */

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ERP_SYSTEM_CONFIG } from './config/erpConfig.js';
import { connectDatabase } from './config/db.js';
import { initializeSocketEmitter } from './core/socketEmitter.js';
import { handleGlobalApplicationErrors } from './middleware/errorHandler.js';

const expressApplication = express();
const httpServerInstance = http.createServer(expressApplication);

const socketIoServer = new SocketIOServer(httpServerInstance, {
  cors: {
    origin: ERP_SYSTEM_CONFIG.CLIENT_ORIGIN,
    credentials: true
  }
});

initializeSocketEmitter(socketIoServer);

expressApplication.use(helmet({ contentSecurityPolicy: false }));
expressApplication.use(
  cors({
    origin: ERP_SYSTEM_CONFIG.CLIENT_ORIGIN,
    credentials: true
  })
);
expressApplication.use(express.json({ limit: '10mb' }));
expressApplication.use(cookieParser());

// Diagnostic Telemetry Endpoint
expressApplication.get('/api/health', (httpRequest, httpResponse) => {
  return httpResponse.status(200).json({
    status: 'ONLINE',
    author: ERP_SYSTEM_CONFIG.AUTHOR_NAME,
    system: ERP_SYSTEM_CONFIG.COMPANY_NAME,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
  });
});

// Dynamic Route Registration Loader
export const registerApiModuleRoutes = (registeredRouterPaths) => {
  registeredRouterPaths.forEach(({ pathPrefix, routerInstance }) => {
    expressApplication.use(pathPrefix, routerInstance);
  });
};

expressApplication.use(handleGlobalApplicationErrors);

const startEnterpriseServer = async () => {
  try {
    await connectDatabase();
    httpServerInstance.listen(ERP_SYSTEM_CONFIG.PORT, () => {
      console.log(`[ERP] ${ERP_SYSTEM_CONFIG.COMPANY_NAME} Server live on port ${ERP_SYSTEM_CONFIG.PORT}`);
    });
  } catch (bootstrappingError) {
    console.error('[ERP] Server bootstrap failed:', bootstrappingError);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startEnterpriseServer();
}

export { expressApplication, httpServerInstance };
