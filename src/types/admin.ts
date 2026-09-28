// src/types/admin.ts

// ============ Admin ============
export type AdminRole = 'super-admin' | 'admin' | 'moderator';
export type AccountStatus = 'active' | 'suspended' | 'pending';
export type ExamStatus = 'draft' | 'published' | 'closed';
export type AnswerStatus = 'pending' | 'marked' | 'published';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: AdminRole;
  profilePicture: string;
  phone: string;
  lastLogin: string;
  createdAt: string;
}

export interface Account {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  region: string;
  currentCity: string;
  status: AccountStatus;
  isVerified: boolean;
  enrollments: number;
  joinedAt: string;
  profilePicture: string;
}

export interface AdminExam {
  id: string;
  title: string;
  courseName: string;
  courseId: string;
  totalMarks: number;
  duration: number;         // minutes
  questions: number;
  status: ExamStatus;
  publishedAt: string | null;
  submissions: number;
}

export interface AdminCourse {
  id: string;
  title: string;
  category: string;
  instructor: string;
  price: number;
  duration: string;
  practicals: number;
  enrolled: number;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
}

export interface AnswerSheet {
  id: string;
  studentName: string;
  studentUsername: string;
  examTitle: string;
  courseName: string;
  submittedAt: string;
  autoMarks: number;
  totalMarks: number;
  practicalScore: number | null;
  finalMarks: number | null;
  status: AnswerStatus;
}

export interface AdminCertificate {
  id: string;
  studentName: string;
  studentUsername: string;
  courseName: string;
  grade: string;
  issuedAt: string;
  serialNumber: string;
  status: 'issued' | 'pending' | 'revoked';
}

export interface Payment {
  id: string;
  studentName: string;
  studentUsername: string;
  courseName: string;
  amount: number;
  method: 'M-Pesa' | 'Tigo Pesa' | 'Airtel Money' | 'Bank';
  status: PaymentStatus;
  paidAt: string;
  reference: string;
}

// ============ Stats ============
export interface StatCard {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'flat';
}

// ============ Exam Builder ============
export type QuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'matching'
  | 'fill-blank';

export type SectionKind =
  | 'Multiple Choice Questions'
  | 'True or False'
  | 'Matching Items'
  | 'Fill-in-the-Blank';

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  text: string;

  // multiple-choice
  options?: string[];            // e.g. ['a) ...', 'b) ...']
  correctOptionIndex?: number;   // 0-based

  // true-false
  correctBoolean?: boolean;

  // matching
  columnA?: { id: string; text: string }[];
  columnB?: { id: string; text: string }[];
  correctMatches?: Record<string, string>; // columnA.id -> columnB.id

  // fill-blank
  correctText?: string;
  acceptAlternatives?: string[]; // optional alt accepted answers
}

export interface ExamSection {
  id: string;
  title: string;                 // e.g. "Section A: Multiple Choice Questions"
  kind: SectionKind;
  instructions: string;          // e.g. "Choose the correct answer(s)..."
  pointsPerQuestion: number;
  questions: ExamQuestion[];
}

export interface AdminExamDraft {
  id: string;
  title: string;                 // e.g. "TESLA CLOUD INSTITUTE THEORY EXAMINATION"
  courseName: string;            // e.g. "COMPUTER BASICS"
  courseId: string;
  year: string;                  // e.g. "2026"
  durationMinutes: number;
  generalInstructions: string[]; // bullet list, auto-numbered
  sections: ExamSection[];
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
  publishedAt: string | null;
}

// ============ Auto-marking ============
export interface StudentAnswer {
  questionId: string;
  // one of these depending on question type
  selectedOptionIndex?: number;
  booleanAnswer?: boolean;
  matches?: Record<string, string>;
  textAnswer?: string;
}

export interface MarkingResult {
  questionId: string;
  correct: boolean;
  awarded: number;
  maxPoints: number;
}

export interface ExamMarkingReport {
  examId: string;
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  passed: boolean;         // threshold e.g. 50%
  results: MarkingResult[];
}