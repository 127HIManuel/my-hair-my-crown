"use client";

import { useState } from "react";
import { BusinessHour } from "@/lib/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function BusinessHoursEditor({ initial }: { initial: BusinessHour[] }) {
  const [hours, setHours] = useState<BusinessHour[]>(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const existingDays = new Set(hours.map((h) => h.day_of_week));
  const availableDays = ALL_DAYS.filter((d) => !existingDays.has(d));

  async function update(id: string, patch: Partial<BusinessHour>) {
    setSaving(id);
    setError(null);
    const res = await fetch(`/api/admin/hours/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); } else {
      setHours((prev) => prev.map((h) => (h.id === id ? data : h)));
    }
    setSaving(null);
  }

  async function remove(id: string) {
    setSaving(id);
    setError(null);
    const res = await fetch(`/api/admin/hours/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
    } else {
      setHours((prev) => prev.filter((h) => h.id !== id));
    }
    setSaving(null);
  }

  async function addDay(day_of_week: number) {
    setSaving("new");
    setError(null);
    const res = await fetch("/api/admin/hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day_of_week }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); } else {
      setHours((prev) =>
        [...prev, data].sort((a, b) => a.day_of_week - b.day_of_week)
      );
    }
    setSaving(null);
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-wine-500/10 px-3 py-2 text-sm text-wine-500">{error}</p>
      )}

      <div className="divide-y divide-ink/10">
        {hours
          .sort((a, b) => a.day_of_week - b.day_of_week)
          .map((h) => {
            const busy = saving === h.id;
            return (
              <div key={h.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-10 text-sm font-medium">{DAY_NAMES[h.day_of_week]}</span>

                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={h.is_closed}
                    disabled={busy}
                    onChange={(e) => update(h.id, { is_closed: e.target.checked })}
                  />
                  Closed
                </label>

                {!h.is_closed && (
                  <>
                    <input
                      type="time"
                      value={h.start_time.slice(0, 5)}
                      disabled={busy}
                      onChange={(e) => update(h.id, { start_time: e.target.value })}
                      className="focus-ring rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
                    />
                    <span className="text-ink/40">–</span>
                    <input
                      type="time"
                      value={h.end_time.slice(0, 5)}
                      disabled={busy}
                      onChange={(e) => update(h.id, { end_time: e.target.value })}
                      className="focus-ring rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
                    />
                  </>
                )}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(h.id)}
                  className="ml-auto text-xs text-wine-500 hover:underline disabled:opacity-40"
                >
                  {busy ? "Saving…" : "Remove"}
                </button>
              </div>
            );
          })}
      </div>

      {availableDays.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {availableDays.map((d) => (
            <button
              key={d}
              type="button"
              disabled={saving === "new"}
              onClick={() => addDay(d)}
              className="focus-ring rounded-full border border-ink/15 px-4 py-1.5 text-sm transition hover:border-crown-400 hover:bg-crown-50 disabled:opacity-40"
            >
              + {DAY_NAMES[d]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
