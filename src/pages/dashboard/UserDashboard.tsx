import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PaymentModal from './PaymentModal';
import { useAuth } from '../../context/AuthContext';
import {
  courseApi,
  enrollmentApi,
  paymentApi,
  examApi,
  attemptApi,
  newsApi,
} from '../../api/api';
import type {
  ApiCourse,
  ApiEnrollment,
  ApiPayment,
  ApiExam,
  ApiAttempt,
  ApiNews,
} from '../../api/api';

// ============================================================
// Icons
// ============================================================
const BookIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
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

const FileTextIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const NewsIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
    />
  </svg>
);

// ============================================================
// Constants
// ============================================================
const categoryColors: Record<string, string> = {
  course: 'bg-blue-100 text-blue-700',
  exam: 'bg-orange-100 text-orange-700',
  payment: 'bg-purple-100 text-purple-700',
  system: 'bg-gray-100 text-gray-700',
  general: 'bg-green-100 text-green-700',
};

// ============================================================
// Component
// ============================================================
const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [enrollments, setEnrollments] = useState<ApiEnrollment[]>([]);
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [exams, setExams] = useState<ApiExam[]>([]);
  const [attempts, setAttempts] = useState<ApiAttempt[]>([]);
  const [news, setNews] = useState<ApiNews[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  // Payment modal
  const [payForCourse, setPayForCourse] = useState<ApiCourse | null>(null);

  // ============================================================
  // Load
  // ============================================================
  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [coursesRes, enrollRes, payRes, examsRes, attemptsRes, newsRes] =
        await Promise.all([
          courseApi.list({ status: 'published' }),
          enrollmentApi.mine(),
          paymentApi.mine(),
          examApi.list({ status: 'published' }),
          attemptApi.mine().catch(() => ({
            success: false,
            data: [] as ApiAttempt[],
          })),
          newsApi.list({ limit: 5 }).catch(() => ({
            success: false,
            data: [] as ApiNews[],
          })),
        ]);

      if (coursesRes.success && Array.isArray(coursesRes.data)) {
        setCourses(coursesRes.data as ApiCourse[]);
      } else {
        setCourses([]);
        setError(coursesRes.message || 'Could not load courses.');
      }

      setEnrollments(
        enrollRes.success && Array.isArray(enrollRes.data)
          ? (enrollRes.data as ApiEnrollment[])
          : []
      );

      setPayments(
        payRes.success && Array.isArray(payRes.data)
          ? (payRes.data as ApiPayment[])
          : []
      );

      setExams(
        examsRes.success && Array.isArray(examsRes.data)
          ? (examsRes.data as ApiExam[])
          : []
      );

      setAttempts(
        attemptsRes.success && Array.isArray(attemptsRes.data)
          ? (attemptsRes.data as ApiAttempt[])
          : []
      );

      setNews(
        newsRes.success && Array.isArray(newsRes.data)
          ? (newsRes.data as ApiNews[])
          : []
      );
    } catch (err) {
      console.error('UserDashboard load error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flashMessage = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(''), 2500);
  };

  // ============================================================
  // Helpers
  // ============================================================
  const formatPrice = (price: number | string) =>
    new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(Number(price));

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const isEnrolled = (courseId: string) =>
    enrollments.some((e) => e.courseId === courseId && e.status === 'active');

  const isPending = (courseId: string) =>
    payments.some((p) => p.courseId === courseId && p.status === 'pending');

  const enrolledCount = enrollments.filter((e) => e.status === 'active').length;

  const attemptForExam = (examId: string): ApiAttempt | undefined =>
    attempts.find((a) => a.examId === examId);

  const allExams = exams;

  const pendingExams = useMemo(
    () => allExams.filter((e) => !attemptForExam(e.id)),
    [allExams, attempts]
  );

  const takenExams = useMemo(
    () => allExams.filter((e) => attemptForExam(e.id)),
    [allExams, attempts]
  );

  // ============================================================
  // Stats
  // ============================================================
  const stats = useMemo(
    () => [
      { label: 'Available Courses', value: courses.length, sub: '' },
      { label: 'Enrolled', value: enrolledCount, sub: '' },
      {
        label: 'Exams Available',
        value: pendingExams.length,
        sub: pendingExams.length > 0 ? 'Ready to take' : '',
      },
      { label: 'Exams Taken', value: takenExams.length, sub: '' },
    ],
    [courses.length, enrolledCount, pendingExams.length, takenExams.length]
  );

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      {flash && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg">
          {flash}
        </div>
      )}

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Welcome back, {user?.fullName?.split(' ')[0] || 'Student'}!
        </h1>
        <p className="text-gray-600">Continue your learning journey</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            {stat.sub && (
              <p className="text-[11px] text-yellow-700 mt-1">{stat.sub}</p>
            )}
          </Card>
        ))}
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </Card>
      )}

      {/* ============================================================
          MAIN SPLIT: Courses (left) | Exams + News (right)
      ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ==================== LEFT: COURSES ==================== */}
        <section className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Available Courses
            </h2>
            <span className="text-xs text-gray-500">
              {courses.length} course{courses.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Scroll container */}
          <div className="lg:max-h-[70vh] lg:overflow-y-auto pr-1 space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="h-32 bg-gray-200" />
                  <div className="p-5">
                    <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
                    <div className="h-5 bg-gray-200 rounded w-40 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-6" />
                    <div className="h-8 bg-gray-200 rounded w-32" />
                  </div>
                </Card>
              ))
            ) : courses.length === 0 ? (
              <Card className="p-12 text-center">
                <BookIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">
                  No courses available yet. Check back soon.
                </p>
              </Card>
            ) : (
              courses.map((course) => {
                const enrolled = isEnrolled(course.id);
                const pending = isPending(course.id);

                return (
                  <Card
                    key={course.id}
                    className="overflow-hidden flex flex-col"
                  >
                    <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                      <BookIcon className="w-10 h-10 text-gray-400" />
                      {enrolled && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-green-600 text-white px-2 py-0.5 rounded-full">
                          <CheckCircleIcon className="w-3 h-3" />
                          Enrolled
                        </span>
                      )}
                      {!enrolled && pending && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-yellow-500 text-black px-2 py-0.5 rounded-full">
                          <ClockIcon className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                          {course.category || 'General'}
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {course.title}
                      </h3>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                        {course.description}
                      </p>

                      <div className="space-y-1 text-xs text-gray-500 mb-4">
                        <p>
                          Instructor:{' '}
                          {course.instructor ||
                            course.instructor_name ||
                            'None'}
                        </p>
                        <p>Duration: {course.duration || 'None'}</p>
                        <p>Practicals: {course.practicals ?? 0}</p>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-gray-900">
                          {formatPrice(course.price)}
                        </span>

                        {enrolled ? (
                          <Button
                            size="small"
                            onClick={() =>
                              navigate(`/my-courses/${course.id}`)
                            }
                          >
                            Continue
                          </Button>
                        ) : pending ? (
                          <Button
                            size="small"
                            variant="outline"
                            onClick={() => setPayForCourse(course)}
                          >
                            Pending - Update
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            onClick={() => setPayForCourse(course)}
                          >
                            Enroll
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        {/* ==================== RIGHT: EXAMS + NEWS ==================== */}
        <section className="flex flex-col lg:max-h-[70vh] lg:overflow-y-auto pr-1 space-y-6">
          {/* ---------- Exams ---------- */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Exams</h2>
              <span className="text-xs text-gray-500">
                {allExams.length} exam{allExams.length !== 1 ? 's' : ''}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="p-5 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-48 mb-3" />
                    <div className="h-3 bg-gray-200 rounded w-32 mb-4" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-100 rounded w-20" />
                      <div className="h-6 bg-gray-100 rounded w-20" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : allExams.length === 0 ? (
              <Card className="p-12 text-center">
                <FileTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 mb-1">No exams available.</p>
                <p className="text-sm text-gray-500">
                  Exams will appear here once the admin publishes them.
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Not attempted */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-orange-700">
                      Not Attempted ({pendingExams.length})
                    </h3>
                    {pendingExams.length > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        Action needed
                      </span>
                    )}
                  </div>

                  {pendingExams.length === 0 ? (
                    <Card className="p-6 text-center border-dashed border-2 border-gray-200 bg-gray-50">
                      <CheckCircleIcon className="w-8 h-8 mx-auto mb-2 text-green-400" />
                      <p className="text-sm text-gray-600">
                        You have attempted all available exams.
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {pendingExams.map((exam) => (
                        <ExamCard
                          key={exam.id}
                          exam={exam}
                          onTake={() =>
                            navigate(`/candidate/exams/${exam.id}`)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Already taken */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-green-700">
                      Already Taken ({takenExams.length})
                    </h3>
                    {takenExams.length > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Results
                      </span>
                    )}
                  </div>

                  {takenExams.length === 0 ? (
                    <Card className="p-6 text-center border-dashed border-2 border-gray-200 bg-gray-50">
                      <FileTextIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-600">
                        You have not taken any exams yet.
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {takenExams.map((exam) => {
                        const attempt = attemptForExam(exam.id);
                        return (
                          <ExamCard
                            key={exam.id}
                            exam={exam}
                            attempt={attempt}
                            onView={() =>
                              navigate(
                                `/candidate/exams/${exam.id}/result`
                              )
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ---------- News (LIVE from API) ---------- */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Latest News
              </h2>
              <Link
                to="/news"
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                View all
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                  </Card>
                ))}
              </div>
            ) : news.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-2 border-gray-200 bg-gray-50">
                <NewsIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-600">No updates yet.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {news.slice(0, 5).map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                        <NewsIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {item.pinned && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                              Pinned
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              categoryColors[item.category] ||
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.category}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                          {item.title}
                        </h3>
                        {item.body && (
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                            {item.body}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Payment modal */}
      {payForCourse && (
        <PaymentModal
          course={payForCourse}
          onClose={() => setPayForCourse(null)}
          onSuccess={async () => {
            setPayForCourse(null);
            flashMessage('Payment submitted. Awaiting admin approval.');
            await load();
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// ExamCard - small reusable row
// ============================================================
interface ExamCardProps {
  exam: ApiExam;
  attempt?: ApiAttempt;
  onTake?: () => void;
  onView?: () => void;
}

const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  attempt,
  onTake,
  onView,
}) => {
  const questions = exam.sections.reduce(
    (sum, s) => sum + (s.questions?.length ?? 0),
    0
  );

  const isTaken = Boolean(attempt);

  return (
    <Card className="p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">
              {exam.title}
            </h3>
            {isTaken ? (
              attempt?.passed === true ? (
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  <CheckCircleIcon className="w-3 h-3" />
                  Passed
                </span>
              ) : attempt?.passed === false ? (
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  Failed
                </span>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  <ClockIcon className="w-3 h-3" />
                  Awaiting Marking
                </span>
              )
            ) : (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                Not Attempted
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 truncate">
            {exam.courseTitle} - {exam.year}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
            <span>
              <strong className="text-gray-700">
                {exam.durationMinutes}
              </strong>{' '}
              min
            </span>
            <span>
              <strong className="text-gray-700">
                {exam.sections.length}
              </strong>{' '}
              sections
            </span>
            <span>
              <strong className="text-gray-700">{questions}</strong> questions
            </span>
          </div>
        </div>

        <div className="shrink-0">
          {isTaken ? (
            <Button variant="outline" size="small" onClick={onView}>
              View Result
            </Button>
          ) : (
            <Button size="small" onClick={onTake}>
              Take Exam
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default UserDashboard;