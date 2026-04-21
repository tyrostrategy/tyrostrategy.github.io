-- ============================================================================
-- Migration 016: users tablosu WITH CHECK (yetki bazlı) + SELECT'te X-User-Email zorunluluğu
-- ============================================================================
-- Amaç (iki kritik açık kapanıyor):
--
--   1. "Yetkisiz self-update role escalation" açığı:
--      Migration 006'daki users_update policy'sinde WITH CHECK yoktu. O yüzden
--      herhangi bir çalışan DevTools'tan kendi users satırına `role='Admin'`
--      yazabiliyordu. Burada WITH CHECK ekliyoruz — self-update'te sadece
--      `locale` (dil) kolonu değişebilir, diğer her kolon mevcut değeriyle aynı
--      kalmak ZORUNDA.
--
--   2. "Anon key ile header'sız veri dumpu" açığı:
--      Migration 001'deki SELECT policy'leri `USING (true)`. Bu yüzden bundle'daki
--      anon key'i çıkaran herhangi biri, login olmadan, X-User-Email header
--      göndermeden tüm projeler/aksiyonlar tablolarını dump edebiliyor. Burada
--      SELECT policy'leri header'da geçerli bir email istediğinden emin oluyoruz.
--      Uygulama zaten login'den sonra X-User-Email gönderdiği için normal akış
--      etkilenmez; sadece login-olmayan dış saldırgan yolu kapatılıyor.
--
-- Dikkat: users ve tag_definitions SELECT'leri BİLEREK açık bırakılıyor çünkü
-- sidebar/dropdown'lar için login sonrası ilk render'da gerekli, ayrıca bunlarda
-- secret bir bilgi yok (email + display_name + role + dept + tag isim/renk).
-- ============================================================================

-- ─── 1. users tablosu: yetki bazlı CRUD + self-update-sadece-locale ─────────
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;

-- INSERT: sadece Kullanıcılar sayfasına yetkisi olan kişi yeni kullanıcı oluşturabilir
CREATE POLICY "users_insert" ON public.users FOR INSERT
  WITH CHECK (app.has_perm('pages.kullanicilar'));

-- DELETE: sadece Kullanıcılar sayfasına yetkisi olan kişi silebilir
CREATE POLICY "users_delete" ON public.users FOR DELETE
  USING (app.has_perm('pages.kullanicilar'));

-- UPDATE:
--   ya pages.kullanicilar yetkin var → tüm kolonlar serbest,
--   ya da bu sensin (self) → SADECE locale değişebilir,
--                           diğer tüm kolonlar mevcut değeriyle aynı kalmak ZORUNDA.
-- IS NOT DISTINCT FROM, `NULL = NULL`'ı true kabul eder (regular = operatörü NULL'u false sayardı).
CREATE POLICY "users_update" ON public.users FOR UPDATE
  USING (
    app.has_perm('pages.kullanicilar')
    OR lower(email) = lower(app.current_email())
  )
  WITH CHECK (
    app.has_perm('pages.kullanicilar')
    OR (
      lower(email) = lower(app.current_email())
      AND email        IS NOT DISTINCT FROM (SELECT u.email        FROM public.users u WHERE lower(u.email) = lower(app.current_email()))
      AND role         IS NOT DISTINCT FROM (SELECT u.role         FROM public.users u WHERE lower(u.email) = lower(app.current_email()))
      AND department   IS NOT DISTINCT FROM (SELECT u.department   FROM public.users u WHERE lower(u.email) = lower(app.current_email()))
      AND display_name IS NOT DISTINCT FROM (SELECT u.display_name FROM public.users u WHERE lower(u.email) = lower(app.current_email()))
      AND title        IS NOT DISTINCT FROM (SELECT u.title        FROM public.users u WHERE lower(u.email) = lower(app.current_email()))
    )
  );

-- ─── 2. SELECT policy'leri — header'da email olmadan dump atılamasın ────────
-- projeler
DROP POLICY IF EXISTS "projeler_select" ON public.projeler;
CREATE POLICY "projeler_select" ON public.projeler FOR SELECT
  USING (app.current_email() IS NOT NULL);

-- aksiyonlar
DROP POLICY IF EXISTS "aksiyonlar_select" ON public.aksiyonlar;
CREATE POLICY "aksiyonlar_select" ON public.aksiyonlar FOR SELECT
  USING (app.current_email() IS NOT NULL);

-- proje_participants
DROP POLICY IF EXISTS "participants_select" ON public.proje_participants;
CREATE POLICY "participants_select" ON public.proje_participants FOR SELECT
  USING (app.current_email() IS NOT NULL);

-- proje_tags
DROP POLICY IF EXISTS "proje_tags_select" ON public.proje_tags;
CREATE POLICY "proje_tags_select" ON public.proje_tags FOR SELECT
  USING (app.current_email() IS NOT NULL);

-- report_templates
DROP POLICY IF EXISTS "templates_select" ON public.report_templates;
CREATE POLICY "templates_select" ON public.report_templates FOR SELECT
  USING (app.current_email() IS NOT NULL);

-- app_settings ve role_permissions SELECT'i de tightenıyoruz — bunlar da sadece
-- login olmuş kullanıcıların görmesi gereken config tabloları
DROP POLICY IF EXISTS "settings_select" ON public.app_settings;
CREATE POLICY "settings_select" ON public.app_settings FOR SELECT
  USING (app.current_email() IS NOT NULL);

DROP POLICY IF EXISTS "role_perms_select" ON public.role_permissions;
CREATE POLICY "role_perms_select" ON public.role_permissions FOR SELECT
  USING (app.current_email() IS NOT NULL);

-- ============================================================================
-- Doğrulama (SQL Editor'da migration çalıştıktan sonra elle test et):
--
-- 1) Self role escalation kapalı mı? (Supabase SQL Editor'da):
--      -- bir normal kullanıcı email'i simüle et
--      SELECT set_config('request.headers', '{"x-user-email":"kullanici@tiryaki.com.tr"}', true);
--      UPDATE public.users SET role = 'Admin' WHERE lower(email) = 'kullanici@tiryaki.com.tr';
--      → ERROR: new row violates check constraint beklenen davranış
--
-- 2) Locale self-update hâlâ çalışıyor mu?
--      SELECT set_config('request.headers', '{"x-user-email":"kullanici@tiryaki.com.tr"}', true);
--      UPDATE public.users SET locale = 'en' WHERE lower(email) = 'kullanici@tiryaki.com.tr';
--      → 1 row updated
--
-- 3) Admin / kullanicilar yetkili diğer CRUD'ları yapabiliyor mu?
--      SELECT set_config('request.headers', '{"x-user-email":"cenk.sayli@tiryaki.com.tr"}', true);
--      UPDATE public.users SET role = 'Proje Lideri' WHERE email = 'birisi@tiryaki.com.tr';
--      → 1 row updated
--
-- 4) Header'sız SELECT:
--      SELECT set_config('request.headers', '{}', true);
--      SELECT count(*) FROM public.projeler;
--      → 0 rows beklenen davranış
-- ============================================================================

-- ============================================================================
-- ROLLBACK (sorun olursa, bu migration'ı geri almak için):
--
--   -- Migration 006'daki orijinal policy'lere dön:
--   DROP POLICY IF EXISTS "users_insert" ON public.users;
--   DROP POLICY IF EXISTS "users_update" ON public.users;
--   DROP POLICY IF EXISTS "users_delete" ON public.users;
--   CREATE POLICY "users_insert" ON public.users FOR INSERT
--     WITH CHECK (app.current_role() = 'Admin');
--   CREATE POLICY "users_update" ON public.users FOR UPDATE
--     USING (app.current_role() = 'Admin' OR lower(email) = lower(app.current_email()));
--   CREATE POLICY "users_delete" ON public.users FOR DELETE
--     USING (app.current_role() = 'Admin');
--
--   -- SELECT'leri eski haline (USING true) geri al:
--   DROP POLICY IF EXISTS "projeler_select" ON public.projeler;
--   CREATE POLICY "projeler_select" ON public.projeler FOR SELECT USING (true);
--   DROP POLICY IF EXISTS "aksiyonlar_select" ON public.aksiyonlar;
--   CREATE POLICY "aksiyonlar_select" ON public.aksiyonlar FOR SELECT USING (true);
--   DROP POLICY IF EXISTS "participants_select" ON public.proje_participants;
--   CREATE POLICY "participants_select" ON public.proje_participants FOR SELECT USING (true);
--   DROP POLICY IF EXISTS "proje_tags_select" ON public.proje_tags;
--   CREATE POLICY "proje_tags_select" ON public.proje_tags FOR SELECT USING (true);
--   DROP POLICY IF EXISTS "templates_select" ON public.report_templates;
--   CREATE POLICY "templates_select" ON public.report_templates FOR SELECT USING (true);
--   DROP POLICY IF EXISTS "settings_select" ON public.app_settings;
--   CREATE POLICY "settings_select" ON public.app_settings FOR SELECT USING (true);
--   DROP POLICY IF EXISTS "role_perms_select" ON public.role_permissions;
--   CREATE POLICY "role_perms_select" ON public.role_permissions FOR SELECT USING (true);
-- ============================================================================
