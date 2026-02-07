"use client"

import Link from "next/link";
import { Sparkles, Twitter, Github, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Methods", href: "#methods" },
    ],
    Company: [
      { name: "About", href: "#about" },
      { name: "Privacy", href: "#privacy" },
      { name: "Terms", href: "#terms" },
    ],
    Support: [
      { name: "Help Center", href: "#help" },
      { name: "Contact", href: "#contact" },
      { name: "Status", href: "#status" },
    ],
  };

  return (
    <footer className="mt-20 border-t border-border/40 bg-background/30 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand Section */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tighter">SolaireAI</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Master your academic journey with AI-driven study architectures. 
              Built for students who demand efficiency and elegance.
            </p>
            <div className="flex items-center gap-4 pt-2">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <Link key={i} href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Link Groups */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground/60 font-medium tracking-tight">
            © {currentYear} SolaireAI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}