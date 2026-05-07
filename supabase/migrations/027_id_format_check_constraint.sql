-- ============================================================================
-- Migration 027: id format CHECK constraint — defense-in-depth
-- ============================================================================
-- Migration 026 BEFORE INSERT trigger ID üretimini atomik kılıyor, ama tek
-- savunma katmanı yeterli değil:
--   * Eski cache'li tarayıcı eski adapter ile RPC + manuel id INSERT yapabilir
--   * Manuel SQL veya ileride yazılacak yanlış migration formatsız id girebilir
--   * Trigger drop edilirse sessizce bozuk veri yazılır
--
-- CHECK constraint Postgres seviyesinde kapı bekçisidir: format eşleşmeyen
-- her INSERT/UPDATE 23514 ile reddedilir. Trigger bypass edilse bile data
-- corruption oluşamaz.
--
-- Format: tek harf ('A' aksiyon / 'P' proje) + 2 hane yıl + '-' + en az 1
-- hane sayaç. Sayaç >9999 olunca widening (5+ hane) için lower bound yok,
-- regex `[0-9]+` (no upper bound) bu durumu da kabul eder.
-- ============================================================================

ALTER TABLE public.aksiyonlar
  ADD CONSTRAINT aksiyonlar_id_format_check
  CHECK (id ~ '^[A][0-9]{2}-[0-9]+$');

ALTER TABLE public.projeler
  ADD CONSTRAINT projeler_id_format_check
  CHECK (id ~ '^[P][0-9]{2}-[0-9]+$');

-- ============================================================================
-- Doğrulama (DB'de canlı test edildi):
--
--   INSERT INTO public.aksiyonlar (id, proje_id, ...)
--   VALUES ('BOZUK_ID', ...);
--   -- → 23514 check_violation ("aksiyonlar_id_format_check")
--
--   -- Trigger ile id'siz insert hâlâ çalışır:
--   INSERT INTO public.aksiyonlar (proje_id, name, ...) VALUES (...);
--   -- → trigger A26-NNNN üretir → format check geçer → INSERT OK
-- ============================================================================
