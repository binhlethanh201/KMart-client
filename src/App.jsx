import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ApprovalSystemProvider } from "./context/ApprovalSystemProvider";
import { HrProvider } from "./features/hr/context/HrProvider";
import MainLayout from "./layouts/MainLayout";
import DepartmentDashboard from "./features/departments/pages/DepartmentDashboard";
import DepartmentDetail from "./features/departments/pages/DepartmentDetail";
import UserProfile from "./features/profile/pages/UserProfile";
import HumanResources from "./features/hr/pages/HumanResources";
import EmployeeDetail from "./features/hr/pages/EmployeeDetail";
import SystemConfig from "./features/system-config/pages/SystemConfig";
import PersonalRequests from "./features/requests/pages/PersonalRequests";
import RequestDetail from "./features/requests/pages/RequestDetail";

import ToastHost from "./components/ToastHost";
import LoginPage from "./features/auth/pages/LoginPage";
import LandingPage from "./features/landing/pages/LandingPage";
import { useState, useEffect } from "react";
import { useApproval } from "./context/useApproval";
import { PERMISSIONS } from "./constants/permissions";

/** Route guard: kiểm tra permission. Wildcard "*" bypasses all. */
function ProtectedRoute({ requiredPermissions = [], children }) {
  const { currentUser, hasPermission } = useApproval();
  if (!currentUser) return null;
  const perms = currentUser.permissions || [];
  if (perms.includes(PERMISSIONS.WILDCARD)) return children;
  const hasAccess = requiredPermissions.every(p => hasPermission(p));
  if (!hasAccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center">
          <span className="material-symbols-outlined text-error text-3xl">lock</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface">Không có quyền truy cập</h2>
        <p className="text-secondary text-center max-w-sm">
          Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên.
        </p>
        <a href="/" className="px-5 py-2 rounded-md bg-primary text-on-primary font-medium hover:bg-primary/90 transition-colors">
          Quay về trang chủ
        </a>
      </div>
    );
  }
  return children;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("kmart_token");
    if (token) {
      setIsAuthenticated(true);
    }
    setIsInitializing(false);

    const handleUnauthorized = () => setIsAuthenticated(false);
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-background">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      {isAuthenticated ? (
        <ApprovalSystemProvider>
          <HrProvider>
            <Routes>
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/" element={<MainLayout />}>
                <Route index element={<DepartmentDashboard />} />
                <Route path="departments" element={<DepartmentDashboard />} />
                <Route path="departments/:id" element={<DepartmentDetail />} />
                <Route path="profile" element={<UserProfile />} />
                
                {/* Protected routes */}
                <Route path="personnel" element={
                  <ProtectedRoute requiredPermissions={[PERMISSIONS.PERSONNEL_VIEW]}>
                    <HumanResources />
                  </ProtectedRoute>
                } />
                <Route path="personnel/:id" element={
                  <ProtectedRoute requiredPermissions={[PERMISSIONS.PERSONNEL_VIEW]}>
                    <EmployeeDetail />
                  </ProtectedRoute>
                } />

                {/* Settings sub-routes */}
                <Route path="settings" element={
                  <ProtectedRoute requiredPermissions={[PERMISSIONS.CONFIG_VIEW]}>
                    <SystemConfig defaultActive="forms" />
                  </ProtectedRoute>
                } />
                <Route path="settings/forms" element={
                  <ProtectedRoute requiredPermissions={[PERMISSIONS.CONFIG_VIEW]}>
                    <SystemConfig defaultActive="forms" />
                  </ProtectedRoute>
                } />
                <Route path="settings/workflow" element={
                  <ProtectedRoute requiredPermissions={[PERMISSIONS.CONFIG_VIEW]}>
                    <SystemConfig defaultActive="workflow" />
                  </ProtectedRoute>
                } />
                <Route path="settings/general" element={
                  <ProtectedRoute requiredPermissions={[PERMISSIONS.CONFIG_VIEW]}>
                    <SystemConfig defaultActive="general" />
                  </ProtectedRoute>
                } />

                <Route path="requests/:id" element={<RequestDetail />} />

                {/* Requests pages */}
                <Route path="my-requests" element={<PersonalRequests defaultFilter="sent" />} />
                <Route path="my-requests/approvals" element={<PersonalRequests defaultFilter="received" />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ToastHost />
          </HrProvider>
        </ApprovalSystemProvider>
      ) : (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={() => { window.location.href = "/"; }} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
