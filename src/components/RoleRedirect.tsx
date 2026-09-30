import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authApi, isAuthenticated } from '../api/api';

interface CachedUser {
  role?: string;
}

const readStoredRole = (): string | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedUser;
    return parsed?.role ?? null;
  } catch {
    return null;
  }
};

const homeForRole = (role: string | null): string => {
  const r = (role ?? '').toLowerCase();
  if (r === 'admin' || r === 'super-admin') return '/admin/dashboard';
  return '/dashboard';
};

interface RoleRedirectProps {
  children: React.ReactNode;
  /** If true, only redirect when the visitor is signed in. */
  onlyWhenAuthed?: boolean;
}

const RoleRedirect: React.FC<RoleRedirectProps> = ({
  children,
  onlyWhenAuthed = true,
}) => {
  const [role, setRole] = useState<string | null>(() => readStoredRole());
  const [isChecking, setIsChecking] = useState<boolean>(
    onlyWhenAuthed && isAuthenticated() && !role
  );

  useEffect(() => {
    if (!onlyWhenAuthed) return;
    if (!isAuthenticated()) return;
    if (role) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await authApi.me();
        if (!cancelled && res.success && res.data) {
          const u = res.data as CachedUser;
          setRole(u.role ?? 'student');
          try {
            localStorage.setItem('user', JSON.stringify(u));
          } catch {
            /* quota */
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, onlyWhenAuthed]);

  // Signed in → go to the role's home
  if (onlyWhenAuthed && isAuthenticated()) {
    if (isChecking) {
      return (
        <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
          Loading…
        </div>
      );
    }
    return <Navigate to={homeForRole(role)} replace />;
  }

  return <>{children}</>;
};

export default RoleRedirect;