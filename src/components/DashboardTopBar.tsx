import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../api/api';
import type { ApiNotification } from '../api/api';

// ============================================================
// Types
// ============================================================
interface DashboardTopBarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const POLL_MS = 60_000; // refresh unread count every 60s

// ============================================================
// Helpers
// ============================================================
const timeAgo = (iso: string): string => {
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const typeColor: Record<string, string> = {
  exam_result: 'bg-blue-100 text-blue-700',
  payment: 'bg-purple-100 text-purple-700',
  certificate: 'bg-green-100 text-green-700',
  system: 'bg-gray-100 text-gray-700',
};

// ============================================================
// Component
// ============================================================
const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  onMenuClick,
  isSidebarOpen,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  const profileRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  // ---------- Close dropdowns on outside click ----------
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---------- Load notifications ----------
  const loadNotifications = useCallback(async () => {
    setIsLoadingNotifs(true);
    try {
      const res = await notificationApi.list({ limit: 20 });
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data as ApiNotification[]);
      }
      if (typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Load notifications error:', err);
    } finally {
      setIsLoadingNotifs(false);
    }
  }, []);

  // ---------- Poll unread count only ----------
  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await notificationApi.list({ unread: true, limit: 1 });
      if (typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      /* silent */
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    loadNotifications();
    const id = setInterval(refreshUnreadCount, POLL_MS);
    return () => clearInterval(id);
  }, [loadNotifications, refreshUnreadCount]);

  // ---------- Handlers ----------
  const handleOpenNotifications = () => {
    const next = !showNotifications;
    setShowNotifications(next);
    setShowProfileDropdown(false);
    if (next) loadNotifications();
  };

  const handleMarkRead = async (n: ApiNotification) => {
    if (n.is_read) return;
    // Optimistic
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationApi.markRead(n.id);
    } catch {
      // Revert on error
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: false } : x))
      );
      setUnreadCount((c) => c + 1);
    }
  };

  const handleMarkAllRead = async () => {
    const prev = notifications;
    const prevUnread = unreadCount;
    setNotifications((list) => list.map((x) => ({ ...x, is_read: true })));
    setUnreadCount(0);
    try {
      await notificationApi.markAllRead();
    } catch {
      setNotifications(prev);
      setUnreadCount(prevUnread);
    }
  };

  const handleClearAll = async () => {
    const prev = notifications;
    const prevUnread = unreadCount;
    setNotifications([]);
    setUnreadCount(0);
    try {
      await notificationApi.clear();
    } catch {
      setNotifications(prev);
      setUnreadCount(prevUnread);
    }
  };

  // ---------- Display values ----------
  const displayName = user?.fullName ?? 'Student';
  const displayEmail = user?.email ?? 'student@teslacloud.ac.tz';
  const displayPicture = user?.profilePicture ?? null;
  const displayInitial = displayName.charAt(0).toUpperCase();

  const dropdownItems = [
    { label: 'My Profile', path: '/my-profile' },
    { label: 'My Courses', path: '/my-courses' },
    { label: 'My Certificates', path: '/my-certificates' },
    { label: 'Settings', path: '/settings' },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setShowProfileDropdown(false);
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      navigate('/signin', { replace: true });
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-16 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Menu button + brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {isSidebarOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <Link
            to="/dashboard"
            className="hidden sm:block text-base font-semibold text-gray-800"
          >
            Tesla Cloud Institute
          </Link>
        </div>

        {/* Right side: notifications + profile */}
        <div className="flex items-center gap-2">
          {/* ---------- Notifications ---------- */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleOpenNotifications}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
              aria-haspopup="true"
              aria-expanded={showNotifications}
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>

              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Notifications</p>
                    {unreadCount > 0 && (
                      <p className="text-xs text-gray-500">{unreadCount} unread</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-black hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={handleClearAll}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* List */}
                <div className="max-h-96 overflow-y-auto">
                  {isLoadingNotifs ? (
                    <div className="px-4 py-8 text-center text-gray-400 text-sm">
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      You have no notifications.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleMarkRead(n)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${
                          !n.is_read ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              typeColor[n.type] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {n.type.replace('_', ' ')}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm truncate ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {n.title}
                              </p>
                              {!n.is_read && (
                                <span className="shrink-0 w-2 h-2 bg-blue-600 rounded-full" />
                              )}
                            </div>
                            {n.body && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {n.body}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">
                              {timeAgo(n.created_at)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="block text-center text-xs font-medium text-gray-700 hover:text-black"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ---------- Profile ---------- */}
          <div className="relative profile-dropdown" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-haspopup="true"
              aria-expanded={showProfileDropdown}
            >
              {displayPicture ? (
                <img
                  src={displayPicture}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
                  {displayInitial}
                </div>
              )}

              <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[140px] truncate">
                {displayName}
              </span>

              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  showProfileDropdown ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
                </div>

                {dropdownItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowProfileDropdown(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
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

export default DashboardTopBar;