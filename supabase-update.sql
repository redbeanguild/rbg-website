-- ============================================================
-- RBG WEBSITE — Supabase Update SQL (Rev 1.7)
-- Run this in your Supabase dashboard → SQL Editor
-- ============================================================

-- 1. Add new columns to the profiles table
--    (IF NOT EXISTS means it's safe to run more than once)

alter table public.profiles
  add column if not exists avatar_url   text,       -- URL of uploaded profile photo
  add column if not exists misogi       text,       -- User's declared annual challenge
  add column if not exists x_handle    text,       -- X (Twitter) handle, e.g. "redbeanguild"
  add column if not exists ig_handle   text;       -- Instagram handle, e.g. "redbeanguild"


-- 2. Create the avatars storage bucket (public — anyone can view avatar images)

insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;


-- 3. Storage RLS policies — users can only upload to their own folder
--    (Path format: {userId}/avatar.{ext})
--    Drop first so this script is safe to re-run without errors.

drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Anyone can view avatars"     on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;

-- Allow logged-in users to upload their own avatar
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow anyone to read/view avatar images (they are public)
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Allow users to replace (update) their own avatar
create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
