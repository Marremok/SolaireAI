import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Stripe from "stripe";

/**
 * CRITICAL: Stripe Webhook Handler
 *
 * This endpoint receives events from Stripe about subscription changes.
 * It's the single source of truth for subscription status.
 *
 * Security:
 * - Signature verification (prevents fake webhooks)
 * - Idempotent (safe to receive same event multiple times)
 * - Error handling (always returns 200 after processing)
 *
 * Events handled:
 * - checkout.session.completed: User completed payment
 * - customer.subscription.created: New subscription created
 * - customer.subscription.updated: Subscription status changed
 * - customer.subscription.deleted: Subscription canceled/expired
 */
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const sig = headersList.get("stripe-signature");

    if (!sig) {
      console.error("[Stripe Webhook] Missing signature");
      return new Response("Missing stripe-signature", { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("[Stripe Webhook] Signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing webhook:", error);
    // IMPORTANT: Always return 200 to prevent Stripe from retrying
    // Log the error but acknowledge receipt
    return new Response(null, { status: 200 });
  }
}

/**
 * Handle successful checkout session
 * This is the first event we receive after a user pays
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  console.log(`[Checkout Completed] Customer: ${customerId}, Subscription: ${subscriptionId}`);

  // Find user by customer ID (should already exist from checkout creation)
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`[Checkout Completed] User not found for customer: ${customerId}`);
    return;
  }

  // Set subscription ID and grant PRO immediately as a safety net
  // (subscription.created/updated webhook will sync the full status later)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: "active",
      plan: "PRO",
    },
  });

  console.log(`[Checkout Completed] Updated user ${user.id} with subscription ${subscriptionId}`);
}

/**
 * Handle subscription creation or update
 * This is called when:
 * - New subscription is created
 * - Subscription status changes (active, past_due, etc.)
 * - Billing period renews
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price.id;
  const rawPeriodEnd = (subscription as any).current_period_end;
  const currentPeriodEnd = rawPeriodEnd
    ? new Date(typeof rawPeriodEnd === "number" ? rawPeriodEnd * 1000 : rawPeriodEnd)
    : null;

  console.log(`[Subscription Update] ${subscriptionId} -> status: ${status}`);

  // Find user by customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`[Subscription Update] User not found for customer: ${customerId}`);
    return;
  }

  // Determine plan based on status
  // Only "active" status grants PRO access
  const plan = (status === "active" || status === "trialing") ? "PRO" : "FREE";

  // Update user with latest subscription data
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: currentPeriodEnd,
      subscriptionStatus: status,
      plan,
    },
  });

  console.log(`[Subscription Update] Updated user ${user.id}: plan=${plan}, status=${status}`);
}

/**
 * Handle subscription deletion/cancellation
 * This is called when:
 * - User cancels subscription
 * - Subscription expires due to failed payment
 * - Admin cancels subscription
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;

  console.log(`[Subscription Deleted] ${subscriptionId}`);

  // Find user by customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`[Subscription Deleted] User not found for customer: ${customerId}`);
    return;
  }

  // Clear subscription data and set to FREE
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
      subscriptionStatus: "canceled",
      plan: "FREE",
    },
  });

  console.log(`[Subscription Deleted] User ${user.id} downgraded to FREE`);
}
