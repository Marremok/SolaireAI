"use client"

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function LandingHeader() {
  return (
    <motion.nav 
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 right-0 left-0 z-50 h-16 border-b border-white/5 bg-background/80 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto h-full px-6 flex justify-between items-center">
        
        {/* --- LOGO --- */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
             {/* Subtle glow behind logo */}
            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Image 
              src="/logo.png" 
              alt="SolaireAI Logo" 
              width={36} 
              height={36} 
              className="relative w-9 h-9 object-contain"
            />
          </div>
          <span className="font-bold text-xl tracking-tighter bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            SolaireAI
          </span>
        </Link>

        {/* --- NAVIGATION LINKS --- */}
        <div className="hidden md:flex items-center gap-10">
          {["How it Works", "Pricing", "About"].map((item) => (
            <Link 
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* --- AUTH ACTIONS --- */}
        <div className="flex items-center gap-3">
          <SignInButton mode="modal" >
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm font-semibold hover:bg-primary/5 hover:text-primary transition-all"
            >
              Login
            </Button>
          </SignInButton>
          
          <SignUpButton mode="modal">
            <Button 
              size="sm" 
              className="rounded-xl px-5 bg-linear-to-r from-primary to-primary/90 font-bold shadow-lg shadow-primary/10 hover:shadow-primary/25 transition-all active:scale-95"
            >
              Sign Up
            </Button>
          </SignUpButton>
        </div>
      </div>
    </motion.nav>
  );
}