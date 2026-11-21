/**
 * @AUTHOR: Garima Mittal
 * @FILE: App.jsx
 * @RESPONSIBILITY: Top-level React routing component managing session authentication gate and active subdomain views.
 * @DEPENDENCIES: react, AuthContext.jsx, MainLayout.jsx, all module views
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './modules/auth/LoginView';
import { PublicLandingView } from './modules/landing/PublicLandingView';
import { CustomerMySolarPortalView } from './modules/customer/CustomerMySolarPortalView';
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

  // Sync default module with role capabilities
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'STAFF' && activeModule === 'inquiries') {
      setActiveModule('technician');
    } else if (currentUser.role === 'ADMIN' && activeModule === 'inquiries') {
      setActiveModule('director');
    }
  }, [currentUser?.role]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#F4F9F6] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#135D3B]">
          <span className="w-3 h-3 rounded-full bg-[#135D3B] animate-ping" />
          <span>Bootstrapping SolIMS Solar ERP Platform...</span>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated Visitor Flow: Public Solar Landing vs Staff Login
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

  // 2. Dedicated Homeowner Portal (Strict Role Decoupling - No Shared Disabled Tabs)
  if (currentUser.role === 'CUSTOMER') {
    return <CustomerMySolarPortalView />;
  }

  // 3. Internal Staff / Director Enterprise ERP Workspace
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
