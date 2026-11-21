/**
 * @AUTHOR: Garima Mittal
 * @FILE: diagnostics.service.js
 * @RESPONSIBILITY: Aggregates real-time server runtime metrics, heap allocations, and database connectivity telemetry.
 * @DEPENDENCIES: mongoose, erpConfig.js
 */

import mongoose from 'mongoose';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';

export const gatherSystemRuntimeTelemetry = async () => {
  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());
  const mongoConnectionState = mongoose.connection.readyState;
  const mongoStateLabels = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];

  const recentCollectionsCount = {
    users: await mongoose.connection.collection('users').countDocuments().catch(() => 0),
    leads: await mongoose.connection.collection('leads').countDocuments().catch(() => 0),
    projectOrders: await mongoose.connection.collection('projectorders').countDocuments().catch(() => 0),
    serialAssets: await mongoose.connection.collection('serialassets').countDocuments().catch(() => 0),
    serviceTickets: await mongoose.connection.collection('servicetickets').countDocuments().catch(() => 0),
    journalEntries: await mongoose.connection.collection('journalentries').countDocuments().catch(() => 0)
  };

  return {
    nodeEnvironment: process.env.NODE_ENV || 'development',
    serverUptimeSeconds: uptimeSeconds,
    serverUptimeFormatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
    heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    rssMemoryMb: Math.round(memoryUsage.rss / 1024 / 1024),
    mongoDbState: mongoStateLabels[mongoConnectionState] || 'Unknown',
    databaseName: mongoose.connection.name || 'solims',
    activeRecordCounts: recentCollectionsCount,
    timestamp: new Date().toISOString()
  };
};
