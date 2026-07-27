import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2 focus-ring">
          <span className="font-display text-xl italic text-wine-500">My Hair</span>
          <span className="font-display text-xl">My Crown</span>
        </Link>
        <nav className="flex items-center gap-8 text-sm uppercase tracking-widest2">
          <Link href="/services" className="focus-ring hover:text-wine-500">
            Services
          </Link>
          <Link
            href="/book"
            className="focus-ring rounded-full bg-ink px-5 py-2 text-ivory transition hover:bg-wine-500"
          >
            Book Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
