-- ============================================================================
-- My Hair My Crown — initial schema
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- ============================================================================

-- Profiles: extends auth.users with a role. Only 'admin' can access /admin.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz not null default now()
);

-- Stylists working at the salon (optional assignment on a booking).
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Services offered (haircuts, colour, braiding, etc).
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_minutes integer not null default 60,
  price_cents integer not null,           -- price paid to the salon (before dev surcharge)
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Salon working hours, per weekday (0 = Sunday ... 6 = Saturday).
create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_closed boolean not null default false,
  unique (day_of_week)
);

-- Single-row settings table for the salon's own configuration.
-- NOTE: the developer surcharge (DEV_FEE_*) intentionally lives in
-- environment variables, NOT here, so the salon owner cannot edit it.
create table if not exists public.business_settings (
  id integer primary key default 1,
  business_name text not null default 'My Hair My Crown',
  stripe_connected_account_id text,          -- salon owner's Stripe Connect account
  stripe_charges_enabled boolean not null default false,
  stripe_payouts_enabled boolean not null default false,
  timezone text not null default 'Africa/Lagos',
  slot_interval_minutes integer not null default 30,
  constraint single_row check (id = 1)
);
insert into public.business_settings (id) values (1) on conflict (id) do nothing;

-- Bookings.
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id),
  staff_id uuid references public.staff(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes text,

  -- money, all in the smallest currency unit (cents/kobo)
  currency text not null default 'usd',
  service_price_cents integer not null,      -- what the salon receives
  dev_fee_cents integer not null default 0,  -- surcharge routed to the developer's account
  total_charged_cents integer not null,      -- service_price_cents + dev_fee_cents

  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,

  created_at timestamptz not null default now()
);

create index if not exists bookings_start_time_idx on public.bookings (start_time);
create index if not exists bookings_status_idx on public.bookings (status);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.staff enable row level security;
alter table public.services enable row level security;
alter table public.business_hours enable row level security;
alter table public.business_settings enable row level security;
alter table public.bookings enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: users can read their own row; admins can read all.
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- staff / services / business_hours: publicly readable (customers need this
-- to book), only admins can write. Writes also go through the service-role
-- key in the API routes, so these policies are a defense-in-depth backstop.
create policy "staff_public_read" on public.staff for select using (true);
create policy "staff_admin_write" on public.staff for all using (public.is_admin());

create policy "services_public_read" on public.services for select using (true);
create policy "services_admin_write" on public.services for all using (public.is_admin());

create policy "hours_public_read" on public.business_hours for select using (true);
create policy "hours_admin_write" on public.business_hours for all using (public.is_admin());

create policy "settings_public_read" on public.business_settings for select using (true);
create policy "settings_admin_write" on public.business_settings for all using (public.is_admin());

-- bookings: nobody can read/write directly from the client. All booking
-- creation happens server-side (checkout + webhook) with the service role
-- key, which bypasses RLS. Admins can read/manage from the dashboard.
create policy "bookings_admin_all" on public.bookings
  for all using (public.is_admin());

-- Seed a couple of example services so the site isn't empty on first run.
insert into public.services (name, description, duration_minutes, price_cents)
values
  ('Signature Wash & Style', 'Shampoo, deep condition, and blow-out styling.', 60, 6500),
  ('Silk Press', 'Heat styling for a smooth, sleek finish.', 90, 9000),
  ('Box Braids', 'Classic protective braids, medium size.', 240, 22000),
  ('Full Colour', 'All-over colour service with gloss.', 120, 15000)
on conflict do nothing;

-- Seed default business hours: Tue–Sat, 9am–6pm; closed Sun/Mon.
insert into public.business_hours (day_of_week, start_time, end_time, is_closed) values
  (0, '09:00', '18:00', true),
  (1, '09:00', '18:00', true),
  (2, '09:00', '18:00', false),
  (3, '09:00', '18:00', false),
  (4, '09:00', '18:00', false),
  (5, '09:00', '18:00', false),
  (6, '09:00', '17:00', false)
on conflict (day_of_week) do nothing;

-- ============================================================================
-- Auto-create a `profiles` row whenever someone signs up via Supabase Auth.
-- New users default to role = 'customer'. To make the salon owner an admin,
-- run this once after they've signed up:
--   update public.profiles set role = 'admin' where id =
--     (select id from auth.users where email = 'owner@example.com');
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
