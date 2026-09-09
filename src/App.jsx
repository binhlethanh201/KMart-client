import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DepartmentDashboard from './features/departments/pages/DepartmentDashboard';
import UserProfile from './features/profile/pages/UserProfile';
import RequestsLayout from './features/requests/layouts/RequestsLayout';
import PersonalRequests from './features/requests/pages/PersonalRequests';
import RequestDetail from './features/requests/pages/RequestDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Layout routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DepartmentDashboard />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="pending-requests" element={<RequestDetail />} />
        </Route>

        {/* Requests Layout routes */}
        <Route path="/my-requests" element={<RequestsLayout />}>
          <Route index element={<PersonalRequests />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
