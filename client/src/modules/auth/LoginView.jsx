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
    <div className="min-h-screen bg-gradient-to-br from-[#4A2545]/15 via-slate-50 to-[#008784]/15 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden">
        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-[#4A2545] to-[#714B67] px-6 py-8 text-white text-center relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="inline-flex p-3 bg-white/10 rounded-xl mb-3 backdrop-blur-xs border border-white/20">
            <Sun className="w-8 h-8 text-amber-300 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">SolIMS ERP</h1>
          <p className="text-xs text-white/90 mt-1 font-medium">
            Solar Installation Management System • Odoo Hackathon Finale
          </p>
          <div className="mt-2 text-[11px] text-amber-200 font-mono font-semibold">
            Authored by Garima Mittal
          </div>
        </div>

        {/* 1-Click Judge Demo Switcher Ribbon */}
        <div className="bg-amber-50/80 border-b border-amber-200/80 p-4">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-950 mb-2.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>1-Click Live Demo Persona Switcher (For Judges)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleInstantPersonaClick('ADMIN')}
              className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-purple-50/80 border border-purple-300 rounded-xl text-left transition-all shadow-xs hover:shadow-sm cursor-pointer group"
            >
              <div className="p-1.5 bg-purple-100 rounded-lg text-purple-700">
                <Shield className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-purple-950 leading-tight">Director</div>
                <div className="text-[10px] font-medium text-slate-500">P&L & Subsidies</div>
              </div>
            </button>

            <button
              onClick={() => handleInstantPersonaClick('OPERATIONS')}
              className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-teal-50/80 border border-teal-300 rounded-xl text-left transition-all shadow-xs hover:shadow-sm cursor-pointer group"
            >
              <div className="p-1.5 bg-teal-100 rounded-lg text-teal-700">
                <Truck className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-teal-950 leading-tight">Operations</div>
                <div className="text-[10px] font-medium text-slate-500">Dispatch & Quotes</div>
              </div>
            </button>

            <button
              onClick={() => handleInstantPersonaClick('STAFF')}
              className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-blue-50/80 border border-blue-300 rounded-xl text-left transition-all shadow-xs hover:shadow-sm cursor-pointer group"
            >
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
                <Wrench className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-blue-950 leading-tight">Technician</div>
                <div className="text-[10px] font-medium text-slate-500">Roof Sign-off</div>
              </div>
            </button>

            <button
              onClick={() => handleInstantPersonaClick('CUSTOMER')}
              className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-amber-50/80 border border-amber-300 rounded-xl text-left transition-all shadow-xs hover:shadow-sm cursor-pointer group"
            >
              <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                <Home className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-amber-950 leading-tight">Homeowner</div>
                <div className="text-[10px] font-medium text-slate-500">Warranties & Portal</div>
              </div>
            </button>
          </div>
        </div>

        {/* Standard Credentials Form */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-semibold flex items-center gap-2">
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleStandardSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
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
