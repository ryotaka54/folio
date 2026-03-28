-- Folio Database Schema
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor → New Query)

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT '',
  mode TEXT DEFAULT 'internship' CHECK (mode IN ('internship', 'job')),
  school_year TEXT DEFAULT '',
  career_level TEXT DEFAULT '',
  recruiting_season TEXT DEFAULT '',
  onboarding_complete BOOLEAN DEFAULT false,
  tutorial_completed BOOLEAN DEFAULT false,
  extension_installed BOOLEAN DEFAULT false,
  extension_banner_dismissed BOOLEAN DEFAULT false,
  extension_hint_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT DEFAULT '',
  category TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Wishlist',
  deadline DATE,
  job_link TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  recruiter_name TEXT DEFAULT '',
  recruiter_email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- 4. Users RLS policies: users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- 5. Applications RLS policies: users can only CRUD their own applications
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON applications FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Index for fast queries
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- ─── Migrations (run these if you already have the tables above) ──────────────
-- If you set up the DB before these columns existed, run the ALTER TABLE
-- statements below. They are safe to run even if columns already exist.

ALTER TABLE users ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS extension_installed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS extension_banner_dismissed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS extension_hint_count INTEGER DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
