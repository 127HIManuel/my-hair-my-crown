"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-24">
      <p className="text-xs uppercase tracking-widest2 text-wine-500">Salon dashboard</p>
      <h1 className="font-display text-3xl">Sign in</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="focus-ring w-full rounded-lg border border-ink/15 px-4 py-2"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="focus-ring w-full rounded-lg border border-ink/15 px-4 py-2"
        />
        {error && <p className="text-sm text-wine-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="focus-ring w-full rounded-full bg-ink py-3 text-sm uppercase tracking-widest2 text-ivory transition hover:bg-wine-500 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-xs text-ink/40">
        Accounts are created by the site administrator directly in Supabase.
      </p>
    </div>
  );
}
