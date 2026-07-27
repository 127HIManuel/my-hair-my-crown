import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Uses the SERVICE ROLE key, which bypasses Row Level Security entirely.
 * Never import this into client components — server (API routes / webhooks) only.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
