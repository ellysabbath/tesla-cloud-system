import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  authApi,
  attemptApi,
  examApi,
  paymentApi,
} from '../../api/api';
import type { ApiAttempt, ApiExam, ApiPayment, AdminUserRow } from '../../api/api';

// ============================================================
// Types
// ============================================================
interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavLink {
  label: string;
  path: string;
  icon: React.ReactNode;
  badgeKey?: BadgeKey;
}

type BadgeKey = 'accounts' | 'exams' | 'answers' | 'payments';

type BadgeCounts = Partial<Record<BadgeKey, number>>;

// ============================================================
// Icons
// ============================================================
const DashboardIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const AccountsIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ExamsIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const CoursesIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const AnswersIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CertificatesIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const PaymentsIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LogoutIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// ============================================================
// Nav links
// ============================================================
const NAV_LINKS: NavLink[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: DashboardIcon },
  {
    label: 'Accounts',
    path: '/accounts',
    icon: AccountsIcon,
    badgeKey: 'accounts',
  },
  {
    label: 'Exams',
    path: '/admin/exams',
    icon: ExamsIcon,
    badgeKey: 'exams',
  },
  { label: 'Courses', path: '/admin/courses', icon: CoursesIcon },
  {
    label: 'Answers',
    path: '/admin/answers',
    icon: AnswersIcon,
    badgeKey: 'answers',
  },
  {
    label: 'Certificates',
    path: '/admin/certificates',
    icon: CertificatesIcon,
  },
  {
    label: 'Payments',
    path: '/admin/payments',
    icon: PaymentsIcon,
    badgeKey: 'payments',
  },
];

// ============================================================
// Badge fetch
// ============================================================
const fetchBadgeCounts = async (): Promise<BadgeCounts> => {
  const [usersRes, examsRes, attemptsRes, paymentsRes] = await Promise.all([
    authApi.adminListUsers({ page_size: 1, status: 'pending' }),
    examApi.list(),
    attemptApi.adminList(),
    paymentApi.adminList(),
  ]);

  const users: AdminUserRow[] = Array.isArray(usersRes.data)
    ? (usersRes.data as AdminUserRow[])
    : [];
  const exams: ApiExam[] = Array.isArray(examsRes.data)
    ? (examsRes.data as ApiExam[])
    : [];
  const attempts: ApiAttempt[] = Array.isArray(attemptsRes.data)
    ? (attemptsRes.data as ApiAttempt[])
    : [];
  const payments: ApiPayment[] = Array.isArray(paymentsRes.data)
    ? (paymentsRes.data as ApiPayment[])
    : [];

  // `authApi.adminListUsers` may return a `pagination.total` — prefer
  // that over the length of the (page-limited) array when present.
  const pendingAccounts =
    (usersRes.pagination?.total as number | undefined) ??
    users.length;

  return {
    accounts: pendingAccounts,
    exams: exams.filter((e) => e.status === 'draft').length,
    answers: attempts.filter((a) => a.status === 'pending').length,
    payments: payments.filter((p) => p.status === 'pending').length,
  };
};

// ============================================================
// Component
// ============================================================
const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [badges, setBadges] = useState<BadgeCounts>({});
  const focusTimer = useRef<number | null>(null);

  // ---------- Badge refresh ----------
  const refreshBadges = useCallback(async () => {
    try {
      const counts = await fetchBadgeCounts();
      setBadges(counts);
    } catch (err) {
      // Sidebar badges are non-critical — swallow errors silently.
      console.warn('[AdminSidebar] badge refresh failed:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refreshBadges();
  }, [refreshBadges]);

  // Refetch whenever the route changes, so counts stay fresh.
  useEffect(() => {
    refreshBadges();
  }, [location.pathname, refreshBadges]);

  // Refetch on window focus (debounced).
  useEffect(() => {
    const onFocus = () => {
      if (focusTimer.current) window.clearTimeout(focusTimer.current);
      focusTimer.current = window.setTimeout(() => {
        refreshBadges();
      }, 400);
    };
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      if (focusTimer.current) window.clearTimeout(focusTimer.current);
    };
  }, [refreshBadges]);

  // ---------- Helpers ----------
  const isActive = (path: string) =>
    location.pathname === path ||
    // Treat nested routes as active (e.g. /admin/exams/:id/edit)
    location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    try {
      await authApi.logout();   // clears tokens + fires "auth:logout"
    } catch (err) {
      console.warn('[AdminSidebar] logout API failed:', err);
    } finally {
      // Belt-and-braces: authApi.logout already calls clearTokens(),
      // but remove the extra keys the app uses too.
      localStorage.removeItem('user');
      localStorage.removeItem('keepMeLoggedIn');
      navigate('/signin');
    }
  };

  const handleLinkClick = () => {
    // Close drawer on small screens only.
    if (window.innerWidth < 1024) onClose();
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-gray-900 text-gray-100
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          <div>
            <p className="text-base font-bold tracking-tight text-white">
              TESLA CLOUD
            </p>
            <p className="text-[10px] uppercase tracking-widest text-gray-500">
              Admin Panel
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-800 transition-colors lg:hidden text-gray-400"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3">
          <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Management
          </p>
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.path);
              const badgeCount = link.badgeKey
                ? badges[link.badgeKey]
                : undefined;
              const showBadge =
                badgeCount !== undefined && badgeCount > 0;

              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    onClick={handleLinkClick}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                      text-sm font-medium
                      transition-colors duration-150
                      ${
                        active
                          ? 'bg-white text-gray-900'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <span
                      className={
                        active ? 'text-gray-900' : 'text-gray-400'
                      }
                    >
                      {link.icon}
                    </span>
                    <span className="flex-1">{link.label}</span>
                    {showBadge && (
                      <span
                        className={`
                          text-xs font-semibold px-2 py-0.5 rounded-full
                          ${
                            active
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-700 text-gray-200'
                          }
                        `}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="
              flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
              text-sm font-medium text-red-400
              hover:bg-red-950 hover:text-red-300 transition-colors duration-150
            "
          >
            <span className="text-red-400">{LogoutIcon}</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;