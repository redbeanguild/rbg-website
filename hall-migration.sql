-- ================================================================
-- RBG Hall of Fame Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- What this does:
--   Creates an RPC function `get_hall_of_fame()` that returns
--   Guild Masters (rank 04) and Grand Guild Masters (rank 05)
--   with only safe public fields. Uses SECURITY DEFINER to
--   bypass RLS so the Hall page can be viewed without login.
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_hall_of_fame()
RETURNS TABLE (
  display_name text,
  avatar_url   text,
  rank         text,
  joined_at    timestamptz
)
LANGUAGE sql
SECURITY DEFINER  -- bypasses RLS (runs as function owner)
STABLE            -- result won't change within a single query
AS $$
  SELECT
    p.display_name,
    p.avatar_url,
    p.rank,
    p.joined_at
  FROM public.profiles p
  WHERE p.rank IN ('04', '05')
  ORDER BY p.rank DESC, p.joined_at ASC;
$$;

-- Grant execute permission to the anon role (public/unauthenticated users)
GRANT EXECUTE ON FUNCTION public.get_hall_of_fame() TO anon;
GRANT EXECUTE ON FUNCTION public.get_hall_of_fame() TO authenticated;
