import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { calculateDevFee } from "@/lib/fee";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      serviceId,
      addonServiceIds, // optional string[] — extras like Hair Care & Treatments items
      staffId,
      startTime, // ISO string
      customerName,
      customerEmail,
      customerPhone,
      notes,
    } = body;

    if (!serviceId || !startTime || !customerName || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .eq("active", true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Validate + load any selected extras. Only items from "Add-On Services"
    // or "Hair Care & Treatments" are ever allowed here — never trust the
    // client to say what's an addon, always re-check server-side.
    let addons: { id: string; name: string; price_cents: number; duration_minutes: number }[] = [];
    if (Array.isArray(addonServiceIds) && addonServiceIds.length > 0) {
      const uniqueIds = [...new Set(addonServiceIds)].filter((id) => id !== serviceId);
      if (uniqueIds.length > 0) {
        const { data: addonRows, error: addonError } = await supabase
          .from("services")
          .select("*")
          .in("id", uniqueIds)
          .eq("active", true);

        if (addonError) {
          return NextResponse.json({ error: "Could not load selected extras" }, { status: 500 });
        }

        const invalid = (addonRows ?? []).find(
          (a) => a.category !== "Add-On Services" && a.category !== "Hair Care & Treatments"
        );
        if (invalid || (addonRows?.length ?? 0) !== uniqueIds.length) {
          return NextResponse.json({ error: "One or more extras are invalid" }, { status: 400 });
        }

        addons = addonRows!.map((a) => ({
          id: a.id,
          name: a.name,
          price_cents: a.price_cents,
          duration_minutes: a.duration_minutes,
        }));
      }
    }

    const { data: settings } = await supabase
      .from("business_settings")
      .select("stripe_connected_account_id, stripe_charges_enabled")
      .single();

    if (!settings?.stripe_connected_account_id || !settings.stripe_charges_enabled) {
      return NextResponse.json(
        {
          error:
            "Online payments aren't set up yet. Please contact the salon directly to book.",
        },
        { status: 503 }
      );
    }

    // Re-validate the slot is still free (race condition guard).
    // Duration includes any selected extras, so the appointment isn't
    // under-booked on the calendar.
    const addonsDurationMinutes = addons.reduce((sum, a) => sum + a.duration_minutes, 0);
    const totalDurationMinutes = service.duration_minutes + addonsDurationMinutes;

    const startsAt = new Date(startTime);
    const endsAt = new Date(startsAt.getTime() + totalDurationMinutes * 60 * 1000);

    let overlapQuery = supabase
      .from("bookings")
      .select("id")
      .neq("status", "cancelled")
      .lt("start_time", endsAt.toISOString())
      .gt("end_time", startsAt.toISOString());

    if (staffId) overlapQuery = overlapQuery.eq("staff_id", staffId);

    const { data: overlapping } = await overlapQuery;
    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        { error: "That time slot was just booked. Please pick another." },
        { status: 409 }
      );
    }

    // ── This is the surcharge logic ──────────────────────────────────────
    // Extras revenue goes to the salon just like the main service does —
    // your flat/percent fee is calculated once, on the combined total, not
    // per line item.
    const addonsTotalCents = addons.reduce((sum, a) => sum + a.price_cents, 0);
    const combinedServicePriceCents = service.price_cents + addonsTotalCents;
    const fee = calculateDevFee(combinedServicePriceCents);

    // Create a pending booking row up front so the webhook has something to update.
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        service_id: service.id,
        staff_id: staffId || null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        notes: notes || null,
        start_time: startsAt.toISOString(),
        end_time: endsAt.toISOString(),
        status: "pending_payment",
        currency: "gbp",
        service_price_cents: fee.servicePriceCents,
        dev_fee_cents: fee.devFeeCents,
        total_charged_cents: fee.totalChargedCents,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Could not create booking" }, { status: 500 });
    }

    if (addons.length > 0) {
      const { error: addonInsertError } = await supabase.from("booking_addons").insert(
        addons.map((a) => ({
          booking_id: booking.id,
          service_id: a.id,
          name: a.name,
          price_cents: a.price_cents,
        }))
      );
      if (addonInsertError) {
        // Don't fail the whole checkout over this — but do log loudly, since
        // it means the receipt/booking record will be missing line items.
        console.error("Failed to record booking_addons:", addonInsertError);
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Destination charge: created on the PLATFORM account (this `stripe`
    // instance uses your STRIPE_SECRET_KEY), with the funds destined for the
    // salon's connected account, minus the application fee which stays with
    // the platform (you).
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: service.price_cents,
            product_data: {
              name: service.name,
              description: `${service.duration_minutes} min appointment`,
            },
          },
          quantity: 1,
        },
        ...addons.map((a) => ({
          price_data: {
            currency: "gbp",
            unit_amount: a.price_cents,
            product_data: { name: a.name, description: "Add-on" },
          },
          quantity: 1,
        })),
        ...(fee.devFeeCents > 0
          ? [
              {
                price_data: {
                  currency: "gbp",
                  unit_amount: fee.devFeeCents,
                  product_data: {
                    name: fee.feeLabel,
                  },
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      payment_intent_data: {
        application_fee_amount: fee.devFeeCents,
        transfer_data: {
          destination: settings.stripe_connected_account_id,
        },
        metadata: { booking_id: booking.id },
      },
      metadata: { booking_id: booking.id },
      success_url: `${siteUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/book?cancelled=1`,
    });

    await supabase
      .from("bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", booking.id);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong creating checkout" },
      { status: 500 }
    );
  }
}
