import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Returns available start times (ISO strings) for a given service on a given
// calendar date, based on business_hours minus any overlapping bookings.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date"); // "YYYY-MM-DD"
  const serviceId = searchParams.get("service_id");
  const staffId = searchParams.get("staff_id"); // optional

  if (!dateStr || !serviceId) {
    return NextResponse.json(
      { error: "date and service_id are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const { data: settings } = await supabase
    .from("business_settings")
    .select("slot_interval_minutes, timezone")
    .single();

  const slotInterval = settings?.slot_interval_minutes ?? 30;
  const durationMs = service.duration_minutes * 60 * 1000;

  const date = new Date(`${dateStr}T00:00:00`);
  const dayOfWeek = date.getDay();

  const { data: hours } = await supabase
    .from("business_hours")
    .select("*")
    .eq("day_of_week", dayOfWeek)
    .single();

  if (!hours || hours.is_closed) {
    return NextResponse.json({ slots: [] });
  }

  // Build candidate slot start times for the day.
  const [openH, openM] = hours.start_time.split(":").map(Number);
  const [closeH, closeM] = hours.end_time.split(":").map(Number);

  const dayStart = new Date(date);
  dayStart.setHours(openH, openM, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(closeH, closeM, 0, 0);

  const candidates: Date[] = [];
  for (
    let t = new Date(dayStart);
    t.getTime() + durationMs <= dayEnd.getTime();
    t = new Date(t.getTime() + slotInterval * 60 * 1000)
  ) {
    // Don't offer slots in the past for "today".
    if (t.getTime() > Date.now()) {
      candidates.push(new Date(t));
    }
  }

  // Fetch existing (non-cancelled) bookings that day, optionally scoped to staff.
  const dayEndOfDay = new Date(dayEnd.getTime() + 24 * 60 * 60 * 1000);
  let query = supabase
    .from("bookings")
    .select("start_time, end_time, staff_id")
    .gte("start_time", dayStart.toISOString())
    .lt("start_time", dayEndOfDay.toISOString())
    .neq("status", "cancelled");

  if (staffId) query = query.eq("staff_id", staffId);

  const { data: existingBookings } = await query;

  const isOverlapping = (slotStart: Date, slotEnd: Date) => {
    return (existingBookings ?? []).some((b) => {
      if (staffId && b.staff_id && b.staff_id !== staffId) return false;
      const bStart = new Date(b.start_time).getTime();
      const bEnd = new Date(b.end_time).getTime();
      return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
    });
  };

  const freeSlots = candidates
    .filter((slotStart) => {
      const slotEnd = new Date(slotStart.getTime() + durationMs);
      return !isOverlapping(slotStart, slotEnd);
    })
    .map((d) => d.toISOString());

  return NextResponse.json({ slots: freeSlots });
}
