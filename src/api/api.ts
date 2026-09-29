// src/api/api.ts
//
// Central API client for Tesla Cloud Institute.
//
// - Holds access + refresh tokens (persisted in localStorage).
// - Attaches Authorization header to authenticated requests.
// - Auto-refreshes the access token on 401 and retries once.
// - Clears tokens and fires "auth:logout" only when refresh fails
//   or the user explicitly logs out.

// ============================================================
// Base URL
// ============================================================
const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://127.0.0.1:8000/api";

// ============================================================
// Token persistence
// ============================================================
const ACCESS_KEY = "tesla_access";
const REFRESH_KEY = "tesla_refresh";

let accessToken: string | null = localStorage.getItem(ACCESS_KEY);
let refreshToken: string | null = localStorage.getItem(REFRESH_KEY);

let refreshInFlight: Promise<boolean> | null = null;

export const setTokens = (
  access: string | null,
  refresh: string | null
): void => {
  accessToken = access;
  refreshToken = refresh;

  if (access) localStorage.setItem(ACCESS_KEY, access);
  else localStorage.removeItem(ACCESS_KEY);

  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  else localStorage.removeItem(REFRESH_KEY);
};

export const getAccessToken = (): string | null => accessToken;
export const getRefreshToken = (): string | null => refreshToken;

export const clearTokens = (): void => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  window.dispatchEvent(new Event("auth:logout"));
};

export const isAuthenticated = (): boolean => Boolean(accessToken);

// ============================================================
// Token refresh
// ============================================================
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (!res.ok) return false;

      const data = await res.json();
      if (!data.access) return false;

      const newRefresh: string = data.refresh ?? refreshToken;
      setTokens(data.access, newRefresh);
      return true;
    } catch (err) {
      console.error("[api] token refresh failed:", err);
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

// ============================================================
// Response type
// ============================================================
export interface PaginationInfo {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  verifyToken?: string;
  resetToken?: string;
  access?: string;
  refresh?: string;
  requiresVerification?: boolean;
  pagination?: PaginationInfo;
  [key: string]: unknown;
}

// ============================================================
// Core request
// ============================================================
async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
  withAuth = true
): Promise<ApiResponse<T>> {
  const buildFetch = (): Promise<Response> => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    if (withAuth && accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return fetch(`${API_BASE}${path}`, { ...options, headers });
  };

  let res: Response;
  try {
    res = await buildFetch();
  } catch (err) {
    console.error("[api] network error:", err);
    return {
      success: false,
      message: `Cannot reach the server at ${API_BASE}. Is Django running?`,
    };
  }

  if (res.status === 401 && withAuth && refreshToken) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      try {
        res = await buildFetch();
      } catch (err) {
        console.error("[api] network error after refresh:", err);
        return { success: false, message: "Network error" };
      }
    } else {
      clearTokens();
    }
  }

  let payload: ApiResponse<T>;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    payload = { success: false, message: `HTTP ${res.status}` };
  }

  if (!res.ok && payload.success === undefined) {
    payload.success = false;
  }

  return payload;
}

// ============================================================
// Shared types — auth + user
// ============================================================
export interface RegisterData {
  profilePicture: File | null;
  fullName: string;
  countryCode: string;
  mobileNumber: string;
  email: string;
  region: string;
  currentCity: string;
  dateOfBirth: { year: string; month: string; day: string };
  educationalBackground?: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
  videoRecord?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  keepMeLoggedIn: boolean;
}

export interface RegistrationVideo {
  data: string;
  mimeType: string | null;
  fileSize: number | null;
  durationSec: number | null;
  createdAt: string;
}

export interface ProfileUpdatePayload {
  fullName?: string;
  mobileNumber?: string;
  countryCode?: string;
  region?: string;
  currentCity?: string;
  educationalBackground?: string;
  profilePicture?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================
// Shared types — admin users
// ============================================================
export interface AdminUserRow {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  countryCode: string;
  region: string | null;
  currentCity: string | null;
  status: "active" | "pending" | "suspended";
  isVerified: boolean;
  enrollments: number;
  joinedAt: string;
  hasProfilePicture: boolean;
}

export interface AdminUserDetail {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  region: string | null;
  currentCity: string | null;
  dateOfBirth: { year: string; month: string; day: string } | null;
  gender: string | null;
  educationalBackground: string | null;
  bio: string | null;
  role: string;
  status: "active" | "pending" | "suspended";
  isVerified: boolean;
  isActive: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  profilePicture: string | null;
  ipAddress: string | null;
  deviceName: string | null;
  termsAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  enrollments: number;
  registrationVideo: {
    data: string;
    mimeType: string | null;
    fileSize: number | null;
    durationSec: number | null;
    createdAt: string;
  } | null;
}

export interface AdminUserUpdatePayload {
  fullName?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  region?: string | null;
  currentCity?: string | null;
  educationalBackground?: string | null;
  gender?: string | null;
  role?: string;
  status?: "active" | "pending" | "suspended";
  isVerified?: boolean;
  isActive?: boolean;
  profilePicture?: string | null;
}

// ============================================================
// Utilities
// ============================================================
export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "Windows";
  if (/Macintosh/i.test(ua)) return "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown";
};

export const getIpAddress = async (): Promise<string> => {
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const j = await r.json();
    return (j.ip as string) ?? "";
  } catch {
    return "";
  }
};

// ============================================================
// Auth API
// ============================================================
export const authApi = {
  // ---------- Registration ----------
  register: async (formData: RegisterData): Promise<ApiResponse> => {
    const payload: Record<string, unknown> = {
      fullName: formData.fullName,
      countryCode: formData.countryCode,
      mobileNumber: formData.mobileNumber,
      email: formData.email,
      region: formData.region,
      currentCity: formData.currentCity,
      dateOfBirth: formData.dateOfBirth,
      educationalBackground: formData.educationalBackground ?? "",
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      termsAccepted: formData.termsAccepted,
      ipAddress: await getIpAddress(),
      deviceName: getDeviceName(),
    };

    if (formData.profilePicture) {
      payload.profilePicture = await fileToBase64(formData.profilePicture);
    }
    if (formData.videoRecord) {
      payload.videoRecord = formData.videoRecord;
    }

    return request(
      "/auth/register/",
      { method: "POST", body: JSON.stringify(payload) },
      false
    );
  },

  verifyAccount: async (token: string): Promise<ApiResponse> =>
    request(
      "/auth/verify/",
      { method: "POST", body: JSON.stringify({ token }) },
      false
    ),

  resendVerification: async (email: string): Promise<ApiResponse> =>
    request(
      "/auth/resend-verification/",
      { method: "POST", body: JSON.stringify({ email }) },
      false
    ),

  // ---------- Auth ----------
  login: async (creds: LoginCredentials): Promise<ApiResponse> => {
    const res = await request(
      "/auth/login/",
      { method: "POST", body: JSON.stringify(creds) },
      false
    );

    if (res.success && res.access) {
      setTokens(res.access as string, (res.refresh as string) ?? null);
    }
    return res;
  },

  logout: async (): Promise<ApiResponse> => {
    try {
      await request(
        "/auth/logout/",
        {
          method: "POST",
          body: JSON.stringify({ refresh: refreshToken }),
        },
        true
      );
    } catch {
      // ignore
    }

    clearTokens();
    return { success: true, message: "Logged out" };
  },

  // ---------- Current user ----------
  me: async (): Promise<ApiResponse> => request("/auth/me/"),

  updateProfile: async (payload: ProfileUpdatePayload): Promise<ApiResponse> =>
    request(
      "/auth/me/",
      { method: "PATCH", body: JSON.stringify(payload) },
      true
    ),

  changePassword: async (
    payload: ChangePasswordPayload
  ): Promise<ApiResponse> =>
    request(
      "/auth/change-password/",
      { method: "POST", body: JSON.stringify(payload) },
      true
    ),

  // ---------- Password reset ----------
  requestPasswordReset: async (payload: {
    email: string;
  }): Promise<ApiResponse> =>
    request(
      "/auth/password-reset/request/",
      { method: "POST", body: JSON.stringify(payload) },
      false
    ),

  verifyResetCodes: async (
    email: string,
    code: string
  ): Promise<ApiResponse> =>
    request(
      "/auth/password-reset/verify/",
      { method: "POST", body: JSON.stringify({ email, code }) },
      false
    ),

  resetPassword: async (payload: {
    resetToken: string;
    password: string;
    confirmPassword: string;
  }): Promise<ApiResponse> => {
    const res = await request(
      "/auth/password-reset/confirm/",
      { method: "POST", body: JSON.stringify(payload) },
      false
    );

    if (res.success && res.access) {
      setTokens(res.access as string, (res.refresh as string) ?? null);
    }
    return res;
  },

  // ---------- Admin: users ----------
  adminListUsers: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<AdminUserRow[]>> => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status && params.status !== "all")
      qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));

    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<AdminUserRow[]>(`/auth/admin/users/${suffix}`);
  },

  adminGetUser: async (userId: string): Promise<ApiResponse> =>
    request(`/auth/admin/users/${userId}/`),

  adminGetAvatar: async (
    userId: string
  ): Promise<ApiResponse<{ profilePicture: string | null }>> =>
    request<{ profilePicture: string | null }>(
      `/auth/admin/users/${userId}/avatar/`
    ),

  adminUpdateUser: async (
    userId: string,
    payload: AdminUserUpdatePayload
  ): Promise<ApiResponse> =>
    request(`/auth/admin/users/${userId}/update/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  adminDeleteUser: async (userId: string): Promise<ApiResponse> =>
    request(`/auth/admin/users/${userId}/delete/`, { method: "POST" }),

  adminSuspendUser: async (userId: string): Promise<ApiResponse> =>
    request(`/auth/admin/users/${userId}/suspend/`, { method: "POST" }),

  adminActivateUser: async (userId: string): Promise<ApiResponse> =>
    request(`/auth/admin/users/${userId}/activate/`, { method: "POST" }),
};

// ============================================================
// Courses API
// ============================================================
export interface CoursePayload {
  title: string;
  description: string;
  fullDescription?: string;
  whyLearn?: string;
  whatWillLearn?: string[];
  category?: string;
  price: number;
  currency?: string;
  duration?: string;
  practicals?: number;
  theoryDays?: string;
  practicalDays?: string;
  theoryExam?: string;
  practicalExam?: string;
  image?: string;
  instructor?: string;
  status?: "published" | "draft" | "archived";
}

export interface ApiCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  fullDescription: string | null;
  whyLearn: string | null;
  whatWillLearn: string[];
  category: string | null;
  price: string | number;
  currency: string;
  duration: string | null;
  practicals: number;
  theoryDays: string | null;
  practicalDays: string | null;
  theoryExam: string | null;
  practicalExam: string | null;
  image: string | null;
  instructor: string | null;
  instructor_name: string | null;
  status: "published" | "draft" | "archived";
  created_at: string;
  updated_at: string;
}

export const courseApi = {
  list: async (params?: {
    search?: string;
    category?: string;
    status?: string;
  }): Promise<ApiResponse<ApiCourse[]>> => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.category && params.category !== "all")
      qs.set("category", params.category);
    if (params?.status && params.status !== "all")
      qs.set("status", params.status);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<ApiCourse[]>(`/courses/${suffix}`);
  },

  get: async (id: string): Promise<ApiResponse<ApiCourse>> =>
    request<ApiCourse>(`/courses/${id}/`),

  create: async (payload: CoursePayload): Promise<ApiResponse<ApiCourse>> =>
    request<ApiCourse>(
      `/courses/`,
      { method: "POST", body: JSON.stringify(payload) },
      true
    ),

  update: async (
    id: string,
    payload: Partial<CoursePayload>
  ): Promise<ApiResponse<ApiCourse>> =>
    request<ApiCourse>(
      `/courses/${id}/`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true
    ),

  remove: async (id: string): Promise<ApiResponse> =>
    request(`/courses/${id}/delete/`, { method: "POST" }, true),
};

// ============================================================
// Payments API
// ============================================================
export interface ApiPayment {
  id: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  studentUsername: string;
  amount: string;
  currency: string;
  method: string;
  reference: string;
  phone_paid_from: string | null;
  status: "paid" | "pending" | "failed" | "refunded";
  paid_at: string | null;
  submittedAt: string;
}

export interface PaymentSubmitPayload {
  courseId: string;
  method: string;
  reference: string;
  phonePaidFrom?: string;
}

export const paymentApi = {
  mine: async (): Promise<ApiResponse<ApiPayment[]>> =>
    request<ApiPayment[]>("/payments/mine/"),

  adminList: async (): Promise<ApiResponse<ApiPayment[]>> =>
    request<ApiPayment[]>("/payments/admin/"),

  submit: async (
    payload: PaymentSubmitPayload
  ): Promise<ApiResponse<ApiPayment>> =>
    request<ApiPayment>(
      "/payments/submit/",
      { method: "POST", body: JSON.stringify(payload) },
      true
    ),

  markPaid: async (paymentId: string): Promise<ApiResponse<ApiPayment>> =>
    request<ApiPayment>(
      `/payments/${paymentId}/mark-paid/`,
      { method: "POST" },
      true
    ),

  markFailed: async (paymentId: string): Promise<ApiResponse<ApiPayment>> =>
    request<ApiPayment>(
      `/payments/${paymentId}/fail/`,
      { method: "POST" },
      true
    ),

  refund: async (paymentId: string): Promise<ApiResponse<ApiPayment>> =>
    request<ApiPayment>(
      `/payments/${paymentId}/refund/`,
      { method: "POST" },
      true
    ),

  remove: async (paymentId: string): Promise<ApiResponse> =>
    request(`/payments/${paymentId}/delete/`, { method: "POST" }, true),
};

// ============================================================
// Enrollments API
// ============================================================
export interface ApiEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  courseCategory: string | null;
  courseDescription: string;
  courseDuration: string | null;
  courseInstructor: string | null;
  coursePrice: string;
  enrolled_at: string;
  completed_at: string | null;
  progress_pct: string;
  status: "active" | "completed" | "dropped";
}

export const enrollmentApi = {
  mine: async (): Promise<ApiResponse<ApiEnrollment[]>> =>
    request<ApiEnrollment[]>("/enrollments/mine/"),

  adminUserEnrollments: async (
    userId: string
  ): Promise<ApiResponse<ApiEnrollment[]>> =>
    request<ApiEnrollment[]>(`/enrollments/admin/user/${userId}/`),

  enroll: async (courseId: string): Promise<ApiResponse<ApiEnrollment>> =>
    request<ApiEnrollment>(
      `/enrollments/enroll/${courseId}/`,
      { method: "POST" },
      true
    ),

  unenroll: async (courseId: string): Promise<ApiResponse> =>
    request(`/enrollments/unenroll/${courseId}/`, { method: "POST" }, true),
};

// ============================================================
// Exams API — types
// ============================================================
export interface ApiExamInstruction {
  id: string;
  instruction: string;
  sort_order: number;
}

export interface ApiExamQuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
}

export interface ApiExamQuestionColumnItem {
  id: string;
  item_text: string;
  sort_order: number;
}

export interface ApiExamQuestionFillBlank {
  id: string;
  answer_text: string;
  is_primary: boolean;
}

export interface ApiExamQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'matching' | 'fill-blank' | string;
  text: string;
  sort_order: number;
  options: ApiExamQuestionOption[];
  boolean: boolean | null;
  column_a: ApiExamQuestionColumnItem[];
  column_b: ApiExamQuestionColumnItem[];
  correct_matches: Record<string, string>;
  fill_blank: ApiExamQuestionFillBlank[];
}

export interface ApiExamSection {
  id?: string;
  title: string;
  kind: string;
  instructions: string;
  points_per_question: number | string;
  sort_order?: number;
  questions?: ApiExamQuestion[];
}

export interface ApiExam {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  year: string;
  durationMinutes: number;
  theoryWeight: string | number;
  practicalWeight: string | number;
  passThreshold: string | number;
  status: 'draft' | 'published' | 'closed';
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  instructions: ApiExamInstruction[];
  sections: ApiExamSection[];
}

export interface ExamPayload {
  title: string;
  courseId: string;
  year: string;
  durationMinutes?: number;
  theoryWeight?: number;
  practicalWeight?: number;
  passThreshold?: number;
  status?: 'draft' | 'published' | 'closed';
}

// ============================================================
// Exam question — WRITE payload (matches QuestionWriteSerializer)
// ============================================================
export interface ExamQuestionPayload {
  type: string;
  text?: string;
  options?: string[];
  correctOptionIndex?: number;
  correctBoolean?: boolean;
  columnA?: { id: string; text: string }[];
  columnB?: { id: string; text: string }[];
  correctMatches?: Record<string, string>;
  correctText?: string;
  acceptAlternatives?: string[];
}

// ============================================================
// Exams API — client
// ============================================================
export const examApi = {
  list: async (params?: {
    status?: string;
    courseId?: string;
    search?: string;
  }): Promise<ApiResponse<ApiExam[]>> => {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== 'all')
      qs.set('status', params.status);
    if (params?.courseId) qs.set('courseId', params.courseId);
    if (params?.search) qs.set('search', params.search);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<ApiExam[]>(`/exams/${suffix}`);
  },

  get: async (id: string): Promise<ApiResponse<ApiExam>> =>
    request<ApiExam>(`/exams/${id}/`),

  create: async (payload: ExamPayload): Promise<ApiResponse<ApiExam>> =>
    request<ApiExam>(
      `/exams/`,
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),

  update: async (
    id: string,
    payload: Partial<ExamPayload>
  ): Promise<ApiResponse<ApiExam>> =>
    request<ApiExam>(
      `/exams/${id}/`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      true
    ),

  remove: async (id: string): Promise<ApiResponse> =>
    request(`/exams/${id}/delete/`, { method: 'POST' }, true),

  publish: async (id: string): Promise<ApiResponse<ApiExam>> =>
    request<ApiExam>(`/exams/${id}/publish/`, { method: 'POST' }, true),

  close: async (id: string): Promise<ApiResponse<ApiExam>> =>
    request<ApiExam>(`/exams/${id}/close/`, { method: 'POST' }, true),

  // ---------- Instructions ----------
  saveInstructions: async (
    id: string,
    instructions: string[]
  ): Promise<ApiResponse> =>
    request(
      `/exams/${id}/instructions/`,
      { method: 'POST', body: JSON.stringify({ instructions }) },
      true
    ),

  // ---------- Sections ----------
  saveSections: async (
    id: string,
    sections: ApiExamSection[]
  ): Promise<ApiResponse<ApiExam>> =>
    request<ApiExam>(
      `/exams/${id}/sections/`,
      { method: 'POST', body: JSON.stringify({ sections }) },
      true
    ),

  // ---------- Questions (per section) ----------
  loadSectionQuestions: async (
    sectionId: string
  ): Promise<ApiResponse<ApiExamQuestion[]>> =>
    request<ApiExamQuestion[]>(
      `/exams/sections/${sectionId}/questions/`
    ),

  saveSectionQuestions: async (
    sectionId: string,
    questions: ExamQuestionPayload[]
  ): Promise<ApiResponse<{ count: number }>> =>
    request<{ count: number }>(
      `/exams/sections/${sectionId}/questions/save/`,
      { method: 'POST', body: JSON.stringify({ questions }) },
      true
    ),
};


export interface ApiAttempt {
  id: string;
  examId: string;
  examTitle: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  studentUsername: string;
  started_at: string;
  submitted_at: string | null;
  auto_submitted: boolean;
  auto_submit_reason: string | null;
  durationMinutes: number;
  theory_earned: string | null;
  theory_total: string | null;
  theory_percent: string | null;
  practical_score: string | null;
  practical_max: string | null;
  practical_percent: string | null;
  final_percent: string | null;
  final_grade: string | null;
  passed: boolean | null;
  status: 'pending' | 'marked' | 'published';
  marked_at: string | null;
  published_at: string | null;
  sessionVideo: string | null;      // ← ADD THIS LINE
}
export interface SubmitAttemptPayload {
  answers: {
    questionId: string;
    selectedOptionId?: string | null;
    booleanAnswer?: boolean | null;
    textAnswer?: string | null;
    matches?: Record<string, string>;
  }[];
  autoSubmitted?: boolean;
  autoSubmitReason?: string;
  videoRecord?: string;
}

// ============================================================
// Attempt review (admin) — full detail with exam structure
// ============================================================
export interface ApiAttemptReview extends ApiAttempt {
  exam: {
    id: string;
    title: string;
    year: string;
    durationMinutes: number;
    sections: ApiExamSection[];
  };
  answers: {
    id: string;
    questionId: string;
    selectedOptionId: string | null;
    boolean_answer: boolean | null;
    text_answer: string | null;
    is_correct: boolean | null;
    points_awarded: string | null;
    answered_at: string;
  }[];
  matching_answers: {
    id: string;
    questionId: string;
    a_index: number;
    b_index: number | null;
    is_correct: boolean | null;
  }[];
  marking_results: {
    id: string;
    questionId: string;
    correct: boolean;
    awarded: string;
    max_points: string;
  }[];
}



export const attemptApi = {
  mine: async (): Promise<ApiResponse<ApiAttempt[]>> =>
    request<ApiAttempt[]>('/attempts/mine/'),


  adminReview: async (
  attemptId: string
): Promise<ApiResponse<ApiAttemptReview>> =>
  request<ApiAttemptReview>(
    `/attempts/${attemptId}/review/`,
    { method: 'GET' },
    true
  ),

  get: async (attemptId: string): Promise<ApiResponse<ApiAttempt>> =>
    request<ApiAttempt>(`/attempts/${attemptId}/`),

  start: async (examId: string): Promise<ApiResponse<ApiAttempt>> =>
    request<ApiAttempt>(
      `/attempts/start/${examId}/`,
      { method: 'POST' },
      true
    ),

  submit: async (
    attemptId: string,
    payload: SubmitAttemptPayload
  ): Promise<ApiResponse<ApiAttempt>> =>
    request<ApiAttempt>(
      `/attempts/${attemptId}/submit/`,
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),

  adminList: async (): Promise<ApiResponse<ApiAttempt[]>> =>
    request<ApiAttempt[]>('/attempts/admin/'),

  markPractical: async (
    attemptId: string,
    payload: { practicalScore: number; practicalMax: number }
  ): Promise<ApiResponse<ApiAttempt>> =>
    request<ApiAttempt>(
      `/attempts/${attemptId}/mark-practical/`,
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),

  publish: async (attemptId: string): Promise<ApiResponse<ApiAttempt>> =>
    request<ApiAttempt>(
      `/attempts/${attemptId}/publish/`,
      { method: 'POST' },
      true
    ),
};

// ============================================================
// Registration video (logged-in user)
// ============================================================
export const getMyRegistrationVideo =
  async (): Promise<RegistrationVideo | null> => {
    const res = await request<RegistrationVideo>("/auth/me/video/");
    if (!res.success) return null;
    return (res.data as RegistrationVideo) ?? null;
  };

// ============================================================
// Default export
// ============================================================
export default {
  authApi,
  courseApi,
  paymentApi,
  enrollmentApi,
  examApi,
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  isAuthenticated,
  getMyRegistrationVideo,
  fileToBase64,
  getDeviceName,
  getIpAddress,
};