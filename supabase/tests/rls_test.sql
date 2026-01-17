-- ============================================
-- BetaGraph - RLS Integration Tests (pgTAP)
-- ============================================
-- Author: Antigravity AI
-- Date: 2026-01-17
-- Description: Automated tests validating Row Level Security policies
--              using pgTAP testing framework
-- ============================================
-- 
-- USAGE:
--   supabase test db supabase/tests/rls_test.sql
--
-- REQUIREMENTS:
--   - Supabase CLI installed
--   - Docker running (for local database)
--   - pgTAP extension enabled
-- ============================================

BEGIN;

-- Declare total number of tests
SELECT plan(10);

-- ============================================
-- TEST 1: Soft-Deleted Boulders
-- ============================================
-- Verify that soft-deleted boulders (deleted_at IS NOT NULL)
-- are NOT visible to anonymous OR authenticated users

-- Setup test data: Create user in auth.users (trigger will create profile)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test-alice@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"username": "test-alice"}'::jsonb
);

INSERT INTO public.boulders (id, creator_id, name, image_url, deleted_at)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Deleted Boulder Test',
  'boulders/test/deleted.webp',
  NOW()  -- Soft delete
);

-- Test 1.1: Anonymous users cannot see soft-deleted boulders
SET ROLE anon;
SET request.jwt.claims = '{}';

SELECT is(
  (SELECT COUNT(*)::int FROM public.boulders WHERE id = '10000000-0000-0000-0000-000000000001'),
  0,
  'Test 1.1: Anonymous users cannot read soft-deleted boulders'
);

-- Test 1.2: Authenticated users (even creators) cannot see soft-deleted boulders
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001"}';

SELECT is(
  (SELECT COUNT(*)::int FROM public.boulders WHERE id = '10000000-0000-0000-0000-000000000001'),
  0,
  'Test 1.2: Authenticated users cannot read soft-deleted boulders (even if creator)'
);

-- Reset role
RESET ROLE;

-- ============================================
-- TEST 2: Beta Ownership (Cross-User Modification)
-- ============================================
-- Verify that User A cannot modify User B's beta

-- Setup test data: Create users in auth.users (trigger creates profiles)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES 
  (
    '00000000-0000-0000-0000-000000000002',
    'test-bob@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"username": "test-bob"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'test-charlie@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"username": "test-charlie"}'::jsonb
  );

INSERT INTO public.boulders (id, creator_id, name, image_url)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'Ownership Test Boulder',
  'boulders/test/ownership.webp'
);

INSERT INTO public.betas (id, boulder_id, user_id, grade_value, grade_system, drawing_data, is_public)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',  -- Bob's beta
  '7A',
  'fontainebleau',
  '{"lines": []}'::jsonb,
  true
);

-- Test 2.1: User Charlie (authenticated but not owner) cannot read Bob's private beta
INSERT INTO public.betas (id, boulder_id, user_id, grade_value, grade_system, drawing_data, is_public)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',  -- Bob's private beta
  '6C',
  'fontainebleau',
  '{"lines": []}'::jsonb,
  false  -- PRIVATE
);

SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000003"}';  -- Charlie

SELECT is(
  (SELECT COUNT(*)::int FROM public.betas WHERE id = '20000000-0000-0000-0000-000000000002'),
  0,
  'Test 2.1: User Charlie cannot read Bob''s private beta'
);

-- Test 2.2: User Charlie cannot update Bob's beta
-- RLS policy will prevent the UPDATE (no error, just no rows affected)
UPDATE public.betas 
SET grade_value = '7B' 
WHERE id = '20000000-0000-0000-0000-000000000001';

SELECT is(
  (SELECT grade_value FROM public.betas WHERE id = '20000000-0000-0000-0000-000000000001'),
  '7A',
  'Test 2.2: User Charlie cannot modify Bob''s beta (grade remains 7A)'
);

-- Test 2.3: User Bob (owner) CAN update his own beta
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000002"}';  -- Bob

UPDATE public.betas 
SET grade_value = '7B' 
WHERE id = '20000000-0000-0000-0000-000000000001';

SELECT is(
  (SELECT grade_value FROM public.betas WHERE id = '20000000-0000-0000-0000-000000000001'),
  '7B',
  'Test 2.3: User Bob (owner) can update his own beta'
);

RESET ROLE;

-- ============================================
-- TEST 3: Public Beta Access (Anonymous)
-- ============================================
-- Verify that anonymous users can read public betas
-- but NOT private betas

-- Setup test data: Create user in auth.users (trigger creates profile)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'test-diana@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"username": "test-diana"}'::jsonb
);

INSERT INTO public.boulders (id, creator_id, name, image_url)
VALUES (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  'Public Access Test Boulder',
  'boulders/test/public.webp'
);

INSERT INTO public.betas (id, boulder_id, user_id, grade_value, grade_system, drawing_data, is_public)
VALUES 
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    '6B',
    'fontainebleau',
    '{"lines": []}'::jsonb,
    true  -- PUBLIC
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    '6C',
    'fontainebleau',
    '{"lines": []}'::jsonb,
    false  -- PRIVATE
  );

-- Test 3.1: Anonymous users CAN read public beta
SET ROLE anon;
SET request.jwt.claims = '{}';

SELECT is(
  (SELECT COUNT(*)::int FROM public.betas WHERE id = '20000000-0000-0000-0000-000000000003'),
  1,
  'Test 3.1: Anonymous users can read public betas'
);

-- Test 3.2: Anonymous users CANNOT read private beta
SELECT is(
  (SELECT COUNT(*)::int FROM public.betas WHERE id = '20000000-0000-0000-0000-000000000004'),
  0,
  'Test 3.2: Anonymous users cannot read private betas'
);

RESET ROLE;

-- ============================================
-- TEST 4: Profile Auto-Creation Trigger
-- ============================================
-- Verify that inserting into auth.users automatically creates
-- a profile via the handle_new_user() trigger

-- Test 4.1: Insert auth.users with username in metadata
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000005',
  'trigger-test@example.com',
  crypt('password123', gen_salt('bf')),  -- Encrypted password
  NOW(),
  '{"username": "triggeruser"}'::jsonb
);

SELECT is(
  (SELECT COUNT(*)::int FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000005'),
  1,
  'Test 4.1: Profile is auto-created when auth.users is inserted'
);

SELECT is(
  (SELECT username FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000005'),
  'triggeruser',
  'Test 4.2: Profile username matches raw_user_meta_data'
);

-- Test 4.3: Insert auth.users WITHOUT username (should auto-generate)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000006',
  'auto-gen@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{}'::jsonb  -- Empty metadata
);

SELECT ok(
  (SELECT username FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000006') LIKE 'user_%',
  'Test 4.3: Profile username is auto-generated when metadata is empty'
);

-- ============================================
-- CLEANUP & FINALIZE
-- ============================================

SELECT * FROM finish();
ROLLBACK;

-- ============================================
-- NOTES
-- ============================================

-- 1. Transaction Isolation:
--    All tests run in a transaction that is ROLLED BACK at the end
--    This ensures test data does not persist in the database

-- 2. Role Switching:
--    SET ROLE anon/authenticated simulates different user contexts
--    request.jwt.claims is used to set the user ID (auth.uid())

-- 3. UUID Consistency:
--    Test UUIDs follow pattern: 00000000-0000-0000-0000-00000000000X (profiles)
--                                10000000-0000-0000-0000-00000000000X (boulders)
--                                20000000-0000-0000-0000-00000000000X (betas)

-- 4. pgTAP Functions Used:
--    - plan(n): Declare number of tests
--    - is(actual, expected, description): Assert equality
--    - ok(expression, description): Assert truthy
--    - finish(): Complete test run

-- ============================================
-- END OF TESTS
-- ============================================
