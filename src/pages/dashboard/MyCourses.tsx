import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { courseApi, paymentApi } from '../../api/api';
import type { ApiCourse, ApiPayment } from '../../api/api';

// ============================================================
// Icons
// ============================================================
const BookIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ============================================================
// Component
// ============================================================
const MyCourses: React.FC = () => {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // ============================================================
  // Load
  // ============================================================
  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [coursesRes, paymentsRes] = await Promise.all([
        courseApi.list(),
        paymentApi.mine(),
      ]);

      if (coursesRes.success && Array.isArray(coursesRes.data)) {
        setCourses(coursesRes.data as ApiCourse[]);
      } else {
        setCourses([]);
      }

      if (paymentsRes.success && Array.isArray(paymentsRes.data)) {
        setPayments(paymentsRes.data as ApiPayment[]);
      } else {
        setPayments([]);
      }

      if (!coursesRes.success && !paymentsRes.success) {
        setError(coursesRes.message || paymentsRes.message || 'Could not load your courses.');
      }
    } catch (err) {
      console.error('MyCourses load error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ============================================================
  // Helpers
  // ============================================================
  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '—';

  const formatPrice = (p: number | string) =>
    new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(Number(p));

  // Pair each payment with its course by courseId
  const items = payments
    .map((payment) => {
      const course = courses.find((c) => c.id === payment.courseId);
      return course ? { payment, course } : null;
    })
    .filter((x): x is { payment: ApiPayment; course: ApiCourse } => x !== null);

  const enrolledCount = items.filter((i) => i.payment.status === 'paid').length;
  const pendingCount = items.filter((i) => i.payment.status === 'pending').length;

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Courses</h1>
          <p className="text-gray-600">
            All courses you're currently enrolled in
            {pendingCount > 0 && ` (${pendingCount} pending approval)`}
          </p>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </Card>
      )}

      {/* Summary stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5">
            <p className="text-sm text-gray-500 mb-1">Enrolled</p>
            <p className="text-2xl font-bold text-green-600">{enrolledCount}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-gray-500 mb-1">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </Card>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-48 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-6" />
              <div className="h-16 bg-gray-100 rounded mb-4" />
              <div className="h-8 bg-gray-200 rounded w-32 ml-auto" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && !error && (
        <Card className="p-12 text-center">
          <BookIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 mb-1">
            You haven't enrolled in any courses yet.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Browse the course catalog and start learning today.
          </p>
          <Link to="/dashboard">
            <Button>Browse Courses</Button>
          </Link>
        </Card>
      )}

      {/* Cards */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map(({ payment, course }) => {
            const isPaid = payment.status === 'paid';
            const isPending = payment.status === 'pending';

            return (
              <Card key={payment.id} className="p-6 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      {course.category || 'General'}
                    </span>
                    <h3 className="font-semibold text-lg text-gray-900 leading-snug mt-0.5 line-clamp-2">
                      {course.title}
                    </h3>
                  </div>

                  {isPaid && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      <CheckCircleIcon className="w-3 h-3" />
                      Enrolled
                    </span>
                  )}
                  {isPending && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      <ClockIcon className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {course.description}
                </p>

                {/* Meta */}
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-gray-50 rounded-lg py-2">
                    <p className="text-sm font-bold text-gray-900">
                      {course.duration || '—'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">
                      Duration
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg py-2">
                    <p className="text-sm font-bold text-gray-900">
                      {course.practicals ?? 0}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">
                      Practicals
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg py-2">
                    <p className="text-sm font-bold text-gray-900 truncate px-1">
                      {(course.instructor || course.instructor_name || '—')
                        .split(' ')[0]}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">
                      Instructor
                    </p>
                  </div>
                </div>

                {/* Payment info */}
                <div className="border-t border-gray-100 pt-3 mb-4 flex-1">
                  {isPaid ? (
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Amount paid</span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(payment.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Paid on</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(payment.paid_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Reference</span>
                        <span className="font-mono text-gray-900">
                          {payment.reference}
                        </span>
                      </div>
                    </div>
                  ) : isPending ? (
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Amount</span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(payment.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Submitted</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(payment.submittedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Reference</span>
                        <span className="font-mono text-gray-900">
                          {payment.reference}
                        </span>
                      </div>
                      <p className="text-[11px] text-yellow-700 pt-1">
                        Awaiting admin approval
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Status</span>
                        <span className="font-medium text-gray-900 capitalize">
                          {payment.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Reference</span>
                        <span className="font-mono text-gray-900">
                          {payment.reference || '—'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    {formatPrice(course.price)}
                  </span>
                  <Link to={`/my-courses/${course.id}`}>
                    <Button
                      size="small"
                      variant={isPaid ? 'primary' : 'outline'}
                    >
                      {isPaid ? 'Continue Learning' : 'View Details'}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCourses;