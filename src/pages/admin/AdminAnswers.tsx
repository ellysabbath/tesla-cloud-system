import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiClock,
  FiVideo,
  FiVideoOff,
  FiCheck,
  FiX,
} from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { attemptApi } from '../../api/api';
import type {
  ApiAttempt,
  ApiAttemptReview,
  ApiExamQuestion,
  ApiExamSection,
} from '../../api/api';

// ============================================================
// Constants
// ============================================================
type FilterKey = 'all' | 'pending' | 'marked' | 'published';

const THEORY_WEIGHT = 50;
const PRACTICAL_WEIGHT = 50;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'marked', label: 'Marked' },
  { key: 'published', label: 'Published' },
];

// ============================================================
// Pills
// ============================================================
const statusPill: Record<ApiAttempt['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  marked: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
};

const gradePill: Record<string, string> = {
  A: 'bg-green-100 text-green-700',
  'B+': 'bg-green-100 text-green-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-orange-100 text-orange-700',
  F: 'bg-red-100 text-red-700',
};

// ============================================================
// Helpers
// ============================================================
const formatDateTime = (d: string | null): string =>
  d
    ? new Date(d).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const formatPercent = (v: string | number | null | undefined): string =>
  v === null || v === undefined || v === ''
    ? '—'
    : `${Number(v).toFixed(2)}%`;

const letterOf = (i: number) => String.fromCharCode(65 + i);

// ============================================================
// Main component
// ============================================================
const AdminAnswers: React.FC = () => {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [attempts, setAttempts] = useState<ApiAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await attemptApi.adminList();
      if (res.success && Array.isArray(res.data)) {
        setAttempts(res.data as ApiAttempt[]);
      } else {
        setAttempts([]);
        setError(res.message || 'Could not load submissions.');
      }
    } catch (err) {
      console.error('AdminAnswers load error:', err);
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

  const filtered = useMemo(() => {
    let list = [...attempts];

    if (filter !== 'all') {
      list = list.filter((a) => a.status === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        `${a.studentName} ${a.studentUsername} ${a.examTitle} ${a.courseTitle}`
          .toLowerCase()
          .includes(q)
      );
    }

    list.sort(
      (a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );

    return list;
  }, [attempts, filter, search]);

  const counts = useMemo(
    () => ({
      all: attempts.length,
      pending: attempts.filter((a) => a.status === 'pending').length,
      marked: attempts.filter((a) => a.status === 'marked').length,
      published: attempts.filter((a) => a.status === 'published').length,
    }),
    [attempts]
  );

  const passRate = useMemo(() => {
    if (attempts.length === 0) return '—';
    const passed = attempts.filter((a) => a.passed === true).length;
    return `${Math.round((passed / attempts.length) * 100)}%`;
  }, [attempts]);

  const handleSavePractical = async (
    attemptId: string,
    score: number,
    max: number
  ) => {
    setIsActing(true);
    try {
      const res = await attemptApi.markPractical(attemptId, {
        practicalScore: score,
        practicalMax: max,
      });
      if (res.success) {
        flashMessage('Practical marks saved.');
        await load();
      } else {
        flashMessage(res.message || 'Could not save practical.');
      }
    } catch (err) {
      console.error('Mark practical error:', err);
      flashMessage('Could not reach the server.');
    } finally {
      setIsActing(false);
    }
  };

  const handlePublish = async (attemptId: string) => {
    setIsActing(true);
    try {
      const res = await attemptApi.publish(attemptId);
      if (res.success) {
        flashMessage('Result published.');
        await load();
      } else {
        flashMessage(res.message || 'Could not publish.');
      }
    } catch (err) {
      console.error('Publish error:', err);
      flashMessage('Could not reach the server.');
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="space-y-6">
      {flash && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg">
          {flash}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Answers &amp; Marking
        </h1>
        <p className="text-gray-600">
          Theory weighted at {THEORY_WEIGHT}%, practical at{' '}
          {PRACTICAL_WEIGHT}% — final = theory% + practical%.
        </p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </Card>
      )}

      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
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
                  {counts[f.key]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 md:max-w-sm md:ml-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, exam, or course..."
              className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-12 text-center text-gray-400">
          Loading submissions...
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-1">
            {attempts.length === 0
              ? 'No submissions yet.'
              : 'No submissions match your filters.'}
          </p>
          <p className="text-sm text-gray-500">
            {attempts.length === 0
              ? 'Candidates will appear here once they take an exam.'
              : 'Try a different filter or search term.'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3">Exam / Course</th>
                  <th className="text-left px-4 py-3">Submitted</th>
                  <th className="text-center px-4 py-3">Theory %</th>
                  <th className="text-center px-4 py-3">Practical %</th>
                  <th className="text-center px-4 py-3">Final %</th>
                  <th className="text-center px-4 py-3">Grade</th>
                  <th className="text-center px-4 py-3">Video</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, idx) => (
                  <tr
                    key={a.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {idx + 1}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                          {a.studentName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {a.studentName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {a.studentUsername}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-gray-900 truncate max-w-[240px]">
                        {a.examTitle}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {a.courseTitle}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      <div className="text-xs">
                        {formatDateTime(a.submitted_at)}
                      </div>
                      {a.auto_submitted && (
                        <div className="text-[10px] text-orange-600 mt-0.5 flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          Auto-submitted
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <p className="font-semibold text-gray-900">
                        {formatPercent(a.theory_percent)}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {a.practical_percent ? (
                        <p className="font-semibold text-gray-900">
                          {formatPercent(a.practical_percent)}
                        </p>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {a.final_percent ? (
                        <p
                          className={`text-lg font-bold ${
                            a.passed ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatPercent(a.final_percent)}
                        </p>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {a.final_grade ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                            gradePill[a.final_grade] ??
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {a.final_grade}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {a.sessionVideo ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full"
                          title="Video recording available"
                        >
                          <FiVideo className="w-3 h-3" />
                          REC
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusPill[a.status]}`}
                      >
                        {a.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Button
                        size="small"
                        variant={
                          a.status === 'pending' ? 'primary' : 'outline'
                        }
                        onClick={() => setReviewingId(a.id)}
                      >
                        {a.status === 'pending' ? 'Review' : 'Open'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing <strong>{filtered.length}</strong> of{' '}
              <strong>{attempts.length}</strong> submissions
            </span>
            <span>
              Pass rate:{' '}
              <strong className="text-gray-700">{passRate}</strong>
            </span>
          </div>
        </Card>
      )}

      {reviewingId && (
        <ReviewModal
          attemptId={reviewingId}
          isActing={isActing}
          onClose={() => setReviewingId(null)}
          onSavePractical={handleSavePractical}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
};

// ============================================================
// Review modal
// ============================================================
interface ReviewModalProps {
  attemptId: string;
  isActing: boolean;
  onClose: () => void;
  onSavePractical: (attemptId: string, score: number, max: number) => void;
  onPublish: (attemptId: string) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  attemptId,
  isActing,
  onClose,
  onSavePractical,
  onPublish,
}) => {
  const [review, setReview] = useState<ApiAttemptReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [scoreInput, setScoreInput] = useState('');
  const [maxInput, setMaxInput] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const res = await attemptApi.adminReview(attemptId);
        if (cancelled) return;
        if (res.success && res.data) {
          const r = res.data as ApiAttemptReview;
          setReview(r);
          setScoreInput(r.practical_score ? String(r.practical_score) : '');
          setMaxInput(r.practical_max ? String(r.practical_max) : '');
        } else {
          setLoadError(res.message || 'Could not load attempt.');
        }
      } catch (err) {
        console.error('Review load error:', err);
        if (!cancelled) setLoadError('Could not reach the server.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  const theoryPercent = review?.theory_percent
    ? Number(review.theory_percent)
    : 0;

  const preview = useMemo(() => {
    const s = Number(scoreInput);
    const m = Number(maxInput);
    if (Number.isNaN(s) || Number.isNaN(m) || m <= 0) return null;
    const practical = (s / m) * PRACTICAL_WEIGHT;
    const final = (theoryPercent * THEORY_WEIGHT) / 100 + practical;
    return {
      practicalPercent: practical,
      finalPercent: Math.min(100, final),
    };
  }, [scoreInput, maxInput, theoryPercent]);

  const sections: ApiExamSection[] = useMemo(
    () => review?.exam?.sections ?? [],
    [review]
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-4xl w-full my-4 max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-5 py-3 border-b border-gray-200 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">
              {review?.examTitle || 'Review attempt'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {review?.courseTitle || ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading && (
            <div className="p-12 text-center text-gray-400">
              Loading attempt...
            </div>
          )}

          {loadError && !isLoading && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {loadError}
            </div>
          )}

          {review && !isLoading && (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                  {review.studentName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {review.studentName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {review.studentUsername}
                  </p>
                </div>
                <span
                  className={`ml-auto inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusPill[review.status]}`}
                >
                  {review.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {theoryPercent.toFixed(2)}%
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">Theory</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {formatPercent(review.practical_percent)}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Practical
                  </p>
                </div>
                <div
                  className={`rounded-lg p-3 text-center ${
                    review.passed === null
                      ? 'bg-gray-50'
                      : review.passed
                      ? 'bg-green-50'
                      : 'bg-red-50'
                  }`}
                >
                  <p
                    className={`text-lg font-bold ${
                      review.passed === null
                        ? 'text-gray-400'
                        : review.passed
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatPercent(review.final_percent)}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">Final</p>
                </div>
              </div>

              {review.sessionVideo ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Exam Session Recording
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      REC
                    </span>
                  </div>
                  <div className="bg-black rounded-lg overflow-hidden">
                    <video
                      src={review.sessionVideo}
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                      controlsList="nodownload"
                      className="w-full max-h-[280px] bg-black"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center shrink-0">
                    <FiVideoOff className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-gray-500">
                    No session recording was captured.
                  </p>
                </div>
              )}

              {sections.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">
                    Question Breakdown
                  </h3>

                  <div className="space-y-6">
                    {sections.map((section, sIdx) => {
                      const questions = section.questions ?? [];

                      const questionsBefore = sections
                        .slice(0, sIdx)
                        .reduce(
                          (sum, s) =>
                            sum + (s.questions?.length ?? 0),
                          0
                        );

                      const sectionCorrect = questions.filter((q) =>
                        review.marking_results.find(
                          (m) => m.questionId === q.id
                        )?.correct
                      ).length;

                      return (
                        <div key={section.id ?? sIdx}>
                          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {section.title}
                              </p>
                              {section.instructions && (
                                <p className="text-[11px] text-gray-500">
                                  {section.instructions}
                                </p>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-500">
                              {sectionCorrect}/{questions.length} correct
                            </span>
                          </div>

                          {questions.length === 0 ? (
                            <p className="text-[11px] text-gray-400 italic">
                              No questions in this section.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {questions.map((q, qIdx) => {
                                const questionNumber =
                                  questionsBefore + qIdx + 1;

                                const marked =
                                  review.marking_results.find(
                                    (m) => m.questionId === q.id
                                  );
                                const ans = review.answers.find(
                                  (a) => a.questionId === q.id
                                );
                                const matches =
                                  review.matching_answers.filter(
                                    (m) => m.questionId === q.id
                                  );

                                return (
                                  <QuestionReviewRow
                                    key={q.id}
                                    number={questionNumber}
                                    question={q}
                                    answer={ans}
                                    matchingAnswers={matches}
                                    isCorrect={marked?.correct ?? false}
                                    awarded={Number(marked?.awarded ?? 0)}
                                    maxPoints={Number(
                                      marked?.max_points ??
                                        section.points_per_question ??
                                        0
                                    )}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {review.status !== 'published' && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">Practical Marks</p>
                  <p className="text-[11px] text-gray-500 mb-3">
                    Theory contributes {THEORY_WEIGHT}%, practical{' '}
                    {PRACTICAL_WEIGHT}%.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={scoreInput}
                        onChange={(e) => setScoreInput(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="e.g. 18"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        Max
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={maxInput}
                        onChange={(e) => setMaxInput(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="e.g. 20"
                      />
                    </div>
                  </div>

                  {preview && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-[11px] mb-3">
                      <p className="text-blue-900 font-medium mb-0.5">
                        Live Preview
                      </p>
                      <p className="text-blue-800">
                        Theory: {theoryPercent.toFixed(2)}% ×{' '}
                        {THEORY_WEIGHT}% ={' '}
                        <strong>
                          {(
                            (theoryPercent * THEORY_WEIGHT) /
                            100
                          ).toFixed(2)}
                          %
                        </strong>
                      </p>
                      <p className="text-blue-800">
                        Practical: ({scoreInput}/{maxInput}) ×{' '}
                        {PRACTICAL_WEIGHT}% ={' '}
                        <strong>
                          {preview.practicalPercent.toFixed(2)}%
                        </strong>
                      </p>
                      <p className="text-blue-900 font-bold mt-0.5">
                        Final: {preview.finalPercent.toFixed(2)}%
                      </p>
                    </div>
                  )}

                  <Button
                    size="small"
                    disabled={isActing}
                    onClick={() => {
                      const s = Number(scoreInput);
                      const m = Number(maxInput);
                      if (
                        !Number.isNaN(s) &&
                        !Number.isNaN(m) &&
                        s >= 0 &&
                        m > 0
                      ) {
                        onSavePractical(review.id, s, m);
                      }
                    }}
                  >
                    {isActing ? 'Saving...' : 'Save Practical Marks'}
                  </Button>
                </div>
              )}

              {review.status === 'published' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-[12px] text-green-800 flex items-center gap-2">
                  <FiCheck className="w-4 h-4 shrink-0" />
                  This result has been published. The candidate can see their
                  final grade.
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 px-5 py-3 border-t border-gray-200 bg-white shrink-0">
          <Button variant="secondary" fullWidth size="small" onClick={onClose}>
            Close
          </Button>
          {review && review.status !== 'published' && (
            <Button
              fullWidth
              size="small"
              disabled={isActing}
              onClick={() => onPublish(review.id)}
            >
              {isActing ? 'Publishing...' : 'Publish Result'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

// ============================================================
// Per-question row — index-based matching
// ============================================================
interface QuestionRowProps {
  number: number;
  question: ApiExamQuestion;
  answer?: {
    selectedOptionId: string | null;
    boolean_answer: boolean | null;
    text_answer: string | null;
  };
  matchingAnswers: {
    a_index: number;
    b_index: number | null;
    is_correct: boolean | null;
  }[];
  isCorrect: boolean;
  awarded: number;
  maxPoints: number;
}

const QuestionReviewRow: React.FC<QuestionRowProps> = ({
  number,
  question,
  answer,
  matchingAnswers,
  isCorrect,
  awarded,
  maxPoints,
}) => {
  const renderStudentAnswer = () => {
    if (question.type === 'multiple-choice') {
      if (!answer?.selectedOptionId) {
        return <em className="text-gray-400">No answer</em>;
      }
      const idx = question.options.findIndex(
        (o) => o.id === answer.selectedOptionId
      );
      if (idx === -1)
        return <em className="text-gray-400">Unknown option</em>;
      return (
        <>
          <strong>{letterOf(idx).toLowerCase()})</strong>{' '}
          {question.options[idx].option_text || '(empty)'}
        </>
      );
    }

    if (question.type === 'true-false') {
      if (
        answer?.boolean_answer === null ||
        answer?.boolean_answer === undefined
      ) {
        return <em className="text-gray-400">No answer</em>;
      }
      return <>{answer.boolean_answer ? 'True' : 'False'}</>;
    }

    if (question.type === 'matching') {
      if (matchingAnswers.length === 0) {
        return <em className="text-gray-400">No answer</em>;
      }

      const sorted = [...matchingAnswers].sort(
        (x, y) => x.a_index - y.a_index
      );

      return (
        <ul className="space-y-0.5">
          {sorted.map((m) => (
            <li key={m.a_index}>
              <strong>{m.a_index + 1}.</strong> →{' '}
              {m.b_index !== null ? letterOf(m.b_index) : '—'}
            </li>
          ))}
        </ul>
      );
    }

    if (question.type === 'fill-blank') {
      return answer?.text_answer ? (
        <>{answer.text_answer}</>
      ) : (
        <em className="text-gray-400">No answer</em>
      );
    }

    return null;
  };

  const renderCorrectAnswer = () => {
    if (question.type === 'multiple-choice') {
      const idx = question.options.findIndex((o) => o.is_correct);
      if (idx === -1) return <em className="text-gray-400">—</em>;
      return (
        <>
          <strong>{letterOf(idx).toLowerCase()})</strong>{' '}
          {question.options[idx].option_text || '(empty)'}
        </>
      );
    }

    if (question.type === 'true-false') {
      return <>{question.boolean === true ? 'True' : 'False'}</>;
    }

    if (question.type === 'matching') {
      const entries = Object.entries(question.correct_matches ?? {});
      if (entries.length === 0)
        return <em className="text-gray-400">—</em>;

      const sorted = entries
        .map(([aKey, bKey]) => ({
          aIdx: Number(aKey),
          bIdx: Number(bKey),
        }))
        .filter(
          (p) => !Number.isNaN(p.aIdx) && !Number.isNaN(p.bIdx)
        )
        .sort((x, y) => x.aIdx - y.aIdx);

      return (
        <ul className="space-y-0.5">
          {sorted.map(({ aIdx, bIdx }) => (
            <li key={aIdx}>
              <strong>{aIdx + 1}.</strong> → {letterOf(bIdx)}
            </li>
          ))}
        </ul>
      );
    }

    if (question.type === 'fill-blank') {
      const blanks = question.fill_blank ?? [];
      const primary =
        blanks.find((f) => f.is_primary)?.answer_text ?? '—';
      const alternatives = blanks
        .filter((f) => !f.is_primary)
        .map((f) => f.answer_text);

      return (
        <>
          {primary}
          {alternatives.length > 0 && (
            <span className="text-[10px] text-gray-500">
              {' '}
              (also: {alternatives.join(', ')})
            </span>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <div
      className={`border rounded-lg px-3 py-2 ${
        isCorrect
          ? 'border-green-200 bg-green-50/50'
          : 'border-red-200 bg-red-50/50'
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white ${
            isCorrect ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {isCorrect ? (
            <FiCheck className="w-3.5 h-3.5" strokeWidth={3} />
          ) : (
            <FiX className="w-3.5 h-3.5" strokeWidth={3} />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <p className="text-[13px] text-gray-900">
              <strong className="text-gray-500">Q{number}.</strong>{' '}
              {question.text || (
                <em className="text-gray-400">
                  {question.type === 'matching'
                    ? 'Match the items in Column A with Column B.'
                    : '(no text)'}
                </em>
              )}
            </p>
            <span className="text-[11px] font-semibold text-gray-600 shrink-0">
              {awarded}/{maxPoints}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white border border-gray-200 rounded px-2 py-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                Student
              </p>
              <div className="text-gray-800">
                {renderStudentAnswer()}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded px-2 py-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                Correct
              </p>
              <div className="text-gray-800">
                {renderCorrectAnswer()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnswers;