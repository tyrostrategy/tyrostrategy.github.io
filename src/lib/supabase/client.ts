import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[Supabase] URL or anon key not configured. Using mock data.");
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = !!supabase;

/**
 * Sets the `app.user_email` session variable on the DB side via the
 * `set_user_context` RPC (defined in migration 006). Called after a
 * successful MSAL login so that RLS policies can resolve the current
 * user's role from the `users` table.
 *
 * Safe to call multiple times (idempotent). Swallows errors so a
 * transient network blip doesn't block the login flow — the app will
 * still work with empty data if context setting failed.
 */
export async function setSupabaseUserContext(email: string | null | undefined): Promise<void> {
  if (!supabase) return;
  if (!email) return;
  try {
    await supabase.rpc("set_user_context", { p_email: email.toLowerCase().trim() });
  } catch (err) {
    console.warn("[Supabase] set_user_context failed:", err);
  }
}
