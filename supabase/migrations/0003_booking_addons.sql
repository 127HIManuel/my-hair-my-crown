-- ============================================================================
-- My Hair My Crown — optional add-ons on bookings
-- Run this AFTER 0002_service_categories.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- One booking can now have zero or more optional extras attached (from the
-- "Add-On Services" category, or from "Hair Care & Treatments" — which is
-- both a standalone bookable category AND addable to any other service).
--
-- name/price_cents are snapshotted at the time of booking (not a live join)
-- so that historical bookings keep showing what the customer actually paid,
-- even if you rename or reprice a service later in the admin dashboard.
-- ----------------------------------------------------------------------------
create table if not exists public.booking_addons (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  name text not null,
  price_cents integer not null,
  created_at timestamptz not null default now()
);

create index if not exists booking_addons_booking_id_idx
  on public.booking_addons (booking_id);

-- Same security model as bookings itself: nobody reads/writes this directly
-- from the client. All writes happen server-side (checkout route) using the
-- service-role key, which bypasses RLS. Admins can read from the dashboard.
alter table public.booking_addons enable row level security;

create policy "booking_addons_admin_all" on public.booking_addons
  for all using (public.is_admin());
