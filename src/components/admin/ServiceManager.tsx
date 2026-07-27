"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Service, formatCents, displayPrice, groupServicesByCategory } from "@/lib/types";

export default function ServiceManager({ initialServices }: { initialServices: Service[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState(0); // in pounds, converted on submit
  const [displayPriceText, setDisplayPriceText] = useState("");
  const [isAddon, setIsAddon] = useState(false);

  function openNew() {
    setEditing(null);
    setName("");
    setCategory("");
    setDescription("");
    setDuration(60);
    setPrice(0);
    setDisplayPriceText("");
    setIsAddon(false);
    setShowForm(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setName(s.name);
    setCategory(s.category);
    setDescription(s.description ?? "");
    setDuration(s.duration_minutes);
    setPrice(s.price_cents / 100);
    setDisplayPriceText(s.display_price ?? "");
    setIsAddon(s.is_addon);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name,
      category: category || "General",
      description,
      duration_minutes: duration,
      price_cents: Math.round(price * 100),
      display_price: displayPriceText || null,
      is_addon: isAddon,
    };

    if (editing) {
      await fetch(`/api/admin/services/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    setShowForm(false);
    router.refresh();
  }

  async function toggleActive(s: Service) {
    await fetch(`/api/admin/services/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    router.refresh();
  }

  async function remove(s: Service) {
    if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/services/${s.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={openNew}
        className="focus-ring mb-6 rounded-full bg-ink px-5 py-2 text-sm uppercase tracking-widest2 text-ivory hover:bg-wine-500"
      >
        + New service
      </button>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="mb-8 space-y-4 rounded-xl border border-crown-400 bg-crown-50 p-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              required
              placeholder="Service name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="focus-ring rounded-lg border border-ink/15 px-4 py-2"
            />
            <input
              required
              placeholder="Category (e.g. Cornrows)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="focus-ring rounded-lg border border-ink/15 px-4 py-2"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <input
                required
                type="number"
                min={0}
                step={0.01}
                placeholder="Price (GBP) — used for checkout"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="focus-ring w-full rounded-lg border border-ink/15 px-4 py-2"
              />
              <p className="mt-1 text-xs text-ink/40">
                For "From £x" or range pricing, enter the lower bound here.
              </p>
            </div>
            <div>
              <input
                placeholder='Display price (optional, e.g. "From £45" or "£30–£45")'
                value={displayPriceText}
                onChange={(e) => setDisplayPriceText(e.target.value)}
                className="focus-ring w-full rounded-lg border border-ink/15 px-4 py-2"
              />
              <p className="mt-1 text-xs text-ink/40">
                Leave blank to just show the exact price above.
              </p>
            </div>
          </div>
          <input
            required
            type="number"
            min={0}
            step={5}
            placeholder="Duration (minutes) — 0 for add-ons"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="focus-ring w-full rounded-lg border border-ink/15 px-4 py-2"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="focus-ring w-full rounded-lg border border-ink/15 px-4 py-2"
          />
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={isAddon}
              onChange={(e) => setIsAddon(e.target.checked)}
            />
            This is a pricing add-on (shown on the price list, not bookable
            on its own)
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="focus-ring rounded-full bg-ink px-5 py-2 text-sm text-ivory hover:bg-wine-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="focus-ring rounded-full border border-ink/20 px-5 py-2 text-sm hover:border-ink/40"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {groupServicesByCategory(initialServices).map((group) => (
      <div key={group.category} className="mb-8">
        <p className="mb-2 text-sm font-medium text-ink/70">{group.category}</p>
        <div className="divide-y divide-ink/10 rounded-xl border border-ink/10">
        {group.items.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-medium">
                {s.name}{" "}
                {!s.active && (
                  <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-xs text-ink/50">
                    hidden
                  </span>
                )}
                {s.is_addon && (
                  <span className="ml-2 rounded-full bg-crown-100 px-2 py-0.5 text-xs text-ink/50">
                    add-on
                  </span>
                )}
              </p>
              <p className="text-xs text-ink/50">
                {s.is_addon ? "Add-on" : `${s.duration_minutes} min`} · {displayPrice(s)}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <button onClick={() => openEdit(s)} className="focus-ring underline underline-offset-4">
                Edit
              </button>
              <button onClick={() => toggleActive(s)} className="focus-ring underline underline-offset-4">
                {s.active ? "Hide" : "Show"}
              </button>
              <button
                onClick={() => remove(s)}
                className="focus-ring text-wine-500 underline underline-offset-4"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        </div>
      </div>
      ))}
      {initialServices.length === 0 && (
        <p className="px-5 py-8 text-center text-ink/50">No services yet.</p>
      )}
    </div>
  );
}
