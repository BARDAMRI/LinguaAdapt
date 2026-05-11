-- Phase 5: SRS vocabulary + gamification columns on profiles.
-- Run after profiles.sql in Supabase SQL Editor.

alter table public.profiles
  add column if not exists practice_streak integer not null default 0,
  add column if not exists last_practice_date date,
  add column if not exists total_points integer not null default 0;

create table if not exists public.user_vocabulary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id text not null,
  next_review_date date not null,
  interval_days integer not null default 1,
  ease_factor numeric not null default 2.5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

alter table public.user_vocabulary enable row level security;

create policy "user_vocab_select_own"
  on public.user_vocabulary for select
  using (auth.uid() = user_id);

create policy "user_vocab_insert_own"
  on public.user_vocabulary for insert
  with check (auth.uid() = user_id);

create policy "user_vocab_update_own"
  on public.user_vocabulary for update
  using (auth.uid() = user_id);

create policy "user_vocab_delete_own"
  on public.user_vocabulary for delete
  using (auth.uid() = user_id);

create index if not exists user_vocab_user_next_idx
  on public.user_vocabulary (user_id, next_review_date);
