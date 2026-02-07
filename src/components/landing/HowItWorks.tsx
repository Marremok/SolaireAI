"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { CalendarPlus, Cpu, BookOpenCheck, ArrowRight } from "lucide-react"
import { useRef } from "react"

const steps = [
  {
    title: "Add your exams",
    description: "Simply input your exam dates and study materials. Our interface makes data entry feel like a breeze.",
    icon: CalendarPlus,
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400",
  },
  {
    title: "AI Optimization",
    description: "SolaireAI analyzes your cognitive load and peak focus hours to build the scientifically perfect schedule.",
    icon: Cpu,
    color: "from-primary/20 to-violet-500/20",
    iconColor: "text-primary",
  },
  {
    title: "Start Studying",
    description: "Wake up to a clear roadmap every day. Focus on learning while we handle the logistics.",
    icon: BookOpenCheck,
    color: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
  },
]

export default function HowItWorks() {
  const containerRef = useRef(null)

  return (
    <section id="how-it-works" ref={containerRef} className="relative py-5 bg-background overflow-hidden">
      
      {/* --- BREATHTAKING BACKGROUND ELEMENTS --- */}
      <div className="absolute inset-0 z-0">
        {/* Animated Light Beam */}
        <motion.div 
          animate={{ 
            translateX: ["-100%", "100%"],
            opacity: [0, 0.3, 0] 
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 h-px w-full bg-linear-to-r from-transparent via-primary to-transparent"
        />
        
        {/* Large Decorative Orb */}
        <div className="absolute -bottom-[20%] -right-[10%] h-150 w-150 rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-6">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-24">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-xs font-black tracking-[0.3em] text-primary uppercase bg-primary/10 px-4 py-2 rounded-full border border-primary/20"
          >
            How It Works
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 text-4xl md:text-6xl font-bold tracking-tighter text-foreground"
          >
            From failing to <br className="hidden md:block" />
            <span className="bg-linear-to-r from-primary via-primary/80 to-violet-400 bg-clip-text text-transparent">
              Academic Brilliance
            </span>
          </motion.h2>
        </div>

        {/* --- STEPS GRID --- */}
        <div className="relative grid gap-12 lg:grid-cols-3">
          
          {/* Background Connecting Line for Desktop */}
          <div className="absolute top-10 left-0 hidden h-0.5 w-full bg-muted/20 lg:block">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-linear-to-r from-primary/50 to-violet-500/50"
            />
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="group relative"
            >
              {/* Card Container */}
              <div className="relative z-10 flex flex-col items-center lg:items-start p-8 rounded-[2.5rem] border border-white/5 bg-card/30 backdrop-blur-md transition-all duration-500 hover:border-primary/30 hover:bg-card/50">
                
                {/* Icon Circle with Glow */}
                <div className={`relative mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br ${step.color} border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    <step.icon className={`h-10 w-10 ${step.iconColor}`} />
                    {/* Inner glow effect */}
                    <div className="absolute inset-0 rounded-3xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Content */}
                <div className="text-center lg:text-left">
                    <div className="mb-4 flex items-center justify-center lg:justify-start gap-3">
                        <span className="text-sm font-bold text-primary/40 tracking-widest uppercase">Step 0{index + 1}</span>
                        <div className="h-px w-8 bg-primary/20" />
                    </div>
                    
                    <h3 className="mb-4 text-2xl font-bold text-foreground">
                        {step.title}
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                    </p>
                </div>

                {/* Subtle Arrow (except for last item) */}
                {index !== steps.length - 1 && (
                    <ArrowRight className="absolute -right-6 top-1/2 hidden lg:block h-6 w-6 text-primary/20 group-hover:text-primary/50 transition-colors" />
                )}
              </div>

              {/* Hover Background Glow */}
              <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-primary/5 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>

        {/* --- BOTTOM CTA --- */}
        <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-20 text-center"
        >
            <p className="text-sm text-muted-foreground italic">
                Ready to transform your study habits? 
                <span className="ml-2 text-primary font-bold cursor-pointer hover:underline">Start your 7-day trial →</span>
            </p>
        </motion.div>
      </div>
    </section>
  )
}