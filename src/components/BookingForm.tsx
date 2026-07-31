"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Service,
  Staff,
  formatCents,
  displayPrice,
  groupServicesByCategory,
  isAddonEligible,
  isBookableCategory,
} from "@/lib/types";

type FeeBreakdown = {
  servicePriceCents: number;
  devFeeCents: number;
  totalChargedCents: number;
  feeLabel: string;
};

type Props = {
  services: Service[];
  staff: Staff[];
  initialServiceId?: string;
};

function todayISODate() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export default function BookingForm({ services, staff, initialServiceId }: Props) {
  const [serviceId, setServiceId] = useState(initialServiceId || services[0]?.id || "");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState<string>("");
  const [date, setDate] = useState(todayISODate());
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);

  // Only these count as browsable/bookable "main" services (excludes the
  // Add-On Services category, and the couple of pure pricing modifiers
  // marked is_addon in other categories).
  const bookableServices = useMemo(
    () => services.filter((s) => !s.is_addon && isBookableCategory(s.category)),
    [services]
  );

  const categoryGroups = useMemo(() => groupServicesByCategory(bookableServices), [bookableServices]);
  const [openCategory, setOpenCategory] = useState(() => {
    if (initialServiceId) {
      const match = bookableServices.find((s) => s.id === initialServiceId);
      if (match) return match.category;
    }
    return categoryGroups[0]?.category ?? "";
  });

  // Optional extras offered once a main service is chosen: Add-On Services
  // items, plus Hair Care & Treatments (which is also independently
  // bookable). Never offer the currently-selected main service as an addon
  // to itself.
  const addonOptions = useMemo(
    () => services.filter((s) => isAddonEligible(s) && s.id !== serviceId),
    [services, serviceId]
  );
  const selectedAddons = useMemo(
    () => addonOptions.filter((a) => addonIds.includes(a.id)),
    [addonOptions, addonIds]
  );

  function toggleAddon(id: string) {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const [openAddonCategory, setOpenAddonCategory] = useState("");
  const addonGroups = useMemo(() => groupServicesByCategory(addonOptions), [addonOptions]);

  const [fee, setFee] = useState<FeeBreakdown | null>(null);

  useEffect(() => {
    if (!service) {
      setFee(null);
      return;
    }
    const combinedPriceCents =
      service.price_cents + selectedAddons.reduce((sum, a) => sum + a.price_cents, 0);
    fetch(`/api/fee-preview?price_cents=${combinedPriceCents}`)
      .then((r) => r.json())
      .then((data) => setFee(data))
      .catch(() => setFee(null));
  }, [service, selectedAddons]);

  useEffect(() => {
    setAddonIds((prev) => prev.filter((id) => id !== serviceId));
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId || !date) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    const params = new URLSearchParams({ date, service_id: serviceId });
    if (staffId) params.set("staff_id", staffId);

    fetch(`/api/availability?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [serviceId, staffId, date]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedSlot) {
      setError("Please choose a time slot.");
      return;
    }
    if (!name || !email) {
      setError("Please enter your name and email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          addonServiceIds: addonIds,
          staffId: staffId || null,
          startTime: selectedSlot,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-10 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-8">
        {/* Service */}
        <fieldset>
          <legend className="mb-3 text-xs uppercase tracking-widest2 text-wine-500">
            1. Choose a service
          </legend>
          <div className="space-y-2">
            {categoryGroups.map((group) => {
              const isOpen = openCategory === group.category;
              return (
                <div key={group.category} className="rounded-xl border border-ink/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenCategory(isOpen ? "" : group.category)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-ink/5 transition"
                  >
                    <span>{group.category}</span>
                    <span className="text-ink/40 text-xs">{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 p-4 pt-2 border-t border-ink/10">
                      {group.items.map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => setServiceId(s.id)}
                          className={`focus-ring rounded-xl border p-4 text-left transition ${
                            serviceId === s.id
                              ? "border-crown-400 bg-crown-50 ring-1 ring-crown-400"
                              : "border-ink/10 hover:border-ink/30"
                          }`}
                        >
                          <p className="font-display">{s.name}</p>
                          <p className="mt-1 text-xs text-ink/50">
                            {s.duration_minutes} min · {displayPrice(s)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>

        {/* Optional extras */}
        {service && addonOptions.length > 0 && (
          <fieldset>
            <legend className="mb-3 text-xs uppercase tracking-widest2 text-wine-500">
              2. Add any extras (optional)
            </legend>
            <div className="space-y-2">
              {addonGroups.map((group) => {
                const isOpen = openAddonCategory === group.category;
                return (
                  <div key={group.category} className="rounded-xl border border-ink/10 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenAddonCategory(isOpen ? "" : group.category)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-ink/5 transition"
                    >
                      <span>{group.category}</span>
                      <span className="text-ink/40 text-xs">{isOpen ? "▲" : "▼"}</span>
                    </button>
                    {isOpen && (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 p-4 pt-2 border-t border-ink/10">
                        {group.items.map((a) => {
                          const checked = addonIds.includes(a.id);
                          return (
                            <label
                              key={a.id}
                              className={`focus-ring flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                                checked
                                  ? "border-crown-400 bg-crown-50 ring-1 ring-crown-400"
                                  : "border-ink/10 hover:border-ink/30"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleAddon(a.id)}
                                className="mt-1"
                              />
                              <div>
                                <p className="font-display">{a.name}</p>
                                <p className="mt-1 text-xs text-ink/50">{displayPrice(a)}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Staff (optional) */}
        {staff.length > 0 && (
          <fieldset>
            <legend className="mb-3 text-xs uppercase tracking-widest2 text-wine-500">
              3. Choose a stylist (optional)
            </legend>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStaffId("")}
                className={`focus-ring rounded-full border px-4 py-2 text-sm transition ${
                  staffId === ""
                    ? "border-crown-400 bg-crown-50"
                    : "border-ink/10 hover:border-ink/30"
                }`}
              >
                No preference
              </button>
              {staff.map((st) => (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => setStaffId(st.id)}
                  className={`focus-ring rounded-full border px-4 py-2 text-sm transition ${
                    staffId === st.id
                      ? "border-crown-400 bg-crown-50"
                      : "border-ink/10 hover:border-ink/30"
                  }`}
                >
                  {st.name}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* Date + time */}
        <fieldset>
          <legend className="mb-3 text-xs uppercase tracking-widest2 text-wine-500">
            4. Pick a date &amp; time
          </legend>
          <input
            type="date"
            value={date}
            min={todayISODate()}
            onChange={(e) => setDate(e.target.value)}
            className="focus-ring rounded-lg border border-ink/15 px-4 py-2"
          />
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {loadingSlots && <p className="col-span-full text-sm text-ink/50">Loading times…</p>}
            {!loadingSlots && slots.length === 0 && (
              <p className="col-span-full text-sm text-ink/50">
                No times available this day — try another date.
              </p>
            )}
            {slots.map((slot) => {
              const t = new Date(slot);
              const label = t.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              });
              const active = selectedSlot === slot;
              return (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`focus-ring rounded-lg border px-3 py-2 text-sm transition ${
                    active
                      ? "border-crown-400 bg-ink text-ivory"
                      : "border-ink/10 hover:border-ink/30"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Contact details */}
        <fieldset className="space-y-4">
          <legend className="mb-1 text-xs uppercase tracking-widest2 text-wine-500">
            5. Your details
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              required
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="focus-ring rounded-lg border border-ink/15 px-4 py-2"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus-ring rounded-lg border border-ink/15 px-4 py-2"
            />
          </div>
          <input
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="focus-ring w-full rounded-lg border border-ink/15 px-4 py-2"
          />
          <textarea
            placeholder="Anything we should know? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="focus-ring w-full rounded-lg border border-ink/15 px-4 py-2"
          />
        </fieldset>
      </div>

      {/* Order summary */}
      <div className="lg:col-span-2">
        <div className="sticky top-24 rounded-2xl border border-ink/10 bg-white/60 p-6">
          <p className="font-display text-lg">Order summary</p>
          {service && fee ? (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink/60">{service.name}</span>
                <span>{formatCents(service.price_cents)}</span>
              </div>
              {selectedAddons.map((a) => (
                <div key={a.id} className="flex justify-between">
                  <span className="text-ink/60">+ {a.name}</span>
                  <span>{formatCents(a.price_cents)}</span>
                </div>
              ))}
              {fee.devFeeCents > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink/60">Booking &amp; processing fee</span>
                  <span>{formatCents(fee.devFeeCents)}</span>
                </div>
              )}
              <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 font-medium">
                <span>Total due today</span>
                <span className="text-wine-500">{formatCents(fee.totalChargedCents)}</span>
              </div>
              {selectedSlot && (
                <p className="mt-2 text-xs text-ink/50">
                  {new Date(selectedSlot).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink/50">Choose a service to see pricing.</p>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-wine-500/10 px-3 py-2 text-sm text-wine-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="focus-ring mt-6 w-full rounded-full bg-ink py-3 text-sm uppercase tracking-widest2 text-ivory transition hover:bg-wine-500 disabled:opacity-50"
          >
            {submitting ? "Redirecting to payment…" : "Continue to payment"}
          </button>
          <p className="mt-3 text-center text-xs text-ink/40">
            Payments are securely processed by Stripe.
          </p>
        </div>
      </div>
    </form>
  );
}
