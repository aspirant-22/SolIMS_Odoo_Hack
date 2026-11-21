/**
 * @AUTHOR: Garima Mittal
 * @FILE: LoginView.jsx
 * @RESPONSIBILITY: Renders the SolIMS authentication screen with 1-click demo persona switcher buttons matching the Forest-Emerald & Soft-Mint Grid Design System.
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
  Lock,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginView = ({ onBackToLanding }) => {
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-200/90 overflow-hidden">
        {/* Brand Banner - Forest Green Brand Header */}
        <div className="bg-gradient-to-r from-[#0F291E] via-[#135D3B] to-[#0E462C] px-6 py-8 text-white text-center relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-3 backdrop-blur-xs border border-white/20 shadow-xs">
            <Sun className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-white">SolIMS ERP</h1>
          <p className="text-xs text-emerald-100 mt-1 font-medium">
            Solar Installation Management System • Odoo Hackathon Finale
          </p>
          <div className="mt-2 text-[11px] text-amber-300 font-mono font-semibold">
            Authored by Garima Mittal
          </div>
        </div>

        {/* 1-Click Judge Demo Switcher Section */}
        <div className="bg-slate-50 border-b border-slate-200/90 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>1-Click Live Demo Persona Switcher (For Judges)</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-white text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              4 Roles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Director Persona */}
            <button
              onClick={() => handleInstantPersonaClick('ADMIN')}
              className="flex items-start gap-3 p-3 bg-white hover:bg-indigo-50/40 border border-slate-200/90 hover:border-indigo-300 rounded-2xl text-left transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer group"
            >
              <div className="p-2 bg-indigo-50 group-hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200/60 shrink-0 transition-colors">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xs font-bold text-slate-900 group-hover:text-indigo-900">Director</span>
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">ADMIN</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">Executive P&L, margins & subsidy claims</div>
              </div>
            </button>

            {/* 2. Operations Persona */}
            <button
              onClick={() => handleInstantPersonaClick('OPERATIONS')}
              className="flex items-start gap-3 p-3 bg-white hover:bg-sky-50/40 border border-slate-200/90 hover:border-sky-300 rounded-2xl text-left transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer group"
            >
              <div className="p-2 bg-sky-50 group-hover:bg-sky-100 text-sky-700 rounded-xl border border-sky-200/60 shrink-0 transition-colors">
                <Truck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xs font-bold text-slate-900 group-hover:text-sky-900">Operations</span>
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200">OPS</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">Auto-BOM, survey quotes & serial dispatch</div>
              </div>
            </button>

            {/* 3. Technician Persona */}
            <button
              onClick={() => handleInstantPersonaClick('STAFF')}
              className="flex items-start gap-3 p-3 bg-white hover:bg-amber-50/40 border border-slate-200/90 hover:border-amber-300 rounded-2xl text-left transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer group"
            >
              <div className="p-2 bg-amber-50 group-hover:bg-amber-100 text-amber-800 rounded-xl border border-amber-200/60 shrink-0 transition-colors">
                <Wrench className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xs font-bold text-slate-900 group-hover:text-amber-950">Technician</span>
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">STAFF</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">Mobile roof sign-off & digital signature</div>
              </div>
            </button>

            {/* 4. Homeowner Persona */}
            <button
              onClick={() => handleInstantPersonaClick('CUSTOMER')}
              className="flex items-start gap-3 p-3 bg-white hover:bg-emerald-50/40 border border-slate-200/90 hover:border-emerald-300 rounded-2xl text-left transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer group"
            >
              <div className="p-2 bg-emerald-50 group-hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200/60 shrink-0 transition-colors">
                <Home className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xs font-bold text-slate-900 group-hover:text-emerald-950">Homeowner</span>
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">CLIENT</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">Live power generation & 20-Yr warranty</div>
              </div>
            </button>
          </div>
        </div>

        {/* Standard Credentials Form */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
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
              className="w-full rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold py-3 px-5 shadow-sm transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Log In to SolIMS ERP</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {onBackToLanding && (
            <div className="mt-4 pt-3 border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={onBackToLanding}
                className="text-xs font-bold text-slate-600 hover:text-[#135D3B] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to SolIMS Public Website & Calculator</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginView;
