import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavLink {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

// Shape of the recorder state pushed from TakeExam
interface RecorderPayload {
  active: boolean;
  status:
    | 'idle'
    | 'requesting'
    | 'recording'
    | 'stopped'
    | 'denied'
    | 'error';
  elapsedSeconds: number;
  stream: MediaStream | null;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // ---------- Recorder panel state (driven by events from TakeExam) ----------
  const [recorder, setRecorder] = useState<RecorderPayload | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<RecorderPayload | null>).detail;
      setRecorder(detail);
    };
    window.addEventListener('tci:recorder', handler);
    return () => window.removeEventListener('tci:recorder', handler);
  }, []);

  // Attach the live stream to the sidebar preview video
  useEffect(() => {
    if (!recorder?.stream) return;
    const el = videoRef.current;
    if (!el) return;
    if (el.srcObject !== recorder.stream) {
      el.srcObject = recorder.stream;
      el.play().catch(() => {});
    }
  }, [recorder?.stream]);

  const navLinks: NavLink[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'My Profile',
      path: '/my-profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      label: 'My Courses',
      path: '/my-courses',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    // {
    //   label: 'Examination Lists',
    //   path: '/candidate/examination-lists',
    //   icon: (
    //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
    //         d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    //     </svg>
    //   ),
    // },
    {
      label: 'My Exams',
      path: '/candidate/exams',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'My Certificates',
      path: '/my-certificates',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return (
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  };

  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('keepMeLoggedIn');
    navigate('/signin');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 shrink-0">
          <Link
            to="/dashboard"
            className="text-lg font-bold tracking-tight"
            onClick={handleLinkClick}
          >
            TESLA CLOUD
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-100 transition-colors lg:hidden"
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
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Menu
          </p>
          <ul className="space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
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
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                      }
                    `}
                  >
                    <span className={active ? 'text-white' : 'text-gray-500'}>
                      {link.icon}
                    </span>
                    <span className="flex-1">{link.label}</span>
                    {link.badge && link.badge > 0 && (
                      <span
                        className={`
                          text-[10px] font-bold px-2 py-0.5 rounded-full
                          ${
                            active
                              ? 'bg-white text-black'
                              : 'bg-black text-white'
                          }
                        `}
                      >
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ============================================================
              RECORDER PANEL — appears below Settings when an exam
              is in progress
          ============================================================ */}
          {recorder && recorder.active && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-gray-900 text-white">
                <div className="flex items-center gap-1.5 min-w-0">
                  {recorder.status === 'recording' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-widest truncate">
                        Recording
                      </span>
                    </>
                  ) : recorder.status === 'requesting' ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest truncate">
                      Starting…
                    </span>
                  ) : recorder.status === 'denied' ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest truncate">
                      Camera denied
                    </span>
                  ) : recorder.status === 'error' ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest truncate">
                      Camera error
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest truncate">
                      Camera
                    </span>
                  )}
                </div>
                {recorder.status === 'recording' && (
                  <span className="text-[10px] font-mono tabular-nums text-white/80 shrink-0">
                    {formatTime(recorder.elapsedSeconds)}
                  </span>
                )}
              </div>

              {/* Video preview */}
              <div className="bg-black aspect-video relative">
                {recorder.status === 'recording' ||
                recorder.status === 'requesting' ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : recorder.status === 'denied' ||
                  recorder.status === 'error' ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 p-3 text-center">
                    <svg
                      className="w-7 h-7 mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-[9px]">
                      Camera unavailable — you may still take the exam.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-[10px]">
                    Initializing…
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="px-2.5 py-1 bg-gray-50 border-t border-gray-100">
                <p className="text-[9px] text-gray-500 text-center leading-tight">
                  Session recorded for identity verification.
                </p>
              </div>
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-200 shrink-0">
          <button
            onClick={handleLogout}
            className="
              flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
              text-sm font-medium text-red-600
              hover:bg-red-50 transition-colors duration-150
            "
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;