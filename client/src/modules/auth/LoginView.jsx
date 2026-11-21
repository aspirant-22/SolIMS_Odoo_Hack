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
    <div className="min-h-screen bg-[#F4F9F6] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-[#0F291E] via-[#135D3B] to-[#0E462C] px-6 py-8 text-white text-center relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-3 backdrop-blur-xs border border-white/20">
            <Sun className="w-8 h-8 text-amber-300 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">SolIMS ERP</h1>
          <p className="text-xs text-emerald-100 mt-1 font-medium">
            Solar Installation Management System • Odoo Hackathon Finale
          </p>
          <div className="mt-2 text-[11px] text-amber-300 font-mono font-semibold">
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
              className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-[#E6F4EC] border border-[#135D3B]/20 rounded-xl text-left transition-all shadow-2xs hover:shadow-sm cursor-pointer group"
            >
              <div className="p-1.5 bg-[#E6F4EC] rounded-lg text-[#135D3B]">
                <Shield className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-[#0F291E] leading-tight">Director</div>
                <div className="text-[10px] font-medium text-slate-500">P&L & Subsidies</div>
              </div>
            </button>

            <button
              onClick={() => handleInstantPersonaClick('OPERATIONS')}
              className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-[#E6F4EC] border border-[#135D3B]/20 rounded-xl text-left transition-all shadow-2xs hover:shadow-sm cursor-pointer group"
            >
              <div className="p-1.5 bg-[#E6F4EC] rounded-lg text-[#135D3B]">
                <Truck className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-[#0F291E] leading-tight">Operations</div>
                <div className="text-[10px] font-medium text-slate-500">Dispatch & Quotes</div>
              </div>
            </button>

            <button
              onClick={() => handleInstantPersonaClick('STAFF')}
              className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-[#E6F4EC] border border-[#135D3B]/20 rounded-xl text-left transition-all shadow-2xs hover:shadow-sm cursor-pointer group"
            >
              <div className="p-1.5 bg-[#E6F4EC] rounded-lg text-[#135D3B]">
                <Wrench className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-[#0F291E] leading-tight">Technician</div>
                <div className="text-[10px] font-medium text-slate-500">Roof Sign-off</div>
              </div>
            </button>

            <button
              onClick={() => handleInstantPersonaClick('CUSTOMER')}
              className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-amber-50 border border-amber-300 rounded-xl text-left transition-all shadow-2xs hover:shadow-sm cursor-pointer group"
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
