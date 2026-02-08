import { auth } from "@clerk/nextjs/server";
import { PricingTable } from "@clerk/nextjs";
import { redirect } from "next/navigation";

/**
 * Upgrade page — shows Clerk PricingTable for users without PRO subscription
 *
 * If user already has PRO, redirect to dashboard
 * If user not authenticated, redirect to sign-in
 */
export default async function UpgradePage() {
  const { has, userId } = await auth();

  if (!userId) redirect("/sign-in");
  if (has({ plan: "pro" })) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <PricingTable />
      </div>
    </div>
  );
}
