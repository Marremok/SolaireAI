"use client"

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Navigation: [
      { name: "Features", href: "/#how-it-works" },
      { name: "Pricing", href: "/#pricingsection" },
      { name: "Get Started", href: "/#CTA" },
    ],
    Company: [
      { name: "About", href: "/#about" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ],
    Support: [
      { name: "Contact Us", href: "/contact" },
    ],
  };

  return (
    <footer className="mt-20 border-t border-border/40 bg-background/30 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">

          {/* Brand Section */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <Image
                src="/logo.png"
                alt="SolaireAI Logo"
                width={32}
                height={32}
                className="rounded-lg object-contain"
              />
              <span className="text-lg font-bold tracking-tighter">SolaireAI</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Master your academic journey with AI-driven study architectures.
              Built for students who demand efficiency and elegance.
            </p>
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
            &copy; {currentYear} SolaireAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
