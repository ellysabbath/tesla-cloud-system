import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import {
  authApi,
  courseApi,
  examApi,
  attemptApi,
  paymentApi,
} from '../../api/api';
import type {
  ApiAttempt,
  ApiCourse,
  ApiExam,
  ApiPayment,
  AdminUserRow,
} from '../../api/api';

// ============================================================
// Types
// ============================================================
interface StatItem {
  label: string;
  value: number;
  sub: string;
  accent: 'neutral' | 'warning' | 'success' | 'info';
}

type ActivityType =
  | 'student'
  | 'exam'
  | 'payment'
  | 'testimonial'
  | 'course';

interface ActivityItem {
  id: string;
  type: ActivityType;
  text: string;
  time: string;
  timestamp: number;
}

interface PendingTask {
  label: string;
  count: number;
  link: string;
}

interface DashboardData {
  stats: StatItem[];
  recentActivity: ActivityItem[];
  pendingTasks: PendingTask[];
}

interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  profilePicture?: string | null;
}

// ============================================================
// Helpers
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
        parsed.fullName || parsed.name || parsed.username || '',
      email: parsed.email || '',
      role: parsed.role || '',
      profilePicture: parsed.profilePicture ?? null,
    };
  } catch {
    return null;
  }
};

const timeAgo = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString();
};

const activityColor = (type: ActivityType): string => {
  switch (type) {
    case 'student':
      return 'bg-blue-500';
    case 'exam':
      return 'bg-orange-500';
    case 'payment':
      return 'bg-green-500';
    case 'testimonial':
      return 'bg-purple-500';
    case 'course':
      return 'bg-gray-700';
    default:
      return 'bg-gray-500';
  }
};

const accentText: Record<StatItem['accent'], string> = {
  neutral: 'text-gray-500',
  warning: 'text-orange-600',
  success: 'text-green-600',
  info: 'text-blue-600',
};

// ============================================================
// Build dashboard data from existing API responses
// ============================================================
const buildDashboard = (
  users: AdminUserRow[],
  courses: ApiCourse[],
  exams: ApiExam[],
  attempts: ApiAttempt[],
  payments: ApiPayment[]
): DashboardData => {
  const totalUsers = users.length;
  const pendingUsers = users.filter((u) => u.status === 'pending').length;
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.status === 'published').length;
  const totalExams = exams.length;
  const publishedExams = exams.filter((e) => e.status === 'published').length;
  const pendingMarking = attempts.filter((a) => a.status === 'pending').length;
  const publishedResults = attempts.filter(
    (a) => a.status === 'published'
  ).length;
  const pendingPayments = payments.filter(
    (p) => p.status === 'pending'
  ).length;

  const stats: StatItem[] = [
    {
      label: 'Accounts',
      value: totalUsers,
      sub: `${pendingUsers} pending verification`,
      accent: pendingUsers > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Exams',
      value: totalExams,
      sub: `${publishedExams} published`,
      accent: 'info',
    },
    {
      label: 'Courses',
      value: totalCourses,
      sub: `${publishedCourses} published`,
      accent: 'neutral',
    },
    {
      label: 'Results Published',
      value: publishedResults,
      sub:
        attempts.length > 0
          ? `${Math.round(
              (publishedResults / attempts.length) * 100
            )}% of attempts`
          : 'No attempts yet',
      accent: publishedResults > 0 ? 'success' : 'neutral',
    },
  ];

  const pendingTasks: PendingTask[] = [
    {
      label: 'Exams awaiting marking',
      count: pendingMarking,
      link: '/admin/answers',
    },
    {
      label: 'Accounts to verify',
      count: pendingUsers,
      link: '/accounts',
    },
    {
      label: 'Payments to confirm',
      count: pendingPayments,
      link: '/admin/payments',
    },
    {
      label: 'Results to publish',
      count: attempts.filter((a) => a.status === 'marked').length,
      link: '/admin/answers',
    },
  ];

  const activity: ActivityItem[] = [];

  users.slice(0, 8).forEach((u) => {
    activity.push({
      id: `user-${u.id}`,
      type: 'student',
      text: `New registration: ${u.fullName}`,
      time: timeAgo(u.joinedAt),
      timestamp: new Date(u.joinedAt).getTime() || 0,
    });
  });

  attempts.slice(0, 8).forEach((a) => {
    const ts = new Date(a.submitted_at ?? a.started_at).getTime() || 0;
    activity.push({
      id: `attempt-${a.id}`,
      type: 'exam',
      text: `${a.studentName} submitted ${a.examTitle}`,
      time: timeAgo(a.submitted_at ?? a.started_at),
      timestamp: ts,
    });
  });

  payments.slice(0, 8).forEach((p) => {
    const ts = new Date(p.submittedAt ?? p.paid_at ?? '').getTime() || 0;
    activity.push({
      id: `payment-${p.id}`,
      type: 'payment',
      text:
        p.status === 'paid'
          ? `Payment received: ${p.currency} ${p.amount} from ${p.studentName}`
          : `Payment pending: ${p.currency} ${p.amount} from ${p.studentName}`,
      time: timeAgo(p.submittedAt ?? p.paid_at),
      timestamp: ts,
    });
  });

  exams.slice(0, 6).forEach((e) => {
    activity.push({
      id: `exam-${e.id}`,
      type: 'exam',
      text: `Exam ${
        e.status === 'published' ? 'published' : 'created'
      }: ${e.title}`,
      time: timeAgo(e.created_at),
      timestamp: new Date(e.created_at).getTime() || 0,
    });
  });

  courses.slice(0, 6).forEach((c) => {
    activity.push({
      id: `course-${c.id}`,
      type: 'course',
      text: `Course ${
        c.status === 'published' ? 'published' : 'created'
      }: ${c.title}`,
      time: timeAgo(c.created_at),
      timestamp: new Date(c.created_at).getTime() || 0,
    });
  });

  activity.sort((a, b) => b.timestamp - a.timestamp);

  return {
    stats,
    recentActivity: activity.slice(0, 8),
    pendingTasks,
  };
};

// ============================================================
// Component
// ============================================================
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // ---------- Current user (name + role) ----------
  const [user, setUser] = useState<CurrentUser | null>(() => readStoredUser());

  // ============================================================
  // Fetch current user via existing authApi.me()
  // ============================================================
  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      if (res.success && res.data) {
        const raw = res.data as Record<string, unknown>;
        const u: CurrentUser = {
          id: String(raw.id ?? ''),
          fullName: String(
            raw.fullName ?? raw.name ?? raw.username ?? ''
          ),
          email: String(raw.email ?? ''),
          role: String(raw.role ?? ''),
          profilePicture:
            (raw.profilePicture as string | null | undefined) ?? null,
        };
        setUser(u);
        try {
          localStorage.setItem('user', JSON.stringify(u));
        } catch {
          /* quota — ignore */
        }
      }
    } catch (err) {
      console.error('Failed to load current user:', err);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Refetch user on tab focus so a role change elsewhere shows up.
  useEffect(() => {
    const onFocus = () => fetchCurrentUser();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchCurrentUser]);

  // ============================================================
  // Derived greeting parts
  // ============================================================
  const greeting = useMemo(() => {
    const full = user?.fullName?.trim() || '';
    const firstName = full ? full.split(' ')[0] : '';
    const role = user?.role?.trim() || '';

    // Format role: "super_admin" → "Super Admin", "admin" → "Admin"
    const roleLabel = role
      ? role
          .split(/[_\s-]+/)
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : '';

    return {
      name: firstName || 'Admin',
      roleLabel,
    };
  }, [user]);

  // ============================================================
  // Load dashboard data
  // ============================================================
  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [
        usersRes,
        coursesRes,
        examsRes,
        attemptsRes,
        paymentsRes,
      ] = await Promise.all([
        authApi.adminListUsers({ page_size: 50 }),
        courseApi.list(),
        examApi.list(),
        attemptApi.adminList(),
        paymentApi.adminList(),
      ]);

      const users: AdminUserRow[] = Array.isArray(usersRes.data)
        ? (usersRes.data as AdminUserRow[])
        : [];
      const courses: ApiCourse[] = Array.isArray(coursesRes.data)
        ? (coursesRes.data as ApiCourse[])
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

      const allFailed =
        !usersRes.success &&
        !coursesRes.success &&
        !examsRes.success &&
        !attemptsRes.success &&
        !paymentsRes.success;

      if (allFailed) {
        setError('Could not load dashboard data.');
        setData(null);
        return;
      }

      setData(buildDashboard(users, courses, exams, attempts, payments));
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome back, {greeting.name}
          </h1>
          <p className="text-gray-600 flex items-center gap-2 flex-wrap">
            <span>Overview of Tesla Cloud Institute activity</span>
            {greeting.roleLabel && (
              <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                {greeting.roleLabel}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="self-start sm:self-auto text-sm text-gray-600 hover:text-black disabled:opacity-50"
        >
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </Card>
      )}

      {/* Stats */}
      {isLoading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-32" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data?.stats ?? []).map((s) => (
            <Card key={s.label} className="p-5">
              <p className="text-sm text-gray-500 mb-1">{s.label}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {s.value}
              </p>
              <p className={`text-xs font-medium ${accentText[s.accent]}`}>
                {s.sub}
              </p>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h2>

            {isLoading && !data ? (
              <ul className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-20" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : data?.recentActivity && data.recentActivity.length > 0 ? (
              <ul className="space-y-4">
                {data.recentActivity.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white ${activityColor(
                        a.type
                      )}`}
                    >
                      {a.type.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{a.text}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic">
                No recent activity yet.
              </p>
            )}
          </Card>
        </div>

        {/* Pending tasks + quick actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pending Tasks
            </h2>

            {isLoading && !data ? (
              <ul className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i}>
                    <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                  </li>
                ))}
              </ul>
            ) : data?.pendingTasks && data.pendingTasks.length > 0 ? (
              <ul className="space-y-3">
                {data.pendingTasks.map((t) => (
                  <li key={t.label}>
                    <Link
                      to={t.link}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-black hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm text-gray-700">{t.label}</span>
                      <span
                        className={`text-sm font-bold ${
                          t.count > 0 ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {t.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic">
                Nothing pending. You're all caught up.
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/admin/courses')}
                className="block w-full text-center px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800"
              >
                Create New Course
              </button>
              <button
                onClick={() => navigate('/admin/exams')}
                className="block w-full text-center px-4 py-2 rounded-lg border border-black text-black text-sm font-medium hover:bg-gray-100"
              >
                Upload Exam
              </button>
              <button
                onClick={() => navigate('/accounts')}
                className="block w-full text-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                View All Accounts
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;