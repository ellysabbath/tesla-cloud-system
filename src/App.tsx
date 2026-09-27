import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PasswordResetRequest from './pages/auth/PasswordResetRequest';
import PasswordVerifyCodes from './pages/auth/PasswordVerifyCodes';
import ResetNow from './pages/auth/ResetNow';
import AccountVerify from './pages/auth/AccountVerify';
import DashboardLayout from './components/layout/DashboardLayout';
import UserDashboard from './pages/dashboard/UserDashboard';
import MyProfile from './pages/dashboard/MyProfile';
import MyCourses from './pages/dashboard/MyCourses';
import MyCertificates from './pages/dashboard/MyCertificates';
import Settings from './pages/dashboard/Settings';
import AboutUs from './pages/dashboard/AboutUs';
import Contacts from './pages/dashboard/Contacts';
import WhatWeOffer from './pages/dashboard/WhatWeOffer';
import Leadership from './pages/dashboard/Leadership';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/password-reset-request" element={<PasswordResetRequest />} />
        <Route path="/password-verify-codes" element={<PasswordVerifyCodes />} />
        <Route path="/reset-now" element={<ResetNow />} />
        <Route path="/acc-verify" element={<AccountVerify />} />

        {/* Dashboard — all use the same layout with sidebar */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/my-certificates" element={<MyCertificates />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="/" element={<LandingPage />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/courses" element={<WhatWeOffer />} />
        <Route path="/members" element={<Leadership />} />

        {/* Catch all */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
};

export default App;