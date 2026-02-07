"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sparkles, CalendarRange, CheckCircle2 } from "lucide-react"
import { SmartCTAButton } from "@/components/landing/UpgradeButton"

export default function CTA() {
  return (
    <section className="relative overflow-hidden py-24 px-6 bg-background">
      
      {/* --- BACKGROUND DECORATION --- */}
      
      {/* Subtle linear Fade */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-primary/5" />
      
      {/* Radial Pattern (The "Pulse" of the page) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05),transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          
          {/* --- LEFT CONTENT --- */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              
              {/* Animated Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
                <span className="text-xs font-medium text-primary">Limited time free access</span>
              </div>

              {/* Main Headline with Gradient */}
              <h2 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                <span className="text-foreground">
                  Stop stressing.
                </span>
                <br />
                <span className="bg-linear-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                  Start passing.
                </span>
              </h2>

              <p className="mx-auto text-lg leading-relaxed text-muted-foreground lg:mx-0 max-w-lg">
                Don't let exam season overwhelm you. Join 10,000+ students using SolaireAI to generate their perfect study roadmap in seconds.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <SmartCTAButton
                size="lg"
                className="group relative h-12 overflow-hidden rounded-xl bg-primary px-8 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
              >
                <>
                  <div className="relative z-10 flex items-center gap-2 font-semibold">
                    <Sparkles className="h-4 w-4" />
                    Generate my Schedule
                  </div>
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                </>
              </SmartCTAButton>

              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-primary/20 bg-background/50 px-8 font-semibold backdrop-blur-sm transition-all hover:bg-primary/5 hover:border-primary/40"
                onClick={() => {
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <CalendarRange className="mr-2 h-4 w-4" />
                See Example Plan
              </Button>
            </div>
            
            {/* Mini Trust Signal */}
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground lg:justify-start pt-2">
                <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>No credit card</span>
                </div>
                <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Cancel anytime</span>
                </div>
            </div>
          </div>

          {/* --- RIGHT CONTENT (IMAGE) --- */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative group">
              
              {/* Floating Badge (Top Left) */}
              <div className="absolute -left-6 top-8 z-20 animate-bounce delay-700 rounded-xl border border-white/10 bg-background/80 p-3 shadow-xl backdrop-blur-md transition-transform duration-300 hover:scale-105 animation-duration-[3s]">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1,2,3].map((i) => (
                        <div key={i} className="h-6 w-6 rounded-full bg-slate-200 border-2 border-background" />
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">10k+ Students</p>
                    <p className="text-[10px] text-muted-foreground">Planning now</p>
                  </div>
                </div>
              </div>

              {/* Main Image Glow/Backdrop */}
              <div className="absolute inset-0 translate-y-4 rounded-3xl bg-linear-to-tr from-primary/20 to-violet-500/20 blur-2xl transition-all duration-500 group-hover:blur-3xl" />

              {/* The Image (Placeholder - replace src with your app screenshot) */}
              {/* I've added a border and shadow to make it look like a floating UI card */}
              <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-background shadow-2xl transition-transform duration-500 hover:-translate-y-2">
                 <Image
                  src="/dashboard-mockup.png" // Replace this with your actual image
                  alt="SolaireAI Dashboard Preview"
                  width={600}
                  height={500}
                  className="w-87.5 md:w-112.5 object-cover"
                />
                
                {/* If you don't have an image yet, this overlay simulates a UI looks */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/5 text-muted-foreground/20">
                    <p className="font-mono text-sm">Dashboard Preview</p>
                </div>
              </div>

              {/* Floating Badge (Bottom Right) */}
              <div className="absolute -bottom-6 -right-4 z-20 rounded-full border border-primary/20 bg-background/90 px-4 py-2 shadow-xl backdrop-blur-md">
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold">AI Online</span>
                 </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}