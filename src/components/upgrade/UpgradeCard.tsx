"use client";

import { useState } from "react";
import { createCheckoutSession } from "@/lib/actions/stripe";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Loader2, Sparkles } from "lucide-react";

const PRO_FEATURES = [
  "Unlimited exams and study sessions",
  "AI-powered study schedule generation",
  "Smart calendar with adaptive planning",
  "Rest day management & burnout prevention",
  "Personalized study intensity settings",
  "Advanced analytics & progress tracking",
];

export function UpgradeCard() {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);
      const checkoutUrl = await createCheckoutSession();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      alert("Failed to start checkout. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg border-2 border-primary/20 shadow-2xl">
      <CardHeader className="text-center space-y-2 pb-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">Upgrade to PRO</CardTitle>
        <CardDescription className="text-base">
          Unlock the full power of SolaireAI with PRO
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Features list */}
        <div className="space-y-3">
          {PRO_FEATURES.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-primary/10 p-1">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground/90">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="pt-6 border-t">
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground">$6.99</div>
            <div className="text-sm text-muted-foreground mt-1">
              per month, billed monthly
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Cancel anytime • No long-term commitment
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-6">
        <Button
          onClick={handleUpgrade}
          disabled={isLoading}
          size="lg"
          className="w-full text-base font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading checkout...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Upgrade to PRO
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Secure payment powered by Stripe
        </p>
      </CardFooter>
    </Card>
  );
}
