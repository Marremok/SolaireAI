import { requireProUser } from "@/lib/auth";
import Navbar from "@/components/dashboard/Navbar";
import Footer from "@/components/dashboard/Footer";
import SettingsForm from "@/components/dashboard/settings/SettingsForm";
import { UserProfile } from "@clerk/nextjs";

/**
 * Settings Page - PROTECTED by PRO subscription
 */
export default async function SettingsPage() {
  // Require PRO subscription
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

        {/* Billing — Clerk UserProfile includes subscription management when Billing is enabled */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Account & Billing</h2>
          <UserProfile />
        </div>
      </div>
      <Footer />
    </div>
  );
}
