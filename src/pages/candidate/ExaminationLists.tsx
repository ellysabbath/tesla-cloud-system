import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { loadExams } from '../../data/examBuilderData';
import { loadResults, getCurrentStudent } from '../../data/examResultsData';
import type { AdminExamDraft } from '../../types/admin';
import type { StoredResult } from '../../data/examResultsData';

// ============================================================
// Weighted scoring constants — matches AdminAnswers + Dashboard
// ============================================================
const THEORY_WEIGHT = 50;
const PRACTICAL_WEIGHT = 50;

interface Override {
  practicalScore: number;
  practicalMax: number;
  markedAt: string;
  published: boolean;
}
type OverrideMap = Record<string, Override>;

const OVERRIDES_KEY = 'tci_answer_overrides';

const loadOverrides = (): OverrideMap => {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as OverrideMap) : {};
  } catch {
    return {};
  }
};

const gradeFromPct = (pct: number | null): string | null => {
  if (pct === null) return null;
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
};

interface WeightedResult {
  theoryPercent: number;
  practicalPercent: number | null;
  finalPercentage: number | null;
  finalPassed: boolean | null;
  grade: string | null;
}

const computeWeighted = (
  autoEarned: number,
  totalPoints: number,
  practicalScore: number | null,
  practicalMax: number | null
): WeightedResult => {
  const theoryPercent =
    totalPoints > 0
      ? Math.min(THEORY_WEIGHT, (autoEarned / totalPoints) * THEORY_WEIGHT)
      : 0;

  if (
    practicalScore === null ||
    practicalMax === null ||
    practicalMax <= 0
  ) {
    return {
      theoryPercent: Math.round(theoryPercent * 100) / 100,
      practicalPercent: null,
      finalPercentage: null,
      finalPassed: null,
      grade: null,
    };
  }

  const practicalPercent = Math.min(
    PRACTICAL_WEIGHT,
    (practicalScore / practicalMax) * PRACTICAL_WEIGHT
  );
  const rawFinal = theoryPercent + practicalPercent;
  const finalPercentage = Math.min(100, Math.round(rawFinal * 100) / 100);

  return {
    theoryPercent: Math.round(theoryPercent * 100) / 100,
    practicalPercent: Math.round(practicalPercent * 100) / 100,
    finalPercentage,
    finalPassed: finalPercentage >= 50,
    grade: gradeFromPct(finalPercentage),
  };
};

// ============================================================
// Filter type
// ============================================================
type FilterKey = 'all' | 'available' | 'submitted' | 'completed';

// ============================================================
// Main component
// ============================================================
const ExaminationLists: React.FC = () => {
  const [exams, setExams] = useState<AdminExamDraft[]>([]);
  const [myResults, setMyResults] = useState<StoredResult[]>([]);
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  const student = useMemo(() => getCurrentStudent(), []);

  // ---------- Load: ONLY published exams ----------
  useEffect(() => {
    const published = loadExams().filter((e) => e.status === 'published');
    setExams(published);

    const mine = loadResults().filter(
      (r) => r.studentUsername === student.username
    );
    setMyResults(mine);
    setOverrides(loadOverrides());
  }, [student.username]);

  // ---------- Helpers ----------
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const getResultFor = (examId: string) =>
    myResults.find((r) => r.examId === examId);

  const getOverrideFor = (resultId: string) => overrides[resultId];

  const isAttempted = (examId: string) => Boolean(getResultFor(examId));

  const isMarked = (examId: string) => {
    const r = getResultFor(examId);
    if (!r) return false;
    return Boolean(overrides[r.id]);
  };

  const totalQuestions = (exam: AdminExamDraft) =>
    exam.sections.reduce((s, sec) => s + sec.questions.length, 0);

  // ---------- Categorise ----------
  // Available  = not attempted yet
  // Submitted  = attempted but admin hasn't marked
  // Completed  = attempted AND admin has marked
  const availableExams = exams.filter((e) => !isAttempted(e.id));
  const submittedExams = exams.filter(
    (e) => isAttempted(e.id) && !isMarked(e.id)
  );
  const completedExams = exams.filter((e) => isMarked(e.id));

  // ---------- Filter + search ----------
  const visible = useMemo(() => {
    let list = [...exams];

    if (filter === 'available') list = availableExams;
    else if (filter === 'submitted') list = submittedExams;
    else if (filter === 'completed') list = completedExams;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        `${e.title} ${e.courseName} ${e.year}`.toLowerCase().includes(q)
      );
    }

    return list;
  }, [
    exams,
    filter,
    search,
    availableExams,
    submittedExams,
    completedExams,
  ]);

  const counts = {
    all: exams.length,
    available: availableExams.length,
    submitted: submittedExams.length,
    completed: completedExams.length,
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      {/* ---------- Header ---------- */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Examination Lists
        </h1>
        <p className="text-gray-600">
          Welcome, {student.name}. All published examinations are listed
          below — take any you haven't attempted yet.
        </p>
      </div>

      {/* ---------- Summary stats ---------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Published',
            value: counts.all,
            color: 'text-gray-900',
          },
          {
            label: 'Available to Take',
            value: counts.available,
            color: 'text-orange-600',
          },
          {
            label: 'Submitted',
            value: counts.submitted,
            color: 'text-blue-600',
          },
          {
            label: 'Completed',
            value: counts.completed,
            color: 'text-green-600',
          },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* ---------- Filter + Search ---------- */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: 'all' as const, label: 'All' },
                { key: 'available' as const, label: 'Available' },
                { key: 'submitted' as const, label: 'Submitted' },
                { key: 'completed' as const, label: 'Completed' },
              ]
            ).map((f) => (
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

          <div className="flex-1 lg:max-w-sm lg:ml-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, course, or year..."
              className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
      </Card>

      {/* ---------- Empty state ---------- */}
      {visible.length === 0 ? (
        <Card className="p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <p className="text-gray-600 mb-1">
            {exams.length === 0
              ? 'No examinations have been published yet.'
              : 'No examinations match your filters.'}
          </p>
          <p className="text-sm text-gray-500">
            {exams.length === 0
              ? 'Check back later — your tutors will publish exams soon.'
              : 'Try a different filter or search term.'}
          </p>
          {exams.length > 0 && (filter !== 'all' || search.trim()) && (
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
          {visible.map((exam) => {
            const attempted = isAttempted(exam.id);
            const marked = isMarked(exam.id);
            const result = getResultFor(exam.id);
            const ov = result ? getOverrideFor(result.id) : undefined;

            // Compute weighted only when there's a marked result
            const weighted: WeightedResult | null =
              result && ov
                ? computeWeighted(
                    result.report.earnedPoints,
                    result.report.totalPoints,
                    ov.practicalScore,
                    ov.practicalMax
                  )
                : null;

            // Header colour depending on state
            const headerClass = !attempted
              ? 'bg-black'
              : !marked
              ? 'bg-blue-600'
              : 'bg-gray-900';

            return (
              <Card
                key={exam.id}
                className="flex flex-col overflow-hidden"
              >
                {/* ---------- Header strip ---------- */}
                <div className={`p-5 text-white ${headerClass}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                      {exam.courseName || 'General'}
                    </span>

                    {!attempted && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-orange-500 px-2 py-0.5 rounded-full">
                        Available
                      </span>
                    )}
                    {attempted && !marked && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-yellow-500 text-black px-2 py-0.5 rounded-full">
                        Awaiting
                      </span>
                    )}
                    {marked &&
                      weighted !== null &&
                      weighted.finalPassed !== null && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            weighted.finalPassed
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          {weighted.finalPassed ? '✓ Passed' : '✗ Failed'}
                        </span>
                      )}
                  </div>

                  <h3 className="font-semibold text-base leading-snug line-clamp-2">
                    {exam.title || 'Untitled Exam'}
                  </h3>
                  <p className="text-xs text-white/70 mt-1">
                    Year {exam.year}
                  </p>
                </div>

                {/* ---------- Body ---------- */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Meta grid */}
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
                        {exam.sections.length}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500">
                        Sections
                      </p>
                    </div>
                  </div>

                  {/* Section kinds */}
                  <p className="text-xs text-gray-500 mb-4 flex-1">
                    {exam.sections.map((s) => s.kind).join(' • ') || '—'}
                  </p>

                  {/* ---------- Available: Start Exam ---------- */}
                  {!attempted && (
                    <Link
                      to={`/candidate/exams/${exam.id}`}
                      className="block"
                    >
                      <Button fullWidth>Start Exam</Button>
                    </Link>
                  )}

                  {/* ---------- Submitted: waiting for marking ---------- */}
                  {attempted && !marked && result && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
                      <p className="font-semibold text-yellow-800 mb-1">
                        ⏳ Awaiting Marking
                      </p>
                      <p className="text-yellow-700">
                        Submitted {formatDate(result.submittedAt)}
                      </p>
                      <p className="text-yellow-700 mt-1">
                        Theory:{' '}
                        <strong>
                          {(
                            (result.report.earnedPoints /
                              (result.report.totalPoints || 1)) *
                            THEORY_WEIGHT
                          ).toFixed(2)}
                          %
                        </strong>{' '}
                        · Practical pending
                      </p>
                    </div>
                  )}

                  {/* ---------- Completed: show marks ---------- */}
                  {marked && result && ov && weighted && (
                    <CompletedExamInfo
                      exam={exam}
                      result={result}
                      override={ov}
                      weighted={weighted}
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------- Footer ---------- */}
      {visible.length > 0 && (
        <p className="text-center text-xs text-gray-500 pt-2">
          Showing {visible.length} of {exams.length} published examination
          {exams.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

// ============================================================
// Sub-component: completed exam info
// ============================================================
interface CompletedExamInfoProps {
  exam: AdminExamDraft;
  result: StoredResult;
  override: Override;
  weighted: WeightedResult;
}

const CompletedExamInfo: React.FC<CompletedExamInfoProps> = ({
  exam,
  result,
  override,
  weighted,
}) => {
  const passed = weighted.finalPassed === true;

  return (
    <div className="space-y-3">
      {/* Score */}
      <div className="text-center bg-gray-50 rounded-lg py-3">
        <p
          className={`text-3xl font-bold ${
            passed ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {weighted.finalPercentage !== null
            ? `${weighted.finalPercentage.toFixed(2)}%`
            : '—'}
        </p>
        {weighted.grade && (
          <p className="text-xs font-bold text-gray-700 mt-0.5">
            Grade: {weighted.grade}
          </p>
        )}
      </div>

      {/* Breakdown */}
      <div className="space-y-1 text-[11px] text-gray-600">
        <div className="flex items-center justify-between">
          <span>Theory</span>
          <span className="font-semibold">
            {weighted.theoryPercent.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Practical</span>
          <span className="font-semibold">
            {weighted.practicalPercent !== null
              ? `${weighted.practicalPercent.toFixed(2)}%`
              : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[10px] text-gray-400">
          <span>
            ({result.report.earnedPoints}/{result.report.totalPoints}) ×{' '}
            {THEORY_WEIGHT} + ({override.practicalScore}/
            {override.practicalMax}) × {PRACTICAL_WEIGHT}
          </span>
        </div>
      </div>

      <Link to={`/candidate/exams/${exam.id}/result`} className="block">
        <Button variant="outline" fullWidth>
          View Full Result
        </Button>
      </Link>
    </div>
  );
};

export default ExaminationLists;