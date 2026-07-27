"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/types";

type BookingRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  start_time: string;
  status: string;
  service_price_cents: number;
  dev_fee_cents: number;
  total_charged_cents: number;
  currency: string;
  services: { name: string } | null;
};

const statusStyles: Record<string, string> = {
  pending_payment: "bg-crown-100 text-crown-600",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
  completed: "bg-ink/10 text-ink/60",
  no_show: "bg-red-100 text-red-600",
};

export default function BookingsTable({ bookings }: { bookings: BookingRow[] }) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    router.refresh();
  }

  if (bookings.length === 0) {
    return <p className="text-ink/50">No bookings yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-crown-50 text-xs uppercase tracking-wide text-ink/50">
          <tr>
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">You receive</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          {bookings.map((b) => (
            <tr key={b.id}>
              <td className="px-4 py-3 whitespace-nowrap">
                {new Date(b.start_time).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
              <td className="px-4 py-3">
                <p>{b.customer_name}</p>
                <p className="text-xs text-ink/50">{b.customer_email}</p>
              </td>
              <td className="px-4 py-3">{b.services?.name ?? "—"}</td>
              <td className="px-4 py-3">
                {formatCents(b.service_price_cents, b.currency)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    statusStyles[b.status] ?? "bg-ink/10"
                  }`}
                >
                  {b.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-4 py-3">
                <select
                  disabled={updatingId === b.id}
                  value={b.status}
                  onChange={(e) => updateStatus(b.id, e.target.value)}
                  className="focus-ring rounded-lg border border-ink/15 bg-white px-2 py-1 text-xs"
                >
                  <option value="pending_payment">Pending payment</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="no_show">No-show</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
