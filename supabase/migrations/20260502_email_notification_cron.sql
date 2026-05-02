-- Schedule email notification edge functions via pg_cron + pg_net.
-- Requires pg_cron and pg_net extensions enabled in Supabase project settings.
-- Replace <PROJECT-REF> with your actual Supabase project ref.

SELECT cron.schedule(
  'deadline-reminder-daily',
  '0 8 * * *',  -- daily at 08:00 UTC
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT-REF>.supabase.co/functions/v1/send-email-notifications',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
    body    := '{"type":"deadline_reminder"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'weekly-digest-monday',
  '0 9 * * 1',  -- Mondays at 09:00 UTC
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT-REF>.supabase.co/functions/v1/send-email-notifications',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
    body    := '{"type":"weekly_digest"}'::jsonb
  );
  $$
);
