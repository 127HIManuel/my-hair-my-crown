-- ============================================================================
-- My Hair My Crown — service categories + full catalog
-- Run this AFTER 0001_init.sql, in the Supabase SQL editor (or `supabase db push`).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. New columns on services
-- ----------------------------------------------------------------------------
alter table public.services
  add column if not exists category text not null default 'General',
  add column if not exists category_sort integer not null default 0,
  add column if not exists sort_order integer not null default 0,
  add column if not exists display_price text,
  add column if not exists is_addon boolean not null default false;

comment on column public.services.is_addon is
  'true for pricing modifiers (length upgrades, "extra thick hair", etc.) '
  'that are shown on the /services price list but are NOT offered as a '
  'standalone bookable appointment on /book — they only make sense on top '
  'of another service, and this data model books one service per '
  'appointment. Ask your dev if you want these bookable as add-ons later.';

comment on column public.services.display_price is
  'Human-readable price shown on the site, e.g. "From £45" or "£30–£45". '
  'price_cents is always the exact numeric amount actually charged at '
  'checkout (the lower bound for ranges/"From" pricing) — adjust per-client '
  'pricing manually in the admin dashboard before charging if needed.';

-- ----------------------------------------------------------------------------
-- 2. Currency: this salon prices in GBP, not USD.
-- ----------------------------------------------------------------------------
alter table public.bookings alter column currency set default 'gbp';

-- ----------------------------------------------------------------------------
-- 3. Clear out the old placeholder seed services.
--    NOTE: this will fail with a foreign key error if you already have real
--    bookings pointing at these rows. If that happens, either delete those
--    test bookings first, or skip this delete and just leave the old rows —
--    you can hide them later from the admin dashboard instead.
-- ----------------------------------------------------------------------------
delete from public.services
where name in (
  'Signature Wash & Style', 'Silk Press', 'Box Braids', 'Full Colour'
);

-- ----------------------------------------------------------------------------
-- 4. Full service catalog
--    price_cents = numeric amount actually charged (pence). For "From £x" or
--    "£x–£y" items, price_cents is set to the lower bound; display_price
--    carries the exact label to show on the site.
-- ----------------------------------------------------------------------------
insert into public.services
  (category, category_sort, sort_order, name, price_cents, display_price, duration_minutes, active, is_addon)
values
  -- Cornrows
  ('Cornrows', 1, 1,  '2 Straight Back Cornrows', 2000, null, 45, true, false),
  ('Cornrows', 1, 2,  '4–6 Straight Back Cornrows', 2500, null, 60, true, false),
  ('Cornrows', 1, 3,  '8–10 Straight Back Cornrows', 3000, null, 75, true, false),
  ('Cornrows', 1, 4,  '12+ Straight Back Cornrows', 3500, null, 90, true, false),
  ('Cornrows', 1, 5,  'Feed-In Cornrows', 4500, 'From £45', 120, true, false),
  ('Cornrows', 1, 6,  'Stitch Braids', 5000, 'From £50', 150, true, false),
  ('Cornrows', 1, 7,  'Ghana Braids', 5500, 'From £55', 150, true, false),
  ('Cornrows', 1, 8,  'Tribal Braids', 6000, 'From £60', 150, true, false),
  ('Cornrows', 1, 9,  'Zigzag/Freestyle Cornrows', 4500, 'From £45', 120, true, false),
  ('Cornrows', 1, 10, 'Men''s Cornrows', 3000, '£30–£45', 60, true, false),
  ('Cornrows', 1, 11, 'Children''s Cornrows (Under 12)', 2500, '£25–£40', 60, true, false),

  -- Knotless Braids
  ('Knotless Braids', 2, 1, 'Large', 7500, null, 240, true, false),
  ('Knotless Braids', 2, 2, 'Medium', 9500, null, 300, true, false),
  ('Knotless Braids', 2, 3, 'Small', 12000, null, 360, true, false),
  ('Knotless Braids', 2, 4, 'Extra Small', 14500, null, 420, true, false),
  ('Knotless Braids', 2, 5, 'Waist Length', 2000, '+£20', 0, true, true),
  ('Knotless Braids', 2, 6, 'Bum Length', 3500, '+£35', 0, true, true),

  -- Box Braids
  ('Box Braids', 3, 1, 'Large', 7000, null, 210, true, false),
  ('Box Braids', 3, 2, 'Medium', 9000, null, 270, true, false),
  ('Box Braids', 3, 3, 'Small', 11000, null, 330, true, false),
  ('Box Braids', 3, 4, 'Extra Small', 13500, null, 390, true, false),
  ('Box Braids', 3, 5, 'Extra Length', 2000, '+£20–£35', 0, true, true),

  -- Twists
  ('Twists', 4, 1, 'Passion Twists', 8500, 'From £85', 180, true, false),
  ('Twists', 4, 2, 'Senegalese Twists', 9000, 'From £90', 210, true, false),
  ('Twists', 4, 3, 'Marley Twists', 9000, 'From £90', 210, true, false),
  ('Twists', 4, 4, 'Havana Twists', 9500, 'From £95', 210, true, false),
  ('Twists', 4, 5, 'Spring Twists', 9000, 'From £90', 210, true, false),

  -- Loc Styles
  ('Loc Styles', 5, 1, 'Soft Locs', 9500, 'From £95', 240, true, false),
  ('Loc Styles', 5, 2, 'Butterfly Locs', 10000, 'From £100', 240, true, false),
  ('Loc Styles', 5, 3, 'Goddess Locs', 11000, 'From £110', 270, true, false),
  ('Loc Styles', 5, 4, 'Distressed Locs', 11000, 'From £110', 270, true, false),
  ('Loc Styles', 5, 5, 'Invisible Locs', 12000, 'From £120', 300, true, false),

  -- Boho & Goddess Styles
  ('Boho & Goddess Styles', 6, 1, 'Boho Knotless Braids', 11000, 'From £110', 300, true, false),
  ('Boho & Goddess Styles', 6, 2, 'Small Boho Braids', 13000, 'From £130', 360, true, false),
  ('Boho & Goddess Styles', 6, 3, 'Goddess Braids', 10500, 'From £105', 240, true, false),
  ('Boho & Goddess Styles', 6, 4, 'Fulani Braids', 6000, 'From £60', 150, true, false),
  ('Boho & Goddess Styles', 6, 5, 'Lemonade Braids', 6500, 'From £65', 150, true, false),

  -- Crochet Styles
  ('Crochet Styles', 7, 1, 'Crochet Braids', 6000, null, 120, true, false),
  ('Crochet Styles', 7, 2, 'Crochet Twists', 6500, null, 120, true, false),
  ('Crochet Styles', 7, 3, 'Crochet Locs', 7000, null, 120, true, false),

  -- Ponytail Styles
  ('Ponytail Styles', 8, 1, 'Braided Ponytail', 4500, null, 90, true, false),
  ('Ponytail Styles', 8, 2, 'Feed-In Ponytail', 5000, null, 90, true, false),
  ('Ponytail Styles', 8, 3, 'Goddess Ponytail', 6000, null, 120, true, false),

  -- Children's Braiding (Under 12)
  ('Children''s Braiding (Under 12)', 9, 1, 'Simple Cornrows', 2500, null, 45, true, false),
  ('Children''s Braiding (Under 12)', 9, 2, 'Beaded Cornrows', 3000, null, 60, true, false),
  ('Children''s Braiding (Under 12)', 9, 3, 'Ponytail Braids', 3500, null, 60, true, false),
  ('Children''s Braiding (Under 12)', 9, 4, 'Box Braids', 5500, 'From £55', 150, true, false),
  ('Children''s Braiding (Under 12)', 9, 5, 'Knotless Braids', 6500, 'From £65', 180, true, false),

  -- Hair Care & Treatments
  ('Hair Care & Treatments', 10, 1, 'Hair Consultation', 1500, 'Free with booked service / £15 standalone', 15, true, false),
  ('Hair Care & Treatments', 10, 2, 'Hair Wash', 1500, null, 20, true, false),
  ('Hair Care & Treatments', 10, 3, 'Blow Dry', 1500, null, 30, true, false),
  ('Hair Care & Treatments', 10, 4, 'Wash & Blow Dry', 2500, null, 45, true, false),
  ('Hair Care & Treatments', 10, 5, 'Deep Conditioning Treatment', 3000, null, 45, true, false),
  ('Hair Care & Treatments', 10, 6, 'Moisturising Steam Treatment', 3500, null, 45, true, false),
  ('Hair Care & Treatments', 10, 7, 'Protein Strengthening Treatment', 3500, null, 45, true, false),
  ('Hair Care & Treatments', 10, 8, 'Hot Oil Treatment', 3000, null, 30, true, false),
  ('Hair Care & Treatments', 10, 9, 'Hair Trim', 1500, null, 20, true, false),

  -- Add-On Services (pricing modifiers only — not standalone bookable)
  ('Add-On Services', 11, 1, 'Hair Included', 1500, 'From £15', 0, true, true),
  ('Add-On Services', 11, 2, 'Beads', 500, null, 0, true, true),
  ('Add-On Services', 11, 3, 'Curly Hair Added', 1500, 'From £15', 0, true, true),
  ('Add-On Services', 11, 4, 'Human Hair Curls', 4000, 'From £40', 0, true, true),
  ('Add-On Services', 11, 5, 'Extra Thick Hair', 1500, '+£15', 0, true, true),
  ('Add-On Services', 11, 6, 'Extra Long Hair', 2000, '+£20–£40', 0, true, true),

  -- Removal Services
  ('Removal Services', 12, 1, 'Cornrows Take Down', 2000, null, 30, true, false),
  ('Removal Services', 12, 2, 'Box Braids Removal', 3500, 'From £35', 45, true, false),
  ('Removal Services', 12, 3, 'Knotless Braids Removal', 4000, 'From £40', 60, true, false),
  ('Removal Services', 12, 4, 'Locs Removal', 4500, 'From £45', 60, true, false),
  ('Removal Services', 12, 5, 'Wash After Take Down', 1500, null, 20, true, false);
