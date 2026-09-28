// src/data/certificateEngine.ts
import { loadExams } from './examBuilderData';
import { loadResults } from './examResultsData';
import { loadCourses } from './coursesData';
import { awardCertificate, loadCertificates } from './certificatesData';

// ============================================================
// Run this whenever a student views their dashboard or certificates
// ============================================================
export const runCertificateEngine = (studentUsername: string) => {
  try {
    const studentName = getStudentName();
    const exams = loadExams();
    const results = loadResults().filter(
      (r) => r.studentUsername === studentUsername
    );
    const courses = loadCourses();
    const existing = loadCertificates();

    // ---------- Group results by course ----------
    const resultsByCourse = new Map<string, typeof results>();
    results.forEach((r) => {
      const key = r.courseName.toLowerCase();
      const arr = resultsByCourse.get(key) ?? [];
      arr.push(r);
      resultsByCourse.set(key, arr);
    });

    // ---------- For each course, check if all exams are passed ----------
    resultsByCourse.forEach((courseResults, courseKey) => {
      // Find the course in the store
      const course = courses.find(
        (c) => c.title.toLowerCase() === courseKey
      );
      if (!course) return;

      // Find all published exams for this course
      const courseExams = exams.filter(
        (e) =>
          e.courseId === course.id ||
          e.courseName.toLowerCase() === courseKey
      );
      if (courseExams.length === 0) return;

      // Check if every exam has a passing result
      const allPassed = courseExams.every((exam) => {
        const result = courseResults.find((r) => r.examId === exam.id);
        return result && result.report.passed;
      });

      if (!allPassed) return;

      // Already awarded?
      const alreadyAwarded = existing.some(
        (c) =>
          c.studentUsername === studentUsername &&
          c.courseName.toLowerCase() === courseKey
      );
      if (alreadyAwarded) return;

      // Compute average grade
      const totalEarned = courseResults.reduce(
        (sum, r) => sum + r.report.earnedPoints,
        0
      );
      const totalPossible = courseResults.reduce(
        (sum, r) => sum + r.report.totalPoints,
        0
      );
      const pct =
        totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
      const grade = computeGrade(pct);

      // Award
      awardCertificate({
        studentUsername,
        studentName,
        courseName: course.title,
        courseId: course.id,
        grade,
      });
    });
  } catch (err) {
    console.error('Certificate engine error:', err);
  }
};

// ============================================================
// Helpers
// ============================================================
const computeGrade = (pct: number): string => {
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
};

const getStudentName = (): string => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return 'Student Name';
    const u = JSON.parse(raw);
    return u.fullName || 'Student Name';
  } catch {
    return 'Student Name';
  }
};