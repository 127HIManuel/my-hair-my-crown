import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { groupServicesByCategory, isBookableCategory, slugify } from "@/lib/types";
import ServiceAccordion from "@/components/ServiceAccordion";

export const revalidate = 60;

export default async function ServicesPage() {
  const supabase = createClient();
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("category_sort")
    .order("sort_order");

  const groups = groupServicesByCategory(services ?? []);
  const navGroups = groups.filter((g) => isBookableCategory(g.category));

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-xs uppercase tracking-widest2 text-wine-500">Menu</p>
      <h1 className="font-display text-4xl">Services &amp; pricing</h1>
      <p className="mt-3 max-w-xl text-ink/60">
        A £10 deposit is required to secure your booking — the remaining
        balance is settled in person on the day. Add-on services are selected
        during booking and charged on the day alongside your main service.
      </p>

      {/* Jump-to-category menu */}
      {navGroups.length > 0 && (
        <nav
          aria-label="Service categories"
          className="mt-8 flex flex-wrap gap-2 border-y border-ink/10 py-4"
        >
          {navGroups.map((g) => (
            <a
              key={g.category}
              href={`#${slugify(g.category)}`}
              className="focus-ring rounded-full border border-ink/15 px-4 py-1.5 text-sm transition hover:border-crown-400 hover:bg-crown-50"
            >
              {g.category}
            </a>
          ))}
        </nav>
      )}

      {groups.length === 0 && (
        <p className="mt-10 py-12 text-center text-ink/50">
          No services are published yet. Please check back soon.
        </p>
      )}

      {groups.length > 0 && <ServiceAccordion groups={groups} />}
    </div>
  );
}
