import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/api';

// ============================================================
// Types
// ============================================================
interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  profilePicture?: string | null;
}

interface AdminTopBarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

// ============================================================
// Fallback — read what we already stored at login.
// `localStorage.user` is expected to be a JSON string like:
//   { "id": "...", "fullName": "Elisha", "email": "...",
//     "role": "admin", "profilePicture": null }
// ============================================================
const readStoredUser = (): CurrentUser | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      id: String(parsed.id ?? ''),
      fullName:
        parsed.fullName ||
        parsed.name ||
        parsed.username ||
        'User',
      email: parsed.email || '',
      role: parsed.role || 'user',
      profilePicture: parsed.profilePicture ?? null,
    };
  } catch {
    return null;
  }
};

// ============================================================
// Component
// ============================================================
const AdminTopBar: React.FC<AdminTopBarProps> = ({
  onMenuClick,
  isSidebarOpen,
}) => {
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Seed from localStorage so the header renders instantly.
  const [user, setUser] = useState<CurrentUser | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================
  // Fetch the current user
  // ============================================================
  const fetchCurrentUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authApi.me();
      if (res.success && res.data) {
        const u = res.data as CurrentUser;
        setUser(u);
        // Keep localStorage in sync so the next page load is instant.
        try {
          localStorage.setItem('user', JSON.stringify(u));
        } catch {
          /* quota — ignore */
        }
      }
    } catch (err) {
      // Network error or 401 — leave the cached user in place.
      // If the API returned 401, the http layer probably already
      // redirected to /signin; no need to duplicate that here.
      console.error('Failed to load current user:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Refresh when the tab regains focus (e.g. profile updated elsewhere).
  useEffect(() => {
    const onFocus = () => fetchCurrentUser();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchCurrentUser]);

  // ============================================================
  // Click-outside to close dropdowns
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.admin-dropdown')) {
        setShowDropdown(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ============================================================
  // Notifications — placeholder data for now
  // ============================================================
  const notifications = [
    { id: 1, text: 'New student registered: John M.', time: '5 min ago' },
    { id: 2, text: 'Exam submitted for marking', time: '20 min ago' },
    { id: 3, text: 'Payment received: TZS 120,000', time: '1 hour ago' },
    { id: 4, text: 'New testimonial pending approval', time: '3 hours ago' },
  ];

  // ============================================================
  // Logout
  // ============================================================
  const handleLogout = async () => {
    try {
      // Best-effort: tell the server to invalidate the session/token.
      // If your authApi has no `logout`, drop this try/catch.
      if ('logout' in authApi && typeof (authApi as any).logout === 'function') {
        await (authApi as any).logout();
      }
    } catch (err) {
      console.warn('Logout API call failed, clearing local state anyway:', err);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('keepMeLoggedIn');
      // Remove any token keys you use — add them here as needed.
      // localStorage.removeItem('accessToken');
      // localStorage.removeItem('refreshToken');
      navigate('/signin');
    }
  };

  // ============================================================
  // Derived display values
  // ============================================================
  const displayName = user?.fullName?.trim() || 'Account';
  const initial = displayName.charAt(0).toUpperCase();
  const firstName = displayName.split(' ')[0];

  // ============================================================
  // Render
  // ============================================================
  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-16 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {isSidebarOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
          <div className="hidden sm:block">
            <p className="text-base font-semibold text-gray-800">Admin Panel</p>
            <p className="text-xs text-gray-500">Tesla Cloud Institute</p>
          </div>
        </div>

        {/* Right: notifications + profile */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative admin-dropdown">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              aria-label="Notifications"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">
                    Notifications
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <p className="text-sm text-gray-800">{n.text}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative admin-dropdown">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">
                  {initial}
                </div>
              )}
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {isLoading && !user ? '…' : firstName}
              </span>
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">
                    {displayName}
                  </p>
                  {user?.email && (
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  )}
                  {user?.role && (
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">
                      {user.role}
                    </p>
                  )}
                </div>
                <Link
                  to="/my-profile"
                  onClick={() => setShowDropdown(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  My Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowDropdown(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Settings
                </Link>
                <Link
                  to="/accounts"
                  onClick={() => setShowDropdown(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Manage Users
                </Link>
                <div className="border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopBar;