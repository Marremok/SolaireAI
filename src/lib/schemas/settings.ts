import { z } from "zod";

// Day enum
export const DAY_OPTIONS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

// REMOVED: SESSION_LENGTH_OPTIONS (moved to Exam level)
// REMOVED: INTENSITY_OPTIONS (no longer needed - pure math instead)

// Validation schema - simplified to only User-level settings
export const userSettingsSchema = z.object({
  maxHoursPerWeek: z
    .number()
    .min(0.5, "Minimum 0.5 hours per week")
    .max(168, "Maximum 168 hours per week"),

  restDays: z
    .array(z.enum(DAY_OPTIONS))
    .max(6, "You must have at least 1 available study day")
    .refine(
      (days) => days.length < 7,
      "Cannot mark all 7 days as rest days"
    ),
});

export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
