/**
 * @AUTHOR: Garima Mittal
 * @FILE: AuthContext.jsx
 * @RESPONSIBILITY: React Context providing global authentication state, 1-click persona switching, and processing flags.
 * @DEPENDENCIES: react, api.js
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { executeHttpRequest } from '../services/api.js';

const ErpSecurityContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSystemProcessing, setIsSystemProcessing] = useState(false);
  const [hasNetworkTimeout, setHasNetworkTimeout] = useState(false);

  const fetchSessionProfile = async () => {
    try {
      const response = await executeHttpRequest('/api/auth/profile', {}, setHasNetworkTimeout);
      if (response.success && response.user) {
        setCurrentUser(response.user);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    fetchSessionProfile();
  }, []);

  const loginUser = async (email, password) => {
    setIsSystemProcessing(true);
    try {
      const response = await executeHttpRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }, setHasNetworkTimeout);

      if (response.success && response.user) {
        setCurrentUser(response.user);
      }
      return response;
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const switchPersonaRole = async (targetRole) => {
    setIsSystemProcessing(true);
    try {
      const response = await executeHttpRequest('/api/auth/switch-persona', {
        method: 'POST',
        body: JSON.stringify({ targetRole })
      }, setHasNetworkTimeout);

      if (response.success && response.user) {
        setCurrentUser(response.user);
      }
      return response;
    } finally {
      setIsSystemProcessing(false);
    }
  };

  const logoutUser = async () => {
    setIsSystemProcessing(true);
    try {
      await executeHttpRequest('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
    } finally {
      setIsSystemProcessing(false);
    }
  };

  return (
    <ErpSecurityContext.Provider
      value={{
        currentUser,
        isInitializing,
        isSystemProcessing,
        setIsSystemProcessing,
        hasNetworkTimeout,
        setHasNetworkTimeout,
        loginUser,
        switchPersonaRole,
        logoutUser,
        refreshSession: fetchSessionProfile
      }}
    >
      {children}
    </ErpSecurityContext.Provider>
  );
};

export const useAuth = () => {
  const contextValue = useContext(ErpSecurityContext);
  if (!contextValue) {
    throw new Error('useAuth must be invoked within an AuthProvider subtree');
  }
  return contextValue;
};
