"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, Zap, Calendar, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { SmartCTAButton } from "@/components/landing/UpgradeButton"

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      
      {/* --- REFINED BACKGROUND LAYER (Pricing Style) --- */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-br from-background via-muted/5 to-primary/5">
          {/* Precise Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_75%_50%_at_50%_50%,#000_50%,transparent_85%)] opacity-20" />
        </div>
        {/* Soft Center Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.06),transparent_70%)]" />
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="container relative z-10 mx-auto">
        <div className="flex flex-col items-center text-center">
          
          {/* Badge: Styled like the Pricing "Simple Pricing" badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-linear-to-r from-primary/5 to-primary/10 px-4 py-2 backdrop-blur-sm"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="text-sm font-medium text-primary">AI Study Planner</span>
          </motion.div>

          {/* Headline: Using the Pricing Section's linear Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
              <span className="bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Master your studies
              </span>
              <br />
              <span className="bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                and save time.
              </span>
            </h1>
          </motion.div>

          {/* Subtext: Muted and readable */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            SolaireAI intelligently organizes your syllabus into a balanced schedule. 
            Focus on learning while we handle the cognitive load of planning.
          </motion.p>

          {/* Primary Actions: Rounded-xl and linear Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 flex flex-col items-center gap-4 sm:flex-row"
          >
            <SmartCTAButton
              size="lg"
              className="h-14 rounded-xl bg-linear-to-r from-primary to-primary/90 px-8 font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95"
            >
              <>
                Start 7-day free trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            </SmartCTAButton>

            <Button
              size="lg"
              variant="outline"
              className="h-14 rounded-xl border border-primary/20 bg-background/50 px-8 font-semibold backdrop-blur-sm transition-all hover:bg-primary/5 hover:border-primary/40"
              onClick={() => {
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See how it works
              <Zap className="ml-2 h-4 w-4 text-primary" />
            </Button>
          </motion.div>

          {/* Feature Strip: Subtle trust indicators under the CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>7-day Free Trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Unlimited Usage</span>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Subtle Bottom Fade (to blend into next section) */}
      <div className="absolute bottom-0 h-24 w-full bg-linear-to-t from-background to-transparent" />
    </section>
  )
}