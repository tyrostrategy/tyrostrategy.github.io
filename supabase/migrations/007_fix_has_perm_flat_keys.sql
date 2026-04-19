-- ============================================================================
-- Migration 007: has_perm / flag helpers'ı flat key yapısına hizala
-- ============================================================================
-- Problem:
--   Migration 006'da has_perm('proje.delete') gibi dotted path varsayıldı
--   (nested JSON). Gerçek role_permissions.permissions JSONB'si flat keys
--   kullanıyor: canCreateProje, canEditProje, canDeleteProje, vs.
--
--   Bu yüzden sanity check'te Admin bile has_perm('proje.delete')=false
--   dönüyordu → tüm mutasyon policy'leri DENY ediyordu.
--
-- Çözüm:
--   * has_perm(path) → dotted path gelirse flat key'e çevir, JSONB'den oku.
--   * flag(key) → editOnlyOwn/viewOnlyOwn DB'de YOK; role isminden türet.
--
-- Policy'ler aynı imzayla çağırdığı için policy DROP/CREATE gerekmez.
-- ============================================================================

-- ── has_perm: dotted path → flat key mapping ──────────────────────────────
CREATE OR REPLACE FUNCTION app.has_perm(path text) RETURNS boolean AS $$
DECLARE
  v_role text := app.current_role();
  v_key  text;
  v_val  text;
BEGIN
  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  v_key := CASE path
    WHEN 'proje.create'    THEN 'canCreateProje'
    WHEN 'proje.edit'      THEN 'canEditProje'
    WHEN 'proje.delete'    THEN 'canDeleteProje'
    WHEN 'aksiyon.create'  THEN 'canCreateAksiyon'
    WHEN 'aksiyon.edit'    THEN 'canEditAksiyon'
    WHEN 'aksiyon.delete'  THEN 'canDeleteAksiyon'
    WHEN 'users.manage'    THEN 'canManageUsers'
    WHEN 'settings.manage' THEN 'canManageSettings'
    WHEN 'view.all'        THEN 'canViewAll'
    ELSE path  -- fallback: flat key doğrudan gelmiş olabilir
  END;

  SELECT rp.permissions ->> v_key INTO v_val
  FROM public.role_permissions rp
  WHERE rp.role = v_role;

  RETURN COALESCE(v_val::boolean, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ── flag: role-bazlı ownership scope'u türet ──────────────────────────────
--   editOnlyOwn:  Proje Lideri + Kullanıcı TRUE
--   viewOnlyOwn:  Kullanıcı TRUE
--   (Bu flag'ler DB JSONB'sinde YOK — client roleStore'da var, role'den türetilir)
CREATE OR REPLACE FUNCTION app.flag(key text) RETURNS boolean AS $$
DECLARE
  v_role text := app.current_role();
BEGIN
  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  RETURN CASE
    WHEN key = 'editOnlyOwn' AND v_role IN ('Proje Lideri', 'Kullanıcı') THEN true
    WHEN key = 'viewOnlyOwn' AND v_role = 'Kullanıcı' THEN true
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- Doğrulama (manual):
--   SELECT public.set_user_context('cenk.sayli@tiryaki.com.tr');
--   SELECT app.has_perm('proje.delete'); -- → true (Admin)
--
--   SELECT public.set_user_context('elif.balci@tiryaki.com.tr');
--   SELECT app.has_perm('proje.delete'); -- → false
--   SELECT app.has_perm('aksiyon.create'); -- → true
--   SELECT app.flag('editOnlyOwn'); -- → true
--   SELECT app.flag('viewOnlyOwn'); -- → false
-- ============================================================================
