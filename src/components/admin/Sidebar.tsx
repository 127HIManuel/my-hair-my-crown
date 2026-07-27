"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/admin", label: "Bookings" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/settings", label: "Payments & settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="w-56 flex-shrink-0 border-r border-ink/10 bg-ivory px-4 py-8">
      <p className="mb-8 px-2 font-display text-lg italic text-wine-500">Dashboard</p>
      <nav className="space-y-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`focus-ring block rounded-lg px-3 py-2 text-sm transition ${
              pathname === l.href ? "bg-ink text-ivory" : "hover:bg-ink/5"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={handleSignOut}
        className="focus-ring mt-8 block w-full rounded-lg px-3 py-2 text-left text-sm text-ink/50 hover:bg-ink/5"
      >
        Sign out
      </button>
    </aside>
  );
}
