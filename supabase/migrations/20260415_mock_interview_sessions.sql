-- ── Mock interview sessions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mock_interview_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id  UUID REFERENCES applications(id) ON DELETE SET NULL,
  company         TEXT NOT NULL,
  role            TEXT NOT NULL,
  questions       JSONB NOT NULL DEFAULT '[]',
  transcript      JSONB NOT NULL DEFAULT '[]',
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mock_interview_sessions_user_id
  ON mock_interview_sessions(user_id, completed_at DESC);

-- RLS: users can only read/write their own sessions
ALTER TABLE mock_interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions"
  ON mock_interview_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
