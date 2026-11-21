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
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const CommandPaletteModal = ({ isOpen, onClose, onNavigate }) => {
  const { switchPersonaRole } = useAuth();
  const [searchFilter, setSearchFilter] = useState('');

  const navigationCommands = [
    { id: 'inquiries', label: 'Rooftop Inquiries & Surveys (Scene 1 & 2)', icon: Sun, route: 'inquiries' },
    { id: 'warehouse', label: 'Warehouse Dispatch & Serial Scanner (Scene 3)', icon: Truck, route: 'warehouse' },
    { id: 'technician', label: 'Technician Roof Sign-off (Scene 4)', icon: FileCheck2, route: 'technician' },
    { id: 'warranty', label: 'Rainy Season Breakdown & Warranty Tickets (Scene 5)', icon: ShieldCheck, route: 'warranty' },
    { id: 'director', label: "Director's Month-End P&L & Subsidies (Scene 6)", icon: BarChart3, route: 'director' },
    { id: 'diagnostics', label: 'Admin Monospace System Diagnostics', icon: Terminal, route: 'diagnostics' }
  ];

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
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
        <div className="flex items-center px-4 py-3 border-b border-gray-200 gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Type a command, module, or persona name..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full text-sm outline-none text-gray-800 placeholder-gray-400"
            autoFocus
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-gray-500 bg-gray-100 border border-gray-200 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-gray-100">
          <div>
            <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
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
                  className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-[#714B67]/10 hover:text-[#714B67] rounded-md transition-colors"
                >
                  <IconComp className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{cmd.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              1-Click Persona Switcher
            </div>
            {filteredPersonas.map((p) => (
              <button
                key={p.id}
                onClick={async () => {
                  await switchPersonaRole(p.role);
                  onClose(false);
                }}
                className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-md transition-colors"
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
