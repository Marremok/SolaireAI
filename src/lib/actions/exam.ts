"use server";

import { requireProUser } from "@/lib/auth";
import { prisma } from "../prisma";

export interface CreateExamInput {
  title: string;
  subject?: string;
  studyMethods: string[];
  description?: string;
  date: Date;
  hoursPerWeek?: number;
  preferredSessionLengthMinutes: number; // NEW: Per-exam session length preference
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
  description: string | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  hoursPerWeek: number | null;
  preferredSessionLengthMinutes: number; // NEW: Per-exam session length preference
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
    preferredSessionLengthMinutes: (exam as any).preferredSessionLengthMinutes ?? 60,
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

  // Validate preferredSessionLengthMinutes
  const validSessionLengths = [30, 45, 60, 90, 120];
  if (
    !input.preferredSessionLengthMinutes ||
    !validSessionLengths.includes(input.preferredSessionLengthMinutes)
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
      description: input.description?.trim() || null,
      date: examDate,
      hoursPerWeek: input.hoursPerWeek || null,
      preferredSessionLengthMinutes: input.preferredSessionLengthMinutes,
    },
  });

  return {
    ...exam,
    studyMethods: exam.studyMethods as string[],
    preferredSessionLengthMinutes: (exam as any).preferredSessionLengthMinutes ?? input.preferredSessionLengthMinutes,
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
