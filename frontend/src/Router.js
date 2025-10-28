import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/useAuth';
import OfficerDashboard from './components/dashboard/OfficerDashboard';
import ChiefDashboard from './components/dashboard/ChiefDashboard';
import ChiefAssistantDashboard from './components/dashboard/ChiefAssistantDashboard';
import ChiefAllReports from './components/dashboard/ChiefAllReports';
import AsChiefUnsignedReports from './components/dashboard/AsChiefUnsignedReports';
import AsChiefSignedReports from './components/dashboard/AsChiefSignedReports';
import AsChiefSignLogbook from './components/AsChiefSignLogbook';
import SuperAdminDashboard from './components/dashboard/SuperAdminDashboard';
import Login from './components/Login';
import LogbookHarianMasterTable from './forms/masters/LogbookHarianMasterTable';
import LogbookHarianMasterForm from './forms/masters/LogbookHarianMasterForm';
import LogbookHarianChiefTable from './forms/masters/LogbookHarianChiefTable';
import LogbookHarianChiefForm from './forms/masters/LogbookHarianChiefForm';
import ChiefSignLogbook from './components/ChiefSignLogbook';
import LogbookPreview from './components/LogbookPreview';
import FormKemajuanPersonel from './forms/masters/FormKemajuanPersonel';

// Helper function to get dashboard path based on user role
const getDashboardPath = (userRole) => {
  switch (userRole) {
    case 'officer':
      return '/dashboard/officer';
    case 'chief':
      return '/dashboard/chief';
    case 'assistant_chief':
      return '/dashboard/assistant-chief';
    case 'superadmin':
      return '/dashboard/superadmin';
    case 'admin':
      return '/dashboard/superadmin';
    default:
      return '/dashboard/officer';
  }
};

// Component to redirect to appropriate dashboard based on user role
const DashboardRedirect = () => {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardPath(auth.user.role)} replace />;
};

// Public route that redirects authenticated users to their dashboard
const PublicRoute = ({ children }) => {
  const { auth } = useAuth();
  if (auth) {
    // Redirect authenticated users to their dashboard
    return <Navigate to={getDashboardPath(auth.user.role)} replace />;
  }
  return children;
};

const ProtectedRoute = ({ children }) => {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  return children;
};

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(auth.user.role)) {
    // Redirect to appropriate dashboard based on user role
    return <Navigate to={getDashboardPath(auth.user.role)} replace />;
  }
  return children;
};

const Router = () => {
  return (
    <div className="App">
      <Routes>
        {/* Public route with protection against authenticated users */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard route that redirects based on role */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
        
        <Route
          path="/dashboard/officer"
          element={
            <RoleBasedRoute allowedRoles={['officer', 'chief', 'superadmin']}>
              <OfficerDashboard />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/dashboard/chief"
          element={
            <RoleBasedRoute allowedRoles={['chief', 'superadmin']}>
              <ChiefDashboard />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/dashboard/assistant-chief"
          element={
            <RoleBasedRoute allowedRoles={['assistant_chief', 'superadmin']}>
              <ChiefAssistantDashboard />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/dashboard/superadmin"
          element={
            <RoleBasedRoute allowedRoles={['superadmin', 'admin']}>
              <SuperAdminDashboard />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/forms/masters/logbook-harian"
          element={
            <ProtectedRoute>
              <LogbookHarianMasterTable />
            </ProtectedRoute>
          }
        />

        <Route
          path="/forms/masters/logbook-chief"
          element={
            <RoleBasedRoute allowedRoles={['chief', 'superadmin', 'admin']}>
              <LogbookHarianChiefTable />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/forms/masters/logbook-chief/create"
          element={
            <RoleBasedRoute allowedRoles={['chief', 'superadmin', 'admin']}>
              <LogbookHarianChiefForm />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/forms/masters/logbook-chief/:id"
          element={
            <RoleBasedRoute allowedRoles={['chief', 'superadmin', 'admin']}>
              <LogbookHarianChiefForm />
            </RoleBasedRoute>
          }
        />

        {/* Form Kemajuan Personel Route */}
        <Route
          path="/forms/masters/form-kemajuan-personel"
          element={
            <RoleBasedRoute allowedRoles={['chief', 'superadmin', 'admin']}>
              <FormKemajuanPersonel />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/forms/masters/logbook-harian/create"
          element={
            <ProtectedRoute>
              <LogbookHarianMasterForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forms/masters/logbook-harian/:id"
          element={
            <ProtectedRoute>
              <LogbookHarianMasterForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forms/masters/logbook-harian/preview/:id"
          element={
            <ProtectedRoute>
              <LogbookHarianMasterForm previewMode={true} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logbook-preview/:id"
          element={
            <ProtectedRoute>
              <LogbookPreview />
            </ProtectedRoute>
          }
        />

        {/* Chief Routes */}
        <Route
          path="/chief/laporan"
          element={
            <RoleBasedRoute allowedRoles={['chief', 'superadmin', 'admin']}>
              <ChiefAllReports />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/chief/sign-logbook/:id"
          element={
            <RoleBasedRoute allowedRoles={['chief', 'superadmin', 'admin']}>
              <ChiefSignLogbook />
            </RoleBasedRoute>
          }
        />

        {/* Assistant Chief Routes */}
        <Route
          path="/assistant-chief/belum-ditandatangani"
          element={
            <RoleBasedRoute allowedRoles={['assistant_chief', 'superadmin', 'admin']}>
              <AsChiefUnsignedReports />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/assistant-chief/laporan-sudah-ditandatangani"
          element={
            <RoleBasedRoute allowedRoles={['assistant_chief', 'superadmin', 'admin']}>
              <AsChiefSignedReports />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/assistant-chief/sign-logbook/:id"
          element={
            <RoleBasedRoute allowedRoles={['assistant_chief', 'superadmin', 'admin']}>
              <AsChiefSignLogbook />
            </RoleBasedRoute>
          }
        />

        {/* Dummy fallback untuk route lain */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default Router; 