-- ============================================
-- BetaGraph - RLS Policies & Profile Trigger
-- ============================================
-- Author: Antigravity AI
-- Date: 2026-01-17
-- Description: Row Level Security policies for tables and storage buckets
--              + Automatic profile creation trigger
-- ============================================

-- ============================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================

-- Function: Create profile when user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER  -- Run with elevated privileges to bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, preferred_grading_system)
  VALUES (
    NEW.id,
    -- Use username from metadata OR auto-generate from UUID
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'user_' || SUBSTRING(NEW.id::text, 1, 8)
    ),
    'fontainebleau'
  )
  ON CONFLICT (id) DO NOTHING;  -- Idempotent (safe if trigger re-runs)
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Auto-creates profile when user signs up via Supabase Auth';

-- Trigger: Execute after user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS POLICIES: profiles table
-- ============================================

-- Policy 1: Public read (allow displaying usernames)
CREATE POLICY "Profiles: public read"
ON public.profiles
FOR SELECT
TO authenticated, anon
USING (true);

-- Policy 2: Users can insert their own profile (fallback if trigger fails)
CREATE POLICY "Profiles: insert own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Profiles: update own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- No DELETE policy (profiles cascade-delete when auth.users is deleted)

-- ============================================
-- RLS POLICIES: boulders table
-- ============================================

-- Policy 1: Read active boulders (not soft-deleted)
CREATE POLICY "Boulders: read active"
ON public.boulders
FOR SELECT
TO authenticated, anon
USING (deleted_at IS NULL);

-- Policy 2: Authenticated users can create boulders
CREATE POLICY "Boulders: insert authenticated"
ON public.boulders
FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid());

-- Policy 3: Creators can update their boulders
CREATE POLICY "Boulders: update own"
ON public.boulders
FOR UPDATE
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

-- Policy 4: Creators can delete their boulders (soft or hard delete)
CREATE POLICY "Boulders: delete own"
ON public.boulders
FOR DELETE
TO authenticated
USING (creator_id = auth.uid());

-- ============================================
-- RLS POLICIES: betas table
-- ============================================

-- Policy 1: Read public betas (from active boulders) OR own betas
CREATE POLICY "Betas: read if public or own"
ON public.betas
FOR SELECT
TO authenticated, anon
USING (
  -- Case 1: Beta is public AND boulder is active (accessible to anonymous users)
  (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM public.boulders 
      WHERE id = boulder_id 
        AND deleted_at IS NULL
    )
  )
  -- Case 2: User owns this beta
  OR user_id = auth.uid()
);

-- Policy 2: Authenticated users can create betas
CREATE POLICY "Betas: insert own"
ON public.betas
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can update their own betas
CREATE POLICY "Betas: update own"
ON public.betas
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 4: Users can delete their own betas
CREATE POLICY "Betas: delete own"
ON public.betas
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- STORAGE RLS: boulders bucket
-- ============================================

-- Policy 1: Read boulder images if user owns OR boulder has public beta
-- LOGIC: Storage access is linked to SQL table visibility
--        - If user created the boulder → access granted
--        - If boulder has ≥1 public beta → access granted (anonymous OK)
--        - Otherwise → 403 Forbidden
CREATE POLICY "Boulder images: read if public beta or own"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (
  bucket_id = 'boulders'
  AND (
    -- Case 1: File is in user's folder (structure: boulders/{user_id}/{filename})
    (storage.foldername(name))[1] = auth.uid()::text
    
    OR
    
    -- Case 2: Boulder has at least one public beta
    -- We match storage filename to boulders.image_url (which should contain the full path)
    EXISTS (
      SELECT 1 
      FROM public.boulders b
      JOIN public.betas beta ON b.id = beta.boulder_id
      WHERE b.image_url LIKE '%' || name
        AND beta.is_public = true
        AND b.deleted_at IS NULL
    )
  )
);

-- Policy 2: Upload boulder images to own folder only
-- Enforces folder structure: boulders/{user_id}/{filename}
CREATE POLICY "Boulder images: insert own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'boulders'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Update images in own folder only
CREATE POLICY "Boulder images: update own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'boulders'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Delete images if no boulder references them (prevent orphan records)
CREATE POLICY "Boulder images: delete if orphan"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'boulders'
  AND (storage.foldername(name))[1] = auth.uid()::text
  -- Only allow delete if NO boulder record references this image
  AND NOT EXISTS (
    SELECT 1 FROM public.boulders 
    WHERE image_url LIKE '%' || name
  )
);

-- ============================================
-- STORAGE RLS: thumbnails bucket
-- ============================================

-- Policy 1: Public read (for OpenGraph meta tags)
CREATE POLICY "Thumbnails: public read"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'thumbnails');

-- Policy 2: Authenticated users can upload thumbnails
CREATE POLICY "Thumbnails: insert authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

-- Policy 3: Authenticated users can update thumbnails
CREATE POLICY "Thumbnails: update authenticated"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'thumbnails');

-- Policy 4: Authenticated users can delete thumbnails
CREATE POLICY "Thumbnails: delete authenticated"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails');

-- ============================================
-- VERIFICATION QUERIES (for testing)
-- ============================================

-- Test 1: Verify profile trigger
-- Create a test user via Supabase Auth UI, then check:
-- SELECT * FROM public.profiles WHERE id = 'new-user-uuid';
-- Expected: Profile exists with auto-generated username

-- Test 2: RLS on betas (as anonymous user)
-- SET ROLE anon;
-- SELECT * FROM public.betas;
-- Expected: Only public betas from active boulders

-- Test 3: RLS on betas (as authenticated user 'alice')
-- SET ROLE authenticated;
-- SET request.jwt.claim.sub = 'alice-uuid';
-- SELECT * FROM public.betas;
-- Expected: Public betas + Alice's own betas

-- Test 4: Storage RLS (boulder with private beta)
-- Upload image as Alice → Create boulder → Create beta (is_public = false)
-- Try accessing image URL as Bob → Expected: 403 Forbidden

-- Test 5: Storage RLS (boulder with public beta)
-- Change beta to is_public = true
-- Try accessing image URL as Bob → Expected: 200 OK

-- ============================================
-- NOTES
-- ============================================

-- 1. Folder Structure Enforcement:
--    Images MUST be uploaded to boulders/{user_id}/{filename}
--    This is enforced by: (storage.foldername(name))[1] = auth.uid()::text

-- 2. Soft Delete Behavior:
--    Soft-deleted boulders (deleted_at IS NOT NULL) are hidden by SELECT policy
--    Their betas are also hidden via the EXISTS subquery

-- 3. Performance Considerations:
--    Storage policies use subqueries which may be slow for large datasets
--    Mitigation: Indexes on boulders.image_url and betas.is_public (already created in 001_initial_schema.sql)

-- 4. Anonymous Access:
--    Policies include "TO authenticated, anon" to allow public read access
--    This is required for OpenGraph previews and shared links

-- ============================================
-- END OF MIGRATION
-- ============================================
