"use server";

import { requireProUser } from "@/lib/auth";
import { prisma } from "../prisma";
import {
  userSettingsSchema,
  type UserSettingsInput,
} from "../schemas/settings";

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
    },
  });

  // Type assertion: Prisma returns string[] but we know it contains valid enum values
  return settings as UserSettingsInput;
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
    },
    select: {
      restDays: true,
    },
  });

  // Type assertion: Prisma returns string[] but we know it contains valid enum values
  return updatedUser as UserSettingsInput;
}
