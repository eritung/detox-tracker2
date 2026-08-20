create table if not exists public.fresh21_checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  day integer not null check (day between 1 and 21),
  completed text[] not null default '{}',
  sleep_at text not null default '',
  wake_at text not null default '',
  morning_mood text not null default '',
  morning_note text not null default '',
  evening_mood text not null default '',
  evening_note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.fresh21_checkins enable row level security;

revoke all privileges on table public.fresh21_checkins from anon;
revoke truncate, references, trigger, delete on table public.fresh21_checkins from authenticated;
grant select, insert, update on table public.fresh21_checkins to authenticated;

create policy "users manage own fresh21 checkins"
on public.fresh21_checkins
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users can insert own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

-- This trigger function is invoked internally when a user signs up and should
-- never be callable through the public Data API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
