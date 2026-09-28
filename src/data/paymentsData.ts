// src/data/paymentsData.ts
import type { Payment } from '../types/admin';

const STORAGE_KEY = 'tci_payments';

// ============================================================
// Seed data
// ============================================================
const seedPayments: Payment[] = [
  {
    id: 'pay-1',
    studentName: 'John Mwangi',
    studentUsername: 'TESLA-2026-4581',
    courseName: 'Computer Basics',
    amount: 50000,
    method: 'M-Pesa',
    status: 'paid',
    paidAt: '2026-01-05T11:20:00Z',
    reference: 'MPX1234567',
  },
  {
    id: 'pay-2',
    studentName: 'Sarah Kimaro',
    studentUsername: 'TESLA-2026-4712',
    courseName: 'Introduction to Computer Programming',
    amount: 75000,
    method: 'Tigo Pesa',
    status: 'paid',
    paidAt: '2026-01-08T10:00:00Z',
    reference: 'TGX7654321',
  },
  {
    id: 'pay-3',
    studentName: 'David Lyimo',
    studentUsername: 'TESLA-2026-5093',
    courseName: 'Database Management System (MySQL)',
    amount: 120000,
    method: 'Airtel Money',
    status: 'pending',
    paidAt: '',
    reference: 'AMX9988776',
  },
  {
    id: 'pay-4',
    studentName: 'Grace Temba',
    studentUsername: 'TESLA-2026-5321',
    courseName: 'High Level Programming in Java',
    amount: 180000,
    method: 'Bank',
    status: 'paid',
    paidAt: '2026-01-12T09:15:00Z',
    reference: 'BNK4455667',
  },
  {
    id: 'pay-5',
    studentName: 'Peter Mushi',
    studentUsername: 'TESLA-2026-5502',
    courseName: 'Web Development (UI/UX)',
    amount: 90000,
    method: 'M-Pesa',
    status: 'failed',
    paidAt: '',
    reference: 'MPX3322110',
  },
  {
    id: 'pay-6',
    studentName: 'Mary Ndosi',
    studentUsername: 'TESLA-2026-5611',
    courseName: 'e-Commerce',
    amount: 100000,
    method: 'M-Pesa',
    status: 'paid',
    paidAt: '2026-01-15T14:45:00Z',
    reference: 'MPX5566778',
  },
  {
    id: 'pay-7',
    studentName: 'Emanuel Kessy',
    studentUsername: 'TESLA-2026-5780',
    courseName: 'System Designing',
    amount: 150000,
    method: 'Tigo Pesa',
    status: 'pending',
    paidAt: '',
    reference: 'TGX4433221',
  },
  {
    id: 'pay-8',
    studentName: 'Fatuma Ally',
    studentUsername: 'TESLA-2026-5840',
    courseName: 'Computer Basics',
    amount: 50000,
    method: 'Airtel Money',
    status: 'refunded',
    paidAt: '2026-01-18T08:30:00Z',
    reference: 'AMX7766554',
  },
];

// ============================================================
// Read all payments
// ============================================================
export const loadPayments = (): Payment[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPayments));
      return seedPayments;
    }
    return JSON.parse(raw) as Payment[];
  } catch {
    return seedPayments;
  }
};

// ============================================================
// Write the whole list
// ============================================================
export const savePayments = (list: Payment[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

// ============================================================
// Create — inserts a new payment at the top
// ============================================================
export const createPayment = (payment: Payment): Payment[] => {
  const all = loadPayments();
  all.unshift(payment);
  savePayments(all);
  return all;
};

// ============================================================
// Update the status of a single payment
//   - When moving to "paid" and paidAt is empty, stamps the current time
//   - Otherwise keeps the existing paidAt
// ============================================================
export const updatePaymentStatus = (
  id: string,
  status: Payment['status']
): Payment[] => {
  const all = loadPayments().map((p) =>
    p.id === id
      ? {
          ...p,
          status,
          paidAt:
            status === 'paid' && !p.paidAt
              ? new Date().toISOString()
              : p.paidAt,
        }
      : p
  );
  savePayments(all);
  return all;
};

// ============================================================
// Delete a single payment
// ============================================================
export const deletePayment = (id: string): Payment[] => {
  const all = loadPayments().filter((p) => p.id !== id);
  savePayments(all);
  return all;
};

// ============================================================
// Student helpers
// ============================================================

/**
 * Returns true when the student has an APPROVED (paid) payment for this course.
 */
export const hasPaidForCourse = (
  studentUsername: string,
  courseName: string
): boolean => {
  return loadPayments().some(
    (p) =>
      p.studentUsername === studentUsername &&
      p.courseName.toLowerCase() === courseName.toLowerCase() &&
      p.status === 'paid'
  );
};

/**
 * Returns true when the student has a PENDING (awaiting approval) payment.
 */
export const hasPendingForCourse = (
  studentUsername: string,
  courseName: string
): boolean => {
  return loadPayments().some(
    (p) =>
      p.studentUsername === studentUsername &&
      p.courseName.toLowerCase() === courseName.toLowerCase() &&
      p.status === 'pending'
  );
};

/**
 * Returns the student's most recent payment record for a specific course
 * (any status). Useful for showing the reference number, submission date, etc.
 */
export const getPaymentForCourse = (
  studentUsername: string,
  courseName: string
): Payment | undefined => {
  return loadPayments()
    .filter(
      (p) =>
        p.studentUsername === studentUsername &&
        p.courseName.toLowerCase() === courseName.toLowerCase()
    )
    .sort((a, b) => {
      const at = a.paidAt || '';
      const bt = b.paidAt || '';
      return bt.localeCompare(at);
    })[0];
};

/**
 * Returns every payment made by a given student, newest first.
 */
export const getPaymentsForStudent = (
  studentUsername: string
): Payment[] => {
  return loadPayments()
    .filter((p) => p.studentUsername === studentUsername)
    .sort((a, b) => {
      const at = a.paidAt || '';
      const bt = b.paidAt || '';
      return bt.localeCompare(at);
    });
};

/**
 * Returns every APPROVED course for a given student.
 * Deduplicates by course name (keeps the latest).
 */
export const getEnrolledCoursesForStudent = (
  studentUsername: string
): Payment[] => {
  const paid = loadPayments().filter(
    (p) => p.studentUsername === studentUsername && p.status === 'paid'
  );

  // Deduplicate by courseName (keep the most recent)
  const map = new Map<string, Payment>();
  paid.forEach((p) => {
    const key = p.courseName.toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, p);
    } else {
      const existingTime = existing.paidAt || '';
      const newTime = p.paidAt || '';
      if (newTime > existingTime) map.set(key, p);
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const at = a.paidAt || '';
    const bt = b.paidAt || '';
    return bt.localeCompare(at);
  });
};