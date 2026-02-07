"use server";

import { stripe } from "@/lib/stripe";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Create a Stripe Checkout Session for PRO subscription
 *
 * This creates a checkout session and returns the URL to redirect the user to.
 * After successful payment, Stripe will send a webhook to update the user's subscription.
 *
 * @returns Checkout session URL
 */
export async function createCheckoutSession(): Promise<string> {
  const user = await requireAuth();

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error("STRIPE_PRICE_ID not configured");
  }

  // Check if user already has a Stripe customer
  let customerId = user.stripeCustomerId;

  if (!customerId) {
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        clerkId: user.clerkId,
        userId: user.id.toString(),
      },
    });

    customerId = customer.id;

    // Save customer ID to database
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  // If user already has active subscription, redirect to portal instead
  if (user.subscriptionStatus === "active") {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    });
    return portalSession.url;
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?checkout=canceled`,
    metadata: {
      userId: user.id.toString(),
      clerkId: user.clerkId,
    },
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  return session.url;
}

/**
 * Create a Stripe Customer Portal session for managing subscription
 *
 * This allows users to:
 * - Update payment method
 * - View invoices
 * - Cancel subscription
 *
 * @returns Portal session URL
 */
export async function createPortalSession(): Promise<string> {
  const user = await requireAuth();

  if (!user.stripeCustomerId) {
    throw new Error("No Stripe customer found");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
  });

  return session.url;
}