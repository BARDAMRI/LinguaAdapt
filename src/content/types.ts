/** Shapes of learnable items. Every item has a stable `id` used by progress/SRS. */

export type PairId = 'en-he' | 'he-en';
/** Language being learned in a pair. */
export function targetOf(pair: PairId): 'he' | 'en' {
  return pair === 'en-he' ? 'he' : 'en';
}
/** Learner's own language in a pair. */
export function nativeOf(pair: PairId): 'he' | 'en' {
  return pair === 'en-he' ? 'en' : 'he';
}

export type ExampleWord = {
  he: string; // with niqqud
  translit: string;
  en: string;
  emoji: string;
};

export type HebrewLetter = {
  id: string; // he:letter:<char>
  char: string;
  nameEn: string;
  nameHe: string; // vowelled, also what TTS says
  translitName: string;
  /** What it sounds like, explained to an English speaker. */
  soundEn: string;
  /** Short sound label shown on tiles, e.g. "b / v". */
  soundShort: string;
  /** A syllable TTS can read to demonstrate the sound, e.g. "בָּ". */
  sampleSyllable: string;
  example: ExampleWord;
  memoryHintEn: string;
  finalForm?: string;
  /** Letters that are easy to confuse with this one. */
  lookalikes?: string[];
};

export type EnglishLetter = {
  id: string; // en:letter:<upper>
  upper: string;
  lower: string;
  name: string; // "ay"
  nameHe: string; // how the name sounds, in Hebrew letters
  isVowel: boolean;
  /** Sound explained to a Hebrew speaker. */
  soundHe: string;
  soundShort: string; // e.g. "ב"
  example: { en: string; he: string; emoji: string };
  lookalikes?: string[];
};

export type NiqqudSign = {
  id: string; // he:vowel:<key>
  key: string;
  /** Combining mark(s) to put after a letter. For shuruk/cholam male this is a full letter sequence. */
  mark: string;
  nameHe: string;
  nameEn: string;
  /** Vowel sound: a, e, i, o, u, or '' for shva nach. */
  sound: string;
  explainEn: string;
  /** Syllables to show/read, each fully vowelled. */
  syllables: string[];
  words: ExampleWord[];
};

export type PhonicsPattern = {
  id: string; // en:phon:<key>
  key: string;
  /** The spelling pattern as shown, e.g. "sh", "a_e", "ee". */
  pattern: string;
  /** Sound explained to a Hebrew speaker. */
  explainHe: string;
  /** Hebrew approximation, e.g. "ש". */
  soundHe: string;
  words: { en: string; he: string; emoji: string }[];
};

export type Word = {
  id: string; // w:<n>
  he: string; // plain
  heNiqqud: string;
  translit: string;
  en: string; // main gloss
  enAlt?: string[]; // other accepted answers
  pos?: 'noun' | 'verb' | 'adj' | 'adv' | 'pron' | 'prep' | 'conj' | 'num' | 'intj' | 'phrase' | 'other';
  gender?: 'm' | 'f' | 'mf';
  plural?: string; // vowelled
  root?: string;
  topic?: string;
  emoji?: string;
  /** 1 = most common. */
  rank?: number;
};

export type Sentence = {
  id: string; // s:<n>
  he: string;
  heNiqqud?: string;
  en: string;
  /** 1 (easiest) … 10 */
  level: number;
  /** Word ids the sentence uses (when known). */
  words?: string[];
  /** Attribution: Tatoeba sentence ids [he, en], or own content. */
  source?: { kind: 'tatoeba'; he: number; en: number } | { kind: 'own' };
};

export type Phrase = {
  id: string; // p:<situation>:<n>
  situation: string;
  he: string;
  heNiqqud: string;
  translit: string;
  en: string;
  noteEn?: string;
  noteHe?: string;
};
