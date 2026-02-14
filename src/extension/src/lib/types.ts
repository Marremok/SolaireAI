import { SubjectConfig } from './colors';

/**
 * Study session data returned by API
 */
export interface SessionData {
  id: number;
  examTitle: string;
  examSubject: string | null;
  topic: string | null;
  method: string;
  duration: number;
  status: "PLANNED" | "COMPLETED" | "SKIPPED";
}

/**
 * Upcoming exam data returned by API
 */
export interface ExamData {
  id: number;
  title: string;
  subject: string | null;
  date: string; // ISO string
  relativeDate: string; // "Today", "Tomorrow", "In 3 days", etc.
}

/**
 * TodayBox API response
 */
export interface TodayBoxResponse {
  sessions: SessionData[];
  upcomingExams: ExamData[];
  isRestDay: boolean;
  restDays: string[];
  subjects: SubjectConfig[];
}

/**
 * API error response
 */
export interface ApiError {
  error: string;
}

/**
 * Auth state for the extension
 */
export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; data: TodayBoxResponse }
  | { status: 'unauthenticated' }
  | { status: 'not_pro' }
  | { status: 'error'; message: string };
