-- ── Referral system migration ────────────────────────────────────────────────
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query).

-- 1. Add referral_code column to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_rewards_granted INTEGER NOT NULL DEFAULT 0;

-- 2. Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each user can only be referred once ever
  UNIQUE(referred_id),
  -- Prevent self-referral at DB level
  CHECK (referrer_id <> referred_id)
);

-- 3. RLS policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Referrers can read referrals where they are the referrer
CREATE POLICY "referrer_can_read_own" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- Service role (API routes with SUPABASE_SERVICE_ROLE_KEY) can insert/update anything
-- No INSERT policy needed for anon/authenticated — all writes go through service role

-- 4. Index for fast lookup of referrer's confirmed referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
-- Index for code lookup
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
