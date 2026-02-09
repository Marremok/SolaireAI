"use client"

import { motion } from "framer-motion"
import { Heart, Sparkles, GraduationCap, BookOpen, Coins, UserStar } from "lucide-react"

export default function AboutSection() {
  return (
    <section id="about" className="relative py-32 bg-background overflow-hidden">
      <div className="container relative z-10 mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6"
            >
              <Heart className="h-3.5 w-3.5 text-primary fill-primary/20" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Our Story</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8">
              Built by students, <br />
              <span className="text-muted-foreground font-medium italic text-3xl md:text-5xl">because we've been there too.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Passion over Profit
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                We created SolaireAI because we know what it feels like to be overwhelmed.
                We've been the students staring at impossible schedules, unsure where to start, afraid of wasting time.
                We've felt the frustration of wanting to study—but not knowing how to organize it.
                SolaireAI exists to change that experience for you.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our mission is simple: to build the tool we wish we had.
                Easy to use, thoughtfully designed, and focused on helping you get things done.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="grid gap-4"
            >
              <div className="p-6 rounded-4xl bg-card/50 border border-white/5 backdrop-blur-sm">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <UserStar className="h-5 w-5" />
                </div>
                <h4 className="font-bold mb-2">Personalized Experience</h4>
                <p className="text-sm text-muted-foreground">Every student is different, with different goals and capacities.</p>
              </div>

              <div className="p-6 rounded-4xl bg-card/50 border border-white/5 backdrop-blur-sm">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 text-violet-400">
                  <Coins className="h-5 w-5" />
                </div>
                <h4 className="font-bold mb-2">Generous Plan</h4>
                <p className="text-sm text-muted-foreground">Get all features and unlimited usage with one plan</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}