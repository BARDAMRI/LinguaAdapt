/**
 * Every text the app can speak, grouped by category (most important first).
 * Mirrors the speak() call sites in src/engine/generate.ts, the exercise views
 * and the dictionary / phrasebook / chart screens. A text missing here is not
 * an error: the app falls back to the device voice for it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanSpeech, type ClipLang } from '../../src/audio/text';
import { ENGLISH_LETTERS } from '../../src/content/en/letters';
import { PHONICS_PATTERNS } from '../../src/content/en/phonics';
import { HEBREW_FINAL_LETTERS, HEBREW_LETTERS } from '../../src/content/he/letters';
import { NIQQUD_SIGNS, READING_MARKS, SYLLABLE_CONSONANTS, buildSyllable } from '../../src/content/he/niqqud';

export type CatalogItem = { lang: ClipLang; text: string; category: string };

export const CATEGORIES = ['core', 'phrases', 'course-words', 'lesson-sentences', 'sentences', 'dictionary'] as const;
export type Category = (typeof CATEGORIES)[number];

type PackWord = { he: string; heNiqqud?: string; en: string };
type PackSentence = { he: string; heNiqqud?: string; en: string };
type Phrase = { he: string; heNiqqud?: string; en: string };

const ROOT = join(__dirname, '..', '..');
const PACKS = join(ROOT, 'public', 'content', 'v1');

function json<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export function buildCatalog(): CatalogItem[] {
  const out: CatalogItem[] = [];
  const seen = new Set<string>();
  const add = (category: Category, lang: ClipLang, text: string | undefined | null) => {
    if (!text) return;
    const clean = cleanSpeech(text);
    if (!clean) return;
    const k = `${lang}|${clean}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ lang, text: clean, category });
  };

  // ── core: letters, final forms, vowel signs, reading marks, phonics ──
  for (const l of HEBREW_LETTERS) {
    add('core', 'he', l.nameHe);
    add('core', 'he', l.sampleSyllable);
    add('core', 'he', l.example.he);
  }
  for (const f of HEBREW_FINAL_LETTERS) {
    add('core', 'he', f.nameHe);
    add('core', 'he', f.example.he);
  }
  for (const s of NIQQUD_SIGNS) {
    add('core', 'he', s.nameHe);
    s.syllables.forEach((x) => add('core', 'he', x));
    s.words.forEach((w) => add('core', 'he', w.he));
    for (const c of SYLLABLE_CONSONANTS) add('core', 'he', buildSyllable(c, s));
  }
  for (const m of READING_MARKS) {
    for (const p of m.pairs) {
      add('core', 'he', p.with.he);
      add('core', 'he', p.without.he);
    }
  }
  for (const l of ENGLISH_LETTERS) {
    add('core', 'en', l.upper);
    add('core', 'en', l.example.en);
  }
  for (const p of PHONICS_PATTERNS) p.words.forEach((w) => add('core', 'en', w.en));

  // ── phrasebook ──
  const phrases = json<{ phrases: Phrase[] }>(join(ROOT, 'src', 'content', 'generated', 'phrases.json')).phrases;
  for (const p of phrases) {
    add('phrases', 'he', p.heNiqqud || p.he);
    add('phrases', 'en', p.en);
  }

  // ── course words: Hebrew for English speakers, English for Hebrew speakers ──
  for (const w of json<PackWord[]>(join(PACKS, 'words-en-he.json'))) add('course-words', 'he', w.heNiqqud || w.he);
  for (const w of json<PackWord[]>(join(PACKS, 'words-he-en.json'))) add('course-words', 'en', w.en);

  // ── sentences: those taught in lessons first, then the dictionary examples ──
  const sentences = json<(PackSentence & { id: string })[]>(join(PACKS, 'sentences.json'));
  const inLessons = new Set<string>();
  for (const pair of ['en-he', 'he-en']) {
    const course = json<{ sentenceUnits: { lessons: { itemIds: string[] }[] }[] }>(join(PACKS, `course-${pair}.json`));
    for (const u of course.sentenceUnits) for (const l of u.lessons) l.itemIds.forEach((id) => inLessons.add(id));
  }
  for (const s of sentences.filter((x) => inLessons.has(x.id))) {
    add('lesson-sentences', 'he', s.heNiqqud || s.he);
    add('lesson-sentences', 'en', s.en);
  }
  for (const s of sentences) {
    add('sentences', 'he', s.heNiqqud || s.he);
    add('sentences', 'en', s.en);
  }

  // ── the rest of the dictionary ──
  for (const w of json<PackWord[]>(join(PACKS, 'dictionary.json'))) {
    add('dictionary', 'he', w.heNiqqud || w.he);
    add('dictionary', 'en', w.en);
  }
  return out;
}

if (require.main === module) {
  const items = buildCatalog();
  const rows: Record<string, { n: number; chars: number }> = {};
  for (const it of items) {
    const k = `${it.category} ${it.lang}`;
    rows[k] ??= { n: 0, chars: 0 };
    rows[k].n += 1;
    rows[k].chars += it.text.length;
  }
  let total = 0;
  for (const [k, v] of Object.entries(rows)) {
    total += v.chars;
    console.log(`${k.padEnd(18)} ${String(v.n).padStart(6)} clips ${String(v.chars).padStart(8)} chars`);
  }
  console.log(`${'total'.padEnd(18)} ${String(items.length).padStart(6)} clips ${String(total).padStart(8)} chars`);
}
