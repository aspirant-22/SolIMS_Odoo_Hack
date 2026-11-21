/**
 * @AUTHOR: Garima Mittal
 * @FILE: ProcessingOverlay.jsx
 * @RESPONSIBILITY: Global modal overlay preventing double-click race conditions during active asynchronous state mutations.
 * @DEPENDENCIES: react, lucide-react, AuthContext.jsx
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProcessingOverlay = () => {
  const { isSystemProcessing } = useAuth();

  if (!isSystemProcessing) return null;

  return (
    <div
      data-component="processing-overlay"
      data-purpose="prevent-mutation-race-conditions"
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center transition-opacity"
    >
      <div className="bg-white rounded-lg p-5 shadow-xl flex items-center gap-3 border border-gray-200">
        <Loader2 className="w-6 h-6 text-[#714B67] animate-spin" />
        <span className="text-sm font-semibold text-gray-800">
          SolIMS Engine: Validating Transaction...
        </span>
      </div>
    </div>
  );
};
