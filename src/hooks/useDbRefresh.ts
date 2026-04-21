import { useEffect } from "react";
import { useDataStore } from "@/stores/dataStore";
import { useRoleStore } from "@/stores/roleStore";
import { isSupabaseMode } from "@/lib/supabaseMode";

/**
 * Pulls the freshest projeler / aksiyonlar / users / tag_definitions /
 * role_permissions snapshot from Supabase and replaces the in-memory
 * store. Used by every list page (Workspace, Dashboard, Projeler,
 * Aksiyonlar, Kullanıcılar, Kokpit) on mount so the user always reads
 * what's currently in the database, not whatever was cached in
 * localStorage from a previous session.
 *
 * Fail-open: a failed fetch logs to console but leaves the existing
 * store contents untouched — user sees cached data, offline-style,
 * instead of an empty screen. Success is silent (no toast spam).
 *
 * A small `cooldownMs` guards against tight navigation loops (user
 * bouncing between Projeler and Aksiyonlar in <5s) — doesn't refetch
 * if we fetched less than the cooldown ago.
 */
let lastFetchAt = 0;
const DEFAULT_COOLDOWN_MS = 5_000;

export function useDbRefresh(cooldownMs: number = DEFAULT_COOLDOWN_MS): void {
  useEffect(() => {
    if (!isSupabaseMode) return;
    const elapsed = Date.now() - lastFetchAt;
    if (elapsed < cooldownMs) return;
    lastFetchAt = Date.now();

    // Lazy-load the adapter so the import graph stays light for
    // mock-mode consumers that never need the Supabase module.
    import("@/lib/data/supabaseAdapter")
      .then(({ supabaseAdapter }) =>
        Promise.all([
          supabaseAdapter.fetchProjeler(),
          supabaseAdapter.fetchAksiyonlar(),
          supabaseAdapter.fetchTagDefinitions(),
          supabaseAdapter.fetchUsers(),
          useRoleStore.getState().reloadFromDb(),
        ]),
      )
      .then(([projeler, aksiyonlar, tagDefinitions, users]) => {
        useDataStore.setState({ projeler, aksiyonlar, tagDefinitions, users });
      })
      .catch((err) => {
        // err from Supabase is usually a PostgrestError-shape object;
        // JSON.stringify so the console actually shows { code, message,
        // details } instead of the useless "[object Object]".
        console.error("[useDbRefresh] failed:", err?.message || JSON.stringify(err));
      });
  }, [cooldownMs]);
}
