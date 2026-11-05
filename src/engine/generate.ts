/**
 * Turns course items into exercises. Every item kind knows how to teach
 * itself, a few practice variants of growing difficulty, and a match pair.
 */
import { ENGLISH_LETTERS } from '../content/en/letters';
import { PHONICS_PATTERNS } from '../content/en/phonics';
import { HEBREW_FINAL_LETTERS, HEBREW_LETTERS } from '../content/he/letters';
import { NIQQUD_SIGNS, SYLLABLE_CONSONANTS, buildSyllable } from '../content/he/niqqud';
import { getItem, itemsOfKind, type AnyItem } from '../content/registry';
import type { PairId, Phrase, Sentence, Word } from '../content/types';
import type { LessonKind } from '../course/types';
import { t } from '../services/i18n';
import { glossVariants, stripNiqqud } from '../utils/hebrew';
import type {
  ChoiceExercise,
  Display,
  Exercise,
  Lang,
  MatchExercise,
  Option,
  TilesExercise,
} from './types';

export type GenContext = {
  pair: PairId;
  kind: LessonKind | 'review' | 'checkpoint';
  /** Items of the same lesson: preferred as distractors (the learner knows them). */
  peers?: string[];
};

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${++seq}`;

export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomOf<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Picks `n` items from `pool` that are not `exclude`, preferring `prefer` first. */
function distractors<T>(pool: readonly T[], n: number, isSame: (x: T) => boolean, prefer: readonly T[] = [], key: (x: T) => string = (x) => String(x)): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of [...shuffle(prefer), ...shuffle(pool)]) {
    if (out.length >= n) break;
    const k = key(x);
    if (isSame(x) || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function choice(
  itemId: string,
  instruction: string,
  prompt: Display | null,
  correct: Display,
  wrong: Display[],
  opts: { audio?: ChoiceExercise['audio']; layout?: 'grid' | 'list'; reveal?: Display } = {},
): ChoiceExercise {
  const all: Option[] = shuffle([
    { id: 'correct', display: correct },
    ...wrong.map((d, i) => ({ id: `w${i}`, display: d })),
  ]);
  return {
    id: uid('ch'),
    type: 'choice',
    itemId,
    instruction,
    prompt,
    audio: opts.audio,
    options: all,
    correctId: 'correct',
    layout: opts.layout ?? (all.every((o) => o.display.text.length <= 6) ? 'grid' : 'list'),
    reveal: opts.reveal ?? correct,
  };
}

const he = (text: string, extra: Partial<Display> = {}): Display => ({ text, lang: 'he', ...extra });
const en = (text: string, extra: Partial<Display> = {}): Display => ({ text, lang: 'en', ...extra });
const glyph = (text: string, lang: Lang): Display => ({ text, lang, size: 'glyph', keepNiqqud: true });

function langName(lang: Lang): string {
  return lang === 'he' ? t('ex.langHe') : t('ex.langEn');
}

/** Sentence → tokens for word tiles (punctuation removed, apostrophes kept). */
export function tokenize(s: string): string[] {
  return s
    .split(/\s+/)
    .map((w) => w.replace(/^[.,!?;:"“”„()…]+|[.,!?;:"“”„()…]+$/g, ''))
    .filter(Boolean);
}

// ───────────────────────────────────────────────────────── Hebrew letters ──

const heLetters = HEBREW_LETTERS;

function heLetterTeach(item: Extract<AnyItem, { kind: 'he-letter' }>): Exercise[] {
  const l = item.data;
  const rows = [
    { label: t('teach.name'), value: en(l.nameEn, { note: l.nameHe, noteLang: 'he' }) },
    { label: t('teach.sound'), value: en(l.soundEn) },
  ];
  if (l.finalForm) {
    rows.push({ label: t('teach.finalForm'), value: he(l.finalForm, { size: 'big' }) });
  }
  return [
    {
      id: uid('teach'),
      type: 'teach',
      itemId: l.id,
      teach: {
        badge: t('teach.letter'),
        glyph: glyph(l.char, 'he'),
        rows,
        examples: [he(l.example.he, { keepNiqqud: true, translit: l.example.translit, note: l.example.en, noteLang: 'en', emoji: l.example.emoji, speak: { text: l.example.he, lang: 'he' } })],
        tip: { text: l.memoryHintEn, lang: 'en' },
        speak: [{ text: l.nameHe, lang: 'he' }, { text: l.sampleSyllable, lang: 'he' }],
        compare: l.lookalikes?.map((c) => glyph(c, 'he')),
      },
    },
  ];
}

function heLetterPractice(item: Extract<AnyItem, { kind: 'he-letter' }>, ctx: GenContext, level: number): Exercise {
  const l = item.data;
  const preferLetters = heLetters.filter((x) => l.lookalikes?.includes(x.char) || ctx.peers?.includes(x.id));
  const others = distractors(heLetters, 3, (x) => x.char === l.char, preferLetters, (x) => x.char);
  if (ctx.kind === 'he-lookalikes') {
    const look = l.lookalikes ?? [];
    const pool = [...look, ...shuffle(heLetters.map((x) => x.char))].filter((c, i, a) => c !== l.char && a.indexOf(c) === i).slice(0, 3);
    return choice(l.id, t('ex.findLetter', { name: l.nameEn }), null, glyph(l.char, 'he'), pool.map((c) => glyph(c, 'he')), {
      audio: { text: l.nameHe, lang: 'he' },
      layout: 'grid',
    });
  }
  const variant = level === 0 ? 0 : level === 1 ? randomOf([1, 2]) : randomOf([0, 1, 2]);
  if (variant === 1) {
    return choice(l.id, t('ex.tapLetterYouHear'), null, glyph(l.char, 'he'), others.map((x) => glyph(x.char, 'he')), {
      audio: { text: l.nameHe, lang: 'he' },
      layout: 'grid',
      reveal: en(l.nameEn, { note: l.char, noteLang: 'he' }),
    });
  }
  if (variant === 2 && l.soundShort !== 'silent') {
    const soundOthers = others.filter((x) => x.soundShort !== l.soundShort && x.soundShort !== 'silent');
    if (soundOthers.length >= 2) {
      return choice(l.id, t('ex.whichMakesSound', { sound: l.soundShort }), null, glyph(l.char, 'he'), soundOthers.map((x) => glyph(x.char, 'he')), {
        layout: 'grid',
        reveal: en(`${l.char} — ${l.nameEn}`),
      });
    }
  }
  return choice(
    l.id,
    t('ex.whichLetter'),
    glyph(l.char, 'he'),
    en(l.nameEn, { note: l.soundShort }),
    others.map((x) => en(x.nameEn, { note: x.soundShort })),
    { layout: 'grid' },
  );
}

// ──────────────────────────────────────────────────────── Final letters ──

function heFinalTeach(item: Extract<AnyItem, { kind: 'he-final' }>): Exercise[] {
  const f = item.data;
  return [
    {
      id: uid('teach'),
      type: 'teach',
      itemId: f.id,
      teach: {
        badge: t('teach.finalForm'),
        glyph: glyph(f.char, 'he'),
        title: he(f.nameHe, { keepNiqqud: true, note: f.nameEn, noteLang: 'en' }),
        rows: [{ label: t('teach.letter'), value: en(t('teach.finalExplain', { base: f.baseChar, final: f.char })) }],
        examples: [he(f.example.he, { keepNiqqud: true, translit: f.example.translit, note: f.example.en, noteLang: 'en', emoji: f.example.emoji, speak: { text: f.example.he, lang: 'he' } })],
        speak: [{ text: f.nameHe, lang: 'he' }, { text: f.example.he, lang: 'he' }],
        compare: [glyph(f.baseChar, 'he'), glyph(f.char, 'he')],
      },
    },
  ];
}

function heFinalPractice(item: Extract<AnyItem, { kind: 'he-final' }>, _ctx: GenContext, level: number): Exercise {
  const f = item.data;
  const others = distractors(HEBREW_FINAL_LETTERS, 3, (x) => x.char === f.char, [], (x) => x.char);
  const variant = level === 0 ? 0 : randomOf([0, 1, 2]);
  if (variant === 1) {
    const plain = stripNiqqud(f.example.he);
    const wrong = plain.slice(0, -1) + f.baseChar;
    return choice(f.id, t('ex.whichFinal'), null, he(plain, { size: 'big', note: f.example.en, noteLang: 'en' }), [he(wrong, { size: 'big', note: f.example.en, noteLang: 'en' })], {
      layout: 'grid',
      audio: { text: f.example.he, lang: 'he' },
    });
  }
  if (variant === 2) {
    return choice(
      f.id,
      t('ex.whichWordHeard'),
      null,
      he(f.example.he, { keepNiqqud: true, size: 'big', translit: f.example.translit }),
      others.map((x) => he(x.example.he, { keepNiqqud: true, size: 'big', translit: x.example.translit })),
      { audio: { text: f.example.he, lang: 'he' }, layout: 'grid' },
    );
  }
  return choice(f.id, t('ex.finalOf', { letter: f.baseChar }), null, glyph(f.char, 'he'), others.map((x) => glyph(x.char, 'he')), { layout: 'grid' });
}

// ──────────────────────────────────────────────────────────── Niqqud ──

const CONSONANT_TRANSLIT: Record<string, string> = { מ: 'm', ל: 'l', נ: 'n', ס: 's', ר: 'r', 'שׁ': 'sh' };
const VOWEL_SOUNDS = ['a', 'e', 'i', 'o', 'u'];

function soundLabel(cons: string, sound: string): string {
  return `${CONSONANT_TRANSLIT[cons] ?? ''}${sound}`;
}

/** A representative sign for each vowel sound, used to build distractor syllables. */
function signForSound(sound: string) {
  return NIQQUD_SIGNS.find((s) => s.sound === sound && s.key !== 'chataf')!;
}

function heVowelTeach(item: Extract<AnyItem, { kind: 'he-vowel' }>): Exercise[] {
  const s = item.data;
  const sample = buildSyllable('מ', s);
  return [
    {
      id: uid('teach'),
      type: 'teach',
      itemId: s.id,
      teach: {
        badge: t('teach.vowel'),
        glyph: glyph(s.key === 'chataf' ? 'אֲ' : sample, 'he'),
        title: he(s.nameHe, { keepNiqqud: true, note: s.nameEn, noteLang: 'en' }),
        rows: [{ label: t('teach.sound'), value: en(s.explainEn) }],
        examples: [
          ...s.syllables.map((syl) => he(syl, { keepNiqqud: true, size: 'big', speak: { text: syl, lang: 'he' } })),
          ...s.words.map((w) => he(w.he, { keepNiqqud: true, translit: w.translit, note: w.en, noteLang: 'en', emoji: w.emoji, speak: { text: w.he, lang: 'he' } })),
        ],
        speak: [{ text: s.syllables[0], lang: 'he' }, { text: s.words[0].he, lang: 'he' }],
      },
    },
    { id: uid('syl'), type: 'syllables', itemId: s.id, instruction: t('ex.buildSyllable'), vowelKey: s.key },
  ];
}

function heVowelPractice(item: Extract<AnyItem, { kind: 'he-vowel' }>, ctx: GenContext, level: number): Exercise {
  const s = item.data;
  const reading = ctx.kind === 'he-read';
  const variant = reading ? randomOf([2, 3]) : level === 0 ? 0 : level === 1 ? randomOf([0, 1]) : randomOf([1, 2, 3]);
  const cons = randomOf(SYLLABLE_CONSONANTS);
  const syl = buildSyllable(cons, s);
  const otherSounds = shuffle(VOWEL_SOUNDS.filter((v) => v !== s.sound)).slice(0, 3);
  if (variant === 0) {
    const correct = s.sound ? soundLabel(cons, s.sound) : soundLabel(cons, '');
    return choice(s.id, t('ex.whatSound'), glyph(syl, 'he'), en(correct), otherSounds.map((v) => en(soundLabel(cons, v))), {
      layout: 'grid',
      reveal: en(correct, { speak: { text: syl, lang: 'he' } }),
    });
  }
  if (variant === 1) {
    return choice(s.id, t('ex.tapSyllableYouHear'), null, glyph(syl, 'he'), otherSounds.map((v) => glyph(buildSyllable(cons, signForSound(v)), 'he')), {
      audio: { text: syl, lang: 'he' },
      layout: 'grid',
    });
  }
  const word = randomOf(s.words);
  const otherWords = distractors(
    NIQQUD_SIGNS.flatMap((x) => x.words),
    3,
    (w) => w.translit === word.translit,
    [],
    (w) => w.translit,
  );
  if (variant === 2) {
    return choice(s.id, t('ex.readWord'), he(word.he, { keepNiqqud: true, size: 'big', emoji: word.emoji }), en(word.translit), otherWords.map((w) => en(w.translit)), {
      layout: 'grid',
      reveal: en(word.translit, { note: word.en, speak: { text: word.he, lang: 'he' } }),
    });
  }
  return choice(s.id, t('ex.whichWordHeard'), null, he(word.he, { keepNiqqud: true, size: 'big' }), otherWords.map((w) => he(w.he, { keepNiqqud: true, size: 'big' })), {
    audio: { text: word.he, lang: 'he' },
    layout: 'grid',
    reveal: he(word.he, { keepNiqqud: true, translit: word.translit, note: word.en, noteLang: 'en' }),
  });
}

function heMarkTeach(item: Extract<AnyItem, { kind: 'he-mark' }>): Exercise[] {
  const m = item.data;
  const p = m.pairs[0];
  return [
    {
      id: uid('teach'),
      type: 'teach',
      itemId: m.id,
      teach: {
        badge: t('teach.tip'),
        glyph: he(m.titleEn.split(' ')[0], { size: 'glyph', keepNiqqud: true }),
        title: en(m.titleEn),
        rows: [{ label: t('teach.sound'), value: en(m.explainEn) }],
        examples: [p.with, p.without].map((w) => he(w.he, { keepNiqqud: true, translit: w.translit, note: w.en, noteLang: 'en', emoji: w.emoji, speak: { text: w.he, lang: 'he' } })),
        speak: [{ text: p.with.he, lang: 'he' }, { text: p.without.he, lang: 'he' }],
      },
    },
  ];
}

function heMarkPractice(item: Extract<AnyItem, { kind: 'he-mark' }>, _ctx: GenContext, level: number): Exercise {
  const m = item.data;
  const p = m.pairs[0];
  const target = Math.random() < 0.5 ? p.with : p.without;
  const other = target === p.with ? p.without : p.with;
  if (level === 0 || Math.random() < 0.5) {
    return choice(m.id, t('ex.whichWordHeard'), null, he(target.he, { keepNiqqud: true, size: 'big' }), [he(other.he, { keepNiqqud: true, size: 'big' })], {
      audio: { text: target.he, lang: 'he' },
      layout: 'grid',
      reveal: he(target.he, { keepNiqqud: true, translit: target.translit, note: target.en, noteLang: 'en' }),
    });
  }
  const extra = distractors(NIQQUD_SIGNS.flatMap((x) => x.words), 2, (w) => w.translit === target.translit || w.translit === other.translit, [], (w) => w.translit);
  return choice(m.id, t('ex.readWord'), he(target.he, { keepNiqqud: true, size: 'big', emoji: target.emoji }), en(target.translit), [en(other.translit), ...extra.map((w) => en(w.translit))], {
    layout: 'grid',
    reveal: en(target.translit, { note: target.en, speak: { text: target.he, lang: 'he' } }),
  });
}

// ─────────────────────────────────────────────────────── English letters ──

function enLetterTeach(item: Extract<AnyItem, { kind: 'en-letter' }>): Exercise[] {
  const l = item.data;
  return [
    {
      id: uid('teach'),
      type: 'teach',
      itemId: l.id,
      teach: {
        badge: t('teach.letter'),
        glyph: glyph(`${l.upper} ${l.lower}`, 'en'),
        rows: [
          { label: t('teach.name'), value: en(l.name, { note: l.nameHe, noteLang: 'he' }) },
          { label: t('teach.sound'), value: he(l.soundHe) },
        ],
        examples: [en(l.example.en, { size: 'big', note: l.example.he, noteLang: 'he', emoji: l.example.emoji, speak: { text: l.example.en, lang: 'en' } })],
        speak: [{ text: l.upper, lang: 'en' }, { text: l.example.en, lang: 'en' }],
        compare: l.lookalikes?.map((c) => glyph(c, 'en')),
      },
    },
  ];
}

function enLetterPractice(item: Extract<AnyItem, { kind: 'en-letter' }>, ctx: GenContext, level: number): Exercise {
  const l = item.data;
  const peers = ENGLISH_LETTERS.filter((x) => ctx.peers?.includes(x.id));
  const others = distractors(ENGLISH_LETTERS, 3, (x) => x.upper === l.upper, peers, (x) => x.upper);
  if (ctx.kind === 'en-lookalikes') {
    const pool = [...(l.lookalikes ?? []), ...shuffle(ENGLISH_LETTERS.map((x) => x.lower))]
      .filter((c, i, a) => c !== l.lower && a.indexOf(c) === i)
      .slice(0, 3);
    return choice(l.id, t('ex.findLetter', { name: l.lower }), null, glyph(l.lower, 'en'), pool.map((c) => glyph(c, 'en')), {
      audio: { text: l.upper, lang: 'en' },
      layout: 'grid',
    });
  }
  const variant = ctx.kind === 'en-case' ? 2 : level === 0 ? 0 : level === 1 ? randomOf([1, 2]) : randomOf([1, 2, 3]);
  if (variant === 1) {
    return choice(l.id, t('ex.tapLetterYouHear'), null, glyph(l.upper, 'en'), others.map((x) => glyph(x.upper, 'en')), {
      audio: { text: l.upper, lang: 'en' },
      layout: 'grid',
      reveal: en(`${l.upper} ${l.lower}`, { note: l.nameHe, noteLang: 'he' }),
    });
  }
  if (variant === 2) {
    const look = ENGLISH_LETTERS.filter((x) => l.lookalikes?.includes(x.lower));
    const lowerOthers = distractors(ENGLISH_LETTERS, 3, (x) => x.upper === l.upper, look, (x) => x.upper);
    return choice(l.id, t('ex.smallOf', { letter: l.upper }), null, glyph(l.lower, 'en'), lowerOthers.map((x) => glyph(x.lower, 'en')), { layout: 'grid' });
  }
  if (variant === 3) {
    const soundOthers = others.filter((x) => x.soundShort !== l.soundShort);
    return choice(l.id, t('ex.whichMakesSound', { sound: l.soundShort }), null, glyph(l.upper, 'en'), soundOthers.map((x) => glyph(x.upper, 'en')), {
      layout: 'grid',
      reveal: en(`${l.upper} ${l.lower}`, { note: l.example.en }),
    });
  }
  return choice(l.id, t('ex.whichLetter'), glyph(l.upper, 'en'), en(l.name, { note: l.nameHe, noteLang: 'he' }), others.map((x) => en(x.name, { note: x.nameHe, noteLang: 'he' })), { layout: 'grid' });
}

// ──────────────────────────────────────────────────────────── Phonics ──

function enPhonicsTeach(item: Extract<AnyItem, { kind: 'en-phonics' }>): Exercise[] {
  const p = item.data;
  return [
    {
      id: uid('teach'),
      type: 'teach',
      itemId: p.id,
      teach: {
        badge: t('teach.pattern'),
        glyph: glyph(p.pattern, 'en'),
        rows: [
          { label: t('teach.sound'), value: he(p.soundHe, { size: 'big', keepNiqqud: true }) },
          { label: t('teach.tip'), value: he(p.explainHe) },
        ],
        examples: p.words.map((w) => en(w.en, { size: 'big', note: w.he, noteLang: 'he', emoji: w.emoji, speak: { text: w.en, lang: 'en' } })),
        speak: [{ text: p.words[0].en, lang: 'en' }],
      },
    },
  ];
}

function spellTiles(itemId: string, word: string, lang: Lang, prompt: Display | null, audio: Display['speak'], instruction: string, reveal: Display): TilesExercise {
  const letters = [...(lang === 'he' ? stripNiqqud(word) : word.toLowerCase())].filter((c) => c.trim());
  const alphabet = lang === 'he' ? HEBREW_LETTERS.map((l) => l.char) : 'abcdefghijklmnopqrstuvwxyz'.split('');
  const extra = shuffle(alphabet.filter((c) => !letters.includes(c))).slice(0, letters.length <= 3 ? 2 : 3);
  return {
    id: uid('tiles'),
    type: 'tiles',
    itemId,
    instruction,
    prompt,
    audio,
    lang,
    answer: letters,
    accepted: [],
    tiles: shuffle([...letters, ...extra]),
    joiner: '',
    reveal,
  };
}

function enPhonicsPractice(item: Extract<AnyItem, { kind: 'en-phonics' }>, _ctx: GenContext, level: number): Exercise {
  const p = item.data;
  const word = randomOf(p.words);
  const otherWords = distractors(
    PHONICS_PATTERNS.filter((x) => x.key !== p.key).flatMap((x) => x.words),
    3,
    (w) => w.en === word.en || p.words.some((pw) => pw.en === w.en),
    [],
    (w) => w.en,
  );
  const variant = level === 0 ? randomOf([0, 3]) : level === 1 ? randomOf([0, 1, 2]) : randomOf([1, 2, 3]);
  const reveal = en(word.en, { note: word.he, noteLang: 'he', emoji: word.emoji, speak: { text: word.en, lang: 'en' } });
  if (variant === 0) {
    return choice(p.id, t('ex.whichSpelling'), null, en(word.en, { size: 'big' }), otherWords.map((w) => en(w.en, { size: 'big' })), {
      audio: { text: word.en, lang: 'en' },
      layout: 'grid',
      reveal,
    });
  }
  if (variant === 1) {
    return choice(p.id, t('ex.whichHasSound', { sound: p.pattern }), null, en(word.en, { size: 'big', emoji: word.emoji }), otherWords.map((w) => en(w.en, { size: 'big', emoji: w.emoji })), {
      layout: 'grid',
      reveal,
    });
  }
  if (variant === 2 && word.en.length <= 8) {
    return spellTiles(p.id, word.en, 'en', he(word.he, { emoji: word.emoji }), { text: word.en, lang: 'en' }, t('ex.spellWord'), reveal);
  }
  return choice(p.id, t('ex.whatMeans'), en(word.en, { size: 'big', speak: { text: word.en, lang: 'en' } }), he(word.he, { emoji: word.emoji }), otherWords.map((w) => he(w.he, { emoji: w.emoji })), {
    audio: { text: word.en, lang: 'en' },
    layout: 'grid',
    reveal,
  });
}

// ─────────────────────────────────────────────────────────────── Words ──

function wordPool(pair: PairId): Word[] {
  const prefix = pair === 'en-he' ? 'w:he:' : 'w:en:';
  return itemsOfKind('word')
    .map((x) => x.data)
    .filter((w) => w.id.startsWith(prefix));
}

function sameMeaning(a: Word, b: Word): boolean {
  return a.id === b.id || a.en.toLowerCase() === b.en.toLowerCase() || stripNiqqud(a.he) === stripNiqqud(b.he);
}

function wordDistractors(w: Word, ctx: GenContext, n = 3): Word[] {
  const pool = wordPool(ctx.pair);
  const peers = new Set(ctx.peers ?? []);
  const near = pool.filter((x) => peers.has(x.id) || (x.topic && x.topic === w.topic && Math.abs((x.rank ?? 0) - (w.rank ?? 0)) < 3000));
  return distractors(pool, n, (x) => sameMeaning(x, w), near, (x) => x.id);
}

function heWordDisplay(w: Word, extra: Partial<Display> = {}): Display {
  return he(w.heNiqqud || w.he, { translit: w.translit, ...extra });
}

function wordTeach(item: Extract<AnyItem, { kind: 'word' }>, ctx: GenContext): Exercise[] {
  const w = item.data;
  const rows: { label: string; value: Display }[] = [];
  if (w.gender) rows.push({ label: t('teach.genderLabel'), value: en(t(`teach.gender.${w.gender}`)) });
  if (w.plural) rows.push({ label: t('teach.plural'), value: he(w.plural, { translit: undefined }) });
  if (ctx.pair === 'en-he') {
    return [
      {
        id: uid('teach'),
        type: 'teach',
        itemId: w.id,
        teach: {
          badge: t('teach.word'),
          glyph: heWordDisplay(w, { size: 'big', emoji: w.emoji }),
          title: en(w.en),
          rows,
          speak: [{ text: w.heNiqqud || w.he, lang: 'he' }],
        },
      },
    ];
  }
  return [
    {
      id: uid('teach'),
      type: 'teach',
      itemId: w.id,
      teach: {
        badge: t('teach.word'),
        glyph: en(w.en, { size: 'big', emoji: w.emoji }),
        title: he(w.he),
        rows: [],
        speak: [{ text: w.en, lang: 'en' }],
      },
    },
  ];
}

function wordPractice(item: Extract<AnyItem, { kind: 'word' }>, ctx: GenContext, level: number): Exercise {
  const w = item.data;
  const others = wordDistractors(w, ctx);
  const variant = level === 0 ? randomOf([0, 1]) : level === 1 ? randomOf([1, 2, 3]) : randomOf([2, 3, 4]);
  if (ctx.pair === 'en-he') {
    const heText = w.heNiqqud || w.he;
    const reveal = heWordDisplay(w, { note: w.en, noteLang: 'en', speak: { text: heText, lang: 'he' } });
    if (variant === 0 || others.length < 2) {
      return choice(w.id, t('ex.whatMeans'), heWordDisplay(w, { size: 'big', speak: { text: heText, lang: 'he' } }), en(w.en, { emoji: w.emoji }), others.map((x) => en(x.en, { emoji: x.emoji })), {
        audio: { text: heText, lang: 'he' },
        reveal,
      });
    }
    if (variant === 1) {
      return choice(w.id, t('ex.howSay', { word: w.en }), w.emoji ? en(w.emoji, { size: 'glyph' }) : null, heWordDisplay(w), others.map((x) => heWordDisplay(x)), { reveal });
    }
    if (variant === 2) {
      return choice(w.id, t('ex.whichWordHeard'), null, he(heText), others.map((x) => he(x.heNiqqud || x.he)), {
        audio: { text: heText, lang: 'he' },
        reveal,
      });
    }
    const plain = stripNiqqud(w.he);
    if (variant === 3 && plain.length >= 2 && plain.length <= 7 && !/\s/.test(plain)) {
      return spellTiles(w.id, plain, 'he', en(w.en, { emoji: w.emoji }), { text: heText, lang: 'he' }, t('ex.spellMeaning', { word: w.en }), reveal);
    }
    return {
      id: uid('type'),
      type: 'type',
      itemId: w.id,
      instruction: t('ex.typeTranslation', { lang: langName('en') }),
      prompt: heWordDisplay(w, { size: 'big', speak: { text: heText, lang: 'he' } }),
      audio: { text: heText, lang: 'he' },
      lang: 'en',
      accepted: [...glossVariants(w.en), ...(w.enAlt ?? []).flatMap(glossVariants)],
      reveal: en(w.en),
    };
  }
  // he-en: the learner studies English.
  const reveal = en(w.en, { note: w.he, noteLang: 'he', emoji: w.emoji, speak: { text: w.en, lang: 'en' } });
  if (variant === 0 || others.length < 2) {
    return choice(w.id, t('ex.whatMeans'), en(w.en, { size: 'big', speak: { text: w.en, lang: 'en' } }), he(w.he, { emoji: w.emoji }), others.map((x) => he(x.he, { emoji: x.emoji })), {
      audio: { text: w.en, lang: 'en' },
      reveal,
    });
  }
  if (variant === 1) {
    return choice(w.id, t('ex.howSay', { word: w.he }), w.emoji ? en(w.emoji, { size: 'glyph' }) : null, en(w.en), others.map((x) => en(x.en)), { reveal });
  }
  if (variant === 2) {
    return choice(w.id, t('ex.whichWordHeard'), null, en(w.en), others.map((x) => en(x.en)), {
      audio: { text: w.en, lang: 'en' },
      reveal,
    });
  }
  if (variant === 3 && w.en.length >= 2 && w.en.length <= 8 && /^[a-z]+$/i.test(w.en)) {
    return spellTiles(w.id, w.en, 'en', he(w.he, { emoji: w.emoji }), { text: w.en, lang: 'en' }, t('ex.spellMeaning', { word: w.he }), reveal);
  }
  return {
    id: uid('type'),
    type: 'type',
    itemId: w.id,
    instruction: t('ex.typeTranslation', { lang: langName('en') }),
    prompt: he(w.he, { size: 'big', emoji: w.emoji }),
    lang: 'en',
    accepted: [w.en, ...(w.enAlt ?? []), ...glossVariants(w.en)],
    reveal,
  };
}

// ─────────────────────────────────────────────────── Sentences & phrases ──

type SentenceLike = { id: string; he: string; heNiqqud?: string; en: string; translit?: string };

function sentencePool(kind: 'sentence' | 'phrase'): SentenceLike[] {
  return itemsOfKind(kind).map((x) => x.data as Sentence | Phrase);
}

function sentenceTiles(s: SentenceLike, target: Lang, prompt: Display | null, audio: Display['speak'], instruction: string, pool: SentenceLike[], reveal: Display): TilesExercise {
  const text = target === 'he' ? s.he : s.en;
  const answer = tokenize(target === 'he' ? stripNiqqud(text) : text);
  const norm = (x: string) => x.toLowerCase();
  const otherTokens = shuffle(
    pool
      .filter((x) => x.id !== s.id)
      .slice(0, 60)
      .flatMap((x) => tokenize(target === 'he' ? stripNiqqud(x.he) : x.en)),
  ).filter((tok, i, a) => !answer.some((aw) => norm(aw) === norm(tok)) && a.indexOf(tok) === i);
  const extra = otherTokens.slice(0, Math.min(3, Math.max(2, Math.ceil(answer.length / 3))));
  return {
    id: uid('tiles'),
    type: 'tiles',
    itemId: s.id,
    instruction,
    prompt,
    audio,
    lang: target,
    answer,
    accepted: [],
    tiles: shuffle([...answer, ...extra]),
    joiner: ' ',
    reveal,
  };
}

function sentenceTeach(item: Extract<AnyItem, { kind: 'sentence' | 'phrase' }>, ctx: GenContext): Exercise[] {
  const s = item.data as SentenceLike & { noteEn?: string; noteHe?: string };
  const isPhrase = item.kind === 'phrase';
  if (ctx.pair === 'en-he') {
    const heText = s.heNiqqud || s.he;
    return [
      {
        id: uid('teach'),
        type: 'teach',
        itemId: s.id,
        teach: {
          badge: isPhrase ? t('teach.phrase') : t('teach.sentence'),
          glyph: he(heText, { size: 'big', translit: s.translit }),
          title: en(s.en),
          rows: s.noteEn ? [{ label: t('teach.tip'), value: en(s.noteEn) }] : [],
          speak: [{ text: heText, lang: 'he' }],
        },
      },
    ];
  }
  return [
    {
      id: uid('teach'),
      type: 'teach',
      itemId: s.id,
      teach: {
        badge: isPhrase ? t('teach.phrase') : t('teach.sentence'),
        glyph: en(s.en, { size: 'big' }),
        title: he(s.he),
        rows: s.noteHe ? [{ label: t('teach.tip'), value: he(s.noteHe) }] : [],
        speak: [{ text: s.en, lang: 'en' }],
      },
    },
  ];
}

function sentencePractice(item: Extract<AnyItem, { kind: 'sentence' | 'phrase' }>, ctx: GenContext, level: number): Exercise {
  const s = item.data as SentenceLike;
  const pool = sentencePool(item.kind);
  const others = distractors(pool, 3, (x) => x.id === s.id || x.en === s.en, [], (x) => x.id);
  const variant = level === 0 ? 0 : level === 1 ? randomOf([1, 2]) : randomOf([1, 2, 3]);
  const heText = s.heNiqqud || s.he;
  if (ctx.pair === 'en-he') {
    const reveal = he(heText, { translit: s.translit, note: s.en, noteLang: 'en', speak: { text: heText, lang: 'he' } });
    if (variant === 0 || others.length < 2) {
      return choice(s.id, t('ex.whatMeans'), he(heText, { size: 'big', translit: s.translit, speak: { text: heText, lang: 'he' } }), en(s.en), others.map((x) => en(x.en)), {
        audio: { text: heText, lang: 'he' },
        layout: 'list',
        reveal,
      });
    }
    if (variant === 1) {
      return sentenceTiles(s, 'he', en(s.en), undefined, t('ex.buildSentence'), pool, reveal);
    }
    if (variant === 2) {
      return sentenceTiles(s, 'he', null, { text: heText, lang: 'he' }, t('ex.buildHeard'), pool, reveal);
    }
    return sentenceTiles(s, 'en', he(heText, { translit: s.translit, speak: { text: heText, lang: 'he' } }), { text: heText, lang: 'he' }, t('ex.buildSentence'), pool, reveal);
  }
  const reveal = en(s.en, { note: s.he, noteLang: 'he', speak: { text: s.en, lang: 'en' } });
  if (variant === 0 || others.length < 2) {
    return choice(s.id, t('ex.whatMeans'), en(s.en, { size: 'big', speak: { text: s.en, lang: 'en' } }), he(s.he), others.map((x) => he(x.he)), {
      audio: { text: s.en, lang: 'en' },
      layout: 'list',
      reveal,
    });
  }
  if (variant === 1) {
    return sentenceTiles(s, 'en', he(s.he), undefined, t('ex.buildSentence'), pool, reveal);
  }
  if (variant === 2) {
    return sentenceTiles(s, 'en', null, { text: s.en, lang: 'en' }, t('ex.buildHeard'), pool, reveal);
  }
  return {
    id: uid('type'),
    type: 'type',
    itemId: s.id,
    instruction: t('ex.typeTranslation', { lang: langName('en') }),
    prompt: he(s.he, { size: 'big' }),
    lang: 'en',
    accepted: [s.en],
    reveal,
  };
}

// ───────────────────────────────────────────────────────────── Dispatch ──

export function teachExercises(item: AnyItem, ctx: GenContext): Exercise[] {
  switch (item.kind) {
    case 'he-letter': return heLetterTeach(item);
    case 'he-final': return heFinalTeach(item);
    case 'he-vowel': return heVowelTeach(item);
    case 'he-mark': return heMarkTeach(item);
    case 'en-letter': return enLetterTeach(item);
    case 'en-phonics': return enPhonicsTeach(item);
    case 'word': return wordTeach(item, ctx);
    case 'sentence': return [];
    case 'phrase': return sentenceTeach(item, ctx);
  }
}

export function practiceExercise(item: AnyItem, ctx: GenContext, level: number): Exercise {
  switch (item.kind) {
    case 'he-letter': return heLetterPractice(item, ctx, level);
    case 'he-final': return heFinalPractice(item, ctx, level);
    case 'he-vowel': return heVowelPractice(item, ctx, level);
    case 'he-mark': return heMarkPractice(item, ctx, level);
    case 'en-letter': return enLetterPractice(item, ctx, level);
    case 'en-phonics': return enPhonicsPractice(item, ctx, level);
    case 'word': return wordPractice(item, ctx, level);
    case 'sentence':
    case 'phrase': return sentencePractice(item, ctx, level);
  }
}

/** Left/right pair for match games, or null when the kind has none. */
function matchPair(item: AnyItem, ctx: GenContext): { left: Display; right: Display } | null {
  switch (item.kind) {
    case 'he-letter': return { left: glyph(item.data.char, 'he'), right: en(item.data.nameEn) };
    case 'he-final': return { left: glyph(item.data.baseChar, 'he'), right: glyph(item.data.char, 'he') };
    case 'he-vowel': {
      const syl = buildSyllable('מ', item.data);
      return { left: he(syl, { keepNiqqud: true, size: 'big' }), right: en(soundLabel('מ', item.data.sound)) };
    }
    case 'en-letter':
      return ctx.kind === 'en-case'
        ? { left: glyph(item.data.upper, 'en'), right: glyph(item.data.lower, 'en') }
        : { left: glyph(item.data.upper, 'en'), right: en(item.data.name, { note: item.data.nameHe, noteLang: 'he' }) };
    case 'en-phonics': {
      const w = item.data.words[0];
      return { left: en(w.en), right: he(w.he, { emoji: w.emoji }) };
    }
    case 'word':
      return ctx.pair === 'en-he'
        ? { left: heWordDisplay(item.data, { translit: undefined }), right: en(item.data.en) }
        : { left: en(item.data.en), right: he(item.data.he) };
    default:
      return null;
  }
}

export function matchExercise(items: AnyItem[], ctx: GenContext): MatchExercise | null {
  const pairs: MatchExercise['pairs'] = [];
  const ids: string[] = [];
  const seenRight = new Set<string>();
  for (const it of shuffle(items)) {
    if (pairs.length >= 5) break;
    const p = matchPair(it, ctx);
    if (!p || seenRight.has(p.right.text) || seenRight.has(`L:${p.left.text}`)) continue;
    seenRight.add(p.right.text);
    seenRight.add(`L:${p.left.text}`);
    pairs.push({ id: it.data.id, ...p });
    ids.push(it.data.id);
  }
  if (pairs.length < 3) return null;
  const instruction =
    ctx.kind === 'en-case' ? t('ex.matchUpperLower') : items[0]?.kind === 'he-letter' || items[0]?.kind === 'en-letter' ? t('ex.matchLetterName') : t('ex.matchPairs');
  return { id: uid('match'), type: 'match', itemIds: ids, instruction, pairs };
}

export function traceExercise(item: AnyItem): Exercise | null {
  if (item.kind === 'he-letter') {
    return { id: uid('trace'), type: 'trace', itemId: item.data.id, instruction: t('ex.traceLetter'), glyph: item.data.char, lang: 'he', speak: { text: item.data.nameHe, lang: 'he' }, label: item.data.nameEn };
  }
  if (item.kind === 'en-letter') {
    return { id: uid('trace'), type: 'trace', itemId: item.data.id, instruction: t('ex.traceLetter'), glyph: item.data.upper, lang: 'en', speak: { text: item.data.upper, lang: 'en' }, label: item.data.name };
  }
  return null;
}

export function resolveItems(ids: string[]): AnyItem[] {
  return ids.map(getItem).filter((x): x is AnyItem => Boolean(x));
}
