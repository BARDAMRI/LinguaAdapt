/**
 * Pure helpers shared by the app and scripts/audio (no React Native imports):
 * how a text is cleaned before speaking, how lone syllables are spelled for a
 * speech engine, and the file key of a recorded clip.
 */

export type ClipLang = 'he' | 'en';

const POINTED_VOWEL = /[ְ-ׇֻ]/;

/** Text exactly as it is spoken and keyed: no markdown bold, single spaces, NFC. */
export function cleanSpeech(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim().normalize('NFC');
}

/**
 * A lone consonant with a vowel sign (בָּ, בִּ, בֹּ…) is read badly by speech engines:
 * they spell the sign or skip it. Spoken Hebrew writes open syllables with a
 * silent ending letter (בָּה, בִּי, בּוֹ, בּוּ), which every voice reads correctly.
 */
export function spokenHebrew(text: string): string {
  const t = text.trim();
  const base = t.replace(/[֑-ׇ]/g, '');
  if (base.length !== 1 || !POINTED_VOWEL.test(t)) return t;
  if (/[ִ]/.test(t)) return `${t}י`; // hiriq → i
  if (/[ֹֺ]/.test(t)) return `${t.replace(/[ֹֺ]/g, '')}וֹ`; // holam → o
  if (/[ֻ]/.test(t)) return `${t.replace(/[ֻ]/g, '')}וּ`; // kubutz → u
  if (/[ֳׇ]/.test(t)) return `${t.replace(/[ֳׇ]/g, '')}וֹ`; // hataf kamatz / kamatz katan → o
  if (/[ְ]/.test(t)) return `${t.replace(/[ְ]/g, 'ֶ')}ה`; // shva na → short e
  return `${t}ה`; // a / e sounds
}

/** 53-bit string hash (cyrb53), stable across JS engines. */
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** File key of the recorded clip for this text, e.g. "f3a9c01b2d4e5". */
export function clipKey(lang: ClipLang, text: string): string {
  return cyrb53(`${lang}|${cleanSpeech(text)}`).toString(36);
}
