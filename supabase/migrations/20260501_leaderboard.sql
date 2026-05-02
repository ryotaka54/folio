-- ── Interview Leaderboard ──────────────────────────────────────────────────────
-- Public per-question leaderboard. Users opt-in after each mock interview answer.
-- Visitors can browse without auth; posting requires auth.
-- Users can delete, anonymize, or hide their answer at any time.

CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company       TEXT NOT NULL,
  company_slug  TEXT NOT NULL,   -- lowercase url-safe e.g. "google", "jane-street"
  role          TEXT NOT NULL,
  question      TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'behavioral',
  score         INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  answer_text   TEXT,            -- NULL if user chose score-only
  display_name  TEXT,            -- NULL if anonymous
  lang          TEXT NOT NULL DEFAULT 'en',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public leaderboard pages, no login required)
CREATE POLICY "leaderboard_public_read"
  ON public.leaderboard_entries FOR SELECT
  USING (true);

-- Only authenticated users can post entries
CREATE POLICY "leaderboard_insert_auth"
  ON public.leaderboard_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries (hide answer, anonymize)
CREATE POLICY "leaderboard_update_own"
  ON public.leaderboard_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "leaderboard_delete_own"
  ON public.leaderboard_entries FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_company_slug
  ON public.leaderboard_entries(company_slug, lang);

CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id
  ON public.leaderboard_entries(user_id);

-- ── Anonymous preview rate-limiting ───────────────────────────────────────────
-- Tracks unauthenticated "try it" evaluations by IP hash to prevent abuse.
-- Accessed via service role key only — no user-facing RLS needed.

CREATE TABLE IF NOT EXISTS public.leaderboard_previews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash      TEXT NOT NULL,
  company_slug TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_previews ENABLE ROW LEVEL SECURITY;
-- No user policies — service role only
