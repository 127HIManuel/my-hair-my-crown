import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmationEmail, sendSalonNotificationEmail } from "@/lib/resend";
import Stripe from "stripe";

export const runtime = "nodejs";

function constructEvent(rawBody: string, signature: string): Stripe.Event {
  const secrets = [
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET,
  ].filter((s): s is string => Boolean(s));

  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      // try next secret
    }
  }
  throw new Error("No matching webhook secret");
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructEvent(rawBody, signature);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      if (!bookingId) break;

      const { data: booking } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          stripe_payment_intent_id:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
        })
        .eq("id", bookingId)
        .select("*, services(name)")
        .single();

      if (booking) {
        try {
          await sendBookingConfirmationEmail({
            customerEmail: booking.customer_email,
            customerName: booking.customer_name,
            serviceName: (booking as any).services?.name ?? "your appointment",
            startTime: booking.start_time,
            totalChargedCents: booking.total_charged_cents,
            currency: booking.currency,
          });
          await sendSalonNotificationEmail({
            serviceName: (booking as any).services?.name ?? "Service",
            customerName: booking.customer_name,
            customerEmail: booking.customer_email,
            customerPhone: booking.customer_phone,
            startTime: booking.start_time,
            servicePriceCents: booking.service_price_cents,
            currency: booking.currency,
          });
        } catch (emailErr) {
          console.error("Failed to send booking emails:", emailErr);
        }
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      if (bookingId) {
        await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      await supabase
        .from("business_settings")
        .update({
          stripe_charges_enabled: account.charges_enabled,
          stripe_payouts_enabled: account.payouts_enabled,
        })
        .eq("stripe_connected_account_id", account.id);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
