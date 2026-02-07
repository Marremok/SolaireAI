import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UpgradeCard } from "@/components/upgrade/UpgradeCard";

/**
 * Upgrade page - shown when user tries to access PRO features without subscription
 *
 * If user already has PRO, redirect to dashboard
 * If user not authenticated, redirect to sign-in
 */
export default async function UpgradePage() {
  const user = await requireAuth();

  // If user already has PRO, redirect to dashboard
  if (user.subscriptionStatus === "active") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <UpgradeCard />
    </div>
  );
}
