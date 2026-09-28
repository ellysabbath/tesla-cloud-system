import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

// ---------- Providers ----------
import { AuthProvider } from './context/AuthContext';
import AuthGuard from './components/AuthGuard';

// ---------- Public ----------
import LandingPage from './pages/LandingPage';
import AboutUs from './pages/dashboard/AboutUs';
import Contacts from './pages/dashboard/Contacts';
import WhatWeOffer from './pages/dashboard/WhatWeOffer';
import Leadership from './pages/dashboard/Leadership';

// ---------- Auth ----------
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PasswordResetRequest from './pages/auth/PasswordResetRequest';
import PasswordVerifyCodes from './pages/auth/PasswordVerifyCodes';
import ResetNow from './pages/auth/ResetNow';
import AccountVerify from './pages/auth/AccountVerify';

// ---------- Student dashboard ----------
import DashboardLayout from './components/layout/DashboardLayout';
import UserDashboard from './pages/dashboard/UserDashboard';
import MyProfile from './pages/dashboard/MyProfile';
import MyCourses from './pages/dashboard/MyCourses';
import MyCertificates from './pages/dashboard/MyCertificates';
import Settings from './pages/dashboard/Settings';
import CourseDetail from './pages/dashboard/CourseDetail';
import Certificate from './pages/dashboard/Certificates';

// ---------- Candidate (exam-taking) ----------
import CandidateExams from './pages/candidate/Exams';
import ExaminationLists from './pages/candidate/ExaminationLists';
import TakeExam from './pages/candidate/TakeExam';
import ExamResult from './pages/candidate/ExamResult';

// ---------- Admin ----------
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMyProfile from './pages/admin/MyProfile';
import AdminSettings from './pages/admin/Settings';
import Accounts from './pages/admin/Accounts';
import AdminExams from './pages/admin/AdminExams';
import AdminExamBuilder from './pages/admin/ExamBuilder';
import AdminCourses from './pages/admin/AdminCourses';
import AdminAnswers from './pages/admin/AdminAnswers';
import AdminCertificates from './pages/admin/AdminCertificates';
import ManageUsers from './pages/admin/ManageUsers';
import Payments from './pages/admin/Payments';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ==================== PUBLIC ==================== */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/courses" element={<WhatWeOffer />} />
          <Route path="/members" element={<Leadership />} />

          {/* ==================== AUTH ==================== */}
          <Route path="/signin" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route
            path="/password-reset-request"
            element={<PasswordResetRequest />}
          />
          <Route
            path="/password-verify-codes"
            element={<PasswordVerifyCodes />}
          />
          <Route path="/reset-now" element={<ResetNow />} />
          <Route path="/acc-verify" element={<AccountVerify />} />

          {/* ==================== AUTHENTICATED: STUDENT DASHBOARD ==================== */}
          <Route
            element={
              <AuthGuard>
                <DashboardLayout />
              </AuthGuard>
            }
          >
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/my-profile" element={<MyProfile />} />
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/my-courses/:id" element={<CourseDetail />} />
            <Route path="/my-certificates" element={<MyCertificates />} />
            <Route path="/my-certificates/:id" element={<Certificate />} />
            <Route path="/settings" element={<Settings />} />

            {/* Candidate exam pages — sidebar stays visible */}
            <Route
              path="/candidate/examination-lists"
              element={<ExaminationLists />}
            />
            <Route path="/candidate/exams" element={<CandidateExams />} />
            <Route path="/candidate/exams/:id" element={<TakeExam />} />
            <Route
              path="/candidate/exams/:id/result"
              element={<ExamResult />}
            />
          </Route>

          {/* ==================== AUTHENTICATED: ADMIN PANEL ==================== */}
          <Route
            element={
              <AuthGuard>
                <AdminLayout />
              </AuthGuard>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/my-profile" element={<AdminMyProfile />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/payments" element={<Payments />} />

            {/* Exam management */}
            <Route path="/admin/exams" element={<AdminExams />} />
            <Route
              path="/admin/exams/:id/edit"
              element={<AdminExamBuilder />}
            />
            <Route path="/admin/answers" element={<AdminAnswers />} />

            {/* Other admin pages */}
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route
              path="/admin/certificates"
              element={<AdminCertificates />}
            />
            <Route path="/manage-users" element={<ManageUsers />} />
          </Route>

          {/* ==================== 404 → HOME ==================== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;