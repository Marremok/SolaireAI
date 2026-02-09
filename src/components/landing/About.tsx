"use client"

import { motion } from "framer-motion"
import { Heart, Sparkles, Coins, UserStar } from "lucide-react"

export default function AboutSection() {
  return (
    <section id="about" className="relative py-32 bg-background overflow-hidden border-t border-primary/5">
      {/* Subtle Background Glow to define the area */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.03),transparent_70%)] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm mb-6"
            >
              <Heart className="h-3.5 w-3.5 text-primary fill-primary/20 animate-pulse" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Our Story</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8">
              Built by students, <br />
              <span className="text-muted-foreground font-medium italic text-3xl md:text-5xl">because we've been there too.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left Side: Story Text */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 group cursor-default">
                  <div className="p-2 rounded-lg bg-primary/10 transition-transform duration-300">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  Passion over Profit
                </h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    We created SolaireAI because we know what it feels like to be overwhelmed.
                    We've been the students staring at impossible schedules, unsure where to start, afraid of wasting time.
                  </p>
                  <p>
                    We've felt the frustration of wanting to study—but not knowing how to organize it.
                    SolaireAI exists to change that experience for you.
                  </p>
                  <p className="font-medium text-foreground/80">
                    Our mission is simple: to build the tool we wish we had.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right Side: Interactive Feature Cards */}
            <div className="space-y-4">
              {/* Card 1 */}
              <motion.div 
                whileHover={{ x: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="group relative p-6 rounded-3xl bg-card/40 border border-white/5 backdrop-blur-md hover:bg-card/60 hover:border-primary/20 transition-all cursor-default"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <UserStar className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-foreground">Personalized Experience</h4>
                    <p className="text-sm text-muted-foreground leading-snug">Every student is different, with different goals and capacities.</p>
                  </div>
                </div>
              </motion.div>

              {/* Card 2 */}
              <motion.div 
                whileHover={{ x: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="group relative p-6 rounded-3xl bg-card/40 border border-white/5 backdrop-blur-md hover:bg-card/60 hover:border-violet-500/20 transition-all cursor-default"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all duration-300">
                    <Coins className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-foreground">Generous Plan</h4>
                    <p className="text-sm text-muted-foreground leading-snug">Get all features and unlimited usage with one plan</p>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}