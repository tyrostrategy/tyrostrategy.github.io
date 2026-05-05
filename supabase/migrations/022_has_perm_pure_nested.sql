-- ============================================================================
-- Migration 022: has_perm pure nested traversal (revert 020 to 012's clean form)
-- ============================================================================
-- Bug:
--   Migration 020'de has_perm'e "legacy flat-key mapping" eklemiştim
--   (proje.edit → canEditProje gibi). Bu mapping nested veri yapısı
--   için her zaman NULL döner, çünkü 'canEditProje' diye bir TOP-LEVEL
--   key yok — gerçek veri:
--     { "proje": { "edit": true, ... }, "aksiyon": { "edit": true, ... } }
--
--   Migration 012 zaten has_perm'i nested traversal ile doğru yapmıştı:
--     permissions #>> string_to_array(path, '.')
--   ('proje.edit' → array['proje','edit'] → #>>'{proje,edit}' → true)
--
--   020'de yanlışlıkla 012'i override ettim ve pages.kullanicilar dışındaki
--   path'ler için işlevi bozdum. Sonuç:
--     - has_perm('proje.edit')     → false → proje update RLS deny → 500
--     - has_perm('aksiyon.edit')   → false → aksiyon update RLS deny → 500
--     - has_perm('aksiyon.create') → false → aksiyon insert RLS deny → 500
--     - has_perm('proje.create')   → false → proje insert RLS deny → 500
--   → "Cannot coerce the result to a single JSON object" + "Veri
--      senkronizasyonu başarısız" hataları (kullanıcı raporu 2026-05-04).
--
-- Fix:
--   has_perm'i 012'in saf nested traversal versiyonuna geri al. Tüm
--   path'ler tutarlı şekilde nested okunur. pages.kullanicilar da bu
--   mantıkla doğru çalışır (#>>'{pages,kullanicilar}').
-- ============================================================================

CREATE OR REPLACE FUNCTION app.has_perm(path text) RETURNS boolean AS $$
DECLARE
  v_role text := app.current_role();
  v_val  text;
BEGIN
  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  -- 'proje.edit' → array['proje','edit'] → permissions #>> '{proje,edit}'
  -- 'pages.kullanicilar' → array['pages','kullanicilar'] → '{pages,kullanicilar}'
  -- Tek seviyeli path 'foo' → array['foo'] → permissions ->> 'foo' eşdeğeri
  SELECT rp.permissions #>> string_to_array(path, '.') INTO v_val
  FROM public.role_permissions rp
  WHERE rp.role = v_role;

  RETURN COALESCE(v_val::boolean, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- Doğrulama (psql, transaction içinde):
--   BEGIN;
--   SET LOCAL app.user_email = 'cenk.sayli@tiryaki.com.tr';
--   SELECT app.has_perm('pages.kullanicilar');  -- TRUE
--   SELECT app.has_perm('proje.edit');          -- TRUE  (önceden FALSE)
--   SELECT app.has_perm('aksiyon.edit');        -- TRUE  (önceden FALSE)
--   SELECT app.has_perm('aksiyon.create');      -- TRUE  (önceden FALSE)
--   ROLLBACK;
-- ============================================================================
