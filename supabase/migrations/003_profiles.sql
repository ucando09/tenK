-- ────────────────────────────────────────────────────────────────────────────
-- 003_profiles.sql
-- User profiles (display name, bio, avatar) + Supabase Storage bucket
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Profiles table ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio          TEXT        DEFAULT '',
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Repair-add columns in case the table was created by an older/partial
-- version of this script that didn't include all fields.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio          TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Force PostgREST to reload its schema cache so the new columns are
-- immediately visible to the API (otherwise upserts referencing them fail
-- with "Could not find the 'X' column in the schema cache").
NOTIFY pgrst, 'reload schema';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop-then-create so this script can be re-run safely.
-- Everyone can read profiles (needed for group leaderboards / member display names)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can insert their own profile row
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Auto-create a profile row when a new user signs up ----------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger first so this script is re-runnable
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Back-fill profiles for existing users -----------------------------------
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. Storage bucket for avatars (public read, owner write) -------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view avatar images (public bucket)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow authenticated users to upload/replace their own avatar
-- Convention: avatars/<user_id>/<filename>
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
