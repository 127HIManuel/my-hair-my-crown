import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe redirects here after the salon owner finishes (or exits) onboarding.
// We re-fetch the account to sync charges_enabled/payouts_enabled immediately,
// rather than waiting for the account.updated webhook.
export async function GET() {
  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("business_settings")
    .select("stripe_connected_account_id")
    .single();

  if (settings?.stripe_connected_account_id) {
    const account = await stripe.accounts.retrieve(settings.stripe_connected_account_id);
    await admin
      .from("business_settings")
      .update({
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
      })
      .eq("id", 1);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return NextResponse.redirect(`${siteUrl}/admin/settings?connected=1`);
}
