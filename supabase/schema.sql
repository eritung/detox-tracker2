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

create policy "users manage own fresh21 checkins"
on public.fresh21_checkins
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can insert own profile"
on public.profiles
for insert
with check (id = auth.uid());
