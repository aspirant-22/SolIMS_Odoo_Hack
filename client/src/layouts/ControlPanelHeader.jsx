/**
 * @AUTHOR: Garima Mittal
 * @FILE: ControlPanelHeader.jsx
 * @RESPONSIBILITY: Pinned top SolIMS Control Panel Header providing breadcrumbs, context action buttons, and workflow ribbon.
 * @DEPENDENCIES: react, lucide-react, ProgressWorkflowRibbon.jsx, AuthContext.jsx
 */

import React from 'react';
import {
  ChevronRight,
  Plus,
  CheckCircle2,
  Download,
  Command,
  LogOut
} from 'lucide-react';
import { ProgressWorkflowRibbon } from './ProgressWorkflowRibbon';
import { useAuth } from '../context/AuthContext';

export const ControlPanelHeader = ({
  breadcrumbHierarchy = ['SolIMS', 'Inquiries'],
  workflowStages = ['Draft', 'Waiting', 'Ready', 'Done'],
  currentStage = 'Draft',
  primaryActionLabel = 'New',
  onPrimaryAction = null,
  secondaryActionLabel = 'Validate',
  onSecondaryAction = null,
  onExportCsv = null,
  onOpenCommandPalette = () => {}
}) => {
  const { currentUser, logoutUser } = useAuth();

  return (
    <header
      data-component="control-panel-header"
      data-purpose="action-navigation"
      className="sticky top-[53px] z-30 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs px-6 py-2.5 flex flex-wrap items-center justify-between gap-4"
    >
      {/* Left: SolIMS Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbHierarchy.map((crumb, idx) => (
          <React.Fragment key={crumb}>
            {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
            <span
              className={
                idx === breadcrumbHierarchy.length - 1
                  ? 'font-extrabold text-[#135D3B]'
                  : 'text-slate-600 font-semibold hover:text-[#135D3B] cursor-pointer'
              }
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Center / Right: Workflow Ribbon & Context Actions */}
      <div className="flex items-center gap-3">
        <ProgressWorkflowRibbon stages={workflowStages} currentStage={currentStage} />

        <div className="flex items-center gap-2 border-l border-emerald-900/10 pl-3">
          {onPrimaryAction && (
            <button
              onClick={onPrimaryAction}
              data-purpose="primary-action-button"
              className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold px-4 py-1.5 shadow-sm transition-all text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{primaryActionLabel}</span>
            </button>
          )}

          {onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              data-purpose="secondary-action-button"
              className="rounded-full border border-[#135D3B] text-[#135D3B] hover:bg-emerald-50 font-semibold px-4 py-1.5 shadow-sm transition-all text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{secondaryActionLabel}</span>
            </button>
          )}

          {onExportCsv && (
            <button
              onClick={onExportCsv}
              data-purpose="export-action-button"
              className="rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-4 py-1.5 text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}

          {/* Ctrl + K Shortcut Button */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#135D3B] bg-[#E6F4EC] hover:bg-emerald-100 rounded-full border border-[#135D3B]/20 transition-colors font-bold cursor-pointer"
            title="Open Command Palette (Ctrl + K)"
          >
            <Command className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px]">Ctrl+K</span>
          </button>
        </div>

        {/* User Persona & Switcher */}
        {currentUser && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-emerald-900/10">
            <span className="rounded-full bg-[#E6F4EC] text-[#135D3B] border border-[#135D3B]/20 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
              {currentUser.role}
            </span>
            <span className="text-xs text-slate-800 font-bold hidden md:inline truncate max-w-[130px]">
              {currentUser.fullName}
            </span>
            <button
              onClick={logoutUser}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default ControlPanelHeader;
