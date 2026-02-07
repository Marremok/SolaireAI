"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getUserSettings, updateUserSettings } from "@/lib/actions/settings";
import { regenerateSchedule } from "@/lib/actions/exam";
import type { UserSettingsInput } from "@/lib/schemas/settings";
import type { ExamWithStatus } from "@/lib/actions/exam";

export const settingsKeys = {
  all: ["settings"] as const,
  detail: () => [...settingsKeys.all, "detail"] as const,
};

/**
 * Hook to fetch user settings
 */
export function useUserSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: async () => {
      const settings = await getUserSettings();
      return settings;
    },
  });
}

/**
 * Hook to update user settings
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UserSettingsInput) => {
      const updated = await updateUserSettings(input);
      return updated;
    },
    onMutate: async (newSettings) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: settingsKeys.detail() });

      // Snapshot previous value
      const previousSettings =
        queryClient.getQueryData<UserSettingsInput>(settingsKeys.detail());

      // Optimistically update
      queryClient.setQueryData(settingsKeys.detail(), newSettings);

      return { previousSettings };
    },
    onError: (_err, _newSettings, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(settingsKeys.detail(), context.previousSettings);
      }
    },
    onSuccess: async () => {
      // Invalidate settings
      queryClient.invalidateQueries({ queryKey: settingsKeys.detail() });

      // Trigger regeneration for all exams with generated schedules
      const examsData = queryClient.getQueryData<ExamWithStatus[]>(["exams", "list"]);

      if (examsData) {
        const generatedExams = examsData.filter(
          (exam) => exam.scheduleStatus === "GENERATED"
        );

        if (generatedExams.length > 0) {
          toast.info("Regenerating schedules", {
            description: `Updating ${generatedExams.length} exam schedule(s) with new settings...`,
          });
        }

        // Regenerate all schedules in parallel
        await Promise.all(
          generatedExams.map(async (exam) => {
            try {
              // Reset schedule status
              await regenerateSchedule(exam.id);

              // Trigger new schedule generation
              await fetch("/api/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ examId: exam.id }),
              });
            } catch (error) {
              console.error(`Failed to regenerate schedule for exam ${exam.id}:`, error);
              toast.error(`Failed to update schedule for ${exam.title}`);
            }
          })
        );
      }

      // Invalidate exams cache (since settings affect scheduling)
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
  });
}
