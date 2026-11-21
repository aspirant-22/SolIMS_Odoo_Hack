/**
 * @AUTHOR: Garima Mittal
 * @FILE: NetworkTimeoutBanner.jsx
 * @RESPONSIBILITY: Displays enterprise system latency banner strictly triggered by 15-second network timeout aborts.
 * @DEPENDENCIES: react, lucide-react, AuthContext.jsx
 */

import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NetworkTimeoutBanner = () => {
  const { hasNetworkTimeout, setHasNetworkTimeout } = useAuth();

  useEffect(() => {
    if (!hasNetworkTimeout) return;
    const timer = setTimeout(() => {
      setHasNetworkTimeout(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, [hasNetworkTimeout, setHasNetworkTimeout]);

  if (!hasNetworkTimeout) return null;

  return (
    <div
      data-component="network-timeout-banner"
      data-purpose="latency-fallback-notification"
      className="bg-amber-500 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-md"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse text-amber-100" />
        <span>
          ⚠️ [ERP System Alert]: Cloud Node latency detected. Transitioning to fallback offline processing state.
        </span>
      </div>
      <button
        onClick={() => setHasNetworkTimeout(false)}
        className="p-1 hover:bg-amber-600 rounded transition-colors text-white"
        aria-label="Dismiss Alert"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
