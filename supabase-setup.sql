-- ============================================================
-- RBG PROFILES TABLE
-- Run this in your Supabase SQL Editor (supabase.com dashboard)
-- Dashboard → SQL Editor → New Query → Paste this → Click "Run"
-- ============================================================

-- Create the profiles table linked to Supabase auth users
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  display_name text,
  wallet_address text,
  owns_happi boolean default false,
  happi_token_count integer default 0,
  wallet_verified_at timestamptz,
  joined_at timestamptz default now()
);

-- Enable Row Level Security (RLS) — users can only see/edit their own profile
alter table public.profiles enable row level security;

-- Policy: users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Policy: users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Policy: users can insert their own profile (on signup)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
-- This "trigger" runs automatically — you don't have to do anything
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, joined_at)
  values (new.id, new.email, now());
  return new;
end;
$$ language plpgsql security definer;

-- Connect the trigger to the auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
