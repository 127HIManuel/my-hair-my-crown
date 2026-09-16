"use client";

import Link from "next/link";
import { useState } from "react";
import { Service, displayPrice, slugify } from "@/lib/types";

type Group = { category: string; items: Service[] };

export default function ServiceAccordion({ groups }: { groups: Group[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="mt-10 space-y-3">
      {groups.map((group) => {
        const isOpen = open === group.category;
        return (
          <div
            key={group.category}
            id={slugify(group.category)}
            className="rounded-xl border border-ink/10 overflow-hidden scroll-mt-24"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : group.category)}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-ink/5"
            >
              <span className="font-display text-xl">{group.category}</span>
              <span className="text-ink/40 text-sm">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
              <div className="border-t border-ink/10">
                {(group.category === "Add-On Services" ||
                  group.category === "Hair Care & Treatments") && (
                  <p className="px-6 pt-3 text-sm text-ink/50">
                    {group.category === "Add-On Services"
                      ? "These are optional extras — select them during booking after you've chosen a main service."
                      : "Bookable on their own, or added on to any other service during booking."}
                  </p>
                )}
                <div className="divide-y divide-ink/10 px-6">
                  {group.items.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-6 py-4">
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
                        {!s.is_addon && (
                          <span className="font-display text-lg text-wine-500">£10 deposit</span>
                        )}
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
