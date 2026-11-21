/**
 * @AUTHOR: Garima Mittal
 * @FILE: MainLayout.jsx
 * @RESPONSIBILITY: Master enterprise layout wrapping the White Glass Navbar, Control Panel, top navigation ribbon, and global modals.
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
  Layers
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
    <div className="min-h-screen bg-[#F4F9F6] flex flex-col text-slate-900 font-sans">
      <NetworkTimeoutBanner />

      {/* Primary Subdomain Navigation Bar: White Glass Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-emerald-900/10 px-6 py-2.5 flex items-center justify-between shadow-xs sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectModule('inquiries')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#135D3B] to-emerald-600 flex items-center justify-center shadow-xs text-white">
              <Sun className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-[#0F291E] block leading-tight">SolIMS ERP</span>
              <span className="text-[10px] text-[#135D3B] block font-mono font-bold leading-none">by Garima Mittal</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 border-l border-emerald-900/10 pl-4">
            {navigationItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectModule(item.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-b-2 border-[#135D3B] text-[#135D3B] font-semibold bg-[#E6F4EC]'
                      : 'text-slate-600 hover:text-[#135D3B] hover:bg-emerald-50/60'
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
          <div className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-full text-xs border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold uppercase px-2">Switch:</span>
            <button
              onClick={() => switchPersonaRole('ADMIN')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                userRole === 'ADMIN' ? 'bg-[#135D3B] text-white shadow-xs' : 'text-slate-600 hover:text-[#135D3B]'
              }`}
            >
              Director
            </button>
            <button
              onClick={() => switchPersonaRole('OPERATIONS')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                userRole === 'OPERATIONS' ? 'bg-[#135D3B] text-white shadow-xs' : 'text-slate-600 hover:text-[#135D3B]'
              }`}
            >
              Ops
            </button>
            <button
              onClick={() => switchPersonaRole('STAFF')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                userRole === 'STAFF' ? 'bg-[#135D3B] text-white shadow-xs' : 'text-slate-600 hover:text-[#135D3B]'
              }`}
            >
              Tech
            </button>
            <button
              onClick={() => switchPersonaRole('CUSTOMER')}
              className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#E6F4EC] text-[#135D3B] border border-[#135D3B]/20 hover:bg-emerald-100 transition-all cursor-pointer ml-1"
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

export default MainLayout;
