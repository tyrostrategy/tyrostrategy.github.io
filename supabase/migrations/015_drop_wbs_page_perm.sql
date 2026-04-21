-- ============================================================================
-- Migration 015: role_permissions.pages.wbs kaldır
-- ============================================================================
-- WBS (Work Breakdown Structure) sayfası uygulamadan kaldırıldı ama
-- PagePermissions tipinde ve DB JSONB'sinde key kalmıştı. Güvenlik
-- sayfasında boşu boşuna toggle görünüyordu. Her satırdan temizliyoruz.
-- ============================================================================

UPDATE public.role_permissions
SET permissions = permissions #- '{pages,wbs}';

-- Sanity:
--   SELECT role, permissions->'pages' FROM public.role_permissions;
--   → pages objesinde wbs kaydı yok
