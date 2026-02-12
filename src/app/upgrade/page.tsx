import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { PricingTable } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { CheckCircle2, Sparkles, Shield, CreditCard, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Upgrade to Pro",
  description:
    "Unlock AI-powered study schedules with SolaireAI Pro. Start your 7-day free trial.",
};

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 h-175 w-175 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-125 w-125 rounded-full bg-violet-500/8 blur-[100px]" />
        <div className="absolute top-[40%] left-[-10%] h-100 w-100 rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="flex flex-col items-center min-h-screen px-4 py-16 md:py-24">
        {/* Header section */}
        <div className="text-center mb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-[0.15em]">
              Upgrade to Pro
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Unlock Your Full{" "}
            <span className="bg-linear-to-r from-primary via-primary/80 to-violet-500 bg-clip-text text-transparent">
              Potential
            </span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            AI-powered study schedules, unlimited exams, and everything you need to ace your studies.
          </p>
        </div>

        {/* Pricing Table with subtle glow wrapper */}
        <div className="w-full max-w-3xl relative">
          <div className="absolute -inset-6 bg-linear-to-r from-primary/15 via-violet-500/10 to-primary/15 rounded-3xl blur-2xl opacity-40 pointer-events-none" />
          <div className="relative">
            <PricingTable
              newSubscriptionRedirectUrl="/dashboard"
              ctaPosition="bottom"
              appearance={{
                variables: {
                  colorPrimary: "#1c9cf0",
                  colorBackground: "#17181c",
                  colorForeground: "#e7e9ea",
                  colorMutedForeground: "#72767a",
                  colorBorder: "#242628",
                  colorInput: "#22303c",
                  colorInputForeground: "#e7e9ea",
                  colorNeutral: "#72767a",
                  borderRadius: "1rem",
                },
                elements: {
                  cardBox: "shadow-xl border border-white/5",
                  formButtonPrimary:
                    "bg-[#1c9cf0] hover:bg-[#1a8cd8] transition-all duration-200 shadow-lg shadow-[#1c9cf0]/20 font-semibold",
                },
              }}
            />
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-12">
          <div className="flex items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Secure Stripe Checkout</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">7-Day Free Trial</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors">
            <CreditCard className="h-4 w-4" />
            <span className="text-sm font-medium">No Upfront Payment</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors">
            <X className="h-4 w-4" />
            <span className="text-sm font-medium">Cancel Anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
