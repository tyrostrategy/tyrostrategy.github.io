-- ============================================================================
-- Migration 025: next_aksiyon_id / next_proje_id — numeric max, no lpad trunc
-- ============================================================================
-- Bug (kullanıcı raporu 2026-05-07):
--   Admin "Aksiyon … oluşturma başarısız: geçersiz veri kısıtlaması" alıyor.
--   Console: code=23505, message="duplicate key value violates unique
--   constraint \"aksiyonlar_pkey\"". RPC adapter çağrısı geçiyor (ID
--   dönüyor) ama dönen ID DB'de ZATEN VAR.
--
--   Migration 024'teki fonksiyonda üç ayrı tuzak iç içe:
--     (1) ORDER BY id DESC alfabetik karşılaştırma yapıyor —
--         'A26-10000' vs 'A26-9999' → "1" < "9" olduğu için 'A26-9999'
--         alfabetik max görünüyor. 5 haneli bir serial varsa fonksiyon onu
--         tamamen yok sayıyor.
--     (2) `lpad(text, length, fill)` — PG dokümantasyonu net: "If string is
--         already longer than length then it is truncated (on the right)."
--         lpad('10000', 4, '0') = '1000'. Yani n = 10000 olduğunda fonksiyon
--         'A26-1000' dönüyor → DB'de zaten var olan eski bir satırla
--         çakışıyor → 23505 PK violation.
--     (3) 9999 sonrası serial üretemiyor — yıl içinde aksiyon sayısı bu
--         sınırı aşarsa tüm sistem yeni satır eklemekten kilitleniyor.
--
--   Eski client-side adapter (`b329d07` öncesi) `String(n).padStart(4, '0')`
--   kullanıyordu — bu PADs yapar ama UZUN string'i kesmez. Yani kullanıcı
--   DB'sine geçmişte 5+ haneli ID'ler ('A26-10000', 'A26-10001', ...)
--   yazılmış olma ihtimali var; migration 024 RPC'si bunları görmezden gelip
--   düşük serial'lara dönüyor → her insert duplicate.
--
-- Fix:
--   * Sayısal max: SELECT max(substring(id FROM ...)::integer) — alfabetik
--     tuzak ortadan kalkar, DB'deki gerçek en büyük serial bulunur.
--   * Format eşleşmeyen satırları regex ile dışla (`~ '^[0-9]+$'`) —
--     bozuk seed veri varsa bile fonksiyon patlamaz.
--   * lpad sadece 9999 ve altı için; üstünde widening (5+ hane) izin verilir.
--   * NOTIFY pgrst → PostgREST schema cache reload (yeni fonksiyon imzaları).
-- ============================================================================

CREATE OR REPLACE FUNCTION app.next_aksiyon_id() RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
DECLARE
  yy text := to_char(current_date, 'YY');
  prefix text := 'A' || yy || '-';
  max_n integer;
  next_n integer;
BEGIN
  SELECT max(substring(id FROM length(prefix) + 1)::integer) INTO max_n
  FROM public.aksiyonlar
  WHERE id LIKE prefix || '%'
    AND substring(id FROM length(prefix) + 1) ~ '^[0-9]+$';

  next_n := COALESCE(max_n, 0) + 1;

  IF next_n <= 9999 THEN
    RETURN prefix || lpad(next_n::text, 4, '0');
  ELSE
    RETURN prefix || next_n::text;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION app.next_proje_id(p_start_date date DEFAULT current_date) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
DECLARE
  yy text := to_char(p_start_date, 'YY');
  prefix text := 'P' || yy || '-';
  max_n integer;
  next_n integer;
BEGIN
  SELECT max(substring(id FROM length(prefix) + 1)::integer) INTO max_n
  FROM public.projeler
  WHERE id LIKE prefix || '%'
    AND substring(id FROM length(prefix) + 1) ~ '^[0-9]+$';

  next_n := COALESCE(max_n, 0) + 1;

  IF next_n <= 9999 THEN
    RETURN prefix || lpad(next_n::text, 4, '0');
  ELSE
    RETURN prefix || next_n::text;
  END IF;
END;
$$;

-- public şeması wrapper'ları imza aynı kaldığı için CREATE OR REPLACE ile
-- yeniden bağlamaya gerek yok — body değişmedi, search_path değişmedi.
-- Sadece yeni fonksiyon gövdesini PostgREST'in görmesi için cache reload:
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Doğrulama (psql):
--
--   SELECT app.next_aksiyon_id();
--     → DB'deki aksiyonlar.id sayısal max + 1, doğru zero-pad veya widen.
--
--   -- Mevcut hatalı satırları teşhis et:
--   SELECT id FROM public.aksiyonlar
--   WHERE id LIKE 'A26-%' AND substring(id FROM 5) !~ '^[0-9]+$'
--   ORDER BY id;
--     → Bozuk format varsa burada listelenir; manuel inceleme gerekebilir.
--
--   -- 5+ haneli serial var mı:
--   SELECT id FROM public.aksiyonlar
--   WHERE id LIKE 'A26-%' AND length(substring(id FROM 5)) > 4
--   ORDER BY id;
--     → Eski client-side adapter'dan kalan widened ID'ler — fonksiyon artık
--        bunları doğru görüyor.
-- ============================================================================
