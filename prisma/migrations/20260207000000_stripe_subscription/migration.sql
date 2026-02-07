-- Add subscription status field to track Stripe subscription state
ALTER TABLE "users" ADD COLUMN "subscriptionStatus" TEXT;

-- Note: Other Stripe fields (stripeCustomerId, stripeSubscriptionId, etc.)
-- were added in previous migration 20260206165323_user_settings_and_float_precision
