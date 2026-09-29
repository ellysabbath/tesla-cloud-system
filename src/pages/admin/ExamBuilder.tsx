import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SectionEditor from './exam-builder/SectionEditor';
import { courseApi, examApi } from '../../api/api';
import type {
  ApiCourse,
  ApiExam,
  ApiExamSection,
  ExamQuestionPayload,
} from '../../api/api';
import type {
  AdminExamDraft,
  ExamQuestion,
  ExamSection,
  QuestionType,
} from '../../types/admin';

// ============================================================
// Local factories
// ============================================================
const emptyQuestion = (type: QuestionType): ExamQuestion => {
  const base: ExamQuestion = {
    id: crypto.randomUUID(),
    type,
    text: '',
  };

  if (type === 'multiple-choice') {
    base.options = ['', '', '', ''];
    base.correctOptionIndex = 0;
  }

  if (type === 'true-false') {
    base.correctBoolean = true;
  }

  if (type === 'matching') {
    base.columnA = [
      { id: crypto.randomUUID(), text: '' },
      { id: crypto.randomUUID(), text: '' },
    ];
    base.columnB = [
      { id: crypto.randomUUID(), text: '' },
      { id: crypto.randomUUID(), text: '' },
    ];
    // New shape: { aIndex: bIndex } — indices, not UUIDs.
    base.correctMatches = {};
  }

  if (type === 'fill-blank') {
    base.correctText = '';
    base.acceptAlternatives = [];
  }

  return base;
};

const kindToType = (kind: ExamSection['kind']): QuestionType => {
  switch (kind) {
    case 'Multiple Choice Questions':
      return 'multiple-choice';
    case 'True or False':
      return 'true-false';
    case 'Matching Items':
      return 'matching';
    case 'Fill-in-the-Blank':
      return 'fill-blank';
  }
};

const emptySectionFor = (kind: ExamSection['kind']): ExamSection => {
  const map: Record<
    ExamSection['kind'],
    { title: string; instructions: string }
  > = {
    'Multiple Choice Questions': {
      title: 'Section A: Multiple Choice Questions',
      instructions: 'Choose the correct answer(s) among the alternatives.',
    },
    'True or False': {
      title: 'Section B: True or False',
      instructions: 'Write T (True) or F (False) for each statement.',
    },
    'Matching Items': {
      title: 'Section C: Matching Items',
      instructions: 'Match the items in Column A with Column B.',
    },
    'Fill-in-the-Blank': {
      title: 'Section D: Fill-in-the-Blank',
      instructions: 'Fill in the blank with the correct term.',
    },
  };

  const cfg = map[kind];

  return {
    id: crypto.randomUUID(),
    title: cfg.title,
    kind,
    instructions: cfg.instructions,
    pointsPerQuestion: 1,
    questions: [emptyQuestion(kindToType(kind))],
  };
};

// ============================================================
// Helpers — UUID → index conversion for matching
// ============================================================
/**
 * Normalize a matching question's `correctMatches` into index form.
 *
 * Old shape (what the backend may still return): ``{ aUuid: bUuid }``
 * New shape (what the backend stores going forward): ``{ "0": "1" }``
 *
 * If the keys are already numeric strings, we return them as-is.
 * If they look like UUIDs, we map them through `columnA` / `columnB`.
 */
const normalizeCorrectMatches = (
  raw: Record<string, string> | undefined,
  columnA: { id: string; text: string }[] | undefined,
  columnB: { id: string; text: string }[] | undefined
): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!raw) return out;

  for (const [aKey, bKey] of Object.entries(raw)) {
    // If the key already resolves to a numeric index, keep it.
    const aNumeric = /^\d+$/.test(aKey);
    const bNumeric = /^\d+$/.test(bKey);

    if (aNumeric && bNumeric) {
      out[aKey] = bKey;
      continue;
    }

    // Otherwise resolve against the column arrays.
    const aIdx = columnA?.findIndex((c) => c.id === aKey) ?? -1;
    const bIdx = columnB?.findIndex((c) => c.id === bKey) ?? -1;
    if (aIdx < 0 || bIdx < 0) continue;

    out[String(aIdx)] = String(bIdx);
  }

  return out;
};

// ============================================================
// Convert API → local
// ============================================================
const fromApiSection = (s: ApiExamSection): ExamSection => {
  const kind = s.kind as ExamSection['kind'];

  const questions: ExamQuestion[] = (s.questions ?? []).map((q) => {
    const base: ExamQuestion = {
      id: q.id,
      type: q.type as QuestionType,
      text: q.text ?? '',
    };

    if (q.type === 'multiple-choice') {
      base.options = q.options.map((o) => o.option_text);
      const correct = q.options.findIndex((o) => o.is_correct);
      base.correctOptionIndex = correct >= 0 ? correct : 0;
    }

    if (q.type === 'true-false') {
      base.correctBoolean = q.boolean ?? true;
    }

    if (q.type === 'matching') {
      base.columnA = q.column_a.map((c) => ({ id: c.id, text: c.item_text }));
      base.columnB = q.column_b.map((c) => ({ id: c.id, text: c.item_text }));

      // Convert whatever came back — UUIDs or indices — to indices.
      base.correctMatches = normalizeCorrectMatches(
        q.correct_matches,
        base.columnA,
        base.columnB
      );
    }

    if (q.type === 'fill-blank') {
      const primary = q.fill_blank.find((f) => f.is_primary);
      const others = q.fill_blank.filter((f) => !f.is_primary);
      base.correctText = primary?.answer_text ?? '';
      base.acceptAlternatives = others.map((f) => f.answer_text);
    }

    return base;
  });

  return {
    id: s.id ?? crypto.randomUUID(),
    title: s.title,
    kind,
    instructions: s.instructions ?? '',
    pointsPerQuestion: Number(s.points_per_question) || 1,
    questions,
  };
};

// ============================================================
// Convert local → API
// ============================================================
const toApiQuestions = (questions: ExamQuestion[]): ExamQuestionPayload[] =>
  questions.map((q) => {
    switch (q.type) {
      case 'multiple-choice':
        return {
          type: 'multiple-choice',
          text: q.text ?? '',
          options: q.options ?? [],
          correctOptionIndex: q.correctOptionIndex ?? 0,
        };

      case 'true-false':
        return {
          type: 'true-false',
          text: q.text ?? '',
          correctBoolean: q.correctBoolean ?? true,
        };

      case 'matching': {
        // `q.correctMatches` is already in index form because
        // `normalizeCorrectMatches` was applied on load and the
        // SectionEditor only writes index pairs.
        const idxMatches: Record<string, string> = {};
        for (const [aKey, bKey] of Object.entries(q.correctMatches ?? {})) {
          const aNumeric = /^\d+$/.test(aKey);
          const bNumeric = /^\d+$/.test(bKey);
          if (aNumeric && bNumeric) {
            idxMatches[aKey] = bKey;
            continue;
          }
          // Defensive: if a UUID slipped through, map it.
          const aIdx = (q.columnA ?? []).findIndex((c) => c.id === aKey);
          const bIdx = (q.columnB ?? []).findIndex((c) => c.id === bKey);
          if (aIdx >= 0 && bIdx >= 0) {
            idxMatches[String(aIdx)] = String(bIdx);
          }
        }

        return {
          type: 'matching',
          text: q.text ?? '',
          columnA: q.columnA ?? [],
          columnB: q.columnB ?? [],
          correctMatches: idxMatches,
        };
      }

      case 'fill-blank':
        return {
          type: 'fill-blank',
          text: q.text ?? '',
          correctText: q.correctText ?? '',
          acceptAlternatives: q.acceptAlternatives ?? [],
        };

      default:
        return { type: q.type, text: q.text ?? '' };
    }
  });

// ============================================================
// Component
// ============================================================
const AdminExamBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<AdminExamDraft | null>(null);
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [newInstruction, setNewInstruction] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // ============================================================
  // Load
  // ============================================================
  const loadExam = useCallback(
    async (examId: string): Promise<boolean> => {
      const [examRes, coursesRes] = await Promise.all([
        examApi.get(examId),
        courseApi.list(),
      ]);

      if (!examRes.success || !examRes.data) return false;

      const e = examRes.data as ApiExam;

      setExam({
        id: e.id,
        title: e.title,
        courseName: e.courseTitle,
        courseId: e.courseId,
        year: e.year,
        durationMinutes: e.durationMinutes,
        generalInstructions: [...e.instructions]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((i) => i.instruction),
        sections: e.sections.map(fromApiSection),
        status: e.status,
        createdAt: e.created_at,
        publishedAt: e.published_at,
      });

      if (coursesRes.success && Array.isArray(coursesRes.data)) {
        setCourses(coursesRes.data as ApiCourse[]);
      }

      return true;
    },
    []
  );

  useEffect(() => {
    if (!id) {
      navigate('/admin/exams');
      return;
    }

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const ok = await loadExam(id);
        if (!ok && !cancelled) navigate('/admin/exams');
      } catch (err) {
        console.error('Builder load error:', err);
        if (!cancelled) setError('Could not load exam.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, navigate, loadExam]);

  // ============================================================
  // Local updaters
  // ============================================================
  const patch = (p: Partial<AdminExamDraft>) =>
    setExam((prev) => (prev ? { ...prev, ...p } : prev));

  const updateSection = (idx: number, p: Partial<ExamSection>) => {
    setExam((prev) => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      sections[idx] = { ...sections[idx], ...p };
      return { ...prev, sections };
    });
  };

  const updateQuestion = (
    sIdx: number,
    qIdx: number,
    p: Partial<ExamQuestion>
  ) => {
    setExam((prev) => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      const questions = [...sections[sIdx].questions];
      questions[qIdx] = { ...questions[qIdx], ...p };
      sections[sIdx] = { ...sections[sIdx], questions };
      return { ...prev, sections };
    });
  };

  // ---------- instructions ----------
  const addInstruction = () => {
    if (!newInstruction.trim() || !exam) return;
    patch({
      generalInstructions: [
        ...exam.generalInstructions,
        newInstruction.trim(),
      ],
    });
    setNewInstruction('');
  };

  const removeInstruction = (i: number) => {
    if (!exam) return;
    patch({
      generalInstructions: exam.generalInstructions.filter(
        (_, idx) => idx !== i
      ),
    });
  };

  // ---------- sections ----------
  const addSection = (kind: ExamSection['kind']) => {
    if (!exam) return;
    patch({ sections: [...exam.sections, emptySectionFor(kind)] });
  };

  const removeSection = (idx: number) => {
    if (!exam) return;
    patch({ sections: exam.sections.filter((_, i) => i !== idx) });
  };

  const addQuestion = (sIdx: number) => {
    if (!exam) return;
    setExam((prev) => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      const type = kindToType(sections[sIdx].kind);
      sections[sIdx] = {
        ...sections[sIdx],
        questions: [...sections[sIdx].questions, emptyQuestion(type)],
      };
      return { ...prev, sections };
    });
  };

  const removeQuestion = (sIdx: number, qIdx: number) => {
    if (!exam) return;
    setExam((prev) => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      sections[sIdx] = {
        ...sections[sIdx],
        questions: sections[sIdx].questions.filter((_, i) => i !== qIdx),
      };
      return { ...prev, sections };
    });
  };

  // ============================================================
  // Save pipeline
  // ============================================================
  const pushAll = async (): Promise<boolean> => {
    if (!exam) return false;

    // 1. Exam meta
    const upd = await examApi.update(exam.id, {
      title: exam.title,
      courseId: exam.courseId,
      year: exam.year,
      durationMinutes: exam.durationMinutes,
      status: exam.status,
    });
    if (!upd.success) {
      setError(upd.message || 'Could not save exam.');
      return false;
    }

    // 2. Instructions
    const ins = await examApi.saveInstructions(
      exam.id,
      exam.generalInstructions
    );
    if (!ins.success) {
      setError(ins.message || 'Could not save instructions.');
      return false;
    }

    // 3. Sections — no client IDs are sent, the backend replaces them
    const sectionsPayload: ApiExamSection[] = exam.sections.map((s) => ({
      title: s.title,
      kind: s.kind,
      instructions: s.instructions,
      points_per_question: s.pointsPerQuestion,
    }));

    const secRes = await examApi.saveSections(exam.id, sectionsPayload);
    if (!secRes.success || !secRes.data) {
      setError(secRes.message || 'Could not save sections.');
      return false;
    }

    const freshExam = secRes.data as ApiExam;

    // 4. Questions — one bulk call per section
    for (let i = 0; i < exam.sections.length; i++) {
      const local = exam.sections[i];
      const server = freshExam.sections[i];
      if (!server?.id) continue;

      const payload = toApiQuestions(local.questions);

      const qRes = await examApi.saveSectionQuestions(server.id, payload);
      if (!qRes.success) {
        setError(
          qRes.message || `Could not save questions in section ${i + 1}.`
        );
        return false;
      }
    }

    // 5. Reload to sync fresh section IDs
    await loadExam(exam.id);

    return true;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    const ok = await pushAll();
    setIsSaving(false);

    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handlePublish = async () => {
    if (!exam) return;
    setIsSaving(true);
    setError('');

    const ok = await pushAll();
    if (!ok) {
      setIsSaving(false);
      return;
    }

    const res = await examApi.publish(exam.id);
    setIsSaving(false);

    if (res.success) {
      patch({ status: 'published' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(res.message || 'Could not publish.');
    }
  };

  // ============================================================
  // Loading / guard
  // ============================================================
  if (isLoading) {
    return (
      <Card className="p-12 text-center text-gray-400">
        Loading exam...
      </Card>
    );
  }

  if (!exam) return null;

  const totalQuestions = exam.sections.reduce(
    (sum, sec) => sum + sec.questions.length,
    0
  );
  const totalPoints = exam.sections.reduce(
    (sum, sec) => sum + sec.questions.length * sec.pointsPerQuestion,
    0
  );

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <button
            onClick={() => navigate('/admin/exams')}
            className="text-sm text-gray-500 hover:text-black mb-1"
          >
            ← Back to Exams
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {exam.title || 'Untitled Exam'}
          </h1>
          <p className="text-gray-600 text-sm">
            {exam.sections.length} sections • {totalQuestions} questions •{' '}
            {totalPoints} points
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button onClick={handlePublish} disabled={isSaving}>
            {exam.status === 'published' ? 'Re-publish' : 'Publish Exam'}
          </Button>
        </div>
      </div>

      {saved && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg">
          ✓ Saved
        </div>
      )}

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </Card>
      )}

      {/* Exam details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Exam Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Exam Title"
              name="title"
              value={exam.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="TESLA CLOUD INSTITUTE THEORY EXAMINATION"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Course</label>
            <select
              value={exam.courseId}
              onChange={(e) => {
                const course = courses.find((c) => c.id === e.target.value);
                patch({
                  courseId: e.target.value,
                  courseName: course?.title ?? '',
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
            >
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

          <Input
            label="Year"
            name="year"
            value={exam.year}
            onChange={(e) => patch({ year: e.target.value })}
            placeholder="2026"
          />

          <Input
            label="Duration (minutes)"
            name="durationMinutes"
            type="number"
            value={String(exam.durationMinutes)}
            onChange={(e) =>
              patch({ durationMinutes: Number(e.target.value) || 0 })
            }
          />
        </div>
      </Card>

      {/* General instructions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Examination General Instructions
            </h2>
            <p className="text-xs text-gray-500">
              Add one instruction at a time. They will auto-number.
            </p>
          </div>
        </div>

        <ol className="list-decimal list-inside space-y-2 mb-4 bg-gray-50 rounded-lg p-4">
          {exam.generalInstructions.map((ins, i) => (
            <li
              key={i}
              className="text-sm text-gray-800 flex items-start justify-between gap-3"
            >
              <span className="flex-1">{ins}</span>
              <button
                onClick={() => removeInstruction(i)}
                className="text-xs text-red-600 hover:underline shrink-0"
              >
                Remove
              </button>
            </li>
          ))}
          {exam.generalInstructions.length === 0 && (
            <li className="text-sm text-gray-400 italic list-none">
              No instructions yet.
            </li>
          )}
        </ol>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Input
              label=""
              name="newInstruction"
              value={newInstruction}
              onChange={(e) => setNewInstruction(e.target.value)}
              placeholder="e.g. Exam Time: 60 Minutes"
            />
          </div>
          <Button onClick={addInstruction} className="sm:self-end">
            + Add Instruction
          </Button>
        </div>
      </Card>

      {/* Sections */}
      <div className="space-y-6">
        {exam.sections.map((section, sIdx) => (
          <SectionEditor
            key={section.id}
            section={section}
            sectionIndex={sIdx}
            onChange={(p) => updateSection(sIdx, p)}
            onRemove={() => removeSection(sIdx)}
            onAddQuestion={() => addQuestion(sIdx)}
            onRemoveQuestion={(qIdx) => removeQuestion(sIdx, qIdx)}
            onUpdateQuestion={(qIdx, p) => updateQuestion(sIdx, qIdx, p)}
          />
        ))}
      </div>

      {/* Add section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Add Section
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(
            [
              'Multiple Choice Questions',
              'True or False',
              'Matching Items',
              'Fill-in-the-Blank',
            ] as ExamSection['kind'][]
          ).map((kind) => (
            <button
              key={kind}
              onClick={() => addSection(kind)}
              className="p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
            >
              + {kind}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminExamBuilder;