import Stripe from "stripe";

// This is YOUR (the developer's / platform's) Stripe account.
// The salon's connected account is referenced separately, per-request, as
// `stripe_connected_account_id` from business_settings — see /api/checkout.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia",
});
