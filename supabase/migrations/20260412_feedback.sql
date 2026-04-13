-- ── Feedback table migration ───────────────────────────────────────────────
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query).

CREATE TABLE IF NOT EXISTS feedback (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      TEXT        NOT NULL CHECK (rating IN ('love', 'okay', 'meh')),
  comment     TEXT,
  source      TEXT        NOT NULL DEFAULT 'in_app_prompt_v1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: users can insert their own feedback; nobody can read others'
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_insert_own_feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role (admin) can read all feedback for analytics
-- No SELECT policy for regular users — feedback is write-only from the client

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
