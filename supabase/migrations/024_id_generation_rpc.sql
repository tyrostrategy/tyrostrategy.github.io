-- ============================================================================
-- Migration 024: server-side ID generation via SECURITY DEFINER RPC
-- ============================================================================
-- Bug (kullanıcı raporu 2026-05-06):
--   Proje Lideri "tyro" projede participant. Yeni aksiyon ekleyince:
--     "Aksiyon \"demo\" oluşturma başarısız: geçersiz veri kısıtlaması"
--   Doğrudan PostgREST PATCH çalışıyor (201 OK), dolayısıyla RLS deny veya
--   schema problemi DEĞİL. Hata 23xxx (constraint violation) — büyük
--   ihtimalle 23505 (unique_violation) primary key id üzerinde.
--
--   Sebep: src/lib/data/supabaseAdapter.ts createAksiyon "max id" lookup
--   yapıyor:
--     SELECT id FROM aksiyonlar WHERE id LIKE 'A26-%' ORDER BY id DESC LIMIT 1
--   Bu sorgu aksiyonlar SELECT RLS policy'sine tabi. tyro
--   editOnlyOwn+viewOnlyOwn → sadece participant olduğu projelerin
--   aksiyonlarını görüyor → max id örn. A26-0050 dönüyor. Halbuki tüm DB'de
--   max id A26-1500 olabilir → adapter A26-0051 üretiyor → ZATEN VAR →
--   PRIMARY KEY ihlali. Diğer projedeki bir aksiyon ile çakışma.
--
-- Çözüm:
--   Server-side ID generation. SECURITY DEFINER fonksiyon RLS'i bypass eder,
--   tablo üzerinde gerçek max'ı görür. Adapter `supabase.rpc(...)` ile
--   çağırır. Sonuç: ID her zaman benzersiz, kullanıcının görünürlüğüne
--   bağımsız.
--
-- Aksiyon ID formatı: A{YY}-{NNNN} (4 haneli sıfır-padded sayaç, takvim yılı)
-- Proje ID formatı: P{YY}-{NNNN} (yıl proje başlangıç tarihinden alınır)
-- ============================================================================

CREATE OR REPLACE FUNCTION app.next_aksiyon_id() RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
DECLARE
  yy text := to_char(current_date, 'YY');
  prefix text := 'A' || yy || '-';
  last_id text;
  n integer;
BEGIN
  SELECT id INTO last_id
  FROM public.aksiyonlar
  WHERE id LIKE prefix || '%'
  ORDER BY id DESC
  LIMIT 1;

  IF last_id IS NULL THEN
    RETURN prefix || '0001';
  END IF;

  -- Strip prefix, parse remainder as int, +1, zero-pad to 4 digits.
  n := substring(last_id FROM length(prefix) + 1)::int + 1;
  RETURN prefix || lpad(n::text, 4, '0');
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
  last_id text;
  n integer;
BEGIN
  SELECT id INTO last_id
  FROM public.projeler
  WHERE id LIKE prefix || '%'
  ORDER BY id DESC
  LIMIT 1;

  IF last_id IS NULL THEN
    RETURN prefix || '0001';
  END IF;

  n := substring(last_id FROM length(prefix) + 1)::int + 1;
  RETURN prefix || lpad(n::text, 4, '0');
END;
$$;

-- Grant EXECUTE on app-schema functions
GRANT EXECUTE ON FUNCTION app.next_aksiyon_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app.next_proje_id(date) TO anon, authenticated;

-- PostgREST default olarak yalnızca public şemayı expose ediyor. RPC
-- endpoint için public şemada wrapper fonksiyonlar oluştur.
CREATE OR REPLACE FUNCTION public.next_aksiyon_id() RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT app.next_aksiyon_id();
$$;

CREATE OR REPLACE FUNCTION public.next_proje_id(p_start_date date DEFAULT current_date) RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT app.next_proje_id(p_start_date);
$$;

GRANT EXECUTE ON FUNCTION public.next_aksiyon_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_proje_id(date) TO anon, authenticated;

-- PostgREST schema cache'ini reload et (yeni RPC'leri görsün)
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Doğrulama (psql):
--   SELECT app.next_aksiyon_id();   -- 'A26-XXXX' (DB'deki gerçek max+1)
--   SELECT app.next_proje_id('2026-05-06'::date);  -- 'P26-XXXX'
--
-- PostgREST RPC:
--   curl -X POST '/rest/v1/rpc/next_aksiyon_id' -H 'apikey: ...' → "A26-1234"
-- ============================================================================
