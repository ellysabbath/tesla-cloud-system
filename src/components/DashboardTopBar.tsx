import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ============================================================
// Types
// ============================================================
interface DashboardTopBarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

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

  // ---------- Close dropdown on outside click ----------
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ---------- Display values (from context) ----------
  const displayName = user?.fullName ?? 'Student';
  const displayEmail = user?.email ?? 'student@teslacloud.ac.tz';
  const displayPicture = user?.profilePicture ?? null;
  const displayInitial = displayName.charAt(0).toUpperCase();

  // ---------- Dropdown items ----------
  const dropdownItems = [
    { label: 'My Profile', path: '/my-profile' },
    { label: 'My Courses', path: '/my-courses' },
    { label: 'My Certificates', path: '/my-certificates' },
    { label: 'Settings', path: '/settings' },
  ];

  // ---------- Logout ----------
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
              // X icon when open
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
              // Hamburger when closed
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

          <Link
            to="/dashboard"
            className="hidden sm:block text-base font-semibold text-gray-800"
          >
            Tesla Cloud Institute
          </Link>
        </div>

        {/* Profile dropdown */}
        <div className="relative profile-dropdown">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
              </div>

              {/* Links */}
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

              {/* Logout */}
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
    </header>
  );
};

export default DashboardTopBar;