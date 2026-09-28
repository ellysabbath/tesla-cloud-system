// src/data/examBuilderData.ts
import type {
  AdminExamDraft,
  ExamSection,
  ExamQuestion,
  StudentAnswer,
  ExamMarkingReport,
  MarkingResult,
} from '../types/admin';

const STORAGE_KEY = 'tci_exam_drafts';

// ---------- CRUD ----------
export const loadExams = (): AdminExamDraft[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminExamDraft[]) : [];
  } catch {
    return [];
  }
};

export const saveExams = (exams: AdminExamDraft[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
};

export const getExam = (id: string): AdminExamDraft | undefined =>
  loadExams().find((e) => e.id === id);

export const upsertExam = (exam: AdminExamDraft) => {
  const all = loadExams();
  const idx = all.findIndex((e) => e.id === exam.id);
  if (idx >= 0) all[idx] = exam;
  else all.unshift(exam);
  saveExams(all);
};

export const deleteExam = (id: string) => {
  saveExams(loadExams().filter((e) => e.id !== id));
};

// ---------- Factory helpers ----------
export const makeId = () => crypto.randomUUID();

export const emptyQuestion = (type: ExamQuestion['type']): ExamQuestion => {
  const base: ExamQuestion = { id: makeId(), type, text: '' };
  if (type === 'multiple-choice') {
    base.options = ['', '', '', ''];
    base.correctOptionIndex = 0;
  }
  if (type === 'true-false') base.correctBoolean = true;
  if (type === 'matching') {
    base.columnA = [{ id: makeId(), text: '' }, { id: makeId(), text: '' }];
    base.columnB = [{ id: makeId(), text: '' }, { id: makeId(), text: '' }];
    base.correctMatches = {};
  }
  if (type === 'fill-blank') {
    base.correctText = '';
    base.acceptAlternatives = [];
  }
  return base;
};

export const emptySection = (kind: ExamSection['kind']): ExamSection => {
  const map: Record<ExamSection['kind'], { title: string; instructions: string; type: ExamQuestion['type'] }> = {
    'Multiple Choice Questions': {
      title: 'Section A: Multiple Choice Questions',
      instructions: 'Choose the correct answer(s) among the alternatives.',
      type: 'multiple-choice',
    },
    'True or False': {
      title: 'Section B: True or False',
      instructions: 'Write T (True) or F (False) for each statement.',
      type: 'true-false',
    },
    'Matching Items': {
      title: 'Section C: Matching Items',
      instructions:
        'Match the items in Column A with the correct definition/example in Column B.',
      type: 'matching',
    },
    'Fill-in-the-Blank': {
      title: 'Section D: Fill-in-the-Blank',
      instructions: 'Fill in the blank with the correct term.',
      type: 'fill-blank',
    },
  };
  const cfg = map[kind];
  return {
    id: makeId(),
    title: cfg.title,
    kind,
    instructions: cfg.instructions,
    pointsPerQuestion: 1,
    questions: [emptyQuestion(cfg.type)],
  };
};

export const emptyExam = (): AdminExamDraft => ({
  id: makeId(),
  title: 'TESLA CLOUD INSTITUTE THEORY EXAMINATION',
  courseName: '',
  courseId: '',
  year: String(new Date().getFullYear()),
  durationMinutes: 60,
  generalInstructions: [
    'Exam Time: 60 Minutes',
    'All sections shall remain open for 60 minutes.',
    'You can submit your answers once you finish.',
    'Once submitted, you cannot retrieve again.',
    'Once time is over, the test will submit itself.',
    'Results of the test will be generated instantly.',
    'Be sure of power and internet connectivity.',
  ],
  sections: [],
  status: 'draft',
  createdAt: new Date().toISOString(),
  publishedAt: null,
});

// ---------- AUTO MARKING ----------
export const markExam = (
  exam: AdminExamDraft,
  answers: StudentAnswer[],
  passThreshold = 50
): ExamMarkingReport => {
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));
  const results: MarkingResult[] = [];

  let totalPoints = 0;
  let earnedPoints = 0;

  for (const section of exam.sections) {
    for (const q of section.questions) {
      const pts = section.pointsPerQuestion;
      totalPoints += pts;

      const ans = answerMap.get(q.id);
      let correct = false;

      if (!ans) {
        correct = false;
      } else if (q.type === 'multiple-choice') {
        correct = ans.selectedOptionIndex === q.correctOptionIndex;
      } else if (q.type === 'true-false') {
        correct = ans.booleanAnswer === q.correctBoolean;
      } else if (q.type === 'matching') {
        const expected = q.correctMatches ?? {};
        const given = ans.matches ?? {};
        const keys = Object.keys(expected);
        correct =
          keys.length > 0 &&
          keys.every((k) => given[k] === expected[k]);
      } else if (q.type === 'fill-blank') {
        const normalize = (s: string) =>
          s.trim().toLowerCase().replace(/\s+/g, ' ');
        const given = normalize(ans.textAnswer ?? '');
        const accepted = [
          q.correctText ?? '',
          ...(q.acceptAlternatives ?? []),
        ].map(normalize);
        correct = given !== '' && accepted.includes(given);
      }

      results.push({
        questionId: q.id,
        correct,
        awarded: correct ? pts : 0,
        maxPoints: pts,
      });
      if (correct) earnedPoints += pts;
    }
  }

  const percentage = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);

  return {
    examId: exam.id,
    totalPoints,
    earnedPoints,
    percentage,
    passed: percentage >= passThreshold,
    results,
  };
};