-- ============================================
-- BetaGraph - Initial Database Schema
-- ============================================
-- Author: Antigravity AI
-- Date: 2026-01-17
-- Description: Creates core tables for BetaGraph (profiles, boulders, betas)
--              with proper foreign keys, indexes, and triggers.
-- ============================================

-- Enable UUID extension (required for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- Grading systems supported by BetaGraph
CREATE TYPE grading_system_enum AS ENUM ('fontainebleau', 'v_scale');

-- ============================================
-- TABLES
-- ============================================

-- Table: profiles
-- Extension of auth.users with BetaGraph-specific data
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  preferred_grading_system grading_system_enum DEFAULT 'fontainebleau' NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL,

  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users with app-specific data';
COMMENT ON COLUMN public.profiles.username IS 'Unique username for display (3-30 chars, alphanumeric + _ -)';
COMMENT ON COLUMN public.profiles.preferred_grading_system IS 'Default grading system preference for display';

-- Table: boulders
-- Physical climbing boulders (images/metadata)
CREATE TABLE public.boulders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  location text,
  image_url text NOT NULL,
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL,

  CONSTRAINT name_not_empty CHECK (char_length(trim(name)) > 0)
);

COMMENT ON TABLE public.boulders IS 'Physical climbing boulders - one image can have multiple betas';
COMMENT ON COLUMN public.boulders.creator_id IS 'User who uploaded the boulder image (nullable if user deleted)';
COMMENT ON COLUMN public.boulders.image_url IS 'URL to the boulder image in Supabase Storage';
COMMENT ON COLUMN public.boulders.deleted_at IS 'Soft delete timestamp - NULL means active';

-- Table: betas
-- User-drawn climbing routes on boulders
CREATE TABLE public.betas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boulder_id uuid REFERENCES public.boulders(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  grade_value text NOT NULL,
  grade_system grading_system_enum NOT NULL,
  drawing_data jsonb NOT NULL,
  is_public boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz DEFAULT NOW() NOT NULL,

  CONSTRAINT grade_value_not_empty CHECK (char_length(trim(grade_value)) > 0)
);

COMMENT ON TABLE public.betas IS 'User-drawn climbing routes (betas) on boulder images';
COMMENT ON COLUMN public.betas.boulder_id IS 'Reference to the physical boulder';
COMMENT ON COLUMN public.betas.user_id IS 'User who created this beta';
COMMENT ON COLUMN public.betas.grade_value IS 'Grade value as string (e.g., "7A", "V6")';
COMMENT ON COLUMN public.betas.grade_system IS 'Grading system used for this beta';
COMMENT ON COLUMN public.betas.drawing_data IS 'Konva canvas drawing data (JSONB format)';
COMMENT ON COLUMN public.betas.is_public IS 'Whether this beta is visible to other users';
COMMENT ON COLUMN public.betas.updated_at IS 'Auto-updated timestamp for conflict resolution';

-- ============================================
-- INDEXES
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Boulders indexes
CREATE INDEX idx_boulders_creator ON public.boulders(creator_id) WHERE creator_id IS NOT NULL;
CREATE INDEX idx_boulders_active ON public.boulders(created_at DESC) WHERE deleted_at IS NULL;

-- Betas indexes
CREATE INDEX idx_betas_boulder ON public.betas(boulder_id);
CREATE INDEX idx_betas_user ON public.betas(user_id);
CREATE INDEX idx_betas_public ON public.betas(is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX idx_betas_updated ON public.betas(updated_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function: update_updated_at_column
-- Auto-updates the 'updated_at' column on row updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger function to auto-update updated_at column';

-- Trigger: update_betas_updated_at
-- Applies the function to betas table
CREATE TRIGGER update_betas_updated_at
  BEFORE UPDATE ON public.betas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables (policies will be defined in Phase 2.3)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boulders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.betas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- GRANTS
-- ============================================

-- Grant usage on tables to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.boulders TO authenticated;
GRANT ALL ON public.betas TO authenticated;

-- Grant usage on sequences (for future SERIAL columns if needed)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- END OF MIGRATION
-- ============================================
