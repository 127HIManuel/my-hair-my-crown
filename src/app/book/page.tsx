import { createClient } from "@/lib/supabase/server";
import BookingForm from "@/components/BookingForm";

export default async function BookPage({
  searchParams,
}: {
  searchParams: { service?: string; cancelled?: string };
}) {
  const supabase = createClient();

  const [{ data: services }, { data: staff }] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("category_sort")
      .order("sort_order"),
    supabase.from("staff").select("*").eq("active", true).order("name"),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-xs uppercase tracking-widest2 text-wine-500">Book</p>
      <h1 className="font-display text-4xl">Reserve your appointment</h1>
      <p className="mt-3 max-w-xl text-ink/60">
        Pick a service, a time that works, and pay securely to confirm your
        spot.
      </p>

      {searchParams.cancelled && (
        <p className="mt-6 rounded-lg bg-crown-100 px-4 py-3 text-sm text-ink/70">
          Your checkout was cancelled — no payment was taken. Feel free to try again.
        </p>
      )}

      {!services || services.length === 0 ? (
        <p className="mt-10 text-ink/50">
          No services are currently available for booking. Please check back soon.
        </p>
      ) : (
        <div className="mt-10">
          <BookingForm
            services={services}
            staff={staff ?? []}
            initialServiceId={searchParams.service}
          />
        </div>
      )}

      <section className="mt-16 rounded-xl border border-ink/10 bg-crown-50/60 p-6">
        <h2 className="font-display text-xl">Appointment Policy</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink/70">
          <li>
            A £10 non-refundable booking fee is required to secure every
            appointment. The £10 deposit can be refunded only if 48 hours'
            notice is given.
          </li>
          <li>
            Please arrive with clean, detangled hair unless a wash service has
            been booked.
          </li>
          <li>
            Prices may vary depending on hair length, density, and style
            complexity.
          </li>
          <li>Hair extensions can be supplied at an additional cost.</li>
          <li>
            Clients arriving more than 35 minutes late may need to reschedule.
          </li>
          <li>The remaining balance is payable on the day of your appointment.</li>
        </ul>
      </section>
    </div>
  );
}
