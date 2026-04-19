-- ============================================================================
-- Migration 006: Role-based RLS using role_permissions table (dynamic)
-- ============================================================================
-- Amaç:
--   * Anon key ile oturum açmadan silme/ekleme/düzenleme yapılmasını engelle
--   * Rol değişikliği yapıldığında DB davranışı otomatik güncellenir
--     (policy'ler role_permissions tablosunu canlı okur)
--   * SELECT policy'leri DEĞİŞMEZ — read davranışı aynı kalır, app bozulmaz
--
-- Yaklaşım:
--   * 4 helper fonksiyon: app.current_email / current_role / has_perm / flag
--   * 1 session setter: app.set_user_context(email)  — login sonrası çağrılır
--   * INSERT/UPDATE/DELETE policy'leri role_permissions JSON'ından oku
-- ============================================================================

-- ── 1. Helper schema + fonksiyonlar ────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS app;

-- Session'daki email (çağrı öncesi set_user_context ile yazılır)
CREATE OR REPLACE FUNCTION app.current_email() RETURNS text AS $$
  SELECT NULLIF(current_setting('app.user_email', true), '');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Session'daki email'in users tablosundaki role'u
CREATE OR REPLACE FUNCTION app.current_role() RETURNS text AS $$
  SELECT u.role FROM public.users u
  WHERE lower(u.email) = lower(app.current_email())
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- JSON path bazlı izin kontrolü — örn. has_perm('proje.create')
CREATE OR REPLACE FUNCTION app.has_perm(path text) RETURNS boolean AS $$
DECLARE
  v_role text := app.current_role();
  v_parts text[];
  v_val text;
BEGIN
  IF v_role IS NULL THEN
    RETURN false;
  END IF;
  v_parts := string_to_array(path, '.');
  SELECT rp.permissions #>> v_parts INTO v_val
  FROM public.role_permissions rp
  WHERE rp.role = v_role;
  RETURN COALESCE(v_val::boolean, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Üst-düzey flag okuma (viewOnlyOwn / editOnlyOwn gibi)
CREATE OR REPLACE FUNCTION app.flag(key text) RETURNS boolean AS $$
DECLARE
  v_role text := app.current_role();
  v_val text;
BEGIN
  IF v_role IS NULL THEN
    RETURN false;
  END IF;
  SELECT rp.permissions ->> key INTO v_val
  FROM public.role_permissions rp
  WHERE rp.role = v_role;
  RETURN COALESCE(v_val::boolean, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Owner match check — owner alanı display_name olabilir, users tablosu üzerinden çöz
CREATE OR REPLACE FUNCTION app.is_owner(owner_val text) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE lower(u.email) = lower(app.current_email())
      AND (
        lower(u.email) = lower(owner_val)
        OR lower(u.display_name) = lower(owner_val)
      )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Participant check — proje_participants user_email field
CREATE OR REPLACE FUNCTION app.is_participant(p_proje_id text) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proje_participants pp
    WHERE pp.proje_id = p_proje_id
      AND lower(pp.user_email) = lower(app.current_email())
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RPC callable from client: session'a email yazar
CREATE OR REPLACE FUNCTION public.set_user_context(p_email text) RETURNS void AS $$
BEGIN
  PERFORM set_config('app.user_email', COALESCE(p_email, ''), false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Anon / authenticated rollerine execute izni — client çağırabilsin
GRANT EXECUTE ON FUNCTION public.set_user_context(text) TO anon, authenticated;
GRANT USAGE ON SCHEMA app TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app.current_email() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app.current_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app.has_perm(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app.flag(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app.is_owner(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app.is_participant(text) TO anon, authenticated;

-- ============================================================================
-- 2. Eski policy'leri temizle
-- ============================================================================
-- users
DROP POLICY IF EXISTS "users_all"    ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;
-- tag_definitions
DROP POLICY IF EXISTS "tags_all"    ON public.tag_definitions;
DROP POLICY IF EXISTS "tags_insert" ON public.tag_definitions;
DROP POLICY IF EXISTS "tags_update" ON public.tag_definitions;
DROP POLICY IF EXISTS "tags_delete" ON public.tag_definitions;
-- projeler
DROP POLICY IF EXISTS "projeler_insert" ON public.projeler;
DROP POLICY IF EXISTS "projeler_update" ON public.projeler;
DROP POLICY IF EXISTS "projeler_delete" ON public.projeler;
-- aksiyonlar
DROP POLICY IF EXISTS "aksiyonlar_insert" ON public.aksiyonlar;
DROP POLICY IF EXISTS "aksiyonlar_update" ON public.aksiyonlar;
DROP POLICY IF EXISTS "aksiyonlar_delete" ON public.aksiyonlar;
-- participants / proje_tags
DROP POLICY IF EXISTS "participants_all" ON public.proje_participants;
DROP POLICY IF EXISTS "proje_tags_all"   ON public.proje_tags;
-- app_settings
DROP POLICY IF EXISTS "settings_all" ON public.app_settings;
-- report_templates
DROP POLICY IF EXISTS "templates_insert" ON public.report_templates;
DROP POLICY IF EXISTS "templates_update" ON public.report_templates;
DROP POLICY IF EXISTS "templates_delete" ON public.report_templates;
-- role_permissions
DROP POLICY IF EXISTS "role_perms_all" ON public.role_permissions;

-- ============================================================================
-- 3. Yeni policy'ler — SELECT'ler "USING (true)" olarak KALIR (okuma bozulmaz)
--    Sadece mutasyonları role + izin tabanlı kilitliyoruz
-- ============================================================================

-- ── USERS ────────────────────────────────────────────────────────────────
-- Admin her CRUD yapabilir. Kullanıcı SADECE kendi profilini update edebilir.
CREATE POLICY "users_insert" ON public.users FOR INSERT
  WITH CHECK (app.current_role() = 'Admin');

CREATE POLICY "users_update" ON public.users FOR UPDATE
  USING (
    app.current_role() = 'Admin'
    OR lower(email) = lower(app.current_email())  -- self-update
  );

CREATE POLICY "users_delete" ON public.users FOR DELETE
  USING (app.current_role() = 'Admin');

-- ── TAG DEFINITIONS ──────────────────────────────────────────────────────
-- Admin only
CREATE POLICY "tags_insert" ON public.tag_definitions FOR INSERT
  WITH CHECK (app.current_role() = 'Admin');
CREATE POLICY "tags_update" ON public.tag_definitions FOR UPDATE
  USING (app.current_role() = 'Admin');
CREATE POLICY "tags_delete" ON public.tag_definitions FOR DELETE
  USING (app.current_role() = 'Admin');

-- ── PROJELER ─────────────────────────────────────────────────────────────
-- role_permissions üzerinden kontrol (proje.create / proje.edit / proje.delete)
CREATE POLICY "projeler_insert" ON public.projeler FOR INSERT
  WITH CHECK (app.has_perm('proje.create'));

CREATE POLICY "projeler_update" ON public.projeler FOR UPDATE
  USING (
    app.has_perm('proje.edit')
    AND (
      NOT app.flag('editOnlyOwn')
      OR app.is_owner(owner)
      OR app.is_participant(id)
    )
  );

CREATE POLICY "projeler_delete" ON public.projeler FOR DELETE
  USING (app.has_perm('proje.delete'));

-- ── AKSIYONLAR ───────────────────────────────────────────────────────────
CREATE POLICY "aksiyonlar_insert" ON public.aksiyonlar FOR INSERT
  WITH CHECK (app.has_perm('aksiyon.create'));

CREATE POLICY "aksiyonlar_update" ON public.aksiyonlar FOR UPDATE
  USING (
    app.has_perm('aksiyon.edit')
    AND (
      NOT app.flag('editOnlyOwn')
      OR app.is_owner(owner)
      OR EXISTS (
        SELECT 1 FROM public.projeler p
        WHERE p.id = aksiyonlar.proje_id AND app.is_owner(p.owner)
      )
      OR app.is_participant(proje_id)
    )
  );

CREATE POLICY "aksiyonlar_delete" ON public.aksiyonlar FOR DELETE
  USING (app.has_perm('aksiyon.delete'));

-- ── PROJE PARTICIPANTS ───────────────────────────────────────────────────
-- Proje owner'ı veya admin ekleyip/silebilir
CREATE POLICY "participants_insert" ON public.proje_participants FOR INSERT
  WITH CHECK (
    app.current_role() = 'Admin'
    OR EXISTS (SELECT 1 FROM public.projeler p WHERE p.id = proje_id AND app.is_owner(p.owner))
  );

CREATE POLICY "participants_update" ON public.proje_participants FOR UPDATE
  USING (
    app.current_role() = 'Admin'
    OR EXISTS (SELECT 1 FROM public.projeler p WHERE p.id = proje_id AND app.is_owner(p.owner))
  );

CREATE POLICY "participants_delete" ON public.proje_participants FOR DELETE
  USING (
    app.current_role() = 'Admin'
    OR EXISTS (SELECT 1 FROM public.projeler p WHERE p.id = proje_id AND app.is_owner(p.owner))
  );

-- ── PROJE TAGS ────────────────────────────────────────────────────────────
CREATE POLICY "proje_tags_insert" ON public.proje_tags FOR INSERT
  WITH CHECK (
    app.current_role() = 'Admin'
    OR app.has_perm('proje.edit')
  );
CREATE POLICY "proje_tags_delete" ON public.proje_tags FOR DELETE
  USING (
    app.current_role() = 'Admin'
    OR app.has_perm('proje.edit')
  );

-- ── APP SETTINGS ──────────────────────────────────────────────────────────
-- Admin only
CREATE POLICY "settings_insert" ON public.app_settings FOR INSERT
  WITH CHECK (app.current_role() = 'Admin');
CREATE POLICY "settings_update" ON public.app_settings FOR UPDATE
  USING (app.current_role() = 'Admin');
CREATE POLICY "settings_delete" ON public.app_settings FOR DELETE
  USING (app.current_role() = 'Admin');

-- ── REPORT TEMPLATES ─────────────────────────────────────────────────────
-- Oturum açmış herkes oluşturabilir; sadece sahibi veya admin değiştirebilir/silebilir
CREATE POLICY "templates_insert" ON public.report_templates FOR INSERT
  WITH CHECK (app.current_email() IS NOT NULL);

CREATE POLICY "templates_update" ON public.report_templates FOR UPDATE
  USING (
    app.current_role() = 'Admin'
    OR lower(owner_email) = lower(app.current_email())
  );

CREATE POLICY "templates_delete" ON public.report_templates FOR DELETE
  USING (
    app.current_role() = 'Admin'
    OR lower(owner_email) = lower(app.current_email())
  );

-- ── ROLE PERMISSIONS ─────────────────────────────────────────────────────
-- Admin only
CREATE POLICY "role_perms_insert" ON public.role_permissions FOR INSERT
  WITH CHECK (app.current_role() = 'Admin');
CREATE POLICY "role_perms_update" ON public.role_permissions FOR UPDATE
  USING (app.current_role() = 'Admin');
CREATE POLICY "role_perms_delete" ON public.role_permissions FOR DELETE
  USING (app.current_role() = 'Admin');

-- ============================================================================
-- SON — Doğrulama sorgusu (manuel, SQL editörde çalıştırmalısın):
--   SELECT set_user_context('cenk.sayli@tiryaki.com.tr');
--   SELECT app.current_role();           -- → 'Admin' dönmeli
--   SELECT app.has_perm('proje.delete'); -- → true dönmeli
-- ============================================================================
