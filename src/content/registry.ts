/**
 * Looks up any learnable item by id. Letters, vowels and phonics are bundled;
 * words, sentences and phrases are registered when their packs load.
 */
import { ENGLISH_LETTERS } from './en/letters';
import { PHONICS_PATTERNS } from './en/phonics';
import { HEBREW_FINAL_LETTERS, HEBREW_LETTERS, type FinalLetter } from './he/letters';
import { NIQQUD_SIGNS, READING_MARKS, type ReadingMark } from './he/niqqud';
import type {
  EnglishLetter,
  HebrewLetter,
  NiqqudSign,
  PhonicsPattern,
  Phrase,
  Sentence,
  Word,
} from './types';

export type AnyItem =
  | { kind: 'he-letter'; data: HebrewLetter }
  | { kind: 'he-final'; data: FinalLetter }
  | { kind: 'he-vowel'; data: NiqqudSign }
  | { kind: 'he-mark'; data: ReadingMark }
  | { kind: 'en-letter'; data: EnglishLetter }
  | { kind: 'en-phonics'; data: PhonicsPattern }
  | { kind: 'word'; data: Word }
  | { kind: 'sentence'; data: Sentence }
  | { kind: 'phrase'; data: Phrase };

export type ItemKind = AnyItem['kind'];

const items = new Map<string, AnyItem>();

function add(item: AnyItem): void {
  items.set(item.data.id, item);
}

HEBREW_LETTERS.forEach((data) => add({ kind: 'he-letter', data }));
HEBREW_FINAL_LETTERS.forEach((data) => add({ kind: 'he-final', data }));
NIQQUD_SIGNS.forEach((data) => add({ kind: 'he-vowel', data }));
READING_MARKS.forEach((data) => add({ kind: 'he-mark', data }));
ENGLISH_LETTERS.forEach((data) => add({ kind: 'en-letter', data }));
PHONICS_PATTERNS.forEach((data) => add({ kind: 'en-phonics', data }));

export function getItem(id: string): AnyItem | undefined {
  return items.get(id);
}

export function registerWords(list: Word[]): void {
  for (const data of list) add({ kind: 'word', data });
}

export function registerSentences(list: Sentence[]): void {
  for (const data of list) add({ kind: 'sentence', data });
}

export function registerPhrases(list: Phrase[]): void {
  for (const data of list) add({ kind: 'phrase', data });
}

export function itemsOfKind<K extends ItemKind>(kind: K): Extract<AnyItem, { kind: K }>[] {
  const out: Extract<AnyItem, { kind: K }>[] = [];
  for (const it of items.values()) {
    if (it.kind === kind) out.push(it as Extract<AnyItem, { kind: K }>);
  }
  return out;
}

export function countItems(kind: ItemKind): number {
  let n = 0;
  for (const it of items.values()) if (it.kind === kind) n++;
  return n;
}
