/**
 * @AUTHOR: Garima Mittal
 * @FILE: socketEmitter.js
 * @RESPONSIBILITY: Manages global Socket.IO instance and dispatches real-time ERP events across client sessions.
 * @DEPENDENCIES: socket.io
 */

let globalSocketServerInstance = null;

export const initializeSocketEmitter = (socketIoServer) => {
  globalSocketServerInstance = socketIoServer;
};

export const emitErpEvent = (eventName, eventPayload) => {
  if (!globalSocketServerInstance) {
    return;
  }
  globalSocketServerInstance.emit(eventName, {
    ...eventPayload,
    dispatchedTimestamp: new Date().toISOString()
  });
};
