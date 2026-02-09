import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "SolaireAI privacy policy. Learn how we collect, use, and protect your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-12"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: February 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Information We Collect</h2>
            <p>
              When you create an account, we collect your name and email address through our authentication provider (Clerk).
              We also collect the exam data, study preferences, and schedule settings you provide to personalize your experience.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
            <p>Your information is used to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Create and manage your account</li>
              <li>Generate personalized AI study schedules</li>
              <li>Process subscription payments via Stripe</li>
              <li>Improve our services and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Data Storage & Security</h2>
            <p>
              Your data is stored securely using industry-standard encryption. We use Prisma with PostgreSQL
              for data storage and Clerk for authentication. Payment processing is handled by Stripe — we never
              store your credit card information directly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-foreground">Clerk</strong> — Authentication and user management</li>
              <li><strong className="text-foreground">Stripe</strong> — Payment processing</li>
              <li><strong className="text-foreground">Anthropic / OpenAI</strong> — AI-powered schedule generation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Your Rights</h2>
            <p>
              You have the right to access, update, or delete your personal data at any time.
              You can manage your account settings from the dashboard, or contact us to request full data deletion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We do not use
              third-party tracking cookies or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Contact</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:support@solaireai.com" className="text-primary hover:underline">
                support@solaireai.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
