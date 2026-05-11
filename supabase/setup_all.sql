-- =============================================================================
-- LinguaAdapt — idempotent full setup  (safe to run multiple times)
-- Supabase Dashboard → SQL Editor → New query → paste → Run
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  current_level integer not null default 0,
  skills jsonb not null default '{
    "alphabet": 0,
    "vocabulary": 0,
    "sentences": 0,
    "conversation": 0
  }'::jsonb,
  practice_streak integer not null default 0,
  last_practice_date date,
  total_points integer not null default 0,
  native_language text,
  target_language text,
  other_courses jsonb not null default '[]'::jsonb
);

-- Add any columns that may be missing in older DB instances
alter table public.profiles
  add column if not exists practice_streak    integer not null default 0,
  add column if not exists last_practice_date date,
  add column if not exists total_points       integer not null default 0,
  add column if not exists native_language    text,
  add column if not exists target_language    text,
  add column if not exists other_courses      jsonb not null default '[]'::jsonb;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update using (auth.uid() = id);

-- Optional GIN index for querying inside other_courses array
create index if not exists idx_profiles_other_courses
  on public.profiles using gin (other_courses);

-- ---------------------------------------------------------------------------
-- 2. Auto-create profile row on sign-up
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. user_vocabulary  (spaced-repetition progress per exercise per user)
-- ---------------------------------------------------------------------------
create table if not exists public.user_vocabulary (
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

drop policy if exists "user_vocab_select_own" on public.user_vocabulary;
drop policy if exists "user_vocab_insert_own" on public.user_vocabulary;
drop policy if exists "user_vocab_update_own" on public.user_vocabulary;
drop policy if exists "user_vocab_delete_own" on public.user_vocabulary;

create policy "user_vocab_select_own"
  on public.user_vocabulary for select using (auth.uid() = user_id);

create policy "user_vocab_insert_own"
  on public.user_vocabulary for insert with check (auth.uid() = user_id);

create policy "user_vocab_update_own"
  on public.user_vocabulary for update using (auth.uid() = user_id);

create policy "user_vocab_delete_own"
  on public.user_vocabulary for delete using (auth.uid() = user_id);

create index if not exists user_vocab_user_next_idx
  on public.user_vocabulary (user_id, next_review_date);

-- ---------------------------------------------------------------------------
-- 4. exercises  (remote content catalog — add new exercises without app updates)
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id              text primary key,
  type            text not null,          -- 'multiple-choice' | 'translate' | 'reorder' | 'free-write'
  category        text not null,          -- 'alphabet' | 'vocabulary' | 'sentences'
  difficulty      integer not null default 5 check (difficulty between 1 and 10),
  learning_pair   text not null default 'en-he',
  question        text not null,
  question_en     text,
  question_he     text,
  correct_answer  text not null,
  distractors     jsonb not null default '[]'::jsonb,
  reorder_words   jsonb,
  tutor_context   text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- All authenticated users can read exercises; only service_role (admin) can write
alter table public.exercises enable row level security;

drop policy if exists "exercises_read_authenticated" on public.exercises;
create policy "exercises_read_authenticated"
  on public.exercises for select
  using (auth.role() = 'authenticated' and is_active = true);

-- Optional: indexes for common query patterns
create index if not exists exercises_category_pair_idx
  on public.exercises (category, learning_pair)
  where is_active = true;

-- Example insert (paste & edit to add new exercises via SQL Editor):
-- insert into public.exercises (id, type, category, difficulty, learning_pair, question, question_en, correct_answer, distractors)
-- values (
--   'remote-voc-1', 'multiple-choice', 'vocabulary', 4, 'en-he',
--   'מה המשמעות של **חלון**?', 'What does **חלון** mean?',
--   'window',
--   '["door", "wall", "floor"]'::jsonb
-- )
-- on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 5. delete_own_account  (security-definer RPC — wipes all user data)
--    Supabase does not allow client-callable functions to delete from
--    auth.users (owned by supabase_auth_admin).  Instead we delete the
--    user's rows from profiles and user_vocabulary; the auth.users entry
--    stays but the app treats the next login as a blank-slate onboarding.
-- ---------------------------------------------------------------------------
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid;
begin
  _uid := auth.uid();
  if _uid is null then
    raise exception 'Not authenticated';
  end if;
  delete from public.user_vocabulary where user_id = _uid;
  delete from public.profiles        where id       = _uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

-- ---------------------------------------------------------------------------
-- 6. content_vocabulary  (server-side word pairs — seeded via npm run seed)
-- ---------------------------------------------------------------------------
create table if not exists public.content_vocabulary (
  id         bigserial    primary key,
  lang_a     varchar(10)  not null default 'he',
  lang_b     varchar(10)  not null default 'en',
  text_a     text         not null,
  text_b     text         not null,
  difficulty smallint     not null default 1 check (difficulty between 1 and 5),
  topic      text         not null default 'general',
  is_active  boolean      not null default true,
  sort_order integer      not null default 0,
  created_at timestamptz           default now(),
  unique (lang_a, lang_b, text_a)
);

create index if not exists idx_vocab_langs  on public.content_vocabulary (lang_a, lang_b);
create index if not exists idx_vocab_active on public.content_vocabulary (is_active);
create index if not exists idx_vocab_topic  on public.content_vocabulary (topic);

alter table public.content_vocabulary enable row level security;

drop policy if exists "public read active vocabulary" on public.content_vocabulary;
create policy "public read active vocabulary"
  on public.content_vocabulary for select
  using (is_active = true);

-- ---------------------------------------------------------------------------
-- 7. content_sentences  (server-side sentence pairs)
-- ---------------------------------------------------------------------------
create table if not exists public.content_sentences (
  id         bigserial    primary key,
  lang_a     varchar(10)  not null default 'he',
  lang_b     varchar(10)  not null default 'en',
  text_a     text         not null,
  text_b     text         not null,
  difficulty smallint     not null default 1 check (difficulty between 1 and 5),
  topic      text         not null default 'general',
  is_active  boolean      not null default true,
  created_at timestamptz           default now(),
  unique (lang_a, lang_b, text_a)
);

create index if not exists idx_sent_langs  on public.content_sentences (lang_a, lang_b);
create index if not exists idx_sent_active on public.content_sentences (is_active);

alter table public.content_sentences enable row level security;

drop policy if exists "public read active sentences" on public.content_sentences;
create policy "public read active sentences"
  on public.content_sentences for select
  using (is_active = true);

-- ---------------------------------------------------------------------------
-- 8. content_alphabet  (server-side alphabet letters per language)
-- ---------------------------------------------------------------------------
create table if not exists public.content_alphabet (
  id              bigserial    primary key,
  lang            varchar(10)  not null,
  char            text         not null,
  name            text         not null,
  name_he         text,
  names           jsonb                 default '{}',
  script_language varchar(10),
  phonetic        text,
  ipa             text,
  final_form      text,
  final_form_name text,
  gematria        integer               default 0,
  memory_hint     text,
  stroke_hint     text,
  sort_order      smallint     not null default 0,
  is_active       boolean      not null default true,
  unique (lang, char)
);

create index if not exists idx_alpha_lang   on public.content_alphabet (lang, sort_order);
create index if not exists idx_alpha_active on public.content_alphabet (is_active);

alter table public.content_alphabet enable row level security;

drop policy if exists "public read active alphabet" on public.content_alphabet;
create policy "public read active alphabet"
  on public.content_alphabet for select
  using (is_active = true);
