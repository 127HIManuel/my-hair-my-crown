import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Called from the admin settings page. Creates (or reuses) a Stripe Express
// connected account for the salon owner, then returns an onboarding link.
// Requires an authenticated admin — enforced by middleware on /admin/*, and
// double-checked here since this is a POST endpoint.
export async function POST() {
  const authedSupabase = createClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await authedSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("business_settings")
    .select("stripe_connected_account_id")
    .single();

  let accountId = settings?.stripe_connected_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
    });
    accountId = account.id;
    await admin
      .from("business_settings")
      .update({ stripe_connected_account_id: accountId })
      .eq("id", 1);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${siteUrl}/admin/settings?refresh=1`,
    return_url: `${siteUrl}/api/stripe/connect/callback`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
