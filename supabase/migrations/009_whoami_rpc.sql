-- ============================================================================
-- Migration 009: public.whoami() — RLS identity diagnostic RPC
-- ============================================================================
-- Amaç:
--   Client'ın X-User-Email header'ı gerçekten RLS helper'larına ulaşıyor mu
--   teyit etmek için hafif bir probe. Production'da da kalabilir, sensitive
--   bilgi dönmüyor — sadece current session'ın kendisinin nasıl göründüğünü
--   söylüyor (zaten kendisi set etti).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.whoami()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'email', app.current_email(),
    'role',  app.current_role(),
    'canDeleteProje',   app.has_perm('proje.delete'),
    'canEditProje',     app.has_perm('proje.edit'),
    'canCreateAksiyon', app.has_perm('aksiyon.create'),
    'editOnlyOwn',      app.flag('editOnlyOwn'),
    'viewOnlyOwn',      app.flag('viewOnlyOwn')
  );
$$;

GRANT EXECUTE ON FUNCTION public.whoami() TO anon, authenticated;

-- Test:
--   curl -X POST \
--     -H "apikey: ANON_KEY" \
--     -H "Authorization: Bearer ANON_KEY" \
--     -H "X-User-Email: cenk.sayli@tiryaki.com.tr" \
--     -H "Content-Type: application/json" \
--     https://edexisfpfksekeefmxwf.supabase.co/rest/v1/rpc/whoami
--   → {"email":"cenk.sayli@tiryaki.com.tr","role":"Admin","canDeleteProje":true,...}
