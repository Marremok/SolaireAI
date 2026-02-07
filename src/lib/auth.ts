import { currentUser } from "@clerk/nextjs/server";
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
  // REMOVED: preferredSessionLengthMinutes (moved to Exam model)
  // REMOVED: studyIntensity (no longer needed - pure math)
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: Date | null;
  subscriptionStatus: string | null;
  plan: "FREE" | "PRO";
};

/**
 * Check if a user has an active PRO subscription
 * A user is PRO if subscriptionStatus is exactly "active"
 */
export function isProUser(user: DbUser): boolean {
  return user.subscriptionStatus === "active";
}

/**
 * Get the current authenticated database user
 * Returns null if not authenticated
 */
export async function getCurrentDbUser(): Promise<DbUser | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
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
 * @param shouldRedirect - If true, redirects to /upgrade on failure. If false, throws error.
 * @returns The authenticated PRO user
 * @throws Error if user is not authenticated or not PRO
 */
export async function requireProUser(shouldRedirect = true): Promise<DbUser> {
  const user = await getCurrentDbUser();

  // Not authenticated at all
  if (!user) {
    if (shouldRedirect) {
      redirect("/sign-in");
    }
    throw new Error("Unauthorized: No user found");
  }

  // Authenticated but not PRO
  if (!isProUser(user)) {
    if (shouldRedirect) {
      redirect("/upgrade");
    }
    throw new Error(
      "PRO subscription required. Current status: " +
        (user.subscriptionStatus || "none")
    );
  }

  return user;
}

/**
 * Require authentication (but not necessarily PRO)
 * Use this for routes that need auth but not subscription
 */
export async function requireAuth(): Promise<DbUser> {
  const user = await getCurrentDbUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

/**
 * API Route version: Check if user has PRO subscription
 * Returns null if not PRO (for API routes that can't use redirect)
 *
 * @returns DbUser if PRO, null otherwise
 */
export async function getProUserOrNull(): Promise<DbUser | null> {
  const user = await getCurrentDbUser();

  if (!user || !isProUser(user)) {
    return null;
  }

  return user;
}
