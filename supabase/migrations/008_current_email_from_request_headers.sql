-- ============================================================================
-- Migration 008: current_email'i PostgREST request.headers'dan oku
-- ============================================================================
-- Problem:
--   Migration 006'da current_email() current_setting('app.user_email') GUC'unu
--   okuyor. set_user_context RPC'si bu GUC'u set_config(..., false) ile session
--   scope'ta set ediyor. Supabase PgBouncer transaction-pooling yaptığı için,
--   1. request'te set ettiğin GUC, 2. request'te farklı connection'a düştüğünde
--   KAYBOLUYOR → app.current_role() null → tüm mutasyonlar 406 reddediyor.
--
-- Çözüm:
--   PostgREST her request için `request.headers` adlı GUC'u transaction-local
--   olarak yazar. Client'tan X-User-Email header'ı gelirse orada görünür.
--   current_email() önce bunu okur, yoksa eski GUC'a düşer (pg script'ler için).
-- ============================================================================

CREATE OR REPLACE FUNCTION app.current_email() RETURNS text AS $$
  SELECT NULLIF(
    lower(trim(COALESCE(
      -- 1. PostgREST request header (canlı app yolu — per-request, pool-safe)
      NULLIF(current_setting('request.headers', true)::json ->> 'x-user-email', ''),
      -- 2. GUC fallback (local pg connection / migration script'ler için)
      NULLIF(current_setting('app.user_email', true), '')
    ))),
    ''
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- Doğrulama:
--   * pg direct: SELECT public.set_user_context('cenk.sayli@...'); hala çalışır
--   * PostgREST: header X-User-Email: cenk.sayli@... varsa current_email() onu döner
-- ============================================================================
