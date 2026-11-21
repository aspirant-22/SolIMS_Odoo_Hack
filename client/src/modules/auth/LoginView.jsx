/**
 * @AUTHOR: Garima Mittal
 * @FILE: LoginView.jsx
 * @RESPONSIBILITY: Renders the Odoo authentication screen with 1-click demo persona switcher buttons for hackathon judges.
 * @DEPENDENCIES: react, lucide-react, AuthContext.jsx
 */

import React, { useState } from 'react';
import {
  Sun,
  Shield,
  Truck,
  Wrench,
  Home,
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginView = () => {
  const { loginUser, switchPersonaRole } = useAuth();
  const [emailInput, setEmailInput] = useState('admin@solims.com');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [errorMessage, setErrorMessage] = useState('');

  const handleStandardSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    try {
      await loginUser(emailInput, passwordInput);
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed');
    }
  };

  const handleInstantPersonaClick = async (targetRole) => {
    setErrorMessage('');
    try {
      await switchPersonaRole(targetRole);
    } catch (err) {
      setErrorMessage(err.message || 'Persona switch failed');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#714B67]/10 via-[#F8F9FA] to-[#008784]/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Brand Banner */}
        <div className="bg-[#714B67] px-6 py-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="inline-flex p-3 bg-white/10 rounded-xl mb-3 backdrop-blur-xs">
            <Sun className="w-8 h-8 text-amber-300 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SolIMS ERP</h1>
          <p className="text-xs text-white/80 mt-1 font-medium">
            Solar Installation Management System • Odoo Hackathon Finale
          </p>
          <div className="mt-2 text-[11px] text-amber-200 font-mono">
            Authored by Garima Mittal
          </div>
        </div>

        {/* 1-Click Judge Demo Switcher Ribbon */}
        <div className="bg-amber-50/70 border-b border-amber-200/60 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>1-Click Live Demo Persona Switcher (For Judges)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleInstantPersonaClick('ADMIN')}
              className="flex items-center gap-2 p-2 bg-white hover:bg-purple-50 border border-purple-200 rounded-lg text-left transition-colors shadow-2xs group"
            >
              <Shield className="w-4 h-4 text-purple-700 shrink-0" />
              <div>
                <div className="text-xs font-bold text-purple-900 leading-tight">Director</div>
                <div className="text-[10px] text-gray-500">P&L & Subsidies</div>
              </div>
            </button>

            <button
              onClick={() => handleInstantPersonaClick('OPERATIONS')}
              className="flex items-center gap-2 p-2 bg-white hover:bg-teal-50 border border-teal-200 rounded-lg text-left transition-colors shadow-2xs group"
            >
              <Truck className="w-4 h-4 text-teal-700 shrink-0" />
              <div>
                <div className="text-xs font-bold text-teal-900 leading-tight">Operations</div>
                <div className="text-[10px] text-gray-500">Dispatch & Quotes</div>
              </div>
            </button>

            <button
              onClick={() => handleInstantPersonaClick('STAFF')}
              className="flex items-center gap-2 p-2 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg text-left transition-colors shadow-2xs group"
            >
              <Wrench className="w-4 h-4 text-blue-700 shrink-0" />
              <div>
                <div className="text-xs font-bold text-blue-900 leading-tight">Technician</div>
                <div className="text-[10px] text-gray-500">Roof Sign-off</div>
              </div>
            </button>

            <button
              onClick={() => handleInstantPersonaClick('CUSTOMER')}
              className="flex items-center gap-2 p-2 bg-white hover:bg-amber-50 border border-amber-200 rounded-lg text-left transition-colors shadow-2xs group"
            >
              <Home className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-900 leading-tight">Homeowner</div>
                <div className="text-[10px] text-gray-500">Warranties & Portal</div>
              </div>
            </button>
          </div>
        </div>

        {/* Standard Credentials Form */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleStandardSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Corporate Email
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="odoo-input"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="odoo-input"
                required
              />
            </div>

            <button
              type="submit"
              className="odoo-btn-primary w-full py-2.5 text-sm gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Log In to SolIMS ERP</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
