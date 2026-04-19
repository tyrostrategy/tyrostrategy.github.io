// Re-export from the canonical client — kept so pre-existing
// `@/lib/supabase/client` imports don't break.
// Canonical source: src/lib/supabase.ts
export {
  supabase,
  isSupabaseConfigured,
  setSupabaseUserContext,
  getSupabaseUserContext,
} from "@/lib/supabase";
