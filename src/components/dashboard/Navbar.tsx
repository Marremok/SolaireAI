"use client"

import { UserButton } from "@clerk/nextjs";
import { Sparkles, LayoutDashboard, Calendar, Settings, NotebookPen, Mail, CreditCard, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Navbar() {
  const navLinks = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
    { name: "Exams", href: "/dashboard/exams", icon: NotebookPen },
    { name: "Support", href: "/dashboard/contact", icon: Mail},
  ];

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 left-0 right-0 z-50 flex justify-center p-4"
    >
      {/* Refined Glassmorphism Container */}
      <nav className="flex items-center justify-between w-full max-w-7xl h-16 px-6 rounded-2xl border border-primary/10 bg-background/60 backdrop-blur-xl shadow-lg shadow-black/5">
        
        {/* --- LEFT: LOGO --- */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary bg-linear-to-br from-primary to-violet-600 shadow-md group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-foreground">
            SolaireAI
          </span>
        </Link>

        {/* --- MIDDLE: NAVIGATION --- */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            >
              <link.icon className="h-4 w-4" />
              {link.name}
            </Link>
          ))}
        </div>

        {/* --- RIGHT: ACTIONS & PROFILE --- */}
        <div className="flex items-center gap-4">
          {/* Settings Link */}
          <Link
            href="/dashboard/settings"
            className="p-2 rounded-xl text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
          >
            <Settings className="h-5 w-5" />
          </Link>

          <div className="h-6 w-px bg-primary/10 mx-1" />

          {/* User Profile */}
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
                userButtonAvatarBox: "h-9 w-9 border border-primary/20 shadow-sm hover:scale-105 transition-transform",
                userButtonPopoverCard: "rounded-2xl border border-white/5 shadow-2xl bg-[#17181c]",
                userButtonTrigger: "focus:shadow-none focus:outline-hidden",
                userButtonPopoverActionButton: "hover:bg-white/5 transition-colors rounded-lg",
                userButtonPopoverActionButtonText: "text-[#e7e9ea] text-sm font-medium",
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
      </nav>
    </motion.header>
  );
}