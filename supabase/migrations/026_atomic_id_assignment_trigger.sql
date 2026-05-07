-- ============================================================================
-- Migration 026: Atomic ID assignment via BEFORE INSERT trigger
-- ============================================================================
-- Bug (kullanıcı raporu 2026-05-07):
--   Migration 025 numeric-max + lpad-no-truncate fix'inden sonra ilk birkaç
--   insert geçti, ama hata tekrar başladı. Postgres logu net:
--     timestamp 1778155625549 — 23505 aksiyonlar_pkey
--     timestamp 1778155625731 — 23505 aksiyonlar_pkey
--     timestamp 1778155625733 — 23505 aksiyonlar_pkey
--     timestamp 1778155625483 — 23505 aksiyonlar_pkey
--   Aynı saniye içinde 4 ardışık duplicate-key — klasik race condition.
--
--   Senaryo:
--     1) Caller A: rpc next_aksiyon_id() → 'A26-10013' (max 10012, +1)
--     2) Caller B: rpc next_aksiyon_id() → 'A26-10013'  (A'nın INSERT'i
--        henüz commit olmamış, max DB'de hala 10012)
--     3) Caller A: INSERT → 10013 yazılır → OK
--     4) Caller B: INSERT → 10013 ZATEN VAR → 23505
--
--   max(...) + 1 mantığı RPC + INSERT iki ayrı network roundtrip arasında
--   atomik DEĞİL — wizard çoklu insert, frontend hızlı tekrar tıklama veya
--   iki kullanıcı aynı saniyede ekleme yaparsa çakışma kaçınılmaz.
--
-- Çözüm:
--   * BEFORE INSERT trigger NEW.id'yi atar — RPC + INSERT artık tek
--     transaction'a daraldı.
--   * pg_advisory_xact_lock paralel insert'leri seri hale getirir; lock
--     transaction commit ile otomatik release. Caller B'nin trigger'ı,
--     Caller A'nın INSERT'i commit olduktan sonra max'ı yeniden okur →
--     güncel + 1 alır → çakışma yok.
--   * Caller id verdiyse (data import / smoke test / migration) trigger
--     müdahale etmez — backward compat korunur. Adapter id göndermiyor
--     (ayrı commit'te) → trigger her aksiyonda çalışır.
--   * Numeric max + format-eşleşmeyen satırları regex ile dışlama
--     (migration 025'in mantığı korunmuş + lpad truncate koruması).
-- ============================================================================

CREATE OR REPLACE FUNCTION app.assign_aksiyon_id() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, app
AS $$
DECLARE
  yy text;
  prefix text;
  max_n integer;
  next_n integer;
BEGIN
  IF NEW.id IS NOT NULL AND NEW.id <> '' THEN
    RETURN NEW;
  END IF;

  yy := to_char(current_date, 'YY');
  prefix := 'A' || yy || '-';

  PERFORM pg_advisory_xact_lock(hashtext('aksiyonlar_id_seq'));

  SELECT max(substring(id FROM length(prefix) + 1)::integer) INTO max_n
  FROM public.aksiyonlar
  WHERE id LIKE prefix || '%'
    AND substring(id FROM length(prefix) + 1) ~ '^[0-9]+$';

  next_n := COALESCE(max_n, 0) + 1;

  IF next_n <= 9999 THEN
    NEW.id := prefix || lpad(next_n::text, 4, '0');
  ELSE
    NEW.id := prefix || next_n::text;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_aksiyonlar_assign_id ON public.aksiyonlar;
CREATE TRIGGER trg_aksiyonlar_assign_id
BEFORE INSERT ON public.aksiyonlar
FOR EACH ROW
EXECUTE FUNCTION app.assign_aksiyon_id();

CREATE OR REPLACE FUNCTION app.assign_proje_id() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, app
AS $$
DECLARE
  yy text;
  prefix text;
  max_n integer;
  next_n integer;
BEGIN
  IF NEW.id IS NOT NULL AND NEW.id <> '' THEN
    RETURN NEW;
  END IF;

  yy := to_char(COALESCE(NEW.start_date, current_date), 'YY');
  prefix := 'P' || yy || '-';

  PERFORM pg_advisory_xact_lock(hashtext('projeler_id_seq'));

  SELECT max(substring(id FROM length(prefix) + 1)::integer) INTO max_n
  FROM public.projeler
  WHERE id LIKE prefix || '%'
    AND substring(id FROM length(prefix) + 1) ~ '^[0-9]+$';

  next_n := COALESCE(max_n, 0) + 1;

  IF next_n <= 9999 THEN
    NEW.id := prefix || lpad(next_n::text, 4, '0');
  ELSE
    NEW.id := prefix || next_n::text;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projeler_assign_id ON public.projeler;
CREATE TRIGGER trg_projeler_assign_id
BEFORE INSERT ON public.projeler
FOR EACH ROW
EXECUTE FUNCTION app.assign_proje_id();

-- ============================================================================
-- Doğrulama (migration uygulanırken DB'de canlı test edildi):
--
--   WITH inserted AS (
--     INSERT INTO public.aksiyonlar (proje_id, name, owner, status, progress,
--                                     start_date, end_date)
--     SELECT (SELECT id FROM public.projeler LIMIT 1),
--            '__trigger_test_' || g, 'test', 'Not Started', 0,
--            current_date, current_date + 1
--     FROM generate_series(1, 5) g
--     RETURNING id
--   )
--   SELECT array_agg(id ORDER BY id) AS ids, count(DISTINCT id) AS distinct_count
--   FROM inserted;
--
--   → ids = {A26-10013, A26-10014, A26-10015, A26-10016, A26-10017}
--   → distinct_count = 5  (hepsi benzersiz, race-free)
--
--   (test verisi DELETE FROM aksiyonlar WHERE name LIKE '__trigger_test_%' ile temizlendi)
-- ============================================================================
