-- =============================================================================
-- LinguaAdapt — Supabase setup (idempotent; safe to run again)
-- Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- Accounts are optional in the app. The server only keeps:
--   • profiles       — display name
--   • user_progress  — one JSON document with the learner's progress
-- Course content is NOT stored here: it ships with the app and in the
-- public content packs (public/content).
-- =============================================================================

-- 1. profiles -----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. user_progress --------------------------------------------------------------
create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

drop policy if exists "progress_select_own" on public.user_progress;
drop policy if exists "progress_insert_own" on public.user_progress;
drop policy if exists "progress_update_own" on public.user_progress;
drop policy if exists "progress_delete_own" on public.user_progress;

create policy "progress_select_own" on public.user_progress for select using (auth.uid() = user_id);
create policy "progress_insert_own" on public.user_progress for insert with check (auth.uid() = user_id);
create policy "progress_update_own" on public.user_progress for update using (auth.uid() = user_id);
create policy "progress_delete_own" on public.user_progress for delete using (auth.uid() = user_id);

-- 3. delete_own_account ---------------------------------------------------------
-- App Store rule 5.1.1(v): an app that lets people create an account must let
-- them delete it. Deleting the auth user cascades to profiles and user_progress.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then
    raise exception 'Not authenticated';
  end if;
  delete from public.user_progress where user_id = _uid;
  delete from public.profiles where id = _uid;
  delete from auth.users where id = _uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
