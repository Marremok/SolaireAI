import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://solaireai.app"),
  title: {
    default: "SolaireAI — AI Study Planner",
    template: "%s | SolaireAI",
  },
  description:
    "SolaireAI uses AI to generate personalized study schedules for your exams. Plan smarter, study less, score higher.",
  keywords: [
    "AI study planner",
    "study schedule generator",
    "exam preparation",
    "AI study assistant",
    "personalized study plan",
    "SolaireAI",
  ],
  openGraph: {
    title: "SolaireAI — AI Study Planner",
    description:
      "AI-powered study schedules tailored to your exams, capacity, and preferences.",
    url: "https://solaireai.app",
    siteName: "SolaireAI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SolaireAI — AI Study Planner",
    description:
      "AI-powered study schedules tailored to your exams, capacity, and preferences.",
  },
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
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}


