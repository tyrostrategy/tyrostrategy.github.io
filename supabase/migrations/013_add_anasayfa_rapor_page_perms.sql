-- ============================================================================
-- Migration 013: role_permissions.pages'e anasayfa + raporKonfigurasyonu ekle
-- ============================================================================
-- Frontend PagePermissions'a iki yeni key eklendi:
--   * anasayfa              → /workspace route'u (ana giriş)
--   * raporKonfigurasyonu   → Dashboard'taki "Rapor Konfigürasyonu" sekmesi
--
-- frontend merge base olarak DEFAULT_PERMISSIONS kullandığı için eksik DB
-- key'leri otomatik defaults'tan doldurulur — ama canlı satırları da
-- buradan eagerly güncelliyoruz ki Güvenlik sayfası açılır açılmaz iki
-- yeni toggle DB'den doğru gelsin ve başka bir cihaz eski state'i görmesin.
--
-- Role defaults (roleStore ile simetrik):
--   Admin         → anasayfa=true,  raporKonfigurasyonu=true
--   Proje Lideri  → anasayfa=true,  raporKonfigurasyonu=true
--   Kullanıcı     → anasayfa=true,  raporKonfigurasyonu=false
--   Management    → anasayfa=true,  raporKonfigurasyonu=true
-- ============================================================================

UPDATE public.role_permissions
SET permissions = jsonb_set(
      jsonb_set(
        permissions,
        '{pages,anasayfa}',
        'true'::jsonb,
        true
      ),
      '{pages,raporKonfigurasyonu}',
      CASE role
        WHEN 'Admin'         THEN 'true'::jsonb
        WHEN 'Proje Lideri'  THEN 'true'::jsonb
        WHEN 'Management'    THEN 'true'::jsonb
        WHEN 'Kullanıcı'     THEN 'false'::jsonb
        ELSE 'false'::jsonb
      END,
      true
    );

-- ============================================================================
-- Sanity:
--   SELECT role, permissions->'pages'->'anasayfa', permissions->'pages'->'raporKonfigurasyonu'
--   FROM public.role_permissions ORDER BY role;
-- ============================================================================
