-- ── Applyd Calendar — run this in your Supabase SQL editor ─────────────────

-- 1. google_calendar_event_id column on applications
alter table public.applications
  add column if not exists google_calendar_event_id text;

-- 2. user_integrations table (stores OAuth tokens server-side)
create table if not exists public.user_integrations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  provider     text not null,          -- 'google_calendar'
  access_token text not null,
  refresh_token text,
  token_expiry  timestamptz,
  provider_email text,                 -- connected Google account email
  connected_at  timestamptz not null default now(),
  unique (user_id, provider)
);

-- RLS: users can only see/manage their own integrations
alter table public.user_integrations enable row level security;

drop policy if exists "Users manage own integrations" on public.user_integrations;
create policy "Users manage own integrations"
  on public.user_integrations
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Edge Function environment variables needed (set in Supabase dashboard):
--    GOOGLE_CLIENT_ID     — from Google Cloud Console
--    GOOGLE_CLIENT_SECRET — from Google Cloud Console
--    APP_URL              — https://useapplyd.com (or localhost:3000 for dev)
--
--    Also add to .env.local:
--    NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-client-id>
