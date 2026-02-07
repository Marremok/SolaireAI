"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { type ReactNode } from "react";

interface SmartCTAButtonProps {
  children: ReactNode;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline";
  className?: string;
}

export function SmartCTAButton({
  children,
  size = "lg",
  variant = "default",
  className = "",
}: SmartCTAButtonProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();

  // If authenticated, route to upgrade
  if (isSignedIn) {
    return (
      <Button
        size={size}
        variant={variant}
        className={className}
        onClick={() => router.push("/upgrade")}
      >
        {children}
      </Button>
    );
  }

  // If not authenticated, show sign-in modal
  return (
    <SignInButton mode="modal">
      <Button size={size} variant={variant} className={className}>
        {children}
      </Button>
    </SignInButton>
  );
}
