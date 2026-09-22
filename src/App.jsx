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
      <ApprovalSystemProvider>
        <HrProvider>
          <Routes>
            {!isAuthenticated ? (
              <>
                <Route path="/" element={<LandingPage />} />
                <Route
                  path="/login"
                  element={
                    <LoginPage
                      onLoginSuccess={() => setIsAuthenticated(true)}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/login" element={<Navigate to="/" replace />} />

                <Route path="/" element={<MainLayout />}>
                  <Route index element={<DepartmentDashboard />} />
                  <Route path="departments" element={<DepartmentDashboard />} />
                  <Route
                    path="departments/:id"
                    element={<DepartmentDetail />}
                  />
                  <Route path="profile" element={<UserProfile />} />
                  <Route path="personnel" element={<HumanResources />} />
                  <Route path="personnel/:id" element={<EmployeeDetail />} />

                  {/* Settings sub-routes */}
                  <Route
                    path="settings"
                    element={<SystemConfig defaultActive="forms" />}
                  />
                  <Route
                    path="settings/forms"
                    element={<SystemConfig defaultActive="forms" />}
                  />
                  <Route
                    path="settings/workflow"
                    element={<SystemConfig defaultActive="workflow" />}
                  />
                  <Route
                    path="settings/general"
                    element={<SystemConfig defaultActive="general" />}
                  />

                  <Route path="requests/:id" element={<RequestDetail />} />

                  {/* Requests pages */}
                  <Route
                    path="my-requests"
                    element={<PersonalRequests defaultFilter="sent" />}
                  />
                  <Route
                    path="my-requests/approvals"
                    element={<PersonalRequests defaultFilter="received" />}
                  />
                </Route>

                {/* Bắt tất cả các route không hợp lệ còn lại và đưa về trang chủ */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
          <ToastHost />
        </HrProvider>
      </ApprovalSystemProvider>
    </BrowserRouter>
  );
}

export default App;
