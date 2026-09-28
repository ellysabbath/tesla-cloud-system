import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { examApi, attemptApi } from '../../api/api';
import type { ApiExam, ApiAttempt } from '../../api/api';

// ============================================================
// Types
// ============================================================
type Filter = 'all' | 'available' | 'completed';

// ============================================================
// Icons
// ============================================================
const ClipboardIcon: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6',
}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
    />
  </svg>
);

// ============================================================
// Component
// ============================================================
const CandidateExams: React.FC = () => {
  const [exams, setExams] = useState<ApiExam[]>([]);
  const [attempts, setAttempts] = useState<ApiAttempt[]>([]);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // ============================================================
  // Load
  // ============================================================
  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [examsRes, attemptsRes] = await Promise.all([
        examApi.list({ status: 'published' }),
        attemptApi.mine().catch(() => ({
          success: false,
          data: [] as ApiAttempt[],
        })),
      ]);

      if (examsRes.success && Array.isArray(examsRes.data)) {
        setExams(examsRes.data as ApiExam[]);
      } else {
        setExams([]);
        setError(examsRes.message || 'Could not load exams.');
      }

      if (attemptsRes.success && Array.isArray(attemptsRes.data)) {
        setAttempts(attemptsRes.data as ApiAttempt[]);
      } else {
        setAttempts([]);
      }
    } catch (err) {
      console.error('CandidateExams load error:', err);
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

  const attemptFor = (examId: string) =>
    attempts.find((a) => a.examId === examId);

  const isAttempted = (examId: string) => Boolean(attemptFor(examId));

  const sectionQuestionsCount = (
    section: { questions?: unknown[] }
  ): number =>
    Array.isArray(section.questions) ? section.questions.length : 0;

  const totalQuestions = (exam: ApiExam) =>
    (exam.sections ?? []).reduce(
      (sum, s) => sum + sectionQuestionsCount(s),
      0
    );

  const totalPoints = (exam: ApiExam) =>
    (exam.sections ?? []).reduce((sum, s) => {
      const qCount = sectionQuestionsCount(s);
      const points = Number(s.points_per_question) || 0;
      return sum + qCount * points;
    }, 0);

  // ============================================================
  // Filter + search
  // ============================================================
  const filtered = useMemo(() => {
    return exams.filter((e) => {
      if (filter === 'available' && isAttempted(e.id)) return false;
      if (filter === 'completed' && !isAttempted(e.id)) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${e.title} ${e.courseTitle} ${e.year}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [exams, filter, search, attempts]);

  // ============================================================
  // Stats
  // ============================================================
  const availableCount = exams.filter((e) => !isAttempted(e.id)).length;
  const completedCount = exams.filter((e) => isAttempted(e.id)).length;
  const passedCount = attempts.filter((a) => a.passed === true).length;

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Exams</h1>
        <p className="text-gray-600">
          Browse and take exams published by your tutors.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Exams',
            value: exams.length,
            color: 'text-gray-900',
          },
          {
            label: 'Available',
            value: availableCount,
            color: 'text-orange-600',
          },
          {
            label: 'Completed',
            value: completedCount,
            color: 'text-blue-600',
          },
          { label: 'Passed', value: passedCount, color: 'text-green-600' },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </Card>
      )}

      {/* Filter + search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all' as Filter, label: 'All', count: exams.length },
              {
                key: 'available' as Filter,
                label: 'Available',
                count: availableCount,
              },
              {
                key: 'completed' as Filter,
                label: 'Completed',
                count: completedCount,
              },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
                  ${
                    filter === f.key
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                  }
                `}
              >
                {f.label}
                <span
                  className={`ml-2 text-xs ${
                    filter === f.key ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 md:max-w-sm md:ml-auto">
            <div className="relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, course, or year..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-24 bg-gray-200" />
              <div className="p-5">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-14 bg-gray-100 rounded-lg" />
                  ))}
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-8 bg-gray-200 rounded w-32 ml-auto" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 mb-1">
            {exams.length === 0
              ? 'No exams available yet.'
              : 'No exams match your filters.'}
          </p>
          <p className="text-sm text-gray-500">
            {exams.length === 0
              ? 'Check back later — your tutors will publish exams soon.'
              : 'Try a different filter or search term.'}
          </p>
          {filter !== 'all' && exams.length > 0 && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setFilter('all');
                setSearch('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((exam) => {
            const attempt = attemptFor(exam.id);
            const attempted = Boolean(attempt);

            // Header color
            const headerClass = !attempted
              ? 'bg-black'
              : attempt?.status === 'pending'
              ? 'bg-yellow-600'
              : attempt?.status === 'marked'
              ? 'bg-blue-600'
              : attempt?.passed
              ? 'bg-green-600'
              : 'bg-red-600';

            return (
              <Card
                key={exam.id}
                className="flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className={`p-5 text-white ${headerClass}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full truncate max-w-[60%]">
                      {exam.courseTitle || 'General'}
                    </span>

                    {!attempted && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                        Available
                      </span>
                    )}
                    {attempt?.status === 'pending' && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                        Awaiting Marking
                      </span>
                    )}
                    {attempt?.status === 'marked' && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                        Marked
                      </span>
                    )}
                    {attempt?.status === 'published' && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                        {attempt.passed ? '✓ Passed' : '✗ Failed'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-base leading-snug line-clamp-2">
                    {exam.title || 'Untitled Exam'}
                  </h3>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div className="bg-gray-50 rounded-lg py-2">
                      <p className="text-lg font-bold text-gray-900">
                        {exam.durationMinutes}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500">
                        Minutes
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg py-2">
                      <p className="text-lg font-bold text-gray-900">
                        {totalQuestions(exam)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500">
                        Questions
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg py-2">
                      <p className="text-lg font-bold text-gray-900">
                        {totalPoints(exam)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500">
                        Points
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-4 flex-1">
                    <p className="mb-1">
                      <strong className="text-gray-700">
                        {exam.sections.length}
                      </strong>{' '}
                      section
                      {exam.sections.length !== 1 ? 's' : ''}:{' '}
                      {exam.sections.map((s) => s.kind).join(', ') || '—'}
                    </p>
                    <p>
                      Year{' '}
                      <strong className="text-gray-700">{exam.year}</strong>
                    </p>
                  </div>

                  {/* Attempt info */}
                  {attempted && attempt && (
                    <div className="mb-4 pt-4 border-t border-gray-100">
                      {attempt.status === 'published' &&
                      attempt.final_percent ? (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">
                              Your Score
                            </span>
                            <span className="text-xs text-gray-500">
                              {attempt.final_grade || ''}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <p
                              className={`text-2xl font-bold ${
                                attempt.passed
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {Number(attempt.final_percent).toFixed(2)}%
                            </p>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Submitted{' '}
                            {formatDate(attempt.submitted_at)}
                          </p>
                        </>
                      ) : attempt.status === 'marked' ? (
                        <>
                          <p className="text-xs text-blue-700 font-medium">
                            Marked — awaiting publish
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Submitted {formatDate(attempt.submitted_at)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-yellow-700 font-medium">
                            Awaiting Marking
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Theory:{' '}
                            {attempt.theory_percent
                              ? `${Number(
                                  attempt.theory_percent
                                ).toFixed(2)}%`
                              : '—'}{' '}
                            · Practical pending
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Submitted {formatDate(attempt.submitted_at)}
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Action */}
                  {attempted ? (
                    <Link
                      to={`/candidate/exams/${exam.id}/result`}
                      className="block"
                    >
                      <Button variant="outline" fullWidth>
                        View Result
                      </Button>
                    </Link>
                  ) : (
                    <Link
                      to={`/candidate/exams/${exam.id}`}
                      className="block"
                    >
                      <Button fullWidth>Start Exam</Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {filtered.length > 0 && (
        <p className="text-center text-xs text-gray-500 pt-2">
          Showing {filtered.length} of {exams.length} exam
          {exams.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default CandidateExams;