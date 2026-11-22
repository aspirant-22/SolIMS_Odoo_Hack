/**
 * @AUTHOR: Garima Mittal
 * @FILE: MainLayout.jsx
 * @RESPONSIBILITY: Master enterprise layout wrapping the White Glass Navbar, Control Panel, top navigation ribbon, and global modals.
 * @DEPENDENCIES: react, lucide-react, ControlPanelHeader.jsx, ProcessingOverlay.jsx, NetworkTimeoutBanner.jsx, CommandPaletteModal.jsx
 */

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Sun,
  Truck,
  FileCheck2,
  ShieldCheck,
  BarChart3,
  Terminal,
  Layers,
  Boxes,
  Mail
} from 'lucide-react';
import { ControlPanelHeader } from './ControlPanelHeader';
import { ORDER_LIFECYCLE_STAGES } from './ProgressWorkflowRibbon';
import { ProcessingOverlay } from '../components/ProcessingOverlay';
import { NetworkTimeoutBanner } from '../components/NetworkTimeoutBanner';
import { CommandPaletteModal } from './CommandPaletteModal';
import { SimulatedEmailOutboxModal } from '../components/SimulatedEmailOutboxModal';
import { useAuth } from '../context/AuthContext';

export const MainLayout = ({ currentModule, children }) => {
  const { currentUser, switchPersonaRole } = useAuth();
  const navigate = useNavigate();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [currentStage, setCurrentStage] = useState('Ready');

  const moduleStages = {
    inquiries: ['Draft', 'Survey_Scheduled', 'Survey_Completed', 'Approved'],
    orders: ORDER_LIFECYCLE_STAGES,
    warehouse: ['Waiting_Dispatch', 'Scanning_Serials', 'Ready_To_Ship', 'Dispatched'],
    inventory: ['In_Stock', 'Low_Stock', 'Restocking', 'Replenished'],
    technician: ['Roster_Assigned', 'On_Roof', 'Testing_Watts', 'Signed_Off'],
    warranty: ['Active_Coverage', 'Ticket_Logged', 'Payment_Checked', 'Resolved'],
    director: ['Month_P&L', 'Margins', 'Subsidies', 'Ledger'],
    diagnostics: ['Node_Active', 'Mongo_Cluster', 'Telemetry_Stream', 'Audit_Healthy']
  };

  const activeStages = moduleStages[currentModule] || ['Draft', 'Waiting', 'Ready', 'Done'];

  // Strict RBAC module whitelist
  const allNavigationItems = [
    { id: 'inquiries', path: '/inquiries', label: 'Inquiries & Proposals', icon: Sun, scene: 'Scene 1 & 2', roles: ['ADMIN', 'OPERATIONS', 'STAFF'] },
    { id: 'orders', path: '/orders', label: 'Orders & BOM', icon: Layers, scene: 'BOM & Advance', roles: ['ADMIN', 'OPERATIONS'] },
    { id: 'warehouse', path: '/dispatch', label: 'Warehouse & Serials', icon: Truck, scene: 'Scene 3', roles: ['ADMIN', 'OPERATIONS'] },
    { id: 'inventory', path: '/inventory', label: 'Inventory Stock', icon: Boxes, scene: 'Live Stock Levels', roles: ['ADMIN', 'OPERATIONS'] },
    { id: 'technician', path: '/field-install', label: 'Roof Sign-off Mobile', icon: FileCheck2, scene: 'Scene 4', roles: ['ADMIN', 'STAFF'] },
    { id: 'warranty', path: '/warranty', label: 'Rainy Warranty & Tickets', icon: ShieldCheck, scene: 'Scene 5', roles: ['ADMIN', 'OPERATIONS', 'STAFF'] },
    { id: 'director', path: '/director', label: 'Director P&L & Subsidies', icon: BarChart3, scene: 'Scene 6', roles: ['ADMIN', 'OPERATIONS'] },
    { id: 'diagnostics', path: '/admin/system-logs', label: 'System Diagnostics', icon: Terminal, scene: 'Admin Telemetry', roles: ['ADMIN'] }
  ];

  const userRole = currentUser?.role || 'ADMIN';
  const navigationItems = allNavigationItems.filter((item) => item.roles.includes(userRole));

  const moduleBreadcrumbTitles = {
    inquiries: ['SolIMS ERP', 'Inquiries & Proposals', 'Rooftop Survey Pipeline'],
    orders: ['SolIMS ERP', 'Confirmed Orders & BOM', 'Advance Locks & Crew Scheduling'],
    warehouse: ['SolIMS ERP', 'Warehouse Logistics', 'Serial Number Dispatch & Warranty Initialization'],
    inventory: ['SolIMS ERP', 'Warehouse Logistics', 'Live Inventory Stock Levels & Restocking'],
    technician: ['SolIMS ERP', 'Field Operations', 'Technician Mobile Roof Sign-off & Digital Signature'],
    warranty: ['SolIMS ERP', 'Customer Support', 'Rainy Season Breakdown & Live Warranty Evaluation'],
    director: ['SolIMS ERP', 'Executive Governance', "Director's Month-End P&L, Margins & Subsidies"],
    diagnostics: ['SolIMS ERP', 'System Administration', 'Monospace Diagnostics & Server Telemetry']
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      <NetworkTimeoutBanner />

      {/* Primary Subdomain Navigation Bar: Clean White Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-6 py-2.5 flex items-center justify-between shadow-xs sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/inquiries')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#135D3B] to-[#0E462C] flex items-center justify-center shadow-xs text-white">
              <Sun className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="font-heading font-black text-sm tracking-tight text-slate-900 block leading-tight">SolIMS ERP</span>
              <span className="text-[10px] text-[#135D3B] block font-mono font-bold leading-none">by Garima Mittal</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 border-l border-slate-200 pl-4">
            {navigationItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentModule === item.id;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${isActive
                      ? 'border-b-2 border-[#135D3B] text-[#135D3B] font-semibold bg-[#E6F4EC]'
                      : 'text-slate-600 hover:text-[#135D3B] hover:bg-slate-100'
                    }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Right side navigation actions & persona switcher */}
        <div className="flex items-center gap-2">
          {/* Clean Top Navbar Simulated Mailbox Button (replaces bottom-right floating pill on internal routes) */}
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#E6F4EC] text-[#135D3B] border border-emerald-300 hover:bg-emerald-100 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            title="Open Zero-Config Simulated Email Outbox"
          >
            <Mail className="w-3.5 h-3.5 text-[#135D3B]" />
            <span className="hidden sm:inline">Simulated Mailbox</span>
            <span className="sm:hidden">Mailbox</span>
          </button>

          <div className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-full text-xs border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold uppercase px-2">Switch:</span>
            <button
              onClick={() => switchPersonaRole('ADMIN')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${userRole === 'ADMIN' ? 'bg-[#135D3B] text-white shadow-xs' : 'text-slate-600 hover:text-[#135D3B]'
                }`}
            >
              Director
            </button>
            <button
              onClick={() => switchPersonaRole('OPERATIONS')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${userRole === 'OPERATIONS' ? 'bg-[#135D3B] text-white shadow-xs' : 'text-slate-600 hover:text-[#135D3B]'
                }`}
            >
              Ops
            </button>
            <button
              onClick={() => switchPersonaRole('STAFF')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${userRole === 'STAFF' ? 'bg-[#135D3B] text-white shadow-xs' : 'text-slate-600 hover:text-[#135D3B]'
                }`}
            >
              Tech
            </button>
            <button
              onClick={() => switchPersonaRole('CUSTOMER')}
              className="px-3 py-1 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:text-[#135D3B] hover:border-[#135D3B]/30 shadow-2xs transition-all cursor-pointer ml-1"
            >
              Customer Portal ➔
            </button>
          </div>
        </div>
      </nav>

      {/* Control Panel Header */}
      <ControlPanelHeader
        breadcrumbHierarchy={moduleBreadcrumbTitles[currentModule] || ['SolIMS', 'Dashboard']}
        workflowStages={activeStages}
        currentStage={currentStage}
        onSelectStage={(st) => setCurrentStage(st)}
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
      />
      <SimulatedEmailOutboxModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </div>
  );
};

export default MainLayout;
