import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { currentAdmin } from '../../data/adminData';

interface AdminTopBarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const AdminTopBar: React.FC<AdminTopBarProps> = ({ onMenuClick, isSidebarOpen }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

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

  const notifications = [
    { id: 1, text: 'New student registered: John M.', time: '5 min ago' },
    { id: 2, text: 'Exam submitted for marking', time: '20 min ago' },
    { id: 3, text: 'Payment received: TZS 120,000', time: '1 hour ago' },
    { id: 4, text: 'New testimonial pending approval', time: '3 hours ago' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('keepMeLoggedIn');
    navigate('/signin');
  };

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16" />
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
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">Notifications</p>
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
              {currentAdmin.profilePicture ? (
                <img
                  src={currentAdmin.profilePicture}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">
                  {currentAdmin.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {currentAdmin.fullName.split(' ')[0]}
              </span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">{currentAdmin.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{currentAdmin.email}</p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">
                    {currentAdmin.role}
                  </p>
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
                  to="/manage-users"
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