import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { PricingTable, UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { CheckCircle2, Sparkles, Shield, CreditCard, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

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

  if (!userId) redirect("/");
  if (has({ plan: "pro" })) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/20">
      {/* Background glow effects - Enhanced */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 h-200 w-200 rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] h-160 w-160 rounded-full bg-violet-500/10 blur-[100px]" />
        <div className="absolute top-[40%] left-[-10%] h-120 w-120 rounded-full bg-primary/5 blur-[100px]" />
      </div>

      {/* NEW: Floating Navigation Header */}
      <nav className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-6 md:px-12">
        {/* Left: Back Link with Glass effect & Slide Animation */}
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/40 backdrop-blur-md border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Back to Dashboard
          </span>
        </Link>

        {/* Right: User Button with Halo Effect */}
        <div className="flex items-center gap-4">
          <div className="relative p-0.5 rounded-xl bg-linear-to-b from-white/10 to-transparent">
             <div className="bg-background/50 backdrop-blur-md rounded-[10px] p-1.5">
              <UserButton
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
                    borderRadius: "0.75rem",
                  },
                  elements: {
                    userButtonAvatarBox: "h-8 w-8",
                    userButtonPopoverCard:
                      "rounded-2xl border border-white/5 shadow-2xl bg-[#17181c]",
                    userButtonTrigger: "focus:shadow-none focus:outline-hidden",
                    userButtonPopoverActionButton:
                      "hover:bg-white/5 transition-colors rounded-lg",
                    userButtonPopoverActionButtonText:
                      "text-[#e7e9ea] text-sm font-medium",
                    userButtonPopoverActionButtonIcon: "text-[#72767a]",
                    userButtonPopoverFooter: "hidden",
                  },
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Action label="manageAccount" />
                  <UserButton.Action label="signOut" />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col items-center min-h-screen px-4 pt-32 pb-16 md:pb-24">
        {/* Header section */}
        <div className="text-center mb-12 max-w-2xl relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-6 shadow-[0_0_15px_rgba(28,156,240,0.2)]">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-[0.15em]">
              Upgrade to Pro
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
            Unlock Your Full{" "}
            <span className="bg-linear-to-r from-primary via-blue-400 to-violet-500 bg-clip-text text-transparent animate-gradient-x">
              Potential
            </span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            AI-powered study schedules, unlimited exams, and everything you need
            to ace your studies.
          </p>
        </div>

        {/* Pricing Table with subtle glow wrapper */}
        <div className="w-full max-w-3xl relative z-10">
          <div className="absolute -inset-1 bg-linear-to-r from-primary/20 via-violet-500/20 to-primary/20 rounded-4xl blur-xl opacity-50 pointer-events-none" />
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
                  cardBox: "shadow-2xl border border-white/10 bg-[#17181c]/80 backdrop-blur-xl",
                  formButtonPrimary:
                    "bg-[#1c9cf0] hover:bg-[#1a8cd8] transition-all duration-200 shadow-lg shadow-[#1c9cf0]/20 font-semibold hover:scale-[1.02] active:scale-[0.98]",
                },
              }}
            />
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-12 opacity-80">
          <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-300">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Secure Stripe Checkout</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-300">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">7-Day Free Trial</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-300">
            <CreditCard className="h-4 w-4" />
            <span className="text-sm font-medium">No Upfront Payment</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-300">
            <X className="h-4 w-4" />
            <span className="text-sm font-medium">Cancel Anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}