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

export const subjectSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().min(1),
});

// Validation schema
export const userSettingsSchema = z.object({
  restDays: z
    .array(z.enum(DAY_OPTIONS))
    .max(6, "You must have at least 1 available study day")
    .refine(
      (days) => days.length < 7,
      "Cannot mark all 7 days as rest days"
    ),
  subjects: z.array(subjectSchema).default([]),
});

export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
