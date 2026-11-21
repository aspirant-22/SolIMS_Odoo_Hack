/**
 * @AUTHOR: Garima Mittal
 * @FILE: db.js
 * @RESPONSIBILITY: Manages resilient MongoDB connection with automatic MongoMemoryServer fallback.
 * @DEPENDENCIES: mongoose, mongodb-memory-server
 */

import mongoose from 'mongoose';

let memoryServerInstance = null;

export const connectDatabase = async () => {
  const configuredMongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/solims';

  try {
    const activeConnection = await mongoose.connect(configuredMongoUri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[DB] Connected to MongoDB at ${configuredMongoUri}`);
    return activeConnection;
  } catch (initialConnectionError) {
    console.warn(`[DB] Local MongoDB connection refused (${initialConnectionError.message}). Initiating MongoMemoryServer fallback...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const fallbackMemoryUri = memoryServerInstance.getUri();
      const fallbackConnection = await mongoose.connect(fallbackMemoryUri);
      console.log(`[DB] Resilient MongoMemoryServer online at ${fallbackMemoryUri}`);
      return fallbackConnection;
    } catch (fallbackError) {
      console.error('[DB] Critical failure: Unable to establish MongoDB connection', fallbackError);
      throw fallbackError;
    }
  }
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
};
