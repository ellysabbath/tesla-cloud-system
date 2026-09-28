import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { examApi, attemptApi } from '../../api/api';
import type { ApiExam, ApiAttempt } from '../../api/api';

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

// ============================================================
// Component
// ============================================================
const CandidateExams: React.FC = () => {
  const [exams, setExams] = useState<ApiExam[]>([]);
  const [attempts, setAttempts] = useState<ApiAttempt[]>([]);
  const [search, setSearch] = useState('');

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
  const attemptFor = (examId: string): ApiAttempt | undefined =>
    attempts.find((a) => a.examId === examId);

  const isAttempted = (examId: string) => Boolean(attemptFor(examId));

  const sectionQuestionsCount = (section: {
    questions?: unknown[];
  }): number =>
    Array.isArray(section.questions) ? section.questions.length : 0;

  const totalQuestions = (exam: ApiExam): number =>
    (exam.sections ?? []).reduce(
      (sum, s) => sum + sectionQuestionsCount(s),
      0
    );

  const totalPoints = (exam: ApiExam): number =>
    (exam.sections ?? []).reduce((sum, s) => {
      const qCount = sectionQuestionsCount(s);
      const points = Number(s.points_per_question) || 0;
      return sum + qCount * points;
    }, 0);

  // ============================================================
  // Filtered list
  // ============================================================
  const filtered = useMemo(() => {
    if (!search.trim()) return exams;
    const q = search.toLowerCase();
    return exams.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.courseTitle || '').toLowerCase().includes(q)
    );
  }, [exams, search]);

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Available Exams
        </h1>
        <p className="text-gray-600">
          Choose an exam below to begin.
        </p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </Card>
      )}

      {/* Search */}
      <Card className="p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exams by title or course..."
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
        />
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-20 bg-gray-200" />
              <div className="p-5">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-12 bg-gray-100 rounded" />
                  ))}
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                <div className="h-8 bg-gray-200 rounded w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 mb-2">
            {exams.length === 0
              ? 'No published exams yet.'
              : 'No exams match your search.'}
          </p>
          <p className="text-sm text-gray-500">
            {exams.length === 0
              ? 'Check back later — your tutor will publish exams soon.'
              : 'Try a different search term.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((exam) => {
            const attempt = attemptFor(exam.id);
            const attempted = Boolean(attempt);

            return (
              <Card key={exam.id} className="flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-black text-white p-5">
                  <h3 className="font-semibold text-lg mb-1 leading-snug line-clamp-2">
                    {exam.title || 'Untitled Exam'}
                  </h3>
                  <p className="text-xs text-gray-300 truncate">
                    {exam.courseTitle || 'General'} • {exam.year}
                  </p>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {exam.durationMinutes}
                      </p>
                      <p className="text-xs text-gray-500">Minutes</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {totalQuestions(exam)}
                      </p>
                      <p className="text-xs text-gray-500">Questions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {totalPoints(exam)}
                      </p>
                      <p className="text-xs text-gray-500">Points</p>
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="text-xs text-gray-500 mb-4 flex-1">
                    {(exam.sections ?? []).length} section
                    {(exam.sections ?? []).length !== 1 ? 's' : ''}:{' '}
                    {(exam.sections ?? []).map((s) => s.kind).join(', ') ||
                      '—'}
                  </div>

                  {/* Attempt info or Start button */}
                  {attempted && attempt ? (
                    <div className="space-y-2">
                      {attempt.status === 'published' &&
                      attempt.final_percent ? (
                        <div
                          className={`text-center py-2 rounded-lg text-sm font-medium ${
                            attempt.passed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {attempt.passed ? '✓ Passed' : '✗ Failed'} —{' '}
                          {Number(attempt.final_percent).toFixed(2)}%
                          {attempt.final_grade
                            ? ` (${attempt.final_grade})`
                            : ''}
                        </div>
                      ) : attempt.status === 'marked' ? (
                        <div className="text-center py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700">
                          Marked — awaiting publish
                        </div>
                      ) : (
                        <div className="text-center py-2 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-700">
                          Awaiting Marking
                        </div>
                      )}
                      <Link to={`/candidate/exams/${exam.id}/result`}>
                        <Button
                          variant="outline"
                          fullWidth
                          size="small"
                        >
                          View Result
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Link to={`/candidate/exams/${exam.id}`}>
                      <Button fullWidth>Start Exam</Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CandidateExams;