/**
 * One-time content seeding script.
 *
 * Prerequisites:
 *   1. Run supabase/content_tables.sql in the Supabase SQL Editor first.
 *   2. Create a .env file (copy .env.example) and add:
 *        SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
 *      (Supabase Dashboard → Settings → API → service_role)
 *      The EXPO_PUBLIC_SUPABASE_URL from your existing .env is reused.
 *
 * Run:
 *   npm run seed
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

// Import all local content data
import { HE_VOCABULARY } from '../src/data/heVocabularyData';
import { HE_SENTENCES } from '../src/data/heSentenceData';
import { HE_ALPHABET } from '../src/data/heAlphabetData';
import { EN_ALPHABET } from '../src/data/enAlphabetData';
import { AR_ALPHABET } from '../src/data/arAlphabetData';
import { ES_ALPHABET } from '../src/data/esAlphabetData';
import { FR_ALPHABET } from '../src/data/frAlphabetData';
import { RU_ALPHABET } from '../src/data/ruAlphabetData';
import { DE_ALPHABET } from '../src/data/deAlphabetData';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  const missing: string[] = [];
  if (!url) {
    missing.push('EXPO_PUBLIC_SUPABASE_URL (or SUPABASE_URL)');
  }
  if (!key) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }
  console.error(`Missing env vars in .env: ${missing.join(', ')}`);
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const BATCH = 200;

/** Postgres rejects batches where ON CONFLICT would touch the same row twice */
function dedupeRowsForUpsert<T extends Record<string, unknown>>(
  rows: T[],
  conflict: string,
  tableLabel: string,
): T[] {
  const cols = conflict.split(',').map((c) => c.trim()) as (keyof T)[];
  const sep = '\u0001';
  const keyOf = (r: T) => cols.map((c) => `${r[c] ?? ''}`).join(sep);
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const k = keyOf(row);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(row);
  }
  const skipped = rows.length - out.length;
  if (skipped > 0) {
    console.warn(
      `  ⚠ ${tableLabel}: omitted ${skipped} duplicate row(s) for unique (${conflict}); kept first occurrence`,
    );
  }
  return out;
}

async function upsertBatched<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  conflict: string,
): Promise<void> {
  rows = dedupeRowsForUpsert(rows, conflict, table);
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from(table)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(batch as any[], { onConflict: conflict });
    if (error) {
      console.error(`  Error in ${table} batch ${i / BATCH + 1}:`, error.message);
      return;
    }
  }
  console.log(`  ✓ ${rows.length} rows → ${table}`);
}

async function seedVocabulary() {
  const rows = HE_VOCABULARY.map((v, i) => ({
    lang_a: 'he',
    lang_b: 'en',
    text_a: v.he,
    text_b: v.en,
    difficulty: v.difficulty,
    topic: v.topic,
    sort_order: i,
  }));
  await upsertBatched('content_vocabulary', rows, 'lang_a,lang_b,text_a');
}

async function seedSentences() {
  const rows = HE_SENTENCES.map((s) => ({
    lang_a: 'he',
    lang_b: 'en',
    text_a: s.he,
    text_b: s.en,
    difficulty: s.difficulty,
    topic: s.topic,
  }));
  await upsertBatched('content_sentences', rows, 'lang_a,lang_b,text_a');
}

async function seedAlphabet() {
  const alphabets = [
    { lang: 'he', data: HE_ALPHABET },
    { lang: 'en', data: EN_ALPHABET },
    { lang: 'ar', data: AR_ALPHABET },
    { lang: 'es', data: ES_ALPHABET },
    { lang: 'fr', data: FR_ALPHABET },
    { lang: 'ru', data: RU_ALPHABET },
    { lang: 'de', data: DE_ALPHABET },
  ];

  for (const { lang, data } of alphabets) {
    const rows = data.map((l, i) => ({
      lang,
      char: l.char,
      name: l.name,
      name_he: l.nameHe ?? null,
      names: l.names ?? {},
      script_language: l.scriptLanguage ?? lang,
      phonetic: l.phonetic ?? null,
      ipa: l.ipa ?? null,
      final_form: l.finalForm ?? null,
      final_form_name: l.finalFormName ?? null,
      gematria: l.gematria,
      memory_hint: l.memoryHint ?? null,
      stroke_hint: l.strokeHint ?? null,
      sort_order: i,
    }));
    await upsertBatched('content_alphabet', rows, 'lang,char');
  }
}

async function main() {
  console.log('Seeding content tables…');
  await seedVocabulary();
  await seedSentences();
  await seedAlphabet();
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
