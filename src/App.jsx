import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ApprovalSystemProvider } from "./context/ApprovalSystemProvider";
import { HrProvider } from "./features/hr/context/HrProvider";
import { I18nProvider } from "./i18n/I18nProvider";
import MainLayout from "./layouts/MainLayout";
import DepartmentDashboard from "./features/departments/pages/DepartmentDashboard";
import DepartmentDetail from "./features/departments/pages/DepartmentDetail";
import UserProfile from "./features/profile/pages/UserProfile";
import HumanResources from "./features/hr/pages/HumanResources";
import EmployeeDetail from "./features/hr/pages/EmployeeDetail";
import SystemConfig from "./features/system-config/pages/SystemConfig";
import PersonalRequests from "./features/requests/pages/PersonalRequests";
import RequestDetail from "./features/requests/pages/RequestDetail";
import ReportsPage from "./features/reports/pages/ReportsPage";
import DelegationsTab from "./features/system-config/components/DelegationsTab";

import ToastHost from "./components/ToastHost";
import LoginPage from "./features/auth/pages/LoginPage";
import LandingPage from "./features/landing/pages/LandingPage";
import { useState, useEffect } from "react";
import { useApproval } from "./context/useApproval";
import { PERMISSIONS, ROLES } from "./constants/permissions";
import { useI18n } from "./i18n/I18nProvider";

/**
 * Route guard: kiểm tra quyền (permission) và/hoặc vai trò (role). Wildcard "*" bypasses all.
 * `requiredRoles` dùng cho các trang mà backend chặn theo POLICY VAI TRÒ (ví dụ báo cáo chỉ cho
 * HR/ADMIN) — cần khớp cả menu sidebar, nếu không người dùng vào thẳng URL sẽ thấy trang rỗng.
 */
function ProtectedRoute({ requiredPermissions = [], requiredRoles = [], children }) {
  const { t } = useI18n();
  const { currentUser, hasPermission } = useApproval();
  if (!currentUser) return null;
  const perms = currentUser.permissions || [];
  if (perms.includes(PERMISSIONS.WILDCARD)) return children;
  const userRoles = (currentUser.roles?.length ? currentUser.roles : [currentUser.role])
    .filter(Boolean)
    .map((r) => String(r).toUpperCase());
  const roleOk = requiredRoles.length === 0 || requiredRoles.some((r) => userRoles.includes(String(r).toUpperCase()));
  const hasAccess = roleOk && requiredPermissions.every(p => hasPermission(p));
  if (!hasAccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center">
          <span className="material-symbols-outlined text-error text-3xl">lock</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface">{t('Không có quyền truy cập')}</h2>
        <p className="text-secondary text-center max-w-sm">
          {t('Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên.')}
        </p>
        <a href="/" className="px-5 py-2 rounded-md bg-primary text-on-primary font-medium hover:bg-primary/90 transition-colors">
          {t('Quay về trang chủ')}
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
    <I18nProvider>
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
                {/* BE-99: quản lý chức vụ & cấp bậc (trước đây chỉ có API, không có giao diện) */}
                <Route path="settings/positions" element={
                  <ProtectedRoute requiredPermissions={[PERMISSIONS.CONFIG_VIEW]}>
                    <SystemConfig defaultActive="positions" />
                  </ProtectedRoute>
                } />
                <Route path="settings/general" element={
                  <ProtectedRoute requiredPermissions={[PERMISSIONS.CONFIG_VIEW]}>
                    <SystemConfig defaultActive="general" />
                  </ProtectedRoute>
                } />

                <Route path="requests/:id" element={<RequestDetail />} />

                {/* Reports page — BE chặn theo policy vai trò "HR" (HR/ADMIN), khớp với menu sidebar */}
                <Route path="reports" element={
                  <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.HR]}>
                    <ReportsPage />
                  </ProtectedRoute>
                } />

                <Route path="delegations" element={
                  /* BE-148: ủy quyền duyệt đơn là tính năng CÁ NHÂN — mở cho mọi tài khoản đã đăng nhập
                     (cấp duyệt tạo ủy quyền, người được ủy quyền xem ai ủy quyền cho mình).
                     Nút tạo ủy quyền trong trang tự ẩn với tài khoản không phải cấp duyệt. */
                  <div className="flex-1 flex flex-col min-h-0 min-w-0">
                    <DelegationsTab />
                  </div>
                } />

                {/* Requests pages */}
                <Route path="my-requests" element={<PersonalRequests mode="sent" />} />
                <Route path="my-requests/approvals" element={<PersonalRequests mode="received" />} />
                {/* BE-15: "Đơn cần bổ sung" đã gộp vào "Đơn từ cá nhân" -> chuyển hướng URL cũ */}
                <Route path="my-requests/supplements" element={<Navigate to="/my-requests" replace />} />
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
    </I18nProvider>
  );
}

export default App;
