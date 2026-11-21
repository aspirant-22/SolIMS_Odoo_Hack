/**
 * @AUTHOR: Garima Mittal
 * @FILE: App.jsx
 * @RESPONSIBILITY: Top-level React routing component managing session authentication gate and active subdomain views.
 * @DEPENDENCIES: react, AuthContext.jsx, MainLayout.jsx, all module views
 */

import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './modules/auth/LoginView';
import { PublicLandingView } from './modules/landing/PublicLandingView';
import { MainLayout } from './layouts/MainLayout';

import { InquiriesView } from './modules/inquiries/InquiriesView';
import { OrdersView } from './modules/orders/OrdersView';
import { WarehouseDispatchView } from './modules/warehouse/WarehouseDispatchView';
import { TechnicianRoofSignoffView } from './modules/technician/TechnicianRoofSignoffView';
import { WarrantyLookupTicketView } from './modules/warranty/WarrantyLookupTicketView';
import { DirectorDashboardView } from './modules/director/DirectorDashboardView';
import { SystemDiagnosticsView } from './modules/diagnostics/SystemDiagnosticsView';

export const App = () => {
  const { currentUser, isInitializing } = useAuth();
  const [activeModule, setActiveModule] = useState('inquiries');
  const [publicView, setPublicView] = useState('landing'); // 'landing' | 'login'

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#714B67]">
          <span className="w-3 h-3 rounded-full bg-[#714B67] animate-ping" />
          <span>Bootstrapping SolIMS Odoo ERP Client...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (publicView === 'login') {
      return <LoginView onBackToLanding={() => setPublicView('landing')} />;
    }
    return (
      <PublicLandingView
        onOpenStaffLogin={() => setPublicView('login')}
        onSelectPublicSection={(section) => setPublicView(section)}
      />
    );
  }

  const renderActiveModuleView = () => {
    switch (activeModule) {
      case 'inquiries':
        return <InquiriesView />;
      case 'orders':
        return <OrdersView />;
      case 'warehouse':
        return <WarehouseDispatchView />;
      case 'technician':
        return <TechnicianRoofSignoffView />;
      case 'warranty':
        return <WarrantyLookupTicketView />;
      case 'director':
        return <DirectorDashboardView />;
      case 'diagnostics':
        return <SystemDiagnosticsView />;
      default:
        return <InquiriesView />;
    }
  };

  return (
    <MainLayout currentModule={activeModule} onSelectModule={setActiveModule}>
      {renderActiveModuleView()}
    </MainLayout>
  );
};

export default App;
