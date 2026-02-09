import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function ContactPage() {
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

        <h1 className="text-4xl font-bold tracking-tight mb-4">Contact Us</h1>
        <p className="text-muted-foreground mb-12 max-w-xl">
          Have a question, feedback, or need help? We&apos;d love to hear from you.
          Reach out and we&apos;ll get back to you as soon as possible.
        </p>

        <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">Email Support</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Send us an email and we&apos;ll respond within 24 hours.
              </p>
              <a
                href="mailto:support@solaireai.com"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                support@solaireai.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
