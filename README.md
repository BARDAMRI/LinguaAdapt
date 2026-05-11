# LinguaAdapt

Cross-platform language-learning app (Expo / React Native) backed by Supabase for auth, progress, and dynamic content. Supports Hebrew, English, Arabic, Spanish, French, Russian, and German. Optional Google Gemini integration for AI-powered free-write evaluation.

---

## Table of contents

1. [User guide](#user-guide)
2. [Prerequisites](#prerequisites)
3. [Quick start](#quick-start)
4. [Environment variables](#environment-variables)
5. [Database setup](#database-setup)
6. [Seeding content](#seeding-content)
7. [Project layout](#project-layout)
8. [Architecture: exercises and language pairs](#architecture-exercises-and-language-pairs)
9. [Language support](#language-support)
10. [Adding new content](#adding-new-content)
11. [Exercise structure reference](#exercise-structure-reference)
12. [Database schema reference](#database-schema-reference)
13. [Developer guide](#developer-guide)
14. [Deploy to GitHub Pages](#deploy-to-github-pages)
15. [npm scripts](#npm-scripts)

---

## User guide

LinguaAdapt adapts its exercises to **your language pair and skill level**. During onboarding you pick your native language and the language you want to learn. The app then:

- Selects exercises matching your language direction (e.g. English → Hebrew, Hebrew → English).
- Scales difficulty to your current skill level in each category (Alphabet, Vocabulary, Sentences).
- Uses a spaced-repetition scheduler to surface due reviews first.
- Awards points and tracks practice streaks.

You can switch your target language or add additional courses at any time in the **Settings** screen. The AI Tutor tab (requires a Gemini API key) gives real-time feedback on free-write answers and conversation practice.

---

## Prerequisites

- **Node.js 18+** and **npm**
- A [Supabase](https://supabase.com) project (free tier is sufficient)
- Optionally, a [Google AI Studio](https://aistudio.google.com/apikey) API key for Gemini

---

## Quick start

```bash
git clone <repository-url>
cd LinguaAdapt
npm install
cp .env.example .env
# Fill in the required values in .env (see below)
npx expo start
```

Press `w` for web, scan the QR code for a device, or press `a`/`i` for Android/iOS simulators.

---

## Environment variables

Create `.env` in the project root (copy from `.env.example`). Expo only injects variables prefixed `EXPO_PUBLIC_` into the client bundle.

| Variable | Required | Purpose |
|----------|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL (`https://<ref>.supabase.co`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase **anon** (public) key — safe to ship in clients when RLS is enabled |
| `EXPO_PUBLIC_GEMINI_API_KEY` | No | Enables AI feedback in free-write and conversation screens |
| `SUPABASE_SERVICE_ROLE_KEY` | Seed only | Service-role key for the `npm run seed` script — **never put this in the app bundle or commit it** |

After editing `.env`, restart the Expo dev server.

**Where to find keys:** Supabase Dashboard → Project Settings → API.

---

## Database setup

Run **`supabase/setup_all.sql`** once in the **Supabase SQL Editor** (New query → paste → Run). This single idempotent script creates every table, index, RLS policy, trigger, and function the app needs:

| Section | What it creates |
|---------|----------------|
| 1 | `public.profiles` — user settings, language prefs, XP, streak |
| 2 | `on_auth_user_created` trigger — auto-creates a profile on sign-up |
| 3 | `public.user_vocabulary` — spaced-repetition state per exercise per user |
| 4 | `public.exercises` — optional hand-crafted remote exercises (not required) |
| 5 | `delete_own_account()` RPC — lets users wipe their own data |
| 6 | `public.content_vocabulary` — server-side word pairs |
| 7 | `public.content_sentences` — server-side sentence pairs |
| 8 | `public.content_alphabet` — server-side alphabet letters |

> **Existing databases:** The script uses `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, and `DROP POLICY IF EXISTS` throughout, so it is safe to re-run on a database that already has some tables.

### Auth setup

In Supabase: **Authentication → Providers**, enable **Email**. Under **Authentication → URL Configuration**, add to **Redirect URLs**:

- `http://localhost:8081/**`
- `https://BARDAMRI.github.io/LinguaAdapt/**`  _(adjust for your own deployment)_

---

## Seeding content

After running `setup_all.sql`, populate the content tables with the bundled data:

```bash
# Make sure SUPABASE_SERVICE_ROLE_KEY is in your .env
npm run seed
```

The seed script (`scripts/seedContent.ts`) uses `upsert` with conflict resolution, so it is **safe to run multiple times** — it will update existing rows, not duplicate them.

**What gets seeded:**

| Table | Rows | Description |
|-------|------|-------------|
| `content_vocabulary` | ~871 | Hebrew ↔ English word pairs across 25+ topics |
| `content_sentences` | ~171 | Hebrew ↔ English sentence pairs across 15+ topics |
| `content_alphabet` | ~192 | Letters for he, en, ar, es, fr, ru, de |

---

## Project layout

```
LinguaAdapt/
├── App.tsx                    # Root: providers, navigation shell, theme
├── index.ts                   # Expo entry point
├── types/
│   └── learning.ts            # Exercise, LetterData, ProfileSkills types
├── src/
│   ├── constants/
│   │   └── onboardingLanguages.ts   # Supported language codes + defaults
│   ├── context/
│   │   ├── AuthContext.tsx          # Supabase auth session
│   │   └── PreferencesContext.tsx   # Theme preference
│   ├── data/
│   │   ├── heVocabularyData.ts      # Local Hebrew vocab (~871 entries, offline fallback)
│   │   ├── heSentenceData.ts        # Local Hebrew sentences (~171 entries, offline fallback)
│   │   ├── heAlphabetData.ts        # Hebrew alphabet
│   │   ├── enAlphabetData.ts        # English alphabet
│   │   ├── arAlphabetData.ts        # Arabic alphabet
│   │   ├── esAlphabetData.ts        # Spanish alphabet
│   │   ├── frAlphabetData.ts        # French alphabet
│   │   ├── ruAlphabetData.ts        # Russian alphabet
│   │   ├── deAlphabetData.ts        # German alphabet
│   │   └── initialExercises.json    # Hand-crafted bootstrap exercises
│   ├── navigation/
│   │   ├── types.ts                 # AppStackParamList, route params
│   │   └── linking.ts               # Deep-link config (web + GitHub Pages)
│   ├── screens/                     # One file per screen
│   ├── services/
│   │   ├── supabase.ts              # Supabase client (anon key)
│   │   ├── profileService.ts        # CRUD for profiles, language prefs, courses
│   │   ├── exerciseService.ts       # Exercise pool, language filtering, session picker
│   │   ├── exerciseGenerator.ts     # Generates exercises from local data files
│   │   ├── remoteContentService.ts  # Fetches content tables → generates DB exercises
│   │   ├── alphabetService.ts       # Alphabet cache (local + DB override)
│   │   ├── learningService.ts       # Session finalization, XP, streak, SRS
│   │   ├── geminiService.ts         # Gemini AI integration
│   │   └── i18n.ts                  # Localization helpers
│   └── theme/
│       └── theme.ts                 # Design tokens, dark/light themes
├── scripts/
│   └── seedContent.ts         # One-time (idempotent) DB seeding script
└── supabase/
    ├── setup_all.sql           # Full idempotent DB setup (run this once)
    └── content_tables.sql      # Content tables only (subset of setup_all.sql)
```

---

## Architecture: exercises and language pairs

### Exercise pool

At app startup, `exerciseService.ts` builds `ALL_EXERCISES` from two sources:

1. **`initialExercises.json`** — a small set of hand-crafted exercises, always available.
2. **Generated exercises** (`exerciseGenerator.ts`) — automatically produced from the local `*Data.ts` files at boot, prefixed `gen-`.

`AppBootstrapScreen.tsx` then calls `loadRemoteContent()` which:

1. Fetches all three content tables from the DB in parallel.
2. Generates exercises from the DB rows (prefix `db-`).
3. Calls `replaceGeneratedExercises()` — removes all `gen-*` exercises and adds the `db-*` ones.

This means **the DB is always the source of truth when available**. If the network is down or the tables don't exist yet, local generated exercises remain active as an offline fallback.

### Language pair routing

Every exercise carries a `learningPair` field formatted as `{native}-{target}`, e.g.:
- `en-he` — English speaker learning Hebrew
- `he-en` — Hebrew speaker learning English
- `en-ar` — English speaker learning Arabic

`filterExercisesByLanguagePair(exercises, nativeCode, targetCode)` applies a three-tier fallback:

1. **Exact match** — exercises where `learningPair === "{native}-{target}"`.
2. **Target-only match** — exercises where `learningPair` ends with `-{target}`. This lets any native speaker use content that was authored for a specific native language.
3. **Global fallback** — all exercises, so the app never shows "no exercises available" even for unsupported pairs.

### Language preference pipeline

```
User picks language during onboarding
        ↓
profiles.native_language / profiles.target_language (Supabase)
        ↓
LearningSessionScreen → fetchProfile(userId)
        ↓
pickSessionExercises(category, skillLevel, 10, undefined, native, target)
        ↓
filterExercisesByLanguagePair(ALL_EXERCISES, native, target)
        ↓
Exercises shown to user
```

### Session picking

`pickSessionExercises(category, skillLevel, count, all, native, target)`:

- For a specific category (`alphabet`, `vocabulary`, `sentences`): sorts by difficulty proximity to the user's skill-scaled anchor, shuffles the top candidates, returns `count` exercises.
- For `mixed`: takes a proportional slice from all three categories.
- Per-category fallback: if the language-filtered pool has no exercises for a specific category, it falls back to exercises for that category in any language (prevents completely empty sessions).

---

## Language support

| Code | Language | Vocab | Sentences | Alphabet |
|------|----------|-------|-----------|---------|
| `he` | Hebrew | ✅ ~871 pairs | ✅ ~171 pairs | ✅ 22 letters + 5 final forms |
| `en` | English | — | — | ✅ 26 letters |
| `ar` | Arabic | — | — | ✅ 28 letters |
| `es` | Spanish | — | — | ✅ 27 letters |
| `fr` | French | — | — | ✅ 26 letters |
| `ru` | Russian | — | — | ✅ 33 letters |
| `de` | German | — | — | ✅ 30 letters |

Non-Hebrew vocab and sentences can be added to the DB without an app update (see [Adding new content](#adding-new-content)).

### Learning pairs currently exercised

| Pair | Content available |
|------|------------------|
| `en-he` | Full: ~4,000+ generated vocabulary, sentence, and alphabet exercises |
| `he-en` | Full: matching exercises in the reverse direction |
| `en-ar` | Alphabet only |
| `en-es` | Alphabet only |
| `en-fr` | Alphabet only |
| `en-ru` | Alphabet only |
| `en-de` | Alphabet only |

---

## Adding new content

All three methods below are **hot** — changes take effect the next time a user opens the app without any app update.

### Method 1 — SQL INSERT into content tables (recommended for bulk)

```sql
-- Add a vocabulary word (Hebrew ↔ English)
INSERT INTO content_vocabulary (lang_a, lang_b, text_a, text_b, difficulty, topic)
VALUES ('he', 'en', 'תפוח', 'apple', 1, 'food')
ON CONFLICT (lang_a, lang_b, text_a) DO UPDATE
  SET text_b = EXCLUDED.text_b,
      difficulty = EXCLUDED.difficulty,
      topic = EXCLUDED.topic;

-- Add a vocabulary word for another language pair (Spanish ↔ English)
INSERT INTO content_vocabulary (lang_a, lang_b, text_a, text_b, difficulty, topic)
VALUES ('es', 'en', 'manzana', 'apple', 1, 'food')
ON CONFLICT (lang_a, lang_b, text_a) DO UPDATE SET text_b = EXCLUDED.text_b;

-- Add a sentence (Hebrew ↔ English)
INSERT INTO content_sentences (lang_a, lang_b, text_a, text_b, difficulty, topic)
VALUES ('he', 'en', 'אני רוצה לאכול תפוח', 'I want to eat an apple', 2, 'food')
ON CONFLICT (lang_a, lang_b, text_a) DO NOTHING;
```

**Difficulty scale:** 1 (very easy) to 5 (hard). Internally mapped to 1–10 for exercise selection.

**Topics** for Hebrew vocabulary (use consistently for good grouping): `greetings`, `numbers`, `colors`, `food`, `family`, `body`, `animals`, `home`, `clothing`, `weather`, `time`, `transport`, `shopping`, `work`, `health`, `travel`, `nature`, `emotions`, `sports`, `seasons`, `questions`, `positions`, `school`, `professions`, `money`, `emergency`, `culture`, `hobbies`, `medical`, `people`.

### Method 2 — Update local data files + reseed (for bundled offline fallback)

1. Add entries to `src/data/heVocabularyData.ts` or `src/data/heSentenceData.ts`:

```ts
// In heVocabularyData.ts
export const HE_VOCABULARY: VocabEntry[] = [
  // ... existing entries ...
  { he: 'תפוח', en: 'apple', difficulty: 1, topic: 'food' },
];
```

2. Reseed the DB:

```bash
npm run seed
```

The seed script deduplicates on `(lang_a, lang_b, text_a)` so existing rows are safe.

### Method 3 — Add hand-crafted exercises to the `exercises` table

For exercises that need custom question wording, multiple distractors, or specific tutor context:

```sql
INSERT INTO public.exercises (
  id, type, category, difficulty, learning_pair,
  question, question_en, correct_answer, distractors, tutor_context
)
VALUES (
  'custom-voc-1',          -- must be unique; use a descriptive prefix
  'multiple-choice',       -- 'multiple-choice' | 'translate' | 'reorder' | 'free-write'
  'vocabulary',            -- 'alphabet' | 'vocabulary' | 'sentences'
  4,                       -- 1–10
  'en-he',                 -- '{native}-{target}' language pair
  'מה המשמעות של **חלון**?',
  'What does **חלון** mean?',
  'window',
  '["door", "wall", "floor"]'::jsonb,
  'חלון means window. It comes from the root ח-ל-ן related to opening.'
)
ON CONFLICT (id) DO NOTHING;
```

To deactivate an exercise without deleting it:

```sql
UPDATE public.exercises SET is_active = false WHERE id = 'custom-voc-1';
```

### Deactivating content

Any row in any content table can be hidden from users without deletion:

```sql
-- Hide a vocabulary word
UPDATE content_vocabulary SET is_active = false
WHERE lang_a = 'he' AND text_a = 'תפוח';

-- Hide all content for a topic
UPDATE content_vocabulary SET is_active = false WHERE topic = 'emergency';
```

---

## Exercise structure reference

### `Exercise` type (TypeScript — `types/learning.ts`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique. Prefixes: `gen-` local, `db-` content table, `remote-` exercises table, custom strings |
| `type` | `string` | Yes | `multiple-choice`, `translate`, `reorder`, `free-write`, `letter-trace` |
| `category` | `string` | Yes | `alphabet`, `vocabulary`, `sentences` |
| `difficulty` | `number` | Yes | 1–10 |
| `learningPair` | `string` | Yes | `{native}-{target}`, e.g. `en-he` |
| `question` | `string` | Yes | Displayed question. Supports `**bold**` markdown |
| `questionEn` | `string` | No | English version of question (shown in bilingual UI) |
| `questionHe` | `string` | No | Hebrew version of question |
| `correctAnswer` | `string` | Yes | The exact correct answer string |
| `distractors` | `string[]` | Yes | Wrong options for `multiple-choice` (2–3 items) |
| `reorderWords` | `string[]` | No | Shuffled word array for `reorder` type |
| `letterData` | `LetterData` | No | Required for `letter-trace` type |
| `tutorContext` | `string` | No | Extra context passed to AI tutor for `free-write` scoring |

### Exercise types explained

| Type | User interaction | When to use |
|------|-----------------|-------------|
| `multiple-choice` | Tap one of 4 options | Vocabulary recognition, alphabet identification |
| `translate` | Type the answer | Active recall of words or short phrases |
| `reorder` | Drag/tap words into order | Sentence structure practice |
| `free-write` | Type a full sentence; AI scores it | Advanced sentence production |
| `letter-trace` | See a letter, choose its name | Alphabet introduction |

### ID prefix conventions

| Prefix | Source |
|--------|--------|
| `gen-voc-*` | Generated from `heVocabularyData.ts` |
| `gen-sent-*` | Generated from `heSentenceData.ts` |
| `gen-lt-*` | Generated from alphabet data files |
| `db-voc-*` | Generated from `content_vocabulary` table |
| `db-sent-*` | Generated from `content_sentences` table |
| `db-lt-*` | Generated from `content_alphabet` table |
| `remote-*` | Hand-crafted rows in the `exercises` table |

---

## Database schema reference

### `public.profiles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | = `auth.users.id` |
| `display_name` | `text` | User's display name |
| `native_language` | `text` | ISO code: `en`, `he`, `ar`, `es`, `fr`, `ru`, `de` |
| `target_language` | `text` | ISO code (the language being learned) |
| `skills` | `jsonb` | `{ alphabet, vocabulary, sentences, conversation }` — integers 0–10 |
| `practice_streak` | `int` | Consecutive days with at least one practice session |
| `last_practice_date` | `date` | Date of last completed session |
| `total_points` | `int` | Cumulative XP |
| `current_level` | `int` | Derived from total_points |
| `other_courses` | `jsonb` | Array of additional language pairs the user has enrolled in |

### `public.user_vocabulary`

Tracks spaced-repetition state per user per exercise.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | `uuid` | Foreign key to `auth.users` |
| `exercise_id` | `text` | Matches `Exercise.id` |
| `next_review_date` | `date` | When to show this exercise next |
| `interval_days` | `int` | Current SM-2 interval |
| `ease_factor` | `numeric` | SM-2 ease factor (default 2.5) |

### `public.content_vocabulary`

| Column | Type | Notes |
|--------|------|-------|
| `lang_a` | `varchar(10)` | Target language code (the language being learned) |
| `lang_b` | `varchar(10)` | Native language code (the helper language) |
| `text_a` | `text` | Word/phrase in `lang_a` |
| `text_b` | `text` | Translation in `lang_b` |
| `difficulty` | `smallint` | 1–5 (mapped to 2–10 internally) |
| `topic` | `text` | Grouping tag |
| `is_active` | `boolean` | Set to `false` to hide without deleting |
| `sort_order` | `int` | Presentation order within topic |

### `public.content_sentences`

Same columns as `content_vocabulary` except no `sort_order`.

### `public.content_alphabet`

| Column | Type | Notes |
|--------|------|-------|
| `lang` | `varchar(10)` | Language code |
| `char` | `text` | The letter character |
| `name` | `text` | English name (e.g. `Alef`) |
| `name_he` | `text` | Hebrew name of the letter |
| `names` | `jsonb` | `{ en, he, ar, ... }` — multilingual names |
| `phonetic` | `text` | Simple phonetic hint (e.g. `"ah"`) |
| `ipa` | `text` | IPA transcription |
| `final_form` | `text` | Hebrew final (sofit) form character |
| `final_form_name` | `text` | Name of the final form |
| `gematria` | `int` | Numeric value (Hebrew only) |
| `memory_hint` | `text` | Mnemonic hint for learners |
| `stroke_hint` | `text` | Writing stroke guidance |
| `sort_order` | `smallint` | Position in alphabet |

### `public.exercises` (hand-crafted remote exercises)

| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` | Primary key — choose a descriptive unique string |
| `type` | `text` | `multiple-choice`, `translate`, `reorder`, `free-write` |
| `category` | `text` | `alphabet`, `vocabulary`, `sentences` |
| `difficulty` | `int` | 1–10 |
| `learning_pair` | `text` | `{native}-{target}` |
| `question` | `text` | Question text (supports `**bold**`) |
| `question_en` | `text` | English version |
| `question_he` | `text` | Hebrew version |
| `correct_answer` | `text` | Exact correct answer |
| `distractors` | `jsonb` | Array of wrong options |
| `reorder_words` | `jsonb` | Words array for reorder exercises |
| `tutor_context` | `text` | Extra context for AI tutor |
| `is_active` | `boolean` | Set to `false` to disable |

---

## Developer guide

### Adding a new language

1. Create `src/data/{xx}AlphabetData.ts` following the pattern of `heAlphabetData.ts`. Export a `{XX}_ALPHABET: LetterData[]` constant.
2. Import it in `scripts/seedContent.ts` and add it to the `alphabets` array in `seedAlphabet()`.
3. Add the language code to `ONBOARDING_LANGUAGE_CODES` in `src/constants/onboardingLanguages.ts`.
4. Add it to `LEARNING_PAIRS` and `SCRIPT_LABELS` in `src/services/remoteContentService.ts`.
5. Run `npm run seed` to populate `content_alphabet`.
6. The app will automatically offer the new alphabet exercises to users who select that target language.

### Adding vocab/sentence content for a non-Hebrew language

Insert rows directly into the DB (Method 1 above). The `buildVocabExercises` function in `remoteContentService.ts` handles non-Hebrew pairs with two exercises per row (MC + translate). No code change is required.

### Modifying exercise generation logic

Exercise generation lives in:

- `src/services/exerciseGenerator.ts` — generates exercises from local data files (offline fallback).
- `src/services/remoteContentService.ts` — generates exercises from DB content tables.

Both must be kept in sync if you change exercise types or question wording conventions.

### TypeScript

```bash
npx tsc --noEmit
```

The project uses strict TypeScript. The `scripts/` directory uses `tsx` to run directly without a separate compilation step.

### Common maintenance tasks

| Task | How |
|------|-----|
| Disable a word that's causing confusion | `UPDATE content_vocabulary SET is_active = false WHERE text_a = '...'` |
| Fix a translation | `UPDATE content_vocabulary SET text_b = '...' WHERE lang_a = 'he' AND text_a = '...'` |
| Change difficulty of a topic | `UPDATE content_vocabulary SET difficulty = 3 WHERE topic = 'medical'` |
| Add a batch of words | Append to `heVocabularyData.ts`, run `npm run seed` |
| Add words in SQL | INSERT with `ON CONFLICT ... DO UPDATE` (Method 1 above) |
| Remove a hand-crafted exercise | `UPDATE exercises SET is_active = false WHERE id = '...'` |
| Re-run full DB setup on a fresh project | Run `supabase/setup_all.sql`, then `npm run seed` |

---

## Deploy to GitHub Pages

```bash
npm run predeploy   # Export to dist/
npm run deploy      # Push dist/ to gh-pages branch
```

Ensure GitHub Pages is configured to serve from branch `gh-pages` / root. The app is live at `https://BARDAMRI.github.io/LinguaAdapt/`.

**How it works:**

- `app.json` sets `experiments.baseUrl` and `web.baseUrl` to `/LinguaAdapt`.
- `predeploy` creates `dist/.nojekyll` so GitHub Pages does not skip the `_expo/` directory.
- `src/navigation/linking.ts` includes the GitHub Pages URL in `prefixes`.

---

## npm scripts

| Command | Description |
|---------|-------------|
| `npm start` / `npx expo start` | Start Expo dev server |
| `npx expo start --web` | Web only |
| `npm run seed` | Seed content tables from local data files (needs `SUPABASE_SERVICE_ROLE_KEY`) |
| `npm run predeploy` | Static web export to `dist/` |
| `npm run deploy` | Publish `dist/` to `gh-pages` branch |
| `npx tsc --noEmit` | Type-check without emitting |
