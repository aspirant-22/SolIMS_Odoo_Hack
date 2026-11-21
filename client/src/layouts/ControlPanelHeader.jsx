/**
 * @AUTHOR: Garima Mittal
 * @FILE: ControlPanelHeader.jsx
 * @RESPONSIBILITY: Pinned top Odoo Control Panel Header providing breadcrumbs, context action buttons, and workflow ribbon.
 * @DEPENDENCIES: react, lucide-react, ProgressWorkflowRibbon.jsx, AuthContext.jsx
 */

import React from 'react';
import {
  ChevronRight,
  Plus,
  CheckCircle2,
  Download,
  Command,
  LogOut,
  User
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
  const { currentUser, logoutUser, switchPersonaRole } = useAuth();

  const roleColorMap = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    OPERATIONS: 'bg-blue-100 text-blue-800 border-blue-200',
    STAFF: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    CUSTOMER: 'bg-amber-100 text-amber-800 border-amber-200'
  };

  return (
    <header
      data-component="control-panel-header"
      data-purpose="action-navigation"
      className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-xs px-6 py-2.5 flex flex-wrap items-center justify-between gap-4"
    >
      {/* Left: Odoo Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbHierarchy.map((crumb, idx) => (
          <React.Fragment key={crumb}>
            {idx > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            <span
              className={
                idx === breadcrumbHierarchy.length - 1
                  ? 'font-bold text-[#714B67]'
                  : 'text-gray-500 hover:text-gray-700 cursor-pointer'
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

        <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
          {onPrimaryAction && (
            <button
              onClick={onPrimaryAction}
              data-purpose="primary-action-button"
              className="odoo-btn-primary gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{primaryActionLabel}</span>
            </button>
          )}

          {onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              data-purpose="secondary-action-button"
              className="odoo-btn-secondary gap-1.5 text-xs py-1.5 px-3"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{secondaryActionLabel}</span>
            </button>
          )}

          {onExportCsv && (
            <button
              onClick={onExportCsv}
              data-purpose="export-action-button"
              className="odoo-btn-outline gap-1.5 text-xs py-1.5 px-3"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Export CSV</span>
            </button>
          )}

          {/* Ctrl + K Shortcut Button */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-200 transition-colors"
            title="Open Command Palette (Ctrl + K)"
          >
            <Command className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px]">Ctrl+K</span>
          </button>
        </div>

        {/* User Persona & Switcher */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase ${
                roleColorMap[currentUser.role] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {currentUser.role}
            </span>
            <span className="text-xs text-gray-700 font-medium hidden md:inline truncate max-w-[120px]">
              {currentUser.fullName}
            </span>
            <button
              onClick={logoutUser}
              className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
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
