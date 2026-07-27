import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/types";
import BookingsTable from "@/components/admin/BookingsTable";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const supabase = createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, services(name)")
    .order("start_time", { ascending: true });

  const upcoming = (bookings ?? []).filter(
    (b) => new Date(b.start_time).getTime() >= Date.now() && b.status !== "cancelled"
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest2 text-wine-500">Overview</p>
          <h1 className="font-display text-3xl">Bookings</h1>
        </div>
        <div className="rounded-xl border border-ink/10 bg-white/60 px-5 py-3 text-right">
          <p className="text-xs text-ink/50">Upcoming appointments</p>
          <p className="font-display text-2xl">{upcoming.length}</p>
        </div>
      </div>

      <BookingsTable bookings={bookings ?? []} />
    </div>
  );
}
