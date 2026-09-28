// src/data/examResultsData.ts
import type { StudentAnswer, ExamMarkingReport } from '../types/admin';

const STORAGE_KEY = 'tci_exam_results';

export interface StoredResult {
  id: string;
  examId: string;
  examTitle: string;
  courseName: string;
  studentName: string;
  studentUsername: string;
  submittedAt: string;
  answers: StudentAnswer[];
  report: ExamMarkingReport;
  autoSubmitted: boolean;
  videoRecord?: string; 
}

export const loadResults = (): StoredResult[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredResult[]) : [];
  } catch {
    return [];
  }
};

export const saveResult = (r: StoredResult) => {
  const all = loadResults();
  all.unshift(r);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

export const getResult = (id: string): StoredResult | undefined =>
  loadResults().find((r) => r.id === id);

export const hasAttempted = (examId: string, username: string): boolean =>
  loadResults().some(
    (r) => r.examId === examId && r.studentUsername === username
  );

export const getResultFor = (
  examId: string,
  username: string
): StoredResult | undefined =>
  loadResults().find(
    (r) => r.examId === examId && r.studentUsername === username
  );

// Get logged-in student info from localStorage
export const getCurrentStudent = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return { name: 'Guest Student', username: 'GUEST' };
    const u = JSON.parse(raw);
    return {
      name: u.fullName || 'Student',
      username: u.username || 'GUEST',
    };
  } catch {
    return { name: 'Guest Student', username: 'GUEST' };
  }
};