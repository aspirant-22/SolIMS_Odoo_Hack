/**
 * @AUTHOR: Garima Mittal
 * @FILE: socket.js
 * @RESPONSIBILITY: Manages client-side Socket.IO real-time connection and event subscription channels.
 * @DEPENDENCIES: socket.io-client
 */

import { io } from 'socket.io-client';

let socketClientInstance = null;

export const connectRealtimeSocket = () => {
  if (!socketClientInstance) {
    socketClientInstance = io(window.location.origin, {
      path: '/socket.io',
      withCredentials: true,
      autoConnect: true
    });

    socketClientInstance.on('connect', () => {
      console.log('[SOCKET] Connected to SolIMS ERP real-time broker');
    });

    socketClientInstance.on('disconnect', () => {
      console.log('[SOCKET] Disconnected from SolIMS ERP real-time broker');
    });
  }
  return socketClientInstance;
};

export const subscribeToErpEvent = (targetEventName, eventHandlerCallback) => {
  const activeSocket = connectRealtimeSocket();
  activeSocket.on(targetEventName, eventHandlerCallback);
  return () => {
    activeSocket.off(targetEventName, eventHandlerCallback);
  };
};
