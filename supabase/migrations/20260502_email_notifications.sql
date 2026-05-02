ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_deadline_reminders BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_weekly_digest       BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.email_notification_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('deadline_reminder','weekly_digest')),
  reference_key TEXT NOT NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, type, reference_key)
);

ALTER TABLE public.email_notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enl_own" ON public.email_notification_log
  USING (auth.uid() = user_id);
