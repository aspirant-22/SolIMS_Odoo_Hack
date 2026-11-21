/**
 * @AUTHOR: Garima Mittal
 * @FILE: MainLayout.jsx
 * @RESPONSIBILITY: Master enterprise layout wrapping the Control Panel, top navigation ribbon, and global modals.
 * @DEPENDENCIES: react, lucide-react, ControlPanelHeader.jsx, ProcessingOverlay.jsx, NetworkTimeoutBanner.jsx, CommandPaletteModal.jsx
 */

import React, { useState } from 'react';
import {
  Sun,
  Truck,
  FileCheck2,
  ShieldCheck,
  BarChart3,
  Terminal,
  Layers,
  Sparkles
} from 'lucide-react';
import { ControlPanelHeader } from './ControlPanelHeader';
import { ProcessingOverlay } from '../components/ProcessingOverlay';
import { NetworkTimeoutBanner } from '../components/NetworkTimeoutBanner';
import { CommandPaletteModal } from './CommandPaletteModal';
import { useAuth } from '../context/AuthContext';

export const MainLayout = ({ currentModule, onSelectModule, children }) => {
  const { currentUser, switchPersonaRole } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Strict RBAC module whitelist
  const allNavigationItems = [
    { id: 'inquiries', label: 'Inquiries & Proposals', icon: Sun, scene: 'Scene 1 & 2', roles: ['ADMIN', 'OPERATIONS', 'STAFF'] },
    { id: 'orders', label: 'Orders & BOM', icon: Layers, scene: 'BOM & Advance', roles: ['ADMIN', 'OPERATIONS'] },
    { id: 'warehouse', label: 'Warehouse & Serials', icon: Truck, scene: 'Scene 3', roles: ['ADMIN', 'OPERATIONS'] },
    { id: 'technician', label: 'Roof Sign-off Mobile', icon: FileCheck2, scene: 'Scene 4', roles: ['ADMIN', 'STAFF'] },
    { id: 'warranty', label: 'Rainy Warranty & Tickets', icon: ShieldCheck, scene: 'Scene 5', roles: ['ADMIN', 'OPERATIONS', 'STAFF'] },
    { id: 'director', label: 'Director P&L & Subsidies', icon: BarChart3, scene: 'Scene 6', roles: ['ADMIN', 'OPERATIONS'] },
    { id: 'diagnostics', label: 'System Diagnostics', icon: Terminal, scene: 'Admin Telemetry', roles: ['ADMIN'] }
  ];

  const userRole = currentUser?.role || 'ADMIN';
  const navigationItems = allNavigationItems.filter((item) => item.roles.includes(userRole));

  const moduleBreadcrumbTitles = {
    inquiries: ['SolIMS ERP', 'Inquiries & Proposals', 'Rooftop Survey Pipeline'],
    orders: ['SolIMS ERP', 'Confirmed Orders & BOM', 'Advance Locks & Crew Scheduling'],
    warehouse: ['SolIMS ERP', 'Warehouse Logistics', 'Serial Number Dispatch & Warranty Initialization'],
    technician: ['SolIMS ERP', 'Field Operations', 'Technician Mobile Roof Sign-off & Digital Signature'],
    warranty: ['SolIMS ERP', 'Customer Support', 'Rainy Season Breakdown & Live Warranty Evaluation'],
    director: ['SolIMS ERP', 'Executive Governance', "Director's Month-End P&L, Margins & Subsidies"],
    diagnostics: ['SolIMS ERP', 'System Administration', 'Monospace Diagnostics & Server Telemetry']
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col text-slate-900 font-sans">
      <NetworkTimeoutBanner />

      {/* Primary Subdomain Navigation Bar */}
      <nav className="bg-[#714B67] text-white px-6 py-2.5 flex items-center justify-between shadow-sm border-b border-[#5D3C54]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectModule('inquiries')}>
            <div className="p-1.5 bg-white/10 rounded-lg border border-white/20">
              <Sun className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block leading-tight">SolIMS ERP</span>
              <span className="text-[10px] text-amber-300 block font-mono font-bold leading-none">by Garima Mittal</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 border-l border-white/20 pl-4">
            {navigationItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectModule(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#714B67] shadow-sm'
                      : 'text-purple-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side persona switcher for judges */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg text-xs border border-white/15">
            <span className="text-[10px] text-amber-200 font-bold uppercase mr-1">Switch:</span>
            <button
              onClick={() => switchPersonaRole('ADMIN')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                userRole === 'ADMIN' ? 'bg-white text-[#714B67] font-extrabold' : 'text-purple-100 hover:text-white'
              }`}
            >
              Director
            </button>
            <button
              onClick={() => switchPersonaRole('OPERATIONS')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                userRole === 'OPERATIONS' ? 'bg-white text-[#714B67] font-extrabold' : 'text-purple-100 hover:text-white'
              }`}
            >
              Ops
            </button>
            <button
              onClick={() => switchPersonaRole('STAFF')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                userRole === 'STAFF' ? 'bg-white text-[#714B67] font-extrabold' : 'text-purple-100 hover:text-white'
              }`}
            >
              Tech
            </button>
            <button
              onClick={() => switchPersonaRole('CUSTOMER')}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-900 hover:bg-amber-300 transition-all cursor-pointer ml-1"
            >
              Customer Portal ➔
            </button>
          </div>
        </div>
      </nav>

      {/* Control Panel Header */}
      <ControlPanelHeader
        breadcrumbHierarchy={moduleBreadcrumbTitles[currentModule] || ['SolIMS', 'Dashboard']}
        workflowStages={['Draft', 'Waiting', 'Ready', 'Done']}
        currentStage="Ready"
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Dynamic Viewport */}
      <main className="flex-1">
        {children}
      </main>

      <ProcessingOverlay />
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={setIsCommandPaletteOpen}
        onNavigate={onSelectModule}
      />
    </div>
  );
};
