/**
 * @AUTHOR: Garima Mittal
 * @FILE: CommandPaletteModal.jsx
 * @RESPONSIBILITY: Global Ctrl+K command palette providing quick route navigation and demo persona switching shortcuts.
 * @DEPENDENCIES: react, lucide-react, AuthContext.jsx
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Sun,
  Truck,
  FileCheck2,
  ShieldCheck,
  BarChart3,
  Terminal,
  UserCheck,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const CommandPaletteModal = ({ isOpen, onClose, onNavigate }) => {
  const { currentUser, switchPersonaRole } = useAuth();
  const [searchFilter, setSearchFilter] = useState('');

  const allNavigationCommands = [
    { id: 'inquiries', label: 'Rooftop Inquiries & Surveys (Scene 1 & 2)', icon: Sun, route: 'inquiries', roles: ['ADMIN', 'OPERATIONS', 'STAFF'] },
    { id: 'orders', label: 'Confirmed Project Orders & BOM', icon: Layers, route: 'orders', roles: ['ADMIN', 'OPERATIONS'] },
    { id: 'warehouse', label: 'Warehouse Dispatch & Serial Scanner (Scene 3)', icon: Truck, route: 'warehouse', roles: ['ADMIN', 'OPERATIONS'] },
    { id: 'technician', label: 'Technician Roof Sign-off (Scene 4)', icon: FileCheck2, route: 'technician', roles: ['ADMIN', 'STAFF'] },
    { id: 'warranty', label: 'Rainy Season Breakdown & Warranty Tickets (Scene 5)', icon: ShieldCheck, route: 'warranty', roles: ['ADMIN', 'OPERATIONS', 'STAFF'] },
    { id: 'director', label: "Director's Month-End P&L & Subsidies (Scene 6)", icon: BarChart3, route: 'director', roles: ['ADMIN', 'OPERATIONS'] },
    { id: 'diagnostics', label: 'Admin Monospace System Diagnostics', icon: Terminal, route: 'diagnostics', roles: ['ADMIN'] }
  ];

  const userRole = currentUser?.role || 'ADMIN';
  const navigationCommands = allNavigationCommands.filter((cmd) => cmd.roles.includes(userRole));

  const personaCommands = [
    { id: 'p-admin', label: 'Switch to Director / Admin (Garima Mittal)', role: 'ADMIN' },
    { id: 'p-ops', label: 'Switch to Operations Manager (Vikram Sethi)', role: 'OPERATIONS' },
    { id: 'p-tech', label: 'Switch to Field Technician Lead (Ramesh Sharma)', role: 'STAFF' },
    { id: 'p-customer', label: 'Switch to Homeowner Client (Sunil Agrawal)', role: 'CUSTOMER' }
  ];

  const filteredNavs = navigationCommands.filter((cmd) =>
    cmd.label.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredPersonas = personaCommands.filter((cmd) =>
    cmd.label.toLowerCase().includes(searchFilter.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onClose(!isOpen);
      } else if (event.key === 'Escape' && isOpen) {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-component="command-palette-modal"
      data-purpose="quick-navigation-dialog"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-2.5">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, module, or persona name..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full text-sm outline-none text-slate-900 font-semibold placeholder-slate-400"
            autoFocus
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono text-slate-600 font-bold bg-slate-100 border border-slate-300 rounded-md">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2.5 divide-y divide-slate-100">
          <div>
            <div className="px-3 py-1.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
              Modules & Scenes
            </div>
            {filteredNavs.map((cmd) => {
              const IconComp = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    onNavigate(cmd.route);
                    onClose(false);
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-slate-800 font-semibold hover:bg-[#714B67]/10 hover:text-[#714B67] rounded-xl transition-colors cursor-pointer"
                >
                  <IconComp className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{cmd.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <div className="px-3 py-1.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
              1-Click Persona Switcher
            </div>
            {filteredPersonas.map((p) => (
              <button
                key={p.id}
                onClick={async () => {
                  await switchPersonaRole(p.role);
                  onClose(false);
                }}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-slate-800 font-bold hover:bg-emerald-50 hover:text-emerald-900 rounded-xl transition-colors cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
