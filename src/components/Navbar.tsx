"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2 focus-ring" onClick={() => setOpen(false)}>
          <span className="font-display text-xl italic text-wine-500">My Hair</span>
          <span className="font-display text-xl">My Crown</span>
        </Link>
        
        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 text-sm uppercase tracking-widest2 sm:flex">
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

        {/* Mobile hamburger */}
        <button
          type="button"
          className="focus-ring sm:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-0.5 w-6 bg-ink transition-all" style={{ marginBottom: 5, rotate: open ? "45deg" : "0deg", translate: open ? "0 6px" : "0" }} />
          <span className="block h-0.5 w-6 bg-ink transition-all" style={{ opacity: open ? 0 : 1 }} />
          <span className="block h-0.5 w-6 bg-ink transition-all" style={{ marginTop: 5, rotate: open ? "-45deg" : "0deg", translate: open ? "0 -6px" : "0" }} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-ink/10 bg-ivory px-6 py-4 flex flex-col gap-4 text-sm uppercase tracking-widest2 sm:hidden">
          <Link href="/services" className="focus-ring hover:text-wine-500" onClick={() => setOpen(false)}>
            Services
          </Link>
          <Link
            href="/book"
            className="focus-ring rounded-full bg-ink px-5 py-3 text-center text-ivory transition hover:bg-wine-500"
            onClick={() => setOpen(false)}
          >
            Book Now
          </Link>
        </nav>
      )}
    </header>
  );
}
