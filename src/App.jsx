import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ApprovalSystemProvider } from './context/ApprovalSystemProvider';
import MainLayout from './layouts/MainLayout';
import RequestsLayout from './features/requests/layouts/RequestsLayout';
import DepartmentDashboard from './features/departments/pages/DepartmentDashboard';
import DepartmentDetail from './features/departments/pages/DepartmentDetail';
import UserProfile from './features/profile/pages/UserProfile';
import HumanResources from './features/hr/pages/HumanResources';
import SystemConfig from './features/system-config/pages/SystemConfig';
import PersonalRequests from './features/requests/pages/PersonalRequests';
import RequestDetail from './features/requests/pages/RequestDetail';
import UserSwitchBar from './features/requests/components/UserSwitchBar';
import ToastHost from './features/requests/components/ToastHost';

function App() {
  return (
    <ApprovalSystemProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DepartmentDashboard />} />
            <Route path="departments" element={<DepartmentDashboard />} />
            <Route path="departments/:id" element={<DepartmentDetail />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="personnel" element={<HumanResources />} />
            <Route path="settings" element={<SystemConfig />} />
            <Route path="requests/:id" element={<RequestDetail />} />
 
            {/* Requests pages now share the same layout shell */}
            <Route path="my-requests" element={<PersonalRequests defaultFilter="sent" />} />
            <Route path="my-requests/approvals" element={<PersonalRequests defaultFilter="received" />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <UserSwitchBar />
      <ToastHost />
    </ApprovalSystemProvider>
  );
}

export default App;
