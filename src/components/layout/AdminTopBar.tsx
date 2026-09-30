import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, notificationApi, newsApi } from '../../api/api';
import type { ApiNotification, ApiNews } from '../../api/api';

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

const POLL_MS = 60_000; // refresh counts every 60s
const NEWS_SEEN_KEY = 'tesla_admin_news_seen_ids';

// ============================================================
// Fallback - read what we already stored at login.
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
        parsed.fullName || parsed.name || parsed.username || 'User',
      email: parsed.email || '',
      role: parsed.role || 'user',
      profilePicture: parsed.profilePicture ?? null,
    };
  } catch {
    return null;
  }
};

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

const readSeenNewsIds = (): string[] => {
  try {
    const raw = localStorage.getItem(NEWS_SEEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const writeSeenNewsIds = (ids: string[]) => {
  try {
    localStorage.setItem(NEWS_SEEN_KEY, JSON.stringify(ids));
  } catch {
    /* quota - ignore */
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

  // Dropdowns
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNews, setShowNews] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const newsRef = useRef<HTMLDivElement | null>(null);

  // User
  const [user, setUser] = useState<CurrentUser | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  // News
  const [newsItems, setNewsItems] = useState<ApiNews[]>([]);
  const [newNewsCount, setNewNewsCount] = useState(0);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  // ============================================================
  // Fetch current user
  // ============================================================
  const fetchCurrentUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authApi.me();
      if (res.success && res.data) {
        const u = res.data as CurrentUser;
        setUser(u);
        try {
          localStorage.setItem('user', JSON.stringify(u));
        } catch {
          /* quota - ignore */
        }
      }
    } catch (err) {
      console.error('Failed to load current user:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    const onFocus = () => fetchCurrentUser();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchCurrentUser]);

  // ============================================================
  // Load notifications
  // ============================================================
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

  // ============================================================
  // Load news
  // ============================================================
  const loadNews = useCallback(async () => {
    setIsLoadingNews(true);
    try {
      const res = await newsApi.list({ limit: 20 });
      if (res.success && Array.isArray(res.data)) {
        const items = res.data as ApiNews[];
        setNewsItems(items);

        const seenIds = new Set(readSeenNewsIds());
        const newCount = items.filter((n) => !seenIds.has(n.id)).length;
        setNewNewsCount(newCount);
      }
    } catch (err) {
      console.error('Load news error:', err);
    } finally {
      setIsLoadingNews(false);
    }
  }, []);

  const refreshNewNewsCount = useCallback(async () => {
    try {
      const res = await newsApi.list({ limit: 20 });
      if (res.success && Array.isArray(res.data)) {
        const items = res.data as ApiNews[];
        const seenIds = new Set(readSeenNewsIds());
        const newCount = items.filter((n) => !seenIds.has(n.id)).length;
        setNewNewsCount(newCount);
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadNews();

    const id = setInterval(() => {
      refreshUnreadCount();
      refreshNewNewsCount();
    }, POLL_MS);

    return () => clearInterval(id);
  }, [
    loadNotifications,
    loadNews,
    refreshUnreadCount,
    refreshNewNewsCount,
  ]);

  // ============================================================
  // Click-outside to close dropdowns
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (newsRef.current && !newsRef.current.contains(target)) {
        setShowNews(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================
  // Notification handlers
  // ============================================================
  const handleOpenNotifications = () => {
    const next = !showNotifications;
    setShowNotifications(next);
    setShowDropdown(false);
    setShowNews(false);
    if (next) loadNotifications();
  };

  const handleMarkRead = async (n: ApiNotification) => {
    if (n.is_read) return;
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationApi.markRead(n.id);
    } catch {
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

  // ============================================================
  // News handlers
  // ============================================================
  const handleOpenNews = () => {
    const next = !showNews;
    setShowNews(next);
    setShowDropdown(false);
    setShowNotifications(false);
    if (next) {
      loadNews();
      // Mark all current items as seen the moment the dropdown opens.
      const ids = newsItems.map((n) => n.id);
      const merged = Array.from(new Set([...readSeenNewsIds(), ...ids]));
      writeSeenNewsIds(merged);
      setNewNewsCount(0);
    }
  };

  const handleOpenNewsPage = () => {
    // Same as opening the dropdown: mark as seen.
    const ids = newsItems.map((n) => n.id);
    const merged = Array.from(new Set([...readSeenNewsIds(), ...ids]));
    writeSeenNewsIds(merged);
    setNewNewsCount(0);
    setShowNews(false);
    navigate('/admin/news');
  };

  // ============================================================
  // Logout
  // ============================================================
  const handleLogout = async () => {
    try {
      if (
        'logout' in authApi &&
        typeof (authApi as unknown as { logout: () => Promise<unknown> })
          .logout === 'function'
      ) {
        await (
          authApi as unknown as { logout: () => Promise<unknown> }
        ).logout();
      }
    } catch (err) {
      console.warn(
        'Logout API call failed, clearing local state anyway:',
        err
      );
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('keepMeLoggedIn');
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <div className="hidden sm:block">
            <p className="text-base font-semibold text-gray-800">Admin Panel</p>
            <p className="text-xs text-gray-500">Tesla Cloud Institute</p>
          </div>
        </div>

        {/* Right: news + notifications + profile */}
        <div className="flex items-center gap-2">
          {/* ---------- News ---------- */}
          <div className="relative" ref={newsRef}>
            <button
              onClick={handleOpenNews}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="News and updates"
              aria-haspopup="true"
              aria-expanded={showNews}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>

              {newNewsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                  {newNewsCount > 9 ? '9+' : newNewsCount}
                </span>
              )}
            </button>

            {showNews && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      News &amp; Updates
                    </p>
                    {newNewsCount > 0 && (
                      <p className="text-xs text-gray-500">
                        {newNewsCount} new
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleOpenNewsPage}
                    className="text-xs text-black hover:underline"
                  >
                    Manage
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {isLoadingNews ? (
                    <div className="px-4 py-8 text-center text-gray-400 text-sm">
                      Loading...
                    </div>
                  ) : newsItems.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      No news yet.
                    </div>
                  ) : (
                    newsItems.slice(0, 6).map((n) => (
                      <button
                        key={n.id}
                        onClick={handleOpenNewsPage}
                        className="w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {n.pinned && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                              Pinned
                            </span>
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {n.category}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {timeAgo(n.created_at)}
                          </span>
                          {!n.is_published && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                              Hidden
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {n.body}
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={handleOpenNewsPage}
                    className="block w-full text-center text-xs font-medium text-gray-700 hover:text-black"
                  >
                    Manage news
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ---------- Notifications ---------- */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleOpenNotifications}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              aria-label="Notifications"
              aria-haspopup="true"
              aria-expanded={showNotifications}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                <div className="max-h-80 overflow-y-auto">
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
                              <p
                                className={`text-sm truncate ${
                                  !n.is_read
                                    ? 'font-semibold text-gray-900'
                                    : 'text-gray-700'
                                }`}
                              >
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

                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                  <Link
                    to="/admin/notifications"
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
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setShowDropdown(!showDropdown);
                setShowNotifications(false);
                setShowNews(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-haspopup="true"
              aria-expanded={showDropdown}
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
                {isLoading && !user ? '...' : firstName}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  showDropdown ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                  to="/admin/my-profile"
                  onClick={() => setShowDropdown(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  My Profile
                </Link>
                <Link
                  to="/admin/settings"
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
                <Link
                  to="/admin/news"
                  onClick={() => setShowDropdown(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  News &amp; Updates
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