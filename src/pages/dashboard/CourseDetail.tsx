import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PaymentModal from './PaymentModal';
import { courseApi, enrollmentApi, paymentApi } from '../../api/api';
import type { ApiCourse, ApiEnrollment, ApiPayment } from '../../api/api';

// ============================================================
// Icons
// ============================================================
const ArrowLeftIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// ============================================================
// Component
// ============================================================
const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [enrollment, setEnrollment] = useState<ApiEnrollment | null>(null);
  const [payment, setPayment] = useState<ApiPayment | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // ============================================================
  // Load course + enrollment + payment
  // ============================================================
  const load = useCallback(async () => {
    if (!id) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    setNotFound(false);

    try {
      // 1. Course (required)
      const courseRes = await courseApi.get(id);

      if (!courseRes.success || !courseRes.data) {
        // Endpoint responded, but no course → real "not found"
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setCourse(courseRes.data as ApiCourse);

      // 2. Enrollments + payments (best-effort)
      const [enrollRes, payRes] = await Promise.all([
        enrollmentApi.mine(),
        paymentApi.mine(),
      ]);

      if (enrollRes.success && Array.isArray(enrollRes.data)) {
        const mine = (enrollRes.data as ApiEnrollment[]).find(
          (e) => e.courseId === id && e.status === 'active'
        );
        setEnrollment(mine ?? null);
      } else {
        setEnrollment(null);
      }

      if (payRes.success && Array.isArray(payRes.data)) {
        const p = (payRes.data as ApiPayment[]).find(
          (p) => p.courseId === id
        );
        setPayment(p ?? null);
      } else {
        setPayment(null);
      }
    } catch (err) {
      console.error('CourseDetail load error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // ============================================================
  // Helpers
  // ============================================================
  const formatPrice = (p: number | string) =>
    new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(Number(p));

  const isPaid = !!enrollment || payment?.status === 'paid';
  const isPending = !isPaid && payment?.status === 'pending';

  // ============================================================
  // Loading
  // ============================================================
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-8 text-center text-gray-400">
          Loading course...
        </Card>
      </div>
    );
  }

  // ============================================================
  // Not found
  // ============================================================
  if (notFound || !course) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card className="p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg
              className="w-7 h-7 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Course not found
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            This course does not exist or may have been removed.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button onClick={() => navigate('/my-courses')}>
              My Courses
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ============================================================
  // Error
  // ============================================================
  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card className="p-8 text-center">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button onClick={load}>Try Again</Button>
        </Card>
      </div>
    );
  }

  // ============================================================
  // Loaded
  // ============================================================
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back
      </button>

      {/* ============================================================
          HERO
      ============================================================ */}
      <Card className="overflow-hidden">
        <div className="bg-black text-white p-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
              {course.category || 'General'}
            </span>
            {isPaid && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-green-500 text-white px-2 py-0.5 rounded-full">
                <CheckCircleIcon className="w-3 h-3" />
                Enrolled
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-yellow-500 text-black px-2 py-0.5 rounded-full">
                <ClockIcon className="w-3 h-3" />
                Pending Approval
              </span>
            )}
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold mb-3">
            {course.title}
          </h1>
          <p className="text-sm text-gray-300 max-w-2xl">
            {course.description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400">
                Instructor
              </p>
              <p className="text-sm font-medium truncate">
                {course.instructor || course.instructor_name || '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400">
                Duration
              </p>
              <p className="text-sm font-medium">{course.duration || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400">
                Practicals
              </p>
              <p className="text-sm font-medium">{course.practicals ?? 0}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400">
                Schedule
              </p>
              <p className="text-sm font-medium truncate">
                {course.theoryDays || 'TBD'}
              </p>
            </div>
          </div>
        </div>

        {/* Price + action bar */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Course Fee</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(course.price)}
              </p>
            </div>

            {isPaid && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <p className="text-sm font-semibold text-green-800">
                  You are enrolled in this course
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  Enrolled on{' '}
                  {enrollment
                    ? new Date(enrollment.enrolled_at).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )
                    : '—'}
                </p>
              </div>
            )}

            {isPending && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 max-w-sm">
                <p className="text-sm font-semibold text-yellow-900">
                  Payment pending approval
                </p>
                <p className="text-xs text-yellow-800 mt-0.5">
                  Reference: {payment?.reference || '—'}. You will be enrolled
                  once the admin confirms.
                </p>
              </div>
            )}

            {!isPaid && !isPending && (
              <Button size="large" onClick={() => setShowPayment(true)}>
                Enroll Now
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Overview */}
      {course.fullDescription && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Course Overview
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {course.fullDescription}
          </p>
        </Card>
      )}

      {/* What you'll learn */}
      {course.whatWillLearn && course.whatWillLearn.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What You Will Learn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {course.whatWillLearn.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <span className="shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-800">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Why learn */}
      {course.whyLearn && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Why Learn This Course
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {course.whyLearn}
          </p>
        </Card>
      )}

      {/* Schedule */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Course Schedule
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Theory Days
            </p>
            <p className="text-sm">{course.theoryDays || 'To be announced'}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Practical Days
            </p>
            <p className="text-sm">{course.practicalDays || 'To be announced'}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Theory Exam
            </p>
            <p className="text-sm">{course.theoryExam || 'To be announced'}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Practical Exam
            </p>
            <p className="text-sm">{course.practicalExam || 'To be announced'}</p>
          </div>
        </div>
      </Card>

      {/* Sticky CTA — only if not enrolled */}
      {!isPaid && !isPending && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 lg:pl-72 z-20">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500">Course Fee</p>
              <p className="font-bold text-gray-900">
                {formatPrice(course.price)}
              </p>
            </div>
            <Button onClick={() => setShowPayment(true)}>Enroll Now</Button>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPayment && (
        <PaymentModal
          course={course}
          onClose={() => setShowPayment(false)}
          onSuccess={async () => {
            setShowPayment(false);
            await load();
          }}
        />
      )}
    </div>
  );
};

export default CourseDetail;