-- AI feature columns on applications table
alter table applications
  add column if not exists ai_interview_prep jsonb,
  add column if not exists ai_strength_signal jsonb,
  add column if not exists ai_offer_intelligence jsonb;

-- Rate limiting table
create table if not exists ai_usage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  feature     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists ai_usage_user_feature_date
  on ai_usage (user_id, feature, created_at);

-- Analytics table
create table if not exists ai_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  feature     text not null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- RLS for ai_usage
alter table ai_usage enable row level security;

create policy "Users manage own ai_usage"
  on ai_usage for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS for ai_events
alter table ai_events enable row level security;

create policy "Users manage own ai_events"
  on ai_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Interview steps column
alter table applications
  add column if not exists interview_steps jsonb default '[]'::jsonb;
