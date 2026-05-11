-- =============================================================================
-- LinguaAdapt — FULL RESET + setup  (destructive — all row data is lost)
-- Supabase Dashboard → SQL Editor → New query → paste → Run
-- ⚠️  Auth users in auth.users are NOT deleted.
-- =============================================================================

drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.user_vocabulary cascade;
drop table if exists public.profiles cascade;
drop function if exists public.handle_new_user() cascade;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  display_name    text,
  current_level   integer not null default 0,
  skills          jsonb not null default '{
    "alphabet": 0,
    "vocabulary": 0,
    "sentences": 0,
    "conversation": 0
  }'::jsonb,
  practice_streak    integer not null default 0,
  last_practice_date date,
  total_points       integer not null default 0,
  native_language    text,
  target_language    text,
  other_courses      jsonb not null default '[]'::jsonb
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update using (auth.uid() = id);

create index idx_profiles_other_courses
  on public.profiles using gin (other_courses);

-- ---------------------------------------------------------------------------
-- Auto-create profile on sign-up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- user_vocabulary  (spaced-repetition)
-- ---------------------------------------------------------------------------
create table public.user_vocabulary (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  exercise_id     text not null,
  next_review_date date not null,
  interval_days   integer not null default 1,
  ease_factor     numeric not null default 2.5,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, exercise_id)
);

alter table public.user_vocabulary enable row level security;

create policy "user_vocab_select_own"
  on public.user_vocabulary for select using (auth.uid() = user_id);

create policy "user_vocab_insert_own"
  on public.user_vocabulary for insert with check (auth.uid() = user_id);

create policy "user_vocab_update_own"
  on public.user_vocabulary for update using (auth.uid() = user_id);

create policy "user_vocab_delete_own"
  on public.user_vocabulary for delete using (auth.uid() = user_id);

create index user_vocab_user_next_idx
  on public.user_vocabulary (user_id, next_review_date);
