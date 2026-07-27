import { createClient } from "@/lib/supabase/server";
import ConnectStripeButton from "@/components/admin/ConnectStripeButton";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: { connected?: string };
}) {
  const supabase = createClient();
  const { data: settings } = await supabase.from("business_settings").select("*").single();
  const { data: hours } = await supabase
    .from("business_hours")
    .select("*")
    .order("day_of_week");

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <p className="text-xs uppercase tracking-widest2 text-wine-500">Payments</p>
        <h1 className="font-display text-3xl">Payments &amp; settings</h1>
      </div>

      {searchParams.connected && (
        <p className="rounded-lg bg-green-100 px-4 py-3 text-sm text-green-700">
          Stripe account status updated.
        </p>
      )}

      <div className="rounded-xl border border-ink/10 bg-white/60 p-6">
        <p className="font-display text-lg">Stripe payout account</p>
        <p className="mt-1 text-sm text-ink/60">
          Connect your Stripe account so payments from bookings are deposited
          straight to you. This is required before customers can pay online.
        </p>

        <div className="mt-4 flex items-center gap-3 text-sm">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              settings?.stripe_charges_enabled ? "bg-green-500" : "bg-crown-400"
            }`}
          />
          <span>
            {settings?.stripe_charges_enabled
              ? "Connected — able to accept payments"
              : settings?.stripe_connected_account_id
              ? "Onboarding started — finish setup to accept payments"
              : "Not connected yet"}
          </span>
        </div>

        <div className="mt-5">
          <ConnectStripeButton
            alreadyConnected={Boolean(settings?.stripe_charges_enabled)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-ink/10 bg-white/60 p-6">
        <p className="font-display text-lg">Business hours</p>
        <p className="mt-1 text-sm text-ink/60">
          Customers can only book within these hours. To change them, update
          the <code className="text-xs">business_hours</code> table in Supabase.
        </p>
        <div className="mt-4 divide-y divide-ink/10 text-sm">
          {(hours ?? []).map((h) => (
            <div key={h.id} className="flex justify-between py-2">
              <span>{dayNames[h.day_of_week]}</span>
              <span className="text-ink/60">
                {h.is_closed ? "Closed" : `${h.start_time.slice(0, 5)} – ${h.end_time.slice(0, 5)}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-ink/20 p-6 text-sm text-ink/50">
        The booking &amp; processing fee added to each transaction is
        configured by the site developer via environment variables and isn't
        editable from this dashboard.
      </div>
    </div>
  );
}
