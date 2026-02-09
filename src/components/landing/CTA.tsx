"use client"

import { Button } from "@/components/ui/button"
import { SignUpButton } from "@clerk/nextjs"
import { motion } from "framer-motion"
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function CTA() {
  return (
    <section className="relative py-32 px-6 overflow-hidden bg-background" id="CTA">
      {/* --- SAME DYNAMIC BACKGROUND AS PRICING --- */}
      <div className="absolute inset-0 -z-10">
        <motion.div 
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-150 w-150 rounded-full bg-primary/20 blur-[100px]" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_at_center,black,transparent)]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* --- TEXT CONTENT (CENTERED TOP) --- */}
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md mb-6"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Final Step</span>
          </motion.div>

          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-[0.9]">
            Ready to transform <br />
            <span className="bg-linear-to-r from-primary via-primary/80 to-violet-500 bg-clip-text text-transparent">
              your study habits?
            </span>
          </h2>
          
          <div className="flex flex-col items-center gap-6">
            <SignUpButton mode="modal">
              <Button 
                className="relative h-14 px-10 overflow-hidden rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all duration-300 hover:scale-[1.05]"
              >
                <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                <span className="relative flex items-center justify-center gap-2">
                  Start Your Free Trial
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
            </SignUpButton>
            
            <div className="flex gap-6 opacity-60">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <CheckCircle2 className="h-4 w-4 text-primary" /> No Card Needed
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <CheckCircle2 className="h-4 w-4 text-primary" /> 7-Day Trial
              </div>
            </div>
          </div>
        </div>

        {/* --- DUAL IMAGE FOCUS --- */}
        <div className="relative flex flex-col lg:flex-row items-end justify-center gap-8 lg:gap-12 w-full">
          
          {/* Image 1: Main Dashboard (Desktop) */}
          <motion.div 
            initial={{ opacity: 0, x: -30, y: 20 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-full lg:w-[65%] z-10"
          >
            <div className="relative aspect-1213/722 rounded-4xl md:rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.7)] bg-card/50">
              <Image 
                src="/calendar.png" 
                alt="Dashboard" 
                fill 
                className="object-cover object-top"
                priority 
              />
              <div className="absolute inset-0 bg-linear-to-tr from-black/20 via-transparent to-white/5 pointer-events-none" />
            </div>
          </motion.div>

          {/* Image 2: Mobile App (Portrait) */}
          <motion.div 
            initial={{ opacity: 0, x: 30, y: 40 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative w-[50%] lg:w-[25%] z-20"
          >
            {/* Glow behind mobile */}
            <div className="absolute inset-0 bg-primary/20 blur-[60px] -z-10" />
            
            <div className="relative aspect-504/854 rounded-4xl md:rounded-[2.5rem] overflow-hidden border-[6px] border-background shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)]">
              <Image 
                src="/addexam.png" 
                alt="Mobile App" 
                fill 
                className="object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </section>
  )
}