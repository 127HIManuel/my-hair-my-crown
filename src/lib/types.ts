export type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  active: boolean;
  category: string;
  category_sort: number;
  sort_order: number;
  display_price: string | null;
  is_addon: boolean;
};

/** Groups a flat service list into ordered category sections. */
export function groupServicesByCategory(services: Service[]) {
  const byCategory = new Map<string, Service[]>();
  for (const s of services) {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category)!.push(s);
  }
  return Array.from(byCategory.entries())
    .map(([category, items]) => ({
      category,
      categorySort: items[0]?.category_sort ?? 0,
      items: items.sort((a, b) => a.sort_order - b.sort_order),
    }))
    .sort((a, b) => a.categorySort - b.categorySort);
}

/** Turns a category name into a URL-safe anchor id, e.g.
 * "Boho & Goddess Styles" -> "boho-goddess-styles". */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "Add-On Services" is priced for reference but is never a standalone
 * bookable category — its items only ever get added on top of another
 * service during checkout. Every other category (including "Hair Care &
 * Treatments", which is both bookable on its own AND addable to others)
 * counts as a normal, browsable/bookable section. */
export function isBookableCategory(category: string) {
  return category !== "Add-On Services";
}

/** A service counts as an optional "extra" during booking if it's in the
 * Add-On Services category, or in Hair Care & Treatments (which does
 * double duty: bookable on its own, and offered as an add-on to anything
 * else). */
export function isAddonEligible(service: Pick<Service, "category">) {
  return (
    service.category === "Add-On Services" ||
    service.category === "Hair Care & Treatments"
  );
}

export type Staff = {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  active: boolean;
};

export type BusinessHour = {
  id: string;
  day_of_week: number;
  start_time: string; // "09:00:00"
  end_time: string;
  is_closed: boolean;
};

export type BusinessSettings = {
  id: number;
  business_name: string;
  stripe_connected_account_id: string | null;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  timezone: string;
  slot_interval_minutes: number;
};

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type Booking = {
  id: string;
  service_id: string;
  staff_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string | null;
  currency: string;
  service_price_cents: number;
  dev_fee_cents: number;
  total_charged_cents: number;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
};

export function formatCents(cents: number, currency = "gbp") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/** Prefer the human-readable label ("From £45") when the salon set one;
 * otherwise fall back to formatting the exact price. */
export function displayPrice(service: Pick<Service, "price_cents" | "display_price">) {
  return service.display_price || formatCents(service.price_cents);
}
