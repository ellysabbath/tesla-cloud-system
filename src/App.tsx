import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

// ---------- Providers / Guards ----------
import { AuthProvider } from './context/AuthContext';
import AuthGuard from './components/AuthGuard';
import RoleRedirect from './components/RoleRedirect';

// ---------- Public ----------
import LandingPage from './pages/LandingPage';
import AboutUs from './pages/dashboard/AboutUs';
import Contacts from './pages/dashboard/Contacts';
import WhatWeOffer from './pages/dashboard/WhatWeOffer';
import Leadership from './pages/dashboard/Leadership';
import NotFound from './pages/NotFound';

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
import MyCertificateDetail from './pages/dashboard/MyCertificateDetail';

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
import AdminCertificatesViewModal from './pages/admin/AdminCertificatesViewModal';
import Accounts from './pages/admin/Accounts';
import AdminExams from './pages/admin/AdminExams';
import AdminExamBuilder from './pages/admin/ExamBuilder';
import AdminCourses from './pages/admin/AdminCourses';
import AdminAnswers from './pages/admin/AdminAnswers';
import AdminCertificates from './pages/admin/AdminCertificates';
import ManageUsers from './pages/admin/ManageUsers';
import Payments from './pages/admin/Payments';
import AdminNews from './pages/admin/AdminNews';
import News from './pages/dashboard/News';

// ============================================================
// Role groups
// ============================================================
const ADMIN_ROLES = ['admin', 'super-admin'] as const;
const STUDENT_ROLES = ['student', 'user'] as const;

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ==================== PUBLIC (visitors only) ==================== */}
          <Route
            path="/"
            element={
              <RoleRedirect>
                <LandingPage />
              </RoleRedirect>
            }
          />
          <Route
            path="/about-us"
            element={
              <RoleRedirect>
                <AboutUs />
              </RoleRedirect>
            }
          />
          <Route
            path="/contacts"
            element={
              <RoleRedirect>
                <Contacts />
              </RoleRedirect>
            }
          />
          <Route
            path="/courses"
            element={
              <RoleRedirect>
                <WhatWeOffer />
              </RoleRedirect>
            }
          />
          <Route
            path="/members"
            element={
              <RoleRedirect>
                <Leadership />
              </RoleRedirect>
            }
          />

          {/* ==================== AUTH ==================== */}
          <Route
            path="/signin"
            element={
              <RoleRedirect>
                <Login />
              </RoleRedirect>
            }
          />
          <Route
            path="/signup"
            element={
              <RoleRedirect>
                <Register />
              </RoleRedirect>
            }
          />
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

          {/* ==================== STUDENT DASHBOARD ==================== */}
          <Route
            element={
              <AuthGuard allowedRoles={[...STUDENT_ROLES]}>
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

            {/* Candidate exam pages */}
            <Route
              path="/candidate/examination-lists"
              element={<ExaminationLists />}
            />
            <Route path="/news" element={<News />} />   {/* <-- NEW */}
            <Route path="/candidate/exams" element={<CandidateExams />} />
            <Route path="/candidate/exams/:id" element={<TakeExam />} />
            <Route
              path="/candidate/exams/:id/result"
              element={<ExamResult />}
            />

            {/* Keep this AFTER the /my-certificates/:id route above */}
            <Route
              path="/my-certificates/:id/detail"
              element={<MyCertificateDetail />}
            />
          </Route>

          {/* ==================== ADMIN PANEL ==================== */}
          <Route
            element={
              <AuthGuard allowedRoles={[...ADMIN_ROLES]}>
                <AdminLayout />
              </AuthGuard>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/my-profile" element={<AdminMyProfile />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/payments" element={<Payments />} />
            <Route
              path="/admin/certificates/:id"
              element={<AdminCertificatesViewModal />}
            />
            <Route path="/admin/exams" element={<AdminExams />} />
            <Route
              path="/admin/exams/:id/edit"
              element={<AdminExamBuilder />}
            />
            <Route path="/admin/answers" element={<AdminAnswers />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route
              path="/admin/certificates"
              element={<AdminCertificates />}
            />
            <Route path="/admin/news" element={<AdminNews />} />   {/* <-- NEW */}
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/manage-users" element={<ManageUsers />} />
          </Route>

          {/* ==================== 404 ==================== */}
          <Route path="/notfound" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/notfound" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;