import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authApi, isAuthenticated } from '../api/api';

// ============================================================
// Roles
// ============================================================
export type Role = 'student' | 'admin' | 'super-admin' | 'user';

interface CachedUser {
  id?: string;
  role?: string;
  fullName?: string;
  email?: string;
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

// ============================================================
// AuthGuard
// ============================================================
interface AuthGuardProps {
  children: React.ReactNode;
  /**
   * If provided, only these roles are allowed.
   * If omitted, any authenticated user may pass.
   */
  allowedRoles?: Role[];
  /** Where to send unauthorised-but-authenticated users. */
  fallbackPath?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  allowedRoles,
  fallbackPath = '/notfound',
}) => {
  const location = useLocation();

  const [role, setRole] = useState<string | null>(() => readStoredRole());
  const [isChecking, setIsChecking] = useState<boolean>(!role);

  // ------------------------------------------------------------
  // If we don't yet know the role (e.g. after a hard refresh
  // where localStorage was cleared), fetch it once.
  // ------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchRole = async () => {
      if (role) {
        setIsChecking(false);
        return;
      }
      try {
        const res = await authApi.me();
        if (!cancelled && res.success && res.data) {
          const u = res.data as CachedUser;
          const r = u.role ?? 'student';
          setRole(r);
          try {
            localStorage.setItem('user', JSON.stringify(u));
          } catch {
            /* quota — ignore */
          }
        }
      } catch {
        /* leave role null → treated as unauthorised */
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    };

    fetchRole();
    return () => {
      cancelled = true;
    };
  }, [role]);

  // 1) Not signed in → /signin
  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // 2) Still resolving the role → render nothing (avoid flash)
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  // 3) Role check
  if (allowedRoles && allowedRoles.length > 0) {
    const normalised = (role ?? '').toLowerCase();
    const allowed = allowedRoles.map((r) => r.toLowerCase());
    if (!allowed.includes(normalised)) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};

export default AuthGuard;