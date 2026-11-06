# LinguaAdapt

Learn Hebrew (for English speakers) or English (for Hebrew speakers) from zero,
in Expo / React Native for iOS and the web.

The course goes **letters → reading (niqqud / phonics) → words → sentences & phrases**,
with spaced repetition, XP, streaks and a daily goal. It works fully offline in
guest mode; an account is optional and only syncs progress.

---

## Contents

1. [The course](#the-course)
2. [Quick start](#quick-start)
3. [Project layout](#project-layout)
4. [How content is stored and loaded](#how-content-is-stored-and-loaded)
5. [Content pipeline](#content-pipeline)
6. [Sources and licenses](#sources-and-licenses)
7. [Accounts and sync (optional)](#accounts-and-sync-optional)
8. [Web (GitHub Pages)](#web-github-pages)
9. [iOS builds (EAS)](#ios-builds-eas)
10. [App Store checklist](#app-store-checklist)

---

## The course

| Stage | English speakers learning Hebrew (`en-he`) | Hebrew speakers learning English (`he-en`) |
|---|---|---|
| 1. Letters | 22 letters in small groups, 5 final forms, look-alike letters | 26 letters, capital/small, names vs sounds, look-alikes (b d p q …) |
| 2. Reading | Niqqud: kamatz/patach, tsere/segol, chirik, cholam, shuruk/kubutz, shva, chataf; dagesh (b/v, k/kh, p/f) and shin/sin | Phonics: short vowels, sh/ch/th/ph/wh/ck/ng, magic e, vowel teams, r-sounds, soft c/g, silent letters, y |
| 3. Words | ~2,470 words: 871 curated by topic, then the most frequent words | ~2,460 English words with Hebrew meanings |
| 4. Sentences | Phrasebook situations + real sentences that use only words learned so far | same, in the other direction |

Plus: a searchable Hebrew–English **dictionary** (~11.5k entries), **My words**,
a **phrasebook** (169 phrases in 17 situations), a **letter chart**, review of
due items, and "jump here" checkpoints to skip ahead.

Exercise types: teaching cards, multiple choice (text, audio or letter), match
pairs, letter tiles (spelling), word tiles (sentences, dictation), typing with
tolerant grading (no niqqud needed, final letters folded, one-letter typos),
tracing and a syllable builder. Speech uses the voices built into the device
(`expo-speech`).

## Quick start

```bash
npm install
npx expo start          # w = web, i = iOS simulator
```

`.env` is optional. Without it the app runs in guest mode. See
[Accounts and sync](#accounts-and-sync-optional) for the variables.

Checks (run before every commit):

```bash
npm run lint
npm run typecheck
```

## Project layout

```
App.tsx                       providers + navigation
src/
  content/                    content model and bundled own content
    he/letters.ts, he/niqqud.ts   Hebrew letters, finals, vowel signs, dagesh
    en/letters.ts, en/phonics.ts  English letters and spelling patterns
    generated/phrases.json        phrasebook (built from scripts/content)
    packs.ts                      downloads + caches the word/sentence packs
    registry.ts                   item lookup by id
    legal.ts                      credits and privacy text
  course/                     course path (stages, units, lessons) + unlock rules
  engine/                     exercise model, generator, lesson assembly
  progress/                   local progress store, spaced repetition, sync
  components/exercises/       one component per exercise type
  screens/                    Home path, Lesson, Dictionary, Phrasebook, …
  services/                   i18n (en/he UI), TTS, Supabase client
scripts/content/              content pipeline (Python) + sources written for the app
public/content/v1/            generated packs served with the website
supabase/schema.sql           optional backend (profiles, progress, account deletion)
```

RTL: the UI is mirrored by our own styles (`rowDir`, `textStart`) the same way on
every platform; native mirroring is turned off in `services/i18n.ts`.

## How content is stored and loaded

* **In the app bundle** (works offline from the first launch): letters, niqqud,
  phonics, the phrasebook and the course structure for stages 1–2. All of it is
  content written for LinguaAdapt.
* **Downloaded packs** (`public/content/v1/*.json`, ~6 MB): dictionary, course
  words, sentences and the word/sentence units. The app loads them on first use
  from the public website, keeps them on the device (file system on iOS, Cache
  Storage on web) and refreshes them when `manifest.json` changes, so content
  updates need no app release.
  * Web: same site (`/LinguaAdapt/content/v1`).
  * iOS dev builds: the Metro dev server.
  * iOS release builds: `https://bardamri.github.io/LinguaAdapt/content/v1`
    (override with `EXPO_PUBLIC_CONTENT_URL`).
* **Progress** lives on the device (`AsyncStorage`), with spaced repetition per
  item (letter, word, sentence …). When signed in it is mirrored to Supabase.

## Content pipeline

```bash
npm run content:fetch            # download Tatoeba + Wiktionary data to .cache/content
npm run content:build            # build packs (stdlib Python, ~10 s)
# only when new Hebrew lines need vowels:
npm run content:setup-niqqud     # one time: venv + Dicta model (pinned revision)
npm run content:niqqud           # vowel .cache/niqqud-todo.txt into scripts/content/niqqud-cache.json
npm run content:build            # fold the vowels in
```

Sources written for the app: `src/data/heVocabularyData.ts` (curated word list
with topics), `src/data/heSentenceData.ts`, `scripts/content/phrasebook.tsv`,
`scripts/content/emoji.json`.

The build filters out vulgar/offensive dictionary senses and sentences with
violence, alcohol, religion, politics and similar topics, keeps only sentences by
native or near-native Hebrew authors, and assigns each sentence to the first
unit in which all its words have been taught.

## Sources and licenses

| Source | Used for | License | Attribution |
|---|---|---|---|
| [Tatoeba](https://tatoeba.org) | Hebrew–English sentences | CC BY 2.0 FR | Required — Credits screen + `public/content/v1/LICENSE.md`; each sentence keeps its Tatoeba ids |
| [Wiktionary](https://en.wiktionary.org) via [kaikki.org](https://kaikki.org/dictionary/Hebrew/) | dictionary, niqqud, transliteration, gender, plural, root | CC BY-SA 4.0 | Required, and the adapted dictionary is published under CC BY-SA 4.0 (`public/content/v1`) |
| [Dicta DictaBERT-large-char-menaked](https://huggingface.co/dicta-il/dictabert-large-char-menaked) | automatic niqqud for sentences and phrases | CC BY 4.0 | Credited |
| Own content | letters, niqqud, phonics, phrasebook, course order, sounds | — | — |
| Device voices | speech | — | — |

The Wiktionary and Tatoeba data are not inside the app binary; they are
downloaded from the public website where the same files are freely available.

## Accounts and sync (optional)

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Add to `.env`:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```

3. In Supabase → Authentication → URL configuration, add
   `http://localhost:8081/**` and `https://BARDAMRI.github.io/LinguaAdapt/**`.

With the variables set, Settings shows "Sign in or create an account", sign out
and **Delete account** (deletes the auth user, profile and progress — required by
App Store rule 5.1.1(v)). Without them, account options are hidden.

## Web (GitHub Pages)

```bash
npm run deploy:web     # export to dist/ and push to the gh-pages branch
```

The export includes `public/content/v1`, so deploying the web app also publishes
the packs that iOS release builds download.

## iOS builds (EAS)

```bash
npx eas-cli@latest build --platform ios --profile preview-simulator   # simulator .app
npx eas-cli@latest build --platform ios --profile production          # App Store build
```

Local development build: `npx expo run:ios`.

## App Store checklist

* Publish the packs first (`npm run deploy:web`) — release builds load words and
  sentences from GitHub Pages.
* Privacy policy URL: `https://BARDAMRI.github.io/LinguaAdapt/privacy.html`
  (from `public/privacy.html`). App Privacy: no tracking; email + progress only
  if the learner creates an account.
* Credits & licenses are in Settings → Credits.
* `ios.supportsTablet` is on, so App Store Connect asks for iPad screenshots too.
* Submitting (`eas submit`) is a separate, manual step.
