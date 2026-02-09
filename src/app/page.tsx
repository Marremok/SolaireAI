import type { Metadata } from "next";
import CTA from "@/components/landing/CTA";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import PricingSection from "@/components/landing/PricingSection";
import Navbar from "@/components/dashboard/Navbar";
import { syncUser } from "@/lib/actions/user";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import Footer from "@/components/dashboard/Footer";
import About from "@/components/landing/About";

export const metadata: Metadata = {
  title: "SolaireAI — AI Study Planner | Smarter Exam Prep",
  description:
    "SolaireAI generates personalized AI study schedules based on your exams, study methods, and weekly capacity. Start your free trial today.",
  openGraph: {
    title: "SolaireAI — AI Study Planner",
    description:
      "AI-powered study schedules tailored to your exams, capacity, and preferences. Start your free trial.",
    url: "https://solaireai.app",
  },
};

export default async function Home() {
  // const user = await currentUser()
  
  // syncing webhooks
  // await syncUser();

  // redircet auth user to dashboard
  // if (user) redirect("/dashboard")

  return (
  
      <div className="min-h-screen bg-background">
        <Header/>
        <Hero/>
        <HowItWorks/>
        <PricingSection/>
        <CTA/>
        <About/>
        <Footer/>
      </div>

  );
}
