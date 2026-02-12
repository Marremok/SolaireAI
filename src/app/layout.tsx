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
        variables: {
          colorPrimary: "#1c9cf0",
          colorBackground: "#17181c",
          colorForeground: "#e7e9ea",
          colorMutedForeground: "#72767a",
          colorBorder: "#242628",
          colorInput: "#22303c",
          colorInputForeground: "#e7e9ea",
          colorNeutral: "#72767a",
          colorDanger: "#f4212e",
          colorSuccess: "#00b87a",
          colorWarning: "#f7b928",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-geist-sans), sans-serif",
        },
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
        elements: {
          card: "shadow-xl border border-white/5",
          formButtonPrimary:
            "bg-[#1c9cf0] hover:bg-[#1a8cd8] transition-all duration-200 shadow-lg shadow-[#1c9cf0]/20 font-semibold",
          footerActionLink: "text-[#1c9cf0] hover:text-[#1a8cd8]",
          headerTitle: "text-[#e7e9ea] font-bold",
          headerSubtitle: "text-[#72767a]",
          socialButtonsBlockButton:
            "border-[#242628] hover:bg-white/5 transition-colors",
          formFieldInput:
            "bg-[#22303c] border-[#242628] text-[#e7e9ea] focus:border-[#1c9cf0] focus:ring-[#1c9cf0]/20",
          formFieldLabel: "text-[#e7e9ea]",
          dividerLine: "bg-[#242628]",
          dividerText: "text-[#72767a]",
          identityPreviewEditButton: "text-[#1c9cf0]",
          formFieldSuccessText: "text-[#00b87a]",
          alertText: "text-[#f4212e]",
          profileSectionPrimaryButton: "text-[#1c9cf0] hover:text-[#1a8cd8]",
          navbarButton: "hover:bg-white/5 transition-colors",
          badge: "bg-[#1c9cf0]/10 text-[#1c9cf0] border-[#1c9cf0]/20",
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


