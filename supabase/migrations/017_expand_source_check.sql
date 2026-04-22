-- ============================================================================
-- Migration 017: projeler.source CHECK constraint — LALE + Organik eklendi
-- ============================================================================
-- Amaç: Excel veri girişi (2026-04-22) ile gelen `LALE` ve `Organik` kaynak
-- değerlerini kabul etmek. Eski constraint sadece Türkiye / Kurumsal /
-- International'a izin veriyordu, yeni veri INSERT ederken patlıyordu.
--
-- Kod tarafı: src/types/index.ts → Source type + src/lib/constants.ts →
-- SOURCE_OPTIONS + form zod şemaları aynı listeye güncellendi.
-- ============================================================================

ALTER TABLE public.projeler
  DROP CONSTRAINT IF EXISTS projeler_source_check;

ALTER TABLE public.projeler
  ADD CONSTRAINT projeler_source_check
  CHECK (source IN ('Türkiye','Kurumsal','International','LALE','Organik'));
