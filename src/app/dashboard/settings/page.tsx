import type { Metadata } from "next";
import { requireProUser } from "@/lib/auth";
import Navbar from "@/components/dashboard/Navbar";
import Footer from "@/components/dashboard/Footer";
import SettingsForm from "@/components/dashboard/settings/SettingsForm";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

/**
 * Settings Page - PROTECTED by PRO subscription
 */
export default async function SettingsPage() {
  await requireProUser();
  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize your study schedule preferences and capacity
          </p>
        </div>
        <SettingsForm />
      </div>
    </div>
  );
}
