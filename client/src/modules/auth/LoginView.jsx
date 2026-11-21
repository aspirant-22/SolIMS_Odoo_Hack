/**
 * @AUTHOR: Garima Mittal
 * @FILE: LoginView.jsx
 * @RESPONSIBILITY: Renders the SolIMS authentication screen with 1-click demo persona switcher buttons matching the Forest-Emerald & Soft-Mint Grid Design System.
 * @DEPENDENCIES: react, lucide-react, AuthContext.jsx
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Shield,
  Truck,
  Wrench,
  Home,
  ArrowRight,
  Sparkles,
  Lock,
  ArrowLeft,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AlertBanner } from '../../components/AlertBanner';

const PERSONAS = [
  {
    role: 'ADMIN', title: 'Director', person: 'Garima Mittal', initials: 'GM', icon: Shield, badge: 'ADMIN', route: '/director',
    summary: 'Executive P&L, job margins and subsidy tracking with full system access.',
    perms: ['P&L & margins', 'CSV export', 'Diagnostics'],
    avatar: 'bg-gradient-to-br from-indigo-500 to-indigo-700', bar: 'bg-indigo-500',
    chip: 'bg-indigo-50 text-indigo-800 border-indigo-200', hover: 'hover:border-indigo-300'
  },
  {
    role: 'OPERATIONS', title: 'Operations', person: 'Vikram Sethi', initials: 'VS', icon: Truck, badge: 'OPS', route: '/inquiries',
    summary: 'Surveys, Auto-BOM quotes, orders and barcode serial dispatch.',
    perms: ['Quotes & BOM', 'Dispatch', 'Warranty'],
    avatar: 'bg-gradient-to-br from-sky-500 to-sky-700', bar: 'bg-sky-500',
    chip: 'bg-sky-50 text-sky-800 border-sky-200', hover: 'hover:border-sky-300'
  },
  {
    role: 'STAFF', title: 'Technician', person: 'Ramesh Sharma', initials: 'RS', icon: Wrench, badge: 'STAFF', route: '/field-install',
    summary: 'Mobile roof sign-off with live camera capture and client signature.',
    perms: ['Roof sign-off', 'Camera', 'Tickets'],
    avatar: 'bg-gradient-to-br from-amber-400 to-amber-600', bar: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-800 border-amber-200', hover: 'hover:border-amber-300'
  },
  {
    role: 'CUSTOMER', title: 'Homeowner', person: 'Sunil Agrawal', initials: 'SA', icon: Home, badge: 'CLIENT', route: '/my-solar',
    summary: 'Live generation, warranty countdowns and monsoon repair requests.',
    perms: ['My solar', 'Warranty', 'Report fault'],
    avatar: 'bg-gradient-to-br from-emerald-500 to-emerald-700', bar: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-800 border-emerald-200', hover: 'hover:border-emerald-300'
  }
];

export const LoginView = () => {
  const navigate = useNavigate();
  const onBackToLanding = () => navigate('/');
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
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-slate-200/90 overflow-hidden">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PERSONAS.map((persona) => {
              const PIcon = persona.icon;
              return (
                <button
                  key={persona.role}
                  onClick={() => handleInstantPersonaClick(persona.role)}
                  className={"relative flex flex-col gap-3 p-4 bg-white border border-slate-200/80 rounded-2xl text-left transition-all duration-200 shadow-card hover:shadow-lift hover:-translate-y-1 cursor-pointer group overflow-hidden " + persona.hover}
                >
                  <span className={"absolute inset-x-0 top-0 h-1 " + persona.bar} />
                  <div className="flex items-center gap-3">
                    <span className={"w-11 h-11 rounded-full flex items-center justify-center font-heading text-sm font-extrabold text-white shadow-sm shrink-0 " + persona.avatar}>
                      {persona.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-heading text-sm font-extrabold text-slate-900 leading-tight">{persona.title}</div>
                      <div className="text-[11px] text-slate-600 font-medium truncate">{persona.person}</div>
                    </div>
                    <span className={"p-1.5 rounded-lg border shrink-0 " + persona.chip}><PIcon className="w-4 h-4" /></span>
                  </div>
                  <p className="text-xs text-slate-700 leading-snug">{persona.summary}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {persona.perms.map((perm) => (
                      <span key={perm} className={"inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border " + persona.chip}>
                        <Check className="w-3 h-3" />{perm}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold">
                    <span className={"font-mono px-1.5 py-0.5 rounded border " + persona.chip}>{persona.badge}</span>
                    <span className="text-slate-700 group-hover:text-slate-900 inline-flex items-center gap-1">Enter {persona.route}<ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Standard Credentials Form */}
        <div className="p-6">
          <AlertBanner
            type="error"
            message={errorMessage}
            onDismiss={() => setErrorMessage('')}
            className="mb-4"
          />

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
