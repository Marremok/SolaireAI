"use server";

import { requireProUser } from "@/lib/auth";
import { prisma } from "../prisma";
import {
  userSettingsSchema,
  type UserSettingsInput,
} from "../schemas/settings";
import { DEFAULT_SUBJECTS, type SubjectConfig } from "@/lib/colors";

/**
 * Get current user settings
 * PROTECTED: Requires active PRO subscription
 */
export async function getUserSettings(): Promise<UserSettingsInput | null> {
  const dbUser = await requireProUser();

  const settings = await prisma.user.findUnique({
    where: { id: dbUser.id },
    select: {
      restDays: true,
      subjects: true,
    },
  });

  if (!settings) return null;

  // If subjects is empty or not set, return default subjects
  const subjects = Array.isArray(settings.subjects) && settings.subjects.length > 0
    ? (settings.subjects as unknown as SubjectConfig[])
    : DEFAULT_SUBJECTS;

  return {
    restDays: settings.restDays as UserSettingsInput["restDays"],
    subjects,
  };
}

/**
 * Update user settings
 * PROTECTED: Requires active PRO subscription
 */
export async function updateUserSettings(
  input: UserSettingsInput
): Promise<UserSettingsInput> {
  const dbUser = await requireProUser();

  // Validate input
  const validated = userSettingsSchema.parse(input);

  // Update user settings
  const updatedUser = await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      restDays: validated.restDays,
      subjects: JSON.parse(JSON.stringify(validated.subjects)),
    },
    select: {
      restDays: true,
      subjects: true,
    },
  });

  const subjects = Array.isArray(updatedUser.subjects) && updatedUser.subjects.length > 0
    ? (updatedUser.subjects as unknown as SubjectConfig[])
    : DEFAULT_SUBJECTS;

  return {
    restDays: updatedUser.restDays as UserSettingsInput["restDays"],
    subjects,
  };
}
