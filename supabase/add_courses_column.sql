-- Migration: add other_courses column for multi-course support
-- Run this in your Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS other_courses JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Optional index for querying inside the JSONB array
CREATE INDEX IF NOT EXISTS idx_profiles_other_courses
  ON public.profiles USING gin (other_courses);
