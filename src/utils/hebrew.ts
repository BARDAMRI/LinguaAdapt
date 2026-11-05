/**
 * Hebrew / mixed-script text helpers: niqqud handling, final letters,
 * script detection and tolerant answer comparison.
 */

/** Niqqud, dagesh, shin/sin dots, rafe and cantillation marks (U+0591–U+05C7). */
const HEBREW_MARKS = /[֑-ֽֿ-ׇׂׅׄ]/g;
const HEBREW_LETTER = /[א-ת]/;
const LATIN_LETTER = /[A-Za-z]/;

const FINAL_TO_REGULAR: Record<string, string> = {
  ך: 'כ',
  ם: 'מ',
  ן: 'נ',
  ף: 'פ',
  ץ: 'צ',
};

export const REGULAR_TO_FINAL: Record<string, string> = {
  כ: 'ך',
  מ: 'ם',
  נ: 'ן',
  פ: 'ף',
  צ: 'ץ',
};

export function hasHebrew(s: string): boolean {
  return HEBREW_LETTER.test(s);
}

export function hasLatin(s: string): boolean {
  return LATIN_LETTER.test(s);
}

/** Text direction for a string, decided by its first strong character. */
export function textDirection(s: string): 'rtl' | 'ltr' {
  for (const ch of s) {
    if (HEBREW_LETTER.test(ch)) return 'rtl';
    if (LATIN_LETTER.test(ch)) return 'ltr';
  }
  return 'ltr';
}

/** Removes vowel points and other marks, keeping the letters. */
export function stripNiqqud(s: string): string {
  return s.normalize('NFD').replace(HEBREW_MARKS, '').normalize('NFC');
}

/** Maps final forms (ך ם ן ף ץ) to their regular letters. */
export function unfinal(s: string): string {
  return s.replace(/[ךםןףץ]/g, (ch) => FINAL_TO_REGULAR[ch] ?? ch);
}

/** Puts the correct final form on the last letter of each word. */
export function applyFinalForms(s: string): string {
  return s.replace(/([כמנפצ])(?=$|[\s.,!?;:"'״׳)\-])/g, (ch) => REGULAR_TO_FINAL[ch] ?? ch);
}

/** Splits a (possibly vowelled) Hebrew string into graphemes: letter + its marks. */
export function hebrewGraphemes(s: string): string[] {
  const out: string[] = [];
  for (const ch of s.normalize('NFC')) {
    if (out.length > 0 && /[֑-ׇ]/.test(ch) && ch !== '־' && ch !== '׀' && ch !== '׃' && ch !== '׆') {
      out[out.length - 1] += ch;
    } else {
      out.push(ch);
    }
  }
  return out;
}

const PUNCTUATION = /[.,!?;:"“”„'’`´()\[\]{}\-–—…״׳־/\\]/g;

/**
 * Canonical form for comparing typed answers: no niqqud, no punctuation,
 * no case, collapsed spaces, final letters folded, common contractions expanded.
 */
export function normalizeAnswer(s: string): string {
  let t = stripNiqqud(s).normalize('NFKC').toLowerCase();
  t = t
    .replace(/[’`´]/g, "'")
    .replace(/\b(i)'m\b/g, '$1 am')
    .replace(/\b(\w+)'re\b/g, '$1 are')
    .replace(/\b(\w+)'ll\b/g, '$1 will')
    .replace(/\b(\w+)'ve\b/g, '$1 have')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\b(\w+)n't\b/g, '$1 not')
    .replace(/\b(it|that|what|he|she|there|here)'s\b/g, '$1 is');
  t = t.replace(PUNCTUATION, ' ');
  t = unfinal(t);
  return t.replace(/\s+/g, ' ').trim();
}

/** Levenshtein distance, capped for speed. */
export function editDistance(a: string, b: string, cap = 4): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  const prev = new Array(b.length + 1);
  const cur = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > cap) return cap + 1;
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
}

export type AnswerVerdict = 'correct' | 'typo' | 'wrong';

/**
 * Compares a typed answer with every accepted answer.
 * One wrong letter in a word of 5+ letters (two in 10+) counts as a typo:
 * accepted, but the learner is shown the exact spelling.
 */
export function gradeTypedAnswer(given: string, accepted: string[]): AnswerVerdict {
  const g = normalizeAnswer(given);
  if (!g) return 'wrong';
  let best: AnswerVerdict = 'wrong';
  for (const raw of accepted) {
    const a = normalizeAnswer(raw);
    if (!a) continue;
    if (g === a) return 'correct';
    const allowed = a.length >= 10 ? 2 : a.length >= 5 ? 1 : 0;
    if (allowed > 0 && editDistance(g, a, allowed) <= allowed) best = 'typo';
  }
  return best;
}

/**
 * Splits a gloss like "hello / peace; hi" or "to eat (food)" into the
 * separate answers a learner may type.
 */
export function glossVariants(gloss: string): string[] {
  const parts = gloss
    .split(/[\/;,]| or /)
    .map((p) => p.trim())
    .filter(Boolean);
  const out = new Set<string>();
  for (const p of parts) {
    out.add(p);
    const noParen = p.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    if (noParen) out.add(noParen);
    const noTo = noParen.replace(/^to\s+/i, '');
    if (noTo) out.add(noTo);
    const noArticle = noParen.replace(/^(a|an|the)\s+/i, '');
    if (noArticle) out.add(noArticle);
  }
  return [...out];
}
