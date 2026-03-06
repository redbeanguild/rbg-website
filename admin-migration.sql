-- ================================================================
-- RBG Admin Migration — Rev 2.1
-- Run this ONCE in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- What this does:
--   1. Adds a `rank` column to profiles (default '01' = Initiate)
--   2. Adds an `is_admin` column to profiles (default false)
--   3. Creates a security helper function to check admin status
--      without causing an infinite loop in RLS policies
--   4. Updates RLS policies so admins can read AND update any profile
-- ================================================================


-- ----------------------------------------------------------------
-- STEP 1: Add the `rank` column
--   - Stores the member's rank code: '01' through '05'
--   - Default is '01' (Initiate) so all existing members start there
--   - IF NOT EXISTS means it's safe to run this script more than once
-- ----------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rank text DEFAULT '01';


-- ----------------------------------------------------------------
-- STEP 2: Add the `is_admin` column
--   - Boolean flag that marks a user as an admin
--   - Default is false — you must manually set this to true for
--     your own account using the Supabase Table Editor dashboard
--   - NEVER set this via the app; always via the dashboard
-- ----------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;


-- ----------------------------------------------------------------
-- STEP 3: Create the admin helper function
--
-- WHY this is needed (important concept):
--   RLS (Row Level Security) policies run on the `profiles` table.
--   If a policy on `profiles` tries to SELECT from `profiles`
--   (to check if the current user is an admin), it creates an
--   infinite loop — the policy triggers itself forever.
--
--   The fix: create a function with SECURITY DEFINER, which means
--   it runs with the permissions of the function OWNER (postgres)
--   rather than the calling user. This bypasses RLS for just this
--   one lookup, breaking the loop.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER  -- runs as owner (postgres), bypasses RLS
STABLE            -- result won't change within a single query
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false  -- if no row found, return false instead of null
  );
$$;


-- ----------------------------------------------------------------
-- STEP 4: Update RLS policies for admin read access
--
-- The existing policy probably only allows users to SELECT their
-- OWN row. We need admins to see ALL rows.
--
-- DROP POLICY IF EXISTS is safe — it won't error if the policy
-- doesn't exist yet. Then we recreate it with expanded logic.
-- ----------------------------------------------------------------

-- Allow users to read their own profile OR allow admins to read any profile
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id        -- user can always read their own row
    OR public.is_admin()   -- admin can read any row
  );


-- ----------------------------------------------------------------
-- STEP 5: Update RLS policies for admin write access
--
-- Admins need to UPDATE the `rank` field on any member's profile.
-- Same pattern: own row OR admin.
-- ----------------------------------------------------------------

-- Allow users to update their own profile OR allow admins to update any profile
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id        -- user can always update their own row
    OR public.is_admin()   -- admin can update any row
  );


-- ================================================================
-- AFTER RUNNING THIS SCRIPT:
--
-- 1. Go to Supabase Dashboard → Table Editor → profiles
-- 2. Find your own row (your email)
-- 3. Click the row to edit it
-- 4. Set `is_admin` = true
-- 5. Save
--
-- Now when you log in and visit admin.html, you will see all members.
-- ================================================================
