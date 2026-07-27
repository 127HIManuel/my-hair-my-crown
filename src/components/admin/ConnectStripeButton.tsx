"use client";

import { useState } from "react";

export default function ConnectStripeButton({ alreadyConnected }: { alreadyConnected: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start onboarding.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="focus-ring rounded-full bg-ink px-5 py-2 text-sm uppercase tracking-widest2 text-ivory hover:bg-wine-500 disabled:opacity-50"
      >
        {loading
          ? "Redirecting to Stripe…"
          : alreadyConnected
          ? "Manage Stripe account"
          : "Connect Stripe account"}
      </button>
      {error && <p className="mt-3 text-sm text-wine-500">{error}</p>}
    </div>
  );
}
