-- ── Applyd Community Challenge — run this in your Supabase SQL editor ──────

-- 1. community_ideas table
create table if not exists public.community_ideas (
  id                  uuid primary key default gen_random_uuid(),
  idea_text           text not null,
  tiktok_username     text,
  vote_count          integer not null default 0,
  date_submitted      timestamptz not null default now(),
  status              text not null default 'pending'
                        check (status in ('pending', 'winning', 'building', 'live', 'rejected')),
  day_number          integer,
  feature_name        text,
  feature_description text,
  built_date          timestamptz,
  screenshot_url      text
);

-- 2. challenge_config table (single row, id = 1)
create table if not exists public.challenge_config (
  id                      integer primary key default 1,
  challenge_start_date    date not null default current_date,
  current_day_winner_id   uuid references public.community_ideas(id),
  challenge_active        boolean not null default true
);

-- Insert default config row (update challenge_start_date to match CHALLENGE_START_DATE constant)
insert into public.challenge_config (id, challenge_start_date)
values (1, '2026-04-02')
on conflict (id) do nothing;

-- 3. Add is_admin column to users table (for admin panel access)
alter table public.users add column if not exists is_admin boolean not null default false;

-- 4. Row Level Security
alter table public.community_ideas enable row level security;
alter table public.challenge_config  enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public read community_ideas"   on public.community_ideas;
drop policy if exists "Public read challenge_config"  on public.challenge_config;
drop policy if exists "Auth insert community_ideas"   on public.community_ideas;
drop policy if exists "Admin update community_ideas"  on public.community_ideas;
drop policy if exists "Admin update challenge_config" on public.challenge_config;

-- Anyone can read
create policy "Public read community_ideas"
  on public.community_ideas for select using (true);

create policy "Public read challenge_config"
  on public.challenge_config for select using (true);

-- Authenticated users can insert new ideas
create policy "Auth insert community_ideas"
  on public.community_ideas for insert
  to authenticated
  with check (true);

-- Only admins can update ideas (status, feature_name, etc.)
create policy "Admin update community_ideas"
  on public.community_ideas for update
  using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- Only admins can update challenge config
create policy "Admin update challenge_config"
  on public.challenge_config for update
  using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- 5. RPC: safe vote increment (security definer bypasses RLS for the increment only)
create or replace function public.increment_vote(idea_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.community_ideas
  set vote_count = vote_count + 1
  where id = idea_id and status = 'pending';
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.increment_vote(uuid) to authenticated;

-- 6. Enable realtime on community_ideas
alter publication supabase_realtime add table public.community_ideas;

-- 7. Seed: pending ideas (voting section)
insert into public.community_ideas (idea_text, tiktok_username, vote_count, status) values
  ('Add a LinkedIn integration so I can import my connections as recruiters automatically', 'alex.codes', 127, 'pending'),
  ('Show a calendar view of all my interview dates and deadlines in one place', 'recruitingqueen', 94, 'pending'),
  ('Let me add notes about what I said in each interview so I can track follow-ups', 'techbro2026', 81, 'pending'),
  ('Send me email reminders 3 days before any deadline I set', 'priya.applies', 67, 'pending'),
  ('Add a GPA and resume version tracker to each application', 'cornell.cs', 43, 'pending');

-- 8. Seed: hall of fame (built features)
insert into public.community_ideas (idea_text, tiktok_username, vote_count, status, day_number, feature_name, feature_description, built_date) values
  ('Show me a percentage of companies that responded to my applications',
   'maya.swe', 312, 'live', 1,
   'Response Rate Card',
   'A live stat showing your callback rate as a percentage — automatically calculated from your application data.',
   now() - interval '2 days'),
  ('Add colored urgency badges on kanban cards for upcoming deadlines',
   'james.nyu', 289, 'live', 2,
   'Deadline Pill Badges',
   'Per-card deadline badges in red and amber — consistent across kanban and table views.',
   now() - interval '1 day'),
  ('I want to know when I am on a hot streak of applying every day',
   'aisha.michigan', 201, 'live', 3,
   'Application Streak Tracker',
   'A streak badge in the nav showing your consecutive days of activity with milestone celebrations.',
   now());
