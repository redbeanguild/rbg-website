-- ================================================================
-- RBG Admin Delete Migration — Rev 2.2
-- Run this ONCE in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- What this does:
--   1. Adds RLS policy so admins can DELETE any profile
--   2. Adds RLS policy so admins can DELETE any wardrobe items
--
-- IMPORTANT: Run this AFTER admin-migration.sql and shopify-migration.sql
-- ================================================================


-- ----------------------------------------------------------------
-- STEP 1: Allow admins to delete profiles
--   - Regular users cannot delete profiles (not even their own)
--   - Only admins can delete, for spam/wrong account cleanup
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  USING (
    public.is_admin()   -- only admins can delete
  );


-- ----------------------------------------------------------------
-- STEP 2: Allow admins to delete wardrobe items
--   - Needed to clean up wardrobe data when deleting an account
--   - wardrobe_items may also cascade-delete via FK, but this
--     policy ensures the RLS layer permits the operation
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can delete wardrobe items" ON public.wardrobe_items;
CREATE POLICY "Admins can delete wardrobe items"
  ON public.wardrobe_items
  FOR DELETE
  USING (
    public.is_admin()   -- only admins can delete
  );


-- ================================================================
-- DONE. Admins can now delete accounts from the admin panel.
-- The wardrobe_items table also has ON DELETE CASCADE on collector_id,
-- but this policy ensures the Supabase client-side delete works too.
-- ================================================================
