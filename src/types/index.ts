// src/types/index.ts

// ============ Authentication ============
export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  profilePicture: string;
  countryCode: string;
  mobileNumber: string;
  region: string;
  currentCity: string;
  dateOfBirth: {
    year: string;
    month: string;
    day: string;
  };
  educationalBackground?: string;
  ipAddress: string;
  deviceName: string;
  videoRecord?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  keepMeLoggedIn: boolean;
}

export interface RegisterData {
  profilePicture: File | null;
  fullName: string;
  countryCode: string;
  mobileNumber: string;
  email: string;
  region: string;
  currentCity: string;
  dateOfBirth: {
    year: string;
    month: string;
    day: string;
  };
  educationalBackground?: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetCodes {
  code: string;
}

export interface ResetPasswordData {
  password: string;
  confirmPassword: string;
}

// ============ Course ============
export interface Course {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  whatWillLearn: string[];
  whyLearn: string;
  price: number;
  instructor: string;
  duration: string;
  practicals: number;
  theoryDays: string;
  practicalDays: string;
  theoryExam: string;
  practicalExam: string;
  image: string;
  category: string;
}

export interface EnrolledCourse {
  id: string;
  courseId: string;
  course: Course;
  enrolledAt: string;
  progress: number;
  status: 'active' | 'completed' | 'dropped';
  grade?: string;
}

export interface Exam {
  id: string;
  title: string;
  courseName: string;
  submissionDate: string;
  marks: number;
  totalMarks: number;
  status: 'passed' | 'failed';
}

export interface Certificate {
  id: string;
  courseName: string;
  issuedDate: string;
  grade: string;
}

// ============ Landing Page ============
export interface NewsItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  message: string;
  image: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
}

// ============ Navigation ============
export interface NavItem {
  label: string;
  path: string;
}