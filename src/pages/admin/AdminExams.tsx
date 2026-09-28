import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { courseApi, examApi } from '../../api/api';
import type { ApiCourse, ApiExam, ApiExamSection } from '../../api/api';

// ============================================================
// Icons
// ============================================================
const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
  </svg>
);

// ============================================================
// Types
// ============================================================
type StatusFilter = 'all' | ApiExam['status'];

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => Promise<void> | void;
}

// ============================================================
// Component
// ============================================================
const AdminExams: React.FC = () => {
  const navigate = useNavigate();

  const [exams, setExams] = useState<ApiExam[]>([]);
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [isActing, setIsActing] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);

  // ============================================================
  // Load
  // ============================================================
  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [examsRes, coursesRes] = await Promise.all([
        examApi.list(),
        courseApi.list(),
      ]);

      if (examsRes.success && Array.isArray(examsRes.data)) {
        setExams(examsRes.data as ApiExam[]);
      } else {
        setExams([]);
        setError(examsRes.message || 'Could not load exams.');
      }

      if (coursesRes.success && Array.isArray(coursesRes.data)) {
        setCourses(coursesRes.data as ApiCourse[]);
      }
    } catch (err) {
      console.error('Exams load error:', err);
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
  // Create — opens a modal, does NOT default to courses[0]
  // ============================================================
  const openCreate = () => {
    if (courses.length === 0) {
      setError('Create a course first before creating exams.');
      return;
    }
    setError('');
    setShowCreate(true);
  };

  // ============================================================
  // Publish / Close / Delete
  // ============================================================
  const doPublish = async (exam: ApiExam) => {
    setIsActing(true);
    try {
      const res = await examApi.publish(exam.id);
      if (res.success) {
        flashMessage(`"${exam.title}" published.`);
        await load();
      } else {
        setError(res.message || 'Could not publish.');
      }
    } catch (err) {
      console.error('Publish error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsActing(false);
    }
  };

  const doClose = async (exam: ApiExam) => {
    setIsActing(true);
    try {
      const res = await examApi.close(exam.id);
      if (res.success) {
        flashMessage(`"${exam.title}" closed.`);
        await load();
      } else {
        setError(res.message || 'Could not close.');
      }
    } catch (err) {
      console.error('Close error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsActing(false);
    }
  };

  const doDelete = async (exam: ApiExam) => {
    setIsActing(true);
    try {
      const res = await examApi.remove(exam.id);
      if (res.success) {
        flashMessage(`"${exam.title}" deleted.`);
        await load();
      } else {
        setError(res.message || 'Could not delete exam.');
      }
    } catch (err) {
      console.error('Delete exam error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsActing(false);
    }
  };

  // ---------- Ask helpers ----------
  const askPublish = (exam: ApiExam) => {
    setConfirmState({
      title: 'Publish exam',
      message: `Publish "${exam.title}"? Candidates will be able to see and take it.`,
      confirmLabel: 'Publish',
      confirmClass: 'bg-black hover:bg-gray-800',
      onConfirm: () => doPublish(exam),
    });
  };

  const askClose = (exam: ApiExam) => {
    setConfirmState({
      title: 'Close exam',
      message: `Close "${exam.title}"? No further attempts will be accepted.`,
      confirmLabel: 'Close',
      confirmClass: 'bg-gray-700 hover:bg-gray-800',
      onConfirm: () => doClose(exam),
    });
  };

  const askDelete = (exam: ApiExam) => {
    setConfirmState({
      title: 'Delete exam',
      message: `Permanently delete "${exam.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      onConfirm: () => doDelete(exam),
    });
  };

  const handleConfirm = async () => {
    if (!confirmState) return;
    setIsConfirming(true);
    try {
      await confirmState.onConfirm();
    } finally {
      setIsConfirming(false);
      setConfirmState(null);
    }
  };

  // ============================================================
  // Counters — safe against undefined questions
  // ============================================================
  const sectionQuestionsCount = (section: ApiExamSection): number => {
    if (Array.isArray(section.questions)) {
      return section.questions.length;
    }
    return 0;
  };

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
  // Filter + search
  // ============================================================
  const filtered = useMemo(() => {
    let list = [...exams];

    if (statusFilter !== 'all') {
      list = list.filter((e) => e.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        `${e.title} ${e.courseTitle} ${e.year}`.toLowerCase().includes(q)
      );
    }

    list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return list;
  }, [exams, statusFilter, search]);

  const counts = {
    all: exams.length,
    draft: exams.filter((e) => e.status === 'draft').length,
    published: exams.filter((e) => e.status === 'published').length,
    closed: exams.filter((e) => e.status === 'closed').length,
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      {flash && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckIcon />
          {flash}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Exams</h1>
          <p className="text-gray-600">Create, publish and manage exams</p>
        </div>
        <Button onClick={openCreate}>
          + Create Exam
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: 'all' as const, label: 'All' },
                { key: 'draft' as const, label: 'Draft' },
                { key: 'published' as const, label: 'Published' },
                { key: 'closed' as const, label: 'Closed' },
              ]
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
                  ${
                    statusFilter === f.key
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                  }
                `}
              >
                {f.label}
                <span
                  className={`ml-2 text-xs ${
                    statusFilter === f.key ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  {counts[f.key]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 lg:max-w-sm lg:ml-auto">
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

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-48 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-32 mb-6" />
              <div className="grid grid-cols-4 gap-2 mb-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-14 bg-gray-100 rounded-lg" />
                ))}
              </div>
              <div className="h-8 bg-gray-200 rounded w-40 ml-auto" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-4">
            {exams.length === 0
              ? 'No exams created yet.'
              : 'No exams match your filters.'}
          </p>
          {exams.length === 0 ? (
            <Button onClick={openCreate}>Create your first exam</Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('all');
                setSearch('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((exam) => {
            const qCount = totalQuestions(exam);
            const pCount = totalPoints(exam);
            const hasQuestions = qCount > 0;

            return (
              <Card key={exam.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
                      {exam.title || 'Untitled Exam'}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {exam.courseTitle || 'No course'} • {exam.year}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                      exam.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : exam.status === 'closed'
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {exam.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center mb-4">
                  <div className="bg-gray-50 rounded-lg py-2">
                    <p className="text-base font-bold text-gray-900">
                      {(exam.sections ?? []).length}
                    </p>
                    <p className="text-xs text-gray-500">Sections</p>
                  </div>
                  <div
                    className={`rounded-lg py-2 ${
                      hasQuestions ? 'bg-gray-50' : 'bg-yellow-50'
                    }`}
                  >
                    <p
                      className={`text-base font-bold ${
                        hasQuestions ? 'text-gray-900' : 'text-yellow-700'
                      }`}
                    >
                      {qCount}
                    </p>
                    <p className="text-xs text-gray-500">Questions</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg py-2">
                    <p className="text-base font-bold text-gray-900">
                      {pCount}
                    </p>
                    <p className="text-xs text-gray-500">Points</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg py-2">
                    <p className="text-base font-bold text-gray-900">
                      {exam.durationMinutes}m
                    </p>
                    <p className="text-xs text-gray-500">Duration</p>
                  </div>
                </div>

                {!hasQuestions && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs px-3 py-2 rounded">
                    This exam has no questions yet. Open the builder to add
                    them before publishing.
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 flex-wrap gap-2">
                  <span className="text-xs text-gray-500">
                    Created {new Date(exam.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    {exam.status === 'draft' && (
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() => askPublish(exam)}
                        disabled={isActing || !hasQuestions}
                        title={
                          !hasQuestions
                            ? 'Add questions before publishing'
                            : 'Publish'
                        }
                      >
                        Publish
                      </Button>
                    )}
                    {exam.status === 'published' && (
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() => askClose(exam)}
                        disabled={isActing}
                      >
                        Close
                      </Button>
                    )}
                    <Link to={`/admin/exams/${exam.id}/edit`}>
                      <Button size="small" variant="outline">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => askDelete(exam)}
                      disabled={isActing}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Exam modal */}
      {showCreate && (
        <CreateExamModal
          courses={courses}
          onClose={() => setShowCreate(false)}
          onCreated={(examId) => {
            setShowCreate(false);
            navigate(`/admin/exams/${examId}/edit`);
          }}
        />
      )}

      {/* Confirm modal */}
      {confirmState && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmState.title}
            </h3>
            <p className="text-sm text-gray-600 mb-6">{confirmState.message}</p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                size="small"
                onClick={() => setConfirmState(null)}
                disabled={isConfirming}
              >
                Cancel
              </Button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className={`flex-1 px-4 py-2 rounded text-white text-sm font-medium transition-colors disabled:opacity-50 ${confirmState.confirmClass}`}
              >
                {isConfirming ? 'Working...' : confirmState.confirmLabel}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Create Exam modal — user must pick a course
// ============================================================
interface CreateExamModalProps {
  courses: ApiCourse[];
  onClose: () => void;
  onCreated: (examId: string) => void;
}

const CreateExamModal: React.FC<CreateExamModalProps> = ({
  courses,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(''); // ← empty = nothing preselected
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [durationMinutes, setDurationMinutes] = useState(60);

  const [isSaving, setIsSaving] = useState(false);
  const [err, setErr] = useState('');

  const canSubmit =
    title.trim().length > 0 &&
    courseId.trim().length > 0 &&
    !isSaving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSaving(true);
    setErr('');
    try {
      const res = await examApi.create({
        title: title.trim(),
        courseId,
        year: year.trim(),
        durationMinutes,
        status: 'draft',
      });

      if (res.success && res.data) {
        onCreated((res.data as ApiExam).id);
      } else {
        setErr(res.message || 'Could not create exam.');
      }
    } catch (e) {
      console.error('Create exam error:', e);
      setErr('Could not reach the server.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Create Exam
        </h2>

        {err && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
            {err}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Exam Title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Midterm Theory Exam"
          />

          <div>
            <label className="block text-sm font-medium mb-1">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
            >
              {/* Empty placeholder so nothing is preselected */}
              <option value="" disabled>
                Select a course…
              </option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Year"
              name="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2026"
            />
            <Input
              label="Duration (minutes)"
              name="durationMinutes"
              type="number"
              value={String(durationMinutes)}
              onChange={(e) =>
                setDurationMinutes(Number(e.target.value) || 0)
              }
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            fullWidth
            size="small"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            size="small"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSaving ? 'Creating...' : 'Create Exam'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminExams;