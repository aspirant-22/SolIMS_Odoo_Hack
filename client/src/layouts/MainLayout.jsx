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
  Layers
} from 'lucide-react';
import { ControlPanelHeader } from './ControlPanelHeader';
import { ProcessingOverlay } from '../components/ProcessingOverlay';
import { NetworkTimeoutBanner } from '../components/NetworkTimeoutBanner';
import { CommandPaletteModal } from './CommandPaletteModal';

export const MainLayout = ({ currentModule, onSelectModule, children }) => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const navigationItems = [
    { id: 'inquiries', label: 'Inquiries & Proposals', icon: Sun, scene: 'Scene 1 & 2' },
    { id: 'warehouse', label: 'Warehouse & Serials', icon: Truck, scene: 'Scene 3' },
    { id: 'technician', label: 'Roof Sign-off Mobile', icon: FileCheck2, scene: 'Scene 4' },
    { id: 'warranty', label: 'Rainy Warranty & Tickets', icon: ShieldCheck, scene: 'Scene 5' },
    { id: 'director', label: 'Director P&L & Subsidies', icon: BarChart3, scene: 'Scene 6' },
    { id: 'diagnostics', label: 'System Diagnostics', icon: Terminal, scene: 'Admin Telemetry' }
  ];

  const moduleBreadcrumbTitles = {
    inquiries: ['SolIMS ERP', 'Inquiries & Proposals', 'Rooftop Survey Pipeline'],
    warehouse: ['SolIMS ERP', 'Warehouse Logistics', 'Serial Number Dispatch & Warranty Initialization'],
    technician: ['SolIMS ERP', 'Field Operations', 'Technician Mobile Roof Sign-off & Digital Signature'],
    warranty: ['SolIMS ERP', 'Customer Support', 'Rainy Season Breakdown & Live Warranty Evaluation'],
    director: ['SolIMS ERP', 'Executive Governance', "Director's Month-End P&L, Margins & Subsidies"],
    diagnostics: ['SolIMS ERP', 'System Administration', 'Monospace Diagnostics & Server Telemetry']
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col text-gray-900">
      <NetworkTimeoutBanner />

      {/* Primary Subdomain Navigation Bar */}
      <nav className="bg-[#714B67] text-white px-6 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectModule('inquiries')}>
            <div className="p-1.5 bg-white/10 rounded-lg">
              <Sun className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block leading-tight">SolIMS ERP</span>
              <span className="text-[10px] text-amber-200 block font-mono leading-none">by Garima Mittal</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1 border-l border-white/20 pl-4">
            {navigationItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectModule(item.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#714B67] shadow-xs'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
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
