import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";

/**
 * Database user with full type information
 */
export type DbUser = {
  id: number;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
  maxHoursPerWeek: number;
  restDays: string[];
};

/**
 * Check if the current user has an active PRO subscription
 * Uses Clerk Billing — reads from session token, no DB query needed
 */
export async function isProUser(): Promise<boolean> {
  const { has } = await auth();
  return has({ plan: "pro" });
}

/**
 * Get the current authenticated database user
 * Returns null if not authenticated
 */
export async function getCurrentDbUser(): Promise<DbUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  return dbUser as DbUser | null;
}

/**
 * CRITICAL: Require PRO subscription for access
 *
 * This is the main gate-keeping function. Use it in:
 * - All server actions (createExam, updateSettings, etc.)
 * - All API routes (/api/schedule, etc.)
 * - All dashboard page components
 *
 * Uses Clerk Billing has({ plan: "pro" }) for subscription check,
 * then fetches DB user for app data (maxHoursPerWeek, restDays, etc.)
 *
 * @param shouldRedirect - If true, redirects to /upgrade on failure. If false, throws error.
 * @returns The authenticated PRO user
 * @throws Error if user is not authenticated or not PRO
 */
export async function requireProUser(shouldRedirect = true): Promise<DbUser> {
  const { has, userId } = await auth();

  // Not authenticated at all
  if (!userId) {
    if (shouldRedirect) {
      redirect("/sign-in");
    }
    throw new Error("Unauthorized: No user found");
  }

  // Authenticated but not PRO
  if (!has({ plan: "pro" })) {
    if (shouldRedirect) {
      redirect("/upgrade");
    }
    throw new Error("PRO subscription required");
  }

  // Fetch DB user for app data
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!dbUser) {
    if (shouldRedirect) {
      redirect("/sign-in");
    }
    throw new Error("User not found in database");
  }

  return dbUser as DbUser;
}

/**
 * Require authentication (but not necessarily PRO)
 * Use this for routes that need auth but not subscription
 */
export async function requireAuth(): Promise<DbUser> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!dbUser) {
    redirect("/sign-in");
  }

  return dbUser as DbUser;
}

/**
 * API Route version: Check if user has PRO subscription
 * Returns null if not PRO (for API routes that can't use redirect)
 *
 * @returns DbUser if PRO, null otherwise
 */
export async function getProUserOrNull(): Promise<DbUser | null> {
  const { has, userId } = await auth();

  if (!userId || !has({ plan: "pro" })) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  return dbUser as DbUser | null;
}
