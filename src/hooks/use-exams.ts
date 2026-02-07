"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExamsByUserId, createExam, deleteExam, type CreateExamInput, type ExamWithStatus } from "@/lib/actions/exam";

// Query keys for cache management
export const examKeys = {
  all: ["exams"] as const,
  list: () => [...examKeys.all, "list"] as const,
};

/**
 * Hook to fetch all exams for the current user
 */
export function useExams() {
  return useQuery({
    queryKey: examKeys.list(),
    queryFn: async () => {
      const exams = await getExamsByUserId();
      return exams;
    },
    refetchInterval: (query) => {
      const exams = query.state.data;
      if (!exams) return false;
      return exams.some((e) => e.scheduleStatus === "GENERATING") ? 2000 : false;
    },
  });
}

/**
 * Hook to create a new exam
 * Automatically invalidates the exams cache on success
 */
export function useCreateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExamInput) => {
      const exam = await createExam(input);
      return exam;
    },
    onSuccess: async (exam) => {
      // Wait for the refetch to complete before continuing
      await queryClient.invalidateQueries({ queryKey: examKeys.list() });

      // Trigger async schedule generation — fire and forget
      fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: exam.id }),
      });
    },
  });
}

/**
 * Hook to delete an exam
 * Automatically invalidates the exams cache on success
 */
export function useDeleteExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (examId: number) => {
      await deleteExam(examId);
    },
    onSuccess: () => {
      // Invalidate and refetch exams list
      queryClient.invalidateQueries({ queryKey: examKeys.list() });
    },
  });
}

/**
 * Helper to get upcoming exams from the exams list
 */
export function filterUpcomingExams(exams: ExamWithStatus[] | undefined): ExamWithStatus[] {
  if (!exams) return [];
  return exams.filter((exam) => exam.status === "UPCOMING");
}

/**
 * Helper to get completed exams from the exams list
 */
export function filterCompletedExams(exams: ExamWithStatus[] | undefined): ExamWithStatus[] {
  if (!exams) return [];
  return exams.filter((exam) => exam.status === "COMPLETED");
}
