import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SolaireAI",
  description: "AI-powered study assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        layout: {
          logoImageUrl: "/logo.png",
          logoPlacement: "inside",
          socialButtonsPlacement: "bottom",
          socialButtonsVariant: "iconButton",
          termsPageUrl: "/terms",
          privacyPageUrl: "/privacy",
          helpPageUrl: "/contact",
          showOptionalFields: false,
          shimmer: true,
          animations: true,
        },
      }}
    >
      <html lang="en">
        <head>
          <link rel="icon" href="/logo.png" />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}>
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}


