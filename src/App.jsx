import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ApprovalSystemProvider } from './context/ApprovalSystemProvider';
import { HrProvider } from './features/hr/context/HrProvider';
import MainLayout from './layouts/MainLayout';
import RequestsLayout from './features/requests/layouts/RequestsLayout';
import DepartmentDashboard from './features/departments/pages/DepartmentDashboard';
import DepartmentDetail from './features/departments/pages/DepartmentDetail';
import UserProfile from './features/profile/pages/UserProfile';
import HumanResources from './features/hr/pages/HumanResources';
import EmployeeDetail from './features/hr/pages/EmployeeDetail';
import SystemConfig from './features/system-config/pages/SystemConfig';
import PersonalRequests from './features/requests/pages/PersonalRequests';
import RequestDetail from './features/requests/pages/RequestDetail';

import ToastHost from './components/ToastHost';
import LoginPage from './features/auth/pages/LoginPage';
import { useState, useEffect } from 'react';
import { authService } from './features/auth/services/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('kmart_token');
    if (token) {
      // Optimistically set authenticated if token exists
      setIsAuthenticated(true);
    }
    setIsInitializing(false);

    // Listen for unauthorized events from apiClient
    const handleUnauthorized = () => setIsAuthenticated(false);
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <ApprovalSystemProvider>
      <HrProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DepartmentDashboard />} />
            <Route path="departments" element={<DepartmentDashboard />} />
            <Route path="departments/:id" element={<DepartmentDetail />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="personnel" element={<HumanResources />} />
            <Route path="personnel/:id" element={<EmployeeDetail />} />
            {/* Settings sub-routes */}
            <Route path="settings" element={<SystemConfig defaultActive="forms" />} />
            <Route path="settings/forms" element={<SystemConfig defaultActive="forms" />} />
            <Route path="settings/workflow" element={<SystemConfig defaultActive="workflow" />} />
            <Route path="settings/general" element={<SystemConfig defaultActive="general" />} />

            <Route path="requests/:id" element={<RequestDetail />} />
 
            {/* Requests pages now share the same layout shell */}
            <Route path="my-requests" element={<PersonalRequests defaultFilter="sent" />} />
            <Route path="my-requests/approvals" element={<PersonalRequests defaultFilter="received" />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </HrProvider>

      <ToastHost />
    </ApprovalSystemProvider>
  );
}

export default App;
