// src/data/certificatesData.ts
import type { AdminCertificate } from '../types/admin';

const STORAGE_KEY = 'tci_certificates';

// ============================================================
// Types
// ============================================================
export interface GeneratedCertificate {
  id: string;
  certificateNumber: string;
  studentUsername: string;
  studentName: string;
  courseName: string;
  courseId: string;
  grade: string;
  issuedAt: string;
  serialNumber: string;
  status: 'issued' | 'pending' | 'revoked';
}

// ============================================================
// Read
// ============================================================
export const loadCertificates = (): GeneratedCertificate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GeneratedCertificate[]) : [];
  } catch {
    return [];
  }
};

// ============================================================
// Write
// ============================================================
export const saveCertificates = (list: GeneratedCertificate[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

// ============================================================
// Generate a certificate number
//   Format: TCI-<year>-<4-digit-sequence>
// ============================================================
const nextCertificateNumber = (existing: GeneratedCertificate[]): string => {
  const year = new Date().getFullYear();
  const thisYear = existing.filter((c) =>
    c.certificateNumber.startsWith(`TCI-${year}-`)
  );
  const nextSeq = String(thisYear.length + 1).padStart(4, '0');
  return `TCI-${year}-${nextSeq}`;
};

// ============================================================
// Award a certificate (idempotent — will not duplicate)
// ============================================================
export const awardCertificate = (params: {
  studentUsername: string;
  studentName: string;
  courseName: string;
  courseId: string;
  grade: string;
}): GeneratedCertificate => {
  const all = loadCertificates();

  // If the student already has a certificate for this course, return it
  const existing = all.find(
    (c) =>
      c.studentUsername === params.studentUsername &&
      c.courseName.toLowerCase() === params.courseName.toLowerCase()
  );
  if (existing) return existing;

  const number = nextCertificateNumber(all);
  const cert: GeneratedCertificate = {
    id: crypto.randomUUID(),
    certificateNumber: number,
    studentUsername: params.studentUsername,
    studentName: params.studentName,
    courseName: params.courseName,
    courseId: params.courseId,
    grade: params.grade,
    issuedAt: new Date().toISOString(),
    serialNumber: number,
    status: 'issued',
  };

  all.unshift(cert);
  saveCertificates(all);
  return cert;
};

// ============================================================
// Get all certificates for a student
// ============================================================
export const getCertificatesForStudent = (
  studentUsername: string
): GeneratedCertificate[] => {
  return loadCertificates()
    .filter((c) => c.studentUsername === studentUsername)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
};

// ============================================================
// Get a single certificate by id
// ============================================================
export const getCertificateById = (
  id: string
): GeneratedCertificate | undefined => {
  return loadCertificates().find((c) => c.id === id);
};