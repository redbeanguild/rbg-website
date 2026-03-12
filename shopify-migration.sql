-- ================================================================
-- RBG Shopify Integration Migration — Rev 2.2.1
-- Run this ONCE in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- What this does:
--   1. Adds shopify_customer_id, total_spend, piece_count to profiles
--   2. Creates the wardrobe_items table for purchased products
--   3. Sets up RLS policies on wardrobe_items
--   4. Creates a rank recalculation function
-- ================================================================


-- ----------------------------------------------------------------
-- STEP 1: Extend the profiles table with Shopify-related columns
-- ----------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shopify_customer_id text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_spend numeric DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS piece_count integer DEFAULT 0;


-- ----------------------------------------------------------------
-- STEP 2: Create the wardrobe_items table
--
-- Each row = one product a collector has purchased via Shopify.
-- The unique constraint on (collector_id, shopify_order_id, shopify_product_id)
-- prevents duplicates if a webhook fires twice or backfill overlaps.
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.wardrobe_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collector_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  shopify_order_id text NOT NULL,
  shopify_product_id text,
  product_title text NOT NULL,
  variant_title text,
  product_image_url text,
  drop_name text,
  price numeric DEFAULT 0,
  purchased_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),

  UNIQUE(collector_id, shopify_order_id, shopify_product_id)
);


-- ----------------------------------------------------------------
-- STEP 3: RLS policies for wardrobe_items
--
-- Users can read their own wardrobe items.
-- Admins can read all wardrobe items.
-- No client-side insert/update/delete — all writes go through
-- Vercel serverless functions using the Supabase service role key.
-- ----------------------------------------------------------------

ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own wardrobe items" ON public.wardrobe_items;
CREATE POLICY "Users can read own wardrobe items"
  ON public.wardrobe_items
  FOR SELECT
  USING (auth.uid() = collector_id);

DROP POLICY IF EXISTS "Admins can read all wardrobe items" ON public.wardrobe_items;
CREATE POLICY "Admins can read all wardrobe items"
  ON public.wardrobe_items
  FOR SELECT
  USING (public.is_admin());


-- ----------------------------------------------------------------
-- STEP 4: Rank recalculation function
--
-- Called from webhook/backfill after inserting wardrobe items.
-- Computes piece_count and total_spend from wardrobe_items (source
-- of truth), then applies rank thresholds.
--
-- Rank 05 (Grand Guildmaster) is NEVER auto-assigned or downgraded.
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.recalculate_rank(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_piece_count integer;
  v_total_spend numeric;
  v_current_rank text;
  v_new_rank text;
BEGIN
  -- Count distinct items and sum spend from wardrobe_items
  SELECT count(*), COALESCE(sum(price), 0)
  INTO v_piece_count, v_total_spend
  FROM public.wardrobe_items
  WHERE collector_id = target_user_id;

  -- Get current rank to protect rank 05
  SELECT rank INTO v_current_rank
  FROM public.profiles
  WHERE id = target_user_id;

  -- Rank calculation (05 is invite-only, never auto-assigned)
  IF v_current_rank = '05' THEN
    v_new_rank := '05';
  ELSIF v_total_spend >= 900 AND v_piece_count >= 10 THEN
    v_new_rank := '04';  -- Guildmaster
  ELSIF v_total_spend >= 400 AND v_piece_count >= 5 THEN
    v_new_rank := '03';  -- Kenshi
  ELSIF v_total_spend >= 150 AND v_piece_count >= 2 THEN
    v_new_rank := '02';  -- Ronin
  ELSIF v_piece_count >= 1 THEN
    v_new_rank := '01';  -- Initiate
  ELSE
    v_new_rank := '01';  -- Default
  END IF;

  -- Update profile with computed values
  UPDATE public.profiles
  SET piece_count = v_piece_count,
      total_spend = v_total_spend,
      rank = v_new_rank
  WHERE id = target_user_id;

  RETURN v_new_rank;
END;
$$;


-- ================================================================
-- AFTER RUNNING THIS SCRIPT:
--
-- 1. Verify new columns exist: SELECT * FROM public.profiles LIMIT 1;
-- 2. Verify wardrobe_items table exists: SELECT * FROM public.wardrobe_items LIMIT 0;
-- 3. Set up Shopify webhook and env vars (see SHOPIFY_SETUP.md)
-- ================================================================
