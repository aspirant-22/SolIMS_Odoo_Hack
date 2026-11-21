/**
 * @AUTHOR: Garima Mittal
 * @FILE: App.jsx
 * @RESPONSIBILITY: Top-level React routing component managing session authentication gate and active subdomain views.
 * @DEPENDENCIES: react, AuthContext.jsx, MainLayout.jsx, all module views
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

const ROLE_HOME = {
  ADMIN: '/director',
  OPERATIONS: '/inquiries',
  STAFF: '/field-install',
  CUSTOMER: '/my-solar'
};

// Internal ERP routes with RBAC whitelist
const ERP_ROUTES = [
  { path: '/inquiries', module: 'inquiries', roles: ['ADMIN', 'OPERATIONS', 'STAFF'], element: <InquiriesView /> },
  { path: '/orders', module: 'orders', roles: ['ADMIN', 'OPERATIONS'], element: <OrdersView /> },
  { path: '/dispatch', module: 'warehouse', roles: ['ADMIN', 'OPERATIONS'], element: <WarehouseDispatchView /> },
  { path: '/field-install', module: 'technician', roles: ['ADMIN', 'STAFF'], element: <TechnicianRoofSignoffView /> },
  { path: '/warranty', module: 'warranty', roles: ['ADMIN', 'OPERATIONS', 'STAFF'], element: <WarrantyLookupTicketView /> },
  { path: '/director', module: 'director', roles: ['ADMIN', 'OPERATIONS'], element: <DirectorDashboardView /> },
  { path: '/admin/system-logs', module: 'diagnostics', roles: ['ADMIN'], element: <SystemDiagnosticsView /> }
];

export const App = () => {
  const { currentUser, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#135D3B]">
          <span className="w-3 h-3 rounded-full bg-[#135D3B] animate-ping" />
          <span>Bootstrapping SolIMS Solar ERP Platform...</span>
        </div>
      </div>
    );
  }

  const role = currentUser?.role;
  const home = ROLE_HOME[role] || '/login';

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicLandingView mode="landing" />} />
      <Route path="/quote" element={<PublicLandingView mode="quote" />} />
      <Route path="/login" element={currentUser ? <Navigate to={home} replace /> : <LoginView />} />

      {/* Homeowner portal */}
      <Route
        path="/my-solar"
        element={
          !currentUser ? <Navigate to="/login" replace />
            : role === 'CUSTOMER' ? <CustomerMySolarPortalView />
            : <Navigate to={home} replace />
        }
      />

      {/* Internal ERP workspace */}
      {ERP_ROUTES.map((r) => (
        <Route
          key={r.path}
          path={r.path}
          element={
            !currentUser ? <Navigate to="/login" replace />
              : r.roles.includes(role) ? <MainLayout currentModule={r.module}>{r.element}</MainLayout>
              : <Navigate to={home} replace />
          }
        />
      ))}

      <Route path="*" element={<Navigate to={currentUser ? home : '/'} replace />} />
    </Routes>
  );
};

export default App;