import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "SolaireAI terms of service. Read our terms for using the AI study planner.",
};

export default function TermsOfServicePage() {
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

        <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: February 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using SolaireAI, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Account Registration</h2>
            <p>
              You must create an account to use SolaireAI. You are responsible for maintaining
              the confidentiality of your account credentials and for all activities under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Subscription & Billing</h2>
            <p>
              SolaireAI offers a paid subscription plan with a 7-day free trial. After the trial period,
              your subscription will be billed monthly. You can cancel your subscription at any time
              from your account settings — cancellation takes effect at the end of the current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Share your account with others or create multiple accounts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. AI-Generated Content</h2>
            <p>
              SolaireAI uses artificial intelligence to generate study schedules. While we strive for accuracy,
              AI-generated schedules are suggestions and should be used as a planning aid. We do not guarantee
              specific academic outcomes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Limitation of Liability</h2>
            <p>
              SolaireAI is provided &quot;as is&quot; without warranty of any kind. We shall not be liable for any
              indirect, incidental, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these terms.
              You may also delete your account at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. We will notify you of significant changes
              via email or through the service. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Contact</h2>
            <p>
              For questions about these Terms of Service, contact us at{" "}
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
