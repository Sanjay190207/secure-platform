import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SetterDashboard from './pages/SetterDashboard';
import ReviewerDashboard from './pages/ReviewerDashboard';
import ControllerDashboard from './pages/ControllerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CandidateDashboard from './pages/CandidateDashboard';

import RoleSwitcherBar from './components/RoleSwitcherBar';

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RoleSwitcherBar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* Role Protected Routes */}
          <Route
            path="/setter/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SETTER', 'ADMIN']}>
                <SetterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviewer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['REVIEWER', 'ADMIN']}>
                <ReviewerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/controller/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CONTROLLER', 'ADMIN']}>
                <ControllerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}>
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
