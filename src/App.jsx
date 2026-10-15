import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
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
import DelegationsTab from "./features/system-config/components/DelegationsTab";
import TimeoutDelegatePage from "./features/system-config/components/TimeoutDelegatePage";
import ToastHost from "./components/ToastHost";
import LoadError from "./components/LoadError";
import ErrorBoundary from "./components/ErrorBoundary";
import LoginPage from "./features/auth/pages/LoginPage";
import LandingPage from "./features/landing/pages/LandingPage";
import ForcePasswordChange from "./features/auth/components/ForcePasswordChange";
import { useState, useEffect } from "react";
import { useApproval } from "./context/useApproval";
import { PERMISSIONS, ROLES } from "./constants/permissions";
import { useI18n } from "./i18n/I18nProvider";

/*
 * PERF-01 (audit): trước đây MỌI trang được import tĩnh nên toàn bộ ứng dụng gộp vào một tệp
 * 834 KB (197 KB nén) — người chỉ mở trang đăng nhập vẫn phải tải cả trang báo cáo (kèm 3 biểu đồ
 * tự vẽ) và cả trang hướng dẫn. Hai trang nặng nhất được tách tải riêng dưới đây.
 *
 * ERR-01: kèm THỬ LẠI một lần. Gói JS có thể tải hụt do mạng chập chờn, hoặc do máy chủ vừa
 * triển khai phiên bản mới (tên tệp đã đổi nên tệp cũ không còn). Thử lại một lần xử lý được
 * trường hợp mạng; nếu vẫn hỏng thì ErrorBoundary bên dưới hiện nút tải lại trang.
 */
const lazyRoute = (factory) =>
  lazy(() => factory().catch(() => factory()));

const ReportsPage = lazyRoute(() => import("./features/reports/pages/ReportsPage"));
const DocsPage = lazyRoute(() => import("./features/docs/pages/DocsPage"));

/**
 * PERF-01: chờ tải xong một trang được tách gói (hiện chỉ trang Báo cáo và trang Hướng dẫn).
 * Dùng lại đúng kiểu spinner mà các trang khác đang dùng để không lệch phong cách.
 */
function RouteLoadingFallback() {
  return (
    <div role="status" aria-busy="true" className="flex-1 flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
    </div>
  );
}

/**
 * Route guard: kiểm tra quyền (permission) và/hoặc vai trò (role). Wildcard "*" bypasses all.
 * `requiredRoles` dùng cho các trang mà backend chặn theo POLICY VAI TRÒ (ví dụ báo cáo chỉ cho
 * HR/ADMIN) — cần khớp cả menu sidebar, nếu không người dùng vào thẳng URL sẽ thấy trang rỗng.
 */
function ProtectedRoute({ requiredPermissions = [], requiredRoles = [], children }) {
  const { t } = useI18n();
  const { currentUser, hasPermission, authLoading, authError, reloadCurrentUser } = useApproval();
  /*
   * UX-01b: trước đây nhánh này `return null`, nên khi /auth/me lỗi thì mọi trang được bảo vệ
   * hiện ra màn hình trắng hoàn toàn. Nay phân biệt rõ "đang tải hồ sơ" và "không tải được hồ sơ".
   */
  if (!currentUser) {
    if (authError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
          <LoadError message={t('Không tải được thông tin tài khoản.')} onRetry={reloadCurrentUser} />
        </div>
      );
    }
    if (authLoading) {
      return (
        <div role="status" aria-busy="true" className="flex-1 flex items-center justify-center min-h-[60vh]">
          <span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
        </div>
      );
    }
    return null;
  }
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
          <span aria-hidden="true" className="material-symbols-outlined text-error text-3xl">lock</span>
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

/**
 * AUTH-10: chặn TOÀN BỘ giao diện khi tài khoản còn dùng mật khẩu tạm do HR cấp.
 *
 * Cờ lấy từ `/auth/me` (currentUser.mustChangePassword). Ngoài ra vẫn lắng nghe sự kiện 403
 * `PASSWORD_CHANGE_REQUIRED` từ apiClient — trường hợp HR đặt lại mật khẩu cho một tài khoản
 * đang đăng nhập ở nơi khác thì giao diện cũng phải chuyển sang màn đổi mật khẩu ngay.
 */
function PasswordChangeGate({ children }) {
  const { currentUser } = useApproval();
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const onRequired = () => setForced(true);
    window.addEventListener('auth:password-change-required', onRequired);
    return () => window.removeEventListener('auth:password-change-required', onRequired);
  }, []);

  if (forced || currentUser?.mustChangePassword) {
    return <ForcePasswordChange />;
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
      {/*
       * ERR-01: lưới an toàn bao TRÙM CẢ ỨNG DỤNG, đặt ngoài BrowserRouter và ngoài cả nhánh
       * đăng nhập/chưa đăng nhập. Lý do đặt ở đây chứ không phải trong từng trang: một lỗi render
       * ở BẤT KỲ đâu (kể cả trong nhà cung cấp ngữ cảnh hay trang đăng nhập) đều làm React gỡ sạch
       * cây và để lại màn hình trắng. Có lưới ở gốc thì luôn còn thông báo + nút tải lại.
       */}
      <ErrorBoundary>
      <BrowserRouter>
        {isAuthenticated ? (
          <ApprovalSystemProvider>
            <HrProvider>
              <PasswordChangeGate>
              <Suspense fallback={<RouteLoadingFallback />}>
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

                {/* BE-165: trang riêng cài người duyệt thay mặc định khi quá hạn. */}
                <Route path="timeout-delegate" element={
                  <div className="flex-1 flex flex-col min-h-0 min-w-0">
                    <TimeoutDelegatePage />
                  </div>
                } />

                {/* Requests pages */}
                <Route path="my-requests" element={<PersonalRequests mode="sent" />} />
                <Route path="my-requests/approvals" element={<PersonalRequests mode="received" />} />
                {/* BE-15: "Đơn cần bổ sung" đã gộp vào "Đơn từ cá nhân" -> chuyển hướng URL cũ */}
                <Route path="my-requests/supplements" element={<Navigate to="/my-requests" replace />} />

                {/* DOCS-01: trang hướng dẫn sử dụng hệ thống (đọc từ public/docs/HUONG-DAN.md). */}
                <Route path="docs" element={<DocsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
            <ToastHost />
              </PasswordChangeGate>
            </HrProvider>
          </ApprovalSystemProvider>
        ) : (
          <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage onLoginSuccess={() => { window.location.href = "/"; }} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        )}
      </BrowserRouter>
      </ErrorBoundary>
    </I18nProvider>
  );
}

export default App;
