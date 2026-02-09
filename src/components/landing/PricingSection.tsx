"use client"

import { Button } from "@/components/ui/button"
import { SignUpButton } from "@clerk/nextjs"
import { motion } from "framer-motion"
import { Sparkles, CheckCircle2, Zap, Trophy, Timer, Brain, Notebook, ArrowRight, Bed } from "lucide-react"
import { PRICING } from "@/lib/constants"

export default function SingleTierPricing() {
  const features = [
    { icon: Brain, text: "AI-Generated Personalized Study Schedule" },
    { icon: Bed, text: "Choose your rest days" },
    { icon: Notebook, text: "Set Your Preferences" },
    { icon: Zap, text: "Unlimited Active Exams" },
  ]

  return (
    <section className="relative py-32 px-6 overflow-hidden bg-background" id="pricingsection">
      {/* --- EXTRA FANCY BACKGROUND --- */}
      <div className="absolute inset-0 -z-10">
        {/* Animated Radial Sken */}
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-200 w-200 rounded-full bg-primary/20 blur-[120px]" 
        />
        {/* Professional Mesh Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_at_center,black,transparent)]"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md mb-6"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-[0.2em]">The Full Experience</span>
          </motion.div>
          
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
            Master Every Exam. <br />
            <span className="bg-linear-to-r from-primary via-primary/80 to-violet-500 bg-clip-text text-transparent">
              With one simple plan.
            </span>
          </h2>
        </div>

        {/* --- THE HERO PRICING CARD --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Outer Glow Border Effect */}
          <div className="absolute -inset-1 bg-linear-to-r from-primary/50 to-violet-500/50 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          
          <div className="relative bg-card/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-16 shadow-2xl overflow-hidden">
            
            {/* Decorative Top Right Glow */}
            <div className="absolute -top-24 -right-24 h-64 w-64 bg-primary/10 blur-[80px] rounded-full"></div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              
              {/* Left: Value Prop */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-3xl font-bold mb-2">SolaireAI Pro</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Everything you need to excel with your studies. No tiers, no limits, just your best grades yet.
                  </p>
                </div>

                <ul className="space-y-4">
                  {features.map((item, i) => (
                    <li key={i} className="flex items-center gap-4 group">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: The Hook & CTA */}
              <div className="relative flex flex-col items-center justify-center p-8 rounded-4xl bg-linear-to-b from-primary/5 to-transparent border border-primary/10">
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-6xl font-black tracking-tight text-foreground">{PRICING.MONTHLY_PRICE}</span>
                    <span className="text-muted-foreground text-xl">/mo</span>
                  </div>
                  <p className="text-sm font-bold text-primary uppercase tracking-widest">
                    Free for your first {PRICING.TRIAL_DAYS} days
                  </p>
                </div>

                <SignUpButton mode="modal">
                  <Button 
                    className="relative w-full h-14 px-8 overflow-hidden rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] active:scale-[0.98]"
                  >
                    {/* Shimmer-effekt som sveper över knappen */}
                    <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                    
                    <span className="relative flex items-center justify-center gap-2">
                      Start Free Trial
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </SignUpButton>

                <p className="mt-6 text-xs text-muted-foreground text-center max-w-50">
                  Billed monthly after trial. Cancel anytime with one click.
                </p>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Sub-footer trust badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> <span className="text-sm font-semibold tracking-tighter">SECURE STRIPE CHECKOUT</span></div>
             <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> <span className="text-sm font-semibold tracking-tighter">NO UPFRONT PAYMENT</span></div>
             <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> <span className="text-sm font-semibold tracking-tighter">CANCEL ANYTIME</span></div>
        </div>
      </div>

      {/* Tailwind Custom Animation for the button */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 5s linear infinite;
        }
      `}</style>
    </section>
  )
}