import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { isBookableCategory, slugify } from "@/lib/types";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();
  const [{ data: featuredServices }, { data: allServices }] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("price_cents", { ascending: true })
      .limit(4),
    supabase
      .from("services")
      .select("category, category_sort")
      .eq("active", true)
      .order("category_sort"),
  ]);

  const seen = new Set<string>();
  const categories = (allServices ?? [])
    .filter((s) => isBookableCategory(s.category) && !seen.has(s.category) && seen.add(s.category))
    .map((s) => s.category);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-ivory">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-32">
          <div>
            <p className="mb-4 text-xs uppercase tracking-widest2 text-crown-400">
              Est. for every kind of crown
            </p>
            <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
              Your hair,
              <br />
              <span className="italic text-crown-400">worn like a crown.</span>
            </h1>
            <p className="mt-6 max-w-md text-ivory/70">
              Book your next wash &amp; style, silk press, braid set, or colour
              service online in under two minutes — pay securely, get
              reminders, and walk in ready.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/book"
                className="focus-ring rounded-full bg-crown-400 px-7 py-3 text-sm font-medium uppercase tracking-widest2 text-ink transition hover:bg-crown-300"
              >
                Book an appointment
              </Link>
              <Link
                href="/services"
                className="focus-ring rounded-full border border-ivory/30 px-7 py-3 text-sm font-medium uppercase tracking-widest2 text-ivory transition hover:border-ivory"
              >
                View services
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/5] w-full rounded-2xl border border-crown-400/30 overflow-hidden md:block">
            <Image
              src="/images/V2.png"
              alt="My Hair My Crown"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Browse by category */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs uppercase tracking-widest2 text-wine-500">
            Explore
          </p>
          <h2 className="font-display text-3xl">Shop by category</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/services#${slugify(category)}`}
                className="focus-ring rounded-full border border-ink/15 px-5 py-2 text-sm transition hover:border-crown-400 hover:bg-crown-50"
              >
                {category}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Services preview */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest2 text-wine-500">
              Signature services
            </p>
            <h2 className="font-display text-3xl">A few client favourites</h2>
          </div>
          <Link href="/services" className="focus-ring text-sm underline underline-offset-4">
            See all services →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(featuredServices ?? []).map((s) => (
            <Link
              key={s.id}
              href={`/book?service=${s.id}`}
              className="focus-ring group rounded-xl border border-ink/10 bg-white/50 p-6 transition hover:border-crown-400 hover:shadow-lg"
            >
              <p className="font-display text-lg">{s.name}</p>
              <p className="mt-2 text-sm text-ink/60 line-clamp-2">{s.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-ink/50">{s.duration_minutes} min</span>
                <span className="font-medium text-wine-500">
                  £10 deposit
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-ink/10 bg-crown-50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-14 sm:grid-cols-3">
          {[
            ["Secure payment", "Every booking is paid and confirmed instantly via Stripe."],
            ["Instant confirmation", "Get an email receipt and reminder the moment you book."],
            ["No surprises", "See the full price, taxes, and fees before you pay."],
          ].map(([title, body]) => (
            <div key={title}>
              <p className="font-display text-lg text-wine-500">{title}</p>
              <p className="mt-2 text-sm text-ink/70">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
