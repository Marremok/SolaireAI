"use server";

import { requireProUser } from "@/lib/auth";
import { prisma } from "../prisma";

export const WHEN_TO_START_OPTIONS = [
  "tomorrow",
  "in_2_days",
  "in_3_days",
  "next_week",
  "the_week_before",
  "2_weeks_before",
  "3_weeks_before",
  "4_weeks_before",
] as const;

export type WhenToStartStudying = (typeof WHEN_TO_START_OPTIONS)[number];

export interface CreateExamInput {
  title: string;
  subject?: string;
  studyMethods: string[];
  preferences?: string;
  date: Date;
  targetSessionsPerWeek: number;
  sessionLengthMinutes: number;
  whenToStartStudying: string;
}

export interface UpdateExamInput {
  title?: string;
  subject?: string;
  studyMethods?: string[];
  preferences?: string;
  date?: Date;
  targetSessionsPerWeek?: number;
  sessionLengthMinutes?: number;
  whenToStartStudying?: string;
}

export interface StudySessionData {
  id: number;
  examId: number;
  date: Date;
  duration: number;
  method: string;
  topic: string | null;
  status: "PLANNED" | "COMPLETED" | "SKIPPED";
}

export interface ExamWithStatus {
  id: number;
  userId: number;
  title: string;
  subject: string | null;
  studyMethods: string[];
  preferences: string | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  targetSessionsPerWeek: number;
  sessionLengthMinutes: number;
  whenToStartStudying: string;
  status: "UPCOMING" | "COMPLETED";
  scheduleStatus: "NONE" | "GENERATING" | "GENERATED" | "FAILED";
  studySessions: StudySessionData[];
}

/**
 * Get all exams for the currently authenticated PRO user
 * PROTECTED: Requires active PRO subscription
 */
export async function getExamsByUserId(): Promise<ExamWithStatus[]> {
  const dbUser = await requireProUser();

  const exams = await prisma.exam.findMany({
    where: { userId: dbUser.id },
    include: { studySessions: true },
    orderBy: { date: "asc" },
  });

  return exams.map((exam) => ({
    ...exam,
    studyMethods: exam.studyMethods as string[],
    studySessions: exam.studySessions.map((s) => ({
      id: s.id,
      examId: s.examId,
      date: s.date,
      duration: s.duration,
      method: s.method,
      topic: s.topic,
      status: s.status as StudySessionData["status"],
    })),
  }));
}

/**
 * Create a new exam for the currently authenticated PRO user
 * PROTECTED: Requires active PRO subscription
 */
export async function createExam(input: CreateExamInput): Promise<ExamWithStatus> {
  const dbUser = await requireProUser();

  // Validate input
  if (!input.title || input.title.trim() === "") {
    throw new Error("Title is required");
  }

  if (!input.date) {
    throw new Error("Exam date is required");
  }

  // Validate targetSessionsPerWeek
  if (!input.targetSessionsPerWeek || input.targetSessionsPerWeek < 1) {
    throw new Error("targetSessionsPerWeek must be at least 1");
  }

  // Validate whenToStartStudying
  if (!WHEN_TO_START_OPTIONS.includes(input.whenToStartStudying as WhenToStartStudying)) {
    throw new Error(`Invalid whenToStartStudying value: ${input.whenToStartStudying}`);
  }

  // Validate sessionLengthMinutes
  const validSessionLengths = [30, 45, 60, 90, 120];
  if (
    !input.sessionLengthMinutes ||
    !validSessionLengths.includes(input.sessionLengthMinutes)
  ) {
    throw new Error(
      "Invalid session length. Must be one of: 30, 45, 60, 90, or 120 minutes"
    );
  }

  const examDate = new Date(input.date);

  // Get the next available ID (since id is not autoincrement)
  const lastExam = await prisma.exam.findFirst({
    orderBy: { id: "desc" },
  });
  const nextId = (lastExam?.id ?? 0) + 1;

  const exam = await prisma.exam.create({
    data: {
      id: nextId,
      userId: dbUser.id,
      title: input.title.trim(),
      subject: input.subject?.trim() || null,
      studyMethods: input.studyMethods,
      preferences: input.preferences?.trim() || null,
      date: examDate,
      targetSessionsPerWeek: input.targetSessionsPerWeek,
      sessionLengthMinutes: input.sessionLengthMinutes,
      whenToStartStudying: input.whenToStartStudying,
    },
  });

  return {
    ...exam,
    studyMethods: exam.studyMethods as string[],
    studySessions: [] as StudySessionData[],
  };
}

/**
 * Delete an exam (only if owned by the current PRO user)
 * PROTECTED: Requires active PRO subscription
 */
export async function deleteExam(examId: number): Promise<void> {
  const dbUser = await requireProUser();

  // Verify ownership
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  if (exam.userId !== dbUser.id) {
    throw new Error("Unauthorized: You do not own this exam");
  }

  await prisma.exam.delete({
    where: { id: examId },
  });
}

/**
 * Update an existing exam (only if owned by the current PRO user)
 * Deletes old sessions and resets schedule so it regenerates.
 * PROTECTED: Requires active PRO subscription
 */
export async function updateExam(
  examId: number,
  input: UpdateExamInput
): Promise<ExamWithStatus> {
  const dbUser = await requireProUser();

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) throw new Error("Exam not found");
  if (exam.userId !== dbUser.id) throw new Error("Unauthorized");

  // Build update data from provided fields
  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.subject !== undefined) data.subject = input.subject.trim() || null;
  if (input.studyMethods !== undefined) data.studyMethods = input.studyMethods;
  if (input.preferences !== undefined) data.preferences = input.preferences.trim() || null;
  if (input.date !== undefined) data.date = new Date(input.date);
  if (input.targetSessionsPerWeek !== undefined) data.targetSessionsPerWeek = input.targetSessionsPerWeek;
  if (input.sessionLengthMinutes !== undefined) {
    data.sessionLengthMinutes = input.sessionLengthMinutes;
  }
  if (input.whenToStartStudying !== undefined) {
    data.whenToStartStudying = input.whenToStartStudying;
  }

  // Delete old sessions + update exam + reset schedule in one transaction
  const [, updated] = await prisma.$transaction([
    prisma.studySession.deleteMany({ where: { examId } }),
    prisma.exam.update({
      where: { id: examId },
      data: { ...data, scheduleStatus: "NONE" },
    }),
  ]);

  return {
    ...updated,
    studyMethods: updated.studyMethods as string[],
    studySessions: [],
  };
}

/**
 * Regenerate schedule for an exam by resetting its status
 * PROTECTED: Requires active PRO subscription
 */
export async function regenerateSchedule(examId: number): Promise<void> {
  const dbUser = await requireProUser();

  // Verify ownership
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  if (exam.userId !== dbUser.id) {
    throw new Error("Unauthorized: You do not own this exam");
  }

  // Delete existing study sessions and reset schedule status
  await prisma.$transaction([
    prisma.studySession.deleteMany({
      where: { examId },
    }),
    prisma.exam.update({
      where: { id: examId },
      data: { scheduleStatus: "NONE" },
    }),
  ]);
}
