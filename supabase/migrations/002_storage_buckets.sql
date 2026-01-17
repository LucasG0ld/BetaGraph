-- ============================================
-- BetaGraph - Storage Buckets Configuration
-- ============================================
-- Author: Antigravity AI
-- Date: 2026-01-17
-- Description: Creates Supabase Storage buckets for boulder images and thumbnails
-- ============================================

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Bucket: boulders
-- Stores original boulder images (private by default, RLS-protected)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'boulders',
  'boulders',
  false,  -- Private by default (RLS policies in Phase 2.3)
  10485760,  -- 10MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp']  -- Allowed image types
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: thumbnails
-- Stores canvas snapshot thumbnails for OpenGraph previews (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true,  -- Public for OpenGraph meta tags
  2097152,  -- 2MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- NOTES
-- ============================================

-- Storage RLS policies will be created in Phase 2.3
-- 
-- For 'boulders' bucket:
-- - SELECT: Public if boulder.is_public = true, otherwise own only
-- - INSERT/UPDATE/DELETE: Own files only
--
-- For 'thumbnails' bucket:
-- - SELECT: Public (no restrictions)
-- - INSERT/UPDATE/DELETE: Authenticated users only

-- ============================================
-- END OF MIGRATION
-- ============================================
