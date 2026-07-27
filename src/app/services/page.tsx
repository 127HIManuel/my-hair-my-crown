import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { displayPrice, groupServicesByCategory, isBookableCategory, slugify } from "@/lib/types";

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
        Prices shown are what the salon charges for the service itself. A
        small booking &amp; processing fee is added at checkout — you'll
        always see the full total before you pay. Items marked as add-ons are
        priced here for reference and are added on top of a booked service
        rather than booked on their own.
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

      {groups.map((group) => (
        <section
          key={group.category}
          id={slugify(group.category)}
          className="mt-12 scroll-mt-24 first:mt-10"
        >
          <h2 className="font-display text-2xl text-ink">{group.category}</h2>
          {group.category === "Add-On Services" && (
            <p className="mt-1 text-sm text-ink/50">
              These are optional extras — select them during booking after
              you've chosen a main service.
            </p>
          )}
          {group.category === "Hair Care & Treatments" && (
            <p className="mt-1 text-sm text-ink/50">
              Bookable on their own, or added on to any other service during
              booking.
            </p>
          )}
          <div className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
            {group.items.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-6 py-4"
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  {s.description && (
                    <p className="mt-1 text-sm text-ink/60">{s.description}</p>
                  )}
                  {!s.is_addon && (
                    <p className="mt-1 text-xs uppercase tracking-widest text-ink/40">
                      {s.duration_minutes} minutes
                    </p>
                  )}
                </div>
                <div className="flex flex-shrink-0 items-center gap-6">
                  <span className="font-display text-lg text-wine-500">
                    {displayPrice(s)}
                  </span>
                  {!s.is_addon && (
                    <Link
                      href={`/book?service=${s.id}`}
                      className="focus-ring rounded-full bg-ink px-5 py-2 text-sm uppercase tracking-widest2 text-ivory transition hover:bg-wine-500"
                    >
                      Book
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
