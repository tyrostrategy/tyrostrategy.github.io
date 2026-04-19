import { createClient } from "@supabase/supabase-js";

/**
 * Canonical Supabase client for the app.
 *
 * Single instance — do NOT createClient() anywhere else. Multiple GoTrueClient
 * instances in the same browser context conflict over the auth storage key.
 *
 * Per-request identity (for RLS):
 *   The current user's email is attached as an `X-User-Email` header to every
 *   HTTP request via the `global.fetch` wrapper below. PostgREST exposes this
 *   as `current_setting('request.headers')::json ->> 'x-user-email'` which
 *   our `app.current_email()` SQL helper reads (migration 008).
 *
 *   This is pool-safe because PostgREST sets these GUCs per-transaction. The
 *   earlier `set_user_context` RPC approach used a session-scoped GUC which
 *   didn't survive PgBouncer's transaction pooling → all mutations got 406.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Mutable module-level ref — fetch wrapper reads this FRESH on every request,
// so the value at login time is reflected on the next DB call without needing
// to recreate the client.
let currentUserEmail: string | null = null;

/**
 * Updates the active user email for RLS. Pass null on logout.
 * Safe to call multiple times. Synchronous.
 */
export function setSupabaseUserContext(email: string | null | undefined): void {
  currentUserEmail = email ? email.toLowerCase().trim() : null;
}

/** Read-only view of the currently-attached RLS identity (for debug/probe). */
export function getSupabaseUserContext(): string | null {
  return currentUserEmail;
}

function makeClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[Supabase] URL or anon key not configured. Using mock data.");
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Keep the auth session key stable — prevents the "Multiple GoTrueClient
      // instances" warning that HMR / hot reloads can trigger.
      storageKey: `sb-${new URL(supabaseUrl).host.split(".")[0]}-auth-token`,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (currentUserEmail) {
          headers.set("X-User-Email", currentUserEmail);
        }
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const supabase = makeClient();

export const isSupabaseConfigured = !!supabase;
