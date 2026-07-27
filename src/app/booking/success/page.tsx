import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCents } from "@/lib/types";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id;
  const admin = createAdminClient();

  const { data: booking } = sessionId
    ? await admin
        .from("bookings")
        .select("*, services(name)")
        .eq("stripe_checkout_session_id", sessionId)
        .single()
    : { data: null };

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <span className="font-display text-6xl text-crown-400">♛</span>
      <h1 className="mt-6 font-display text-3xl">
        {booking ? "You're booked!" : "Thanks — payment received"}
      </h1>

      {booking ? (
        <div className="mt-8 space-y-2 rounded-xl border border-ink/10 bg-white/60 p-6 text-left text-sm">
          <div className="flex justify-between">
            <span className="text-ink/60">Service</span>
            <span>{(booking as any).services?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/60">When</span>
            <span>
              {new Date(booking.start_time).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-2 font-medium">
            <span>Total paid</span>
            <span className="text-wine-500">
              {formatCents(booking.total_charged_cents, booking.currency)}
            </span>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-ink/60">
          We're finalizing your booking — a confirmation email is on its way.
        </p>
      )}

      <Link
        href="/"
        className="focus-ring mt-10 inline-block rounded-full bg-ink px-7 py-3 text-sm uppercase tracking-widest2 text-ivory transition hover:bg-wine-500"
      >
        Back to home
      </Link>
    </div>
  );
}
