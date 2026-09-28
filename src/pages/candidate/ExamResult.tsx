import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { examApi, attemptApi } from '../../api/api';
import type { ApiExam, ApiAttempt } from '../../api/api';

// ============================================================
// Grade helper
// ============================================================
const gradeFromPct = (pct: number | null): string | null => {
  if (pct === null) return null;
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
};

// ============================================================
// Icons
// ============================================================
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const VideoIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const VideoOffIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// ============================================================
// Component
// ============================================================
const ExamResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<ApiAttempt | null>(null);
  const [exam, setExam] = useState<ApiExam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) {
      navigate('/candidate/exams');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [attemptsRes, examRes] = await Promise.all([
        attemptApi.mine(),
        examApi.get(id),
      ]);

      if (!attemptsRes.success || !Array.isArray(attemptsRes.data)) {
        setError('Could not load your attempts.');
        return;
      }

      const found = (attemptsRes.data as ApiAttempt[]).find(
        (a) => a.examId === id
      );

      if (!found) {
        navigate('/candidate/exams');
        return;
      }

      setAttempt(found);

      if (examRes.success && examRes.data) {
        setExam(examRes.data as ApiExam);
      }
    } catch (err) {
      console.error('ExamResult load error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  // ============================================================
  // Derived
  // ============================================================
  const theoryEarned = attempt ? Number(attempt.theory_earned || 0) : 0;
  const theoryTotal = attempt ? Number(attempt.theory_total || 0) : 0;
  const theoryPercent = attempt?.theory_percent
    ? Number(attempt.theory_percent)
    : theoryTotal > 0
    ? Math.round((theoryEarned / theoryTotal) * 10000) / 100
    : 0;
  const theoryPassed = theoryPercent >= 50;
  const theoryGrade = gradeFromPct(theoryPercent);

  const practicalPercent = attempt?.practical_percent
    ? Number(attempt.practical_percent)
    : null;
  const finalPercent = attempt?.final_percent
    ? Number(attempt.final_percent)
    : null;
  const finalGrade = attempt?.final_grade ?? null;
  const passed = attempt?.passed ?? null;

  const correctCount = useMemo(() => {
    if (!attempt) return 0;
    return (attempt as unknown as { marking_results?: { correct: boolean }[] })
      .marking_results?.filter((r) => r.correct).length ?? 0;
  }, [attempt]);

  const totalMarked = (attempt as unknown as { marking_results?: unknown[] })
    ?.marking_results?.length ?? 0;
  const wrongCount = Math.max(0, totalMarked - correctCount);

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  // ============================================================
  // Guards
  // ============================================================
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-12 text-center text-gray-400">
          Loading result...
        </Card>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card className="p-8 text-center">
          <p className="text-red-600 mb-4">
            {error || 'Result not found.'}
          </p>
          <Button onClick={() => navigate('/candidate/exams')}>
            Back to Exams
          </Button>
        </Card>
      </div>
    );
  }

  const isPending = attempt.status === 'pending';
  const isMarked = attempt.status === 'marked';
  const isPublished = attempt.status === 'published';

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Hero card */}
      <Card className="overflow-hidden">
        <div
          className={`p-8 text-center text-white ${
            isPending
              ? 'bg-yellow-600'
              : isMarked
              ? 'bg-blue-600'
              : passed
              ? 'bg-green-600'
              : 'bg-red-600'
          }`}
        >
          <div
            className={`w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4 ${
              passed ? 'animate-bounce' : ''
            }`}
          >
            {isPending || isMarked ? (
              <ClockIcon className="w-10 h-10" />
            ) : passed ? (
              <CheckCircleIcon className="w-10 h-10" />
            ) : (
              <XCircleIcon className="w-10 h-10" />
            )}
          </div>

          <h1 className="text-2xl font-bold mb-1">
            {isPending
              ? 'Awaiting Marking'
              : isMarked
              ? 'Marked — Awaiting Publish'
              : passed
              ? 'Congratulations!'
              : 'Keep Practicing'}
          </h1>
          <p className="text-sm opacity-90 mb-6">
            {isPending
              ? 'The admin is reviewing your answers.'
              : isMarked
              ? 'Your practical has been marked. The result will be published shortly.'
              : passed
              ? 'You have passed this examination.'
              : 'You did not reach the passing threshold (50%).'}
          </p>

          <div className="inline-block bg-white/20 rounded-2xl px-8 py-4">
            <p className="text-5xl font-bold">
              {isPublished && finalPercent !== null
                ? `${finalPercent.toFixed(2)}%`
                : `${theoryPercent.toFixed(2)}%`}
            </p>
            <p className="text-xs uppercase tracking-widest mt-1 opacity-90">
              {isPublished && finalPercent !== null
                ? 'Final Score'
                : 'Theory Score'}
            </p>
          </div>
        </div>

        <div className="p-6">
          <h2 className="font-semibold text-gray-900 mb-1">
            {attempt.examTitle}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {attempt.courseTitle} • Submitted{' '}
            {formatDate(attempt.submitted_at)}
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {theoryEarned.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Points Earned</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {theoryTotal.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Total Points</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {correctCount}
              </p>
              <p className="text-xs text-gray-500">Correct</p>
            </div>
          </div>

          {attempt.auto_submitted && (
            <div className="mt-4 bg-orange-50 border border-orange-200 text-orange-700 text-xs px-3 py-2 rounded flex items-center gap-2">
              <ClockIcon className="w-4 h-4 shrink-0" />
              <span>
                {attempt.auto_submit_reason ||
                  'Your exam was submitted automatically.'}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ============================================================
          VIDEO — always rendered when present
      ============================================================ */}
      {attempt.sessionVideo ? (
        <Card className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                <VideoIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 mb-0.5">
                  Exam Session Recording
                </h2>
                <p className="text-xs text-gray-500">
                  The video captured automatically while you took the exam.
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                REC
              </span>
            </div>

            <div className="bg-black rounded-lg overflow-hidden">
              <video
                src={attempt.sessionVideo}
                controls
                autoPlay
                muted
                loop
                playsInline
                controlsList="nodownload"
                className="w-full max-h-[420px] bg-black"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            <p className="text-[11px] text-gray-400 mt-3 text-center">
              This recording is stored with your attempt for verification.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
              <VideoOffIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                No session recording
              </p>
              <p className="text-xs text-gray-500">
                No video was captured for this exam session (camera was
                unavailable or denied).
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Theory summary */}
      <Card className="p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          Theory Examination Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {theoryEarned.toFixed(0)}/{theoryTotal.toFixed(0)}
            </p>
            <p className="text-xs text-gray-600 mt-1">Points Scored</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {correctCount}
            </p>
            <p className="text-xs text-gray-600 mt-1">Correct Answers</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{wrongCount}</p>
            <p className="text-xs text-gray-600 mt-1">Incorrect Answers</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Theory Progress
            </span>
            <span className="text-sm font-bold text-gray-900">
              {theoryPercent.toFixed(2)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                theoryPassed ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, theoryPercent)}%` }}
            />
          </div>
        </div>

        {theoryGrade && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="text-xs text-gray-500">Theory Grade:</span>
            <span className="text-3xl font-bold text-gray-900">
              {theoryGrade}
            </span>
          </div>
        )}
      </Card>

      {/* Weighted summary (published only) */}
      {isPublished && (
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Final Result Breakdown
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {theoryPercent.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Theory (50%)</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {practicalPercent !== null
                  ? `${practicalPercent.toFixed(2)}%`
                  : '—'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Practical (50%)
              </p>
            </div>
            <div
              className={`rounded-lg p-4 text-center ${
                passed ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <p
                className={`text-2xl font-bold ${
                  passed ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {finalPercent !== null
                  ? `${finalPercent.toFixed(2)}%`
                  : '—'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Final{finalGrade ? ` (${finalGrade})` : ''}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Section breakdown */}
      {exam && exam.sections.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Section Breakdown
          </h2>
          <div className="space-y-4">
            {exam.sections.map((section) => {
              const total = section.questions?.length ?? 0;
              return (
                <div key={section.id}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {section.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {total} question{total !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-black"
                      style={{ width: total > 0 ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/candidate/exams" className="flex-1">
          <Button variant="secondary" fullWidth>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Exams
          </Button>
        </Link>
        <Link to="/dashboard" className="flex-1">
          <Button fullWidth>Go to Dashboard</Button>
        </Link>
      </div>

      <p className="text-center text-xs text-gray-500">
        Note: individual correct answers are not displayed. Contact your
        tutor for a detailed review.
      </p>
    </div>
  );
};

export default ExamResult;