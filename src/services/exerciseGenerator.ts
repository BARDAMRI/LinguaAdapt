import type { Exercise, LetterData } from '../../types/learning';
import { HE_ALPHABET } from '../data/heAlphabetData';
import { EN_ALPHABET } from '../data/enAlphabetData';
import { AR_ALPHABET } from '../data/arAlphabetData';
import { ES_ALPHABET } from '../data/esAlphabetData';
import { FR_ALPHABET } from '../data/frAlphabetData';
import { RU_ALPHABET } from '../data/ruAlphabetData';
import { DE_ALPHABET } from '../data/deAlphabetData';
import { HE_VOCABULARY, type VocabEntry } from '../data/heVocabularyData';
import { HE_SENTENCES, type SentenceEntry } from '../data/heSentenceData';

/** Seeded Fisher-Yates shuffle using a simple deterministic seed */
function deterministicShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick `n` unique items from `arr` using seed, excluding `exclude` values */
function pickDistractors(
  all: VocabEntry[],
  excludeEn: string,
  n: number,
  seed: number,
): string[] {
  const candidates = deterministicShuffle(
    all.filter((v) => v.en !== excludeEn),
    seed,
  );
  const result: string[] = [];
  const seen = new Set<string>();
  for (const v of candidates) {
    if (result.length >= n) break;
    if (!seen.has(v.en)) {
      result.push(v.en);
      seen.add(v.en);
    }
  }
  return result;
}

function pickHeDistractors(
  all: VocabEntry[],
  excludeHe: string,
  n: number,
  seed: number,
): string[] {
  const candidates = deterministicShuffle(
    all.filter((v) => v.he !== excludeHe),
    seed,
  );
  const result: string[] = [];
  const seen = new Set<string>();
  for (const v of candidates) {
    if (result.length >= n) break;
    if (!seen.has(v.he)) {
      result.push(v.he);
      seen.add(v.he);
    }
  }
  return result;
}

export function generateVocabularyExercises(): Exercise[] {
  const exercises: Exercise[] = [];

  HE_VOCABULARY.forEach((entry, idx) => {
    const diff = Math.min(10, Math.max(1, entry.difficulty * 2));

    // 1. He → En multiple choice
    exercises.push({
      id: `gen-voc-mc-he-${idx}`,
      type: 'multiple-choice',
      learningPair: 'en-he',
      difficulty: diff,
      category: 'vocabulary',
      question: `מה המשמעות של **${entry.he}**?`,
      questionEn: `What does **${entry.he}** mean?`,
      correctAnswer: entry.en,
      distractors: pickDistractors(HE_VOCABULARY, entry.en, 3, idx * 31 + 7),
    });

    // 2. En → He multiple choice
    exercises.push({
      id: `gen-voc-mc-en-${idx}`,
      type: 'multiple-choice',
      learningPair: 'en-he',
      difficulty: diff,
      category: 'vocabulary',
      question: `How do you say **${entry.en}** in Hebrew?`,
      questionHe: `איך אומרים **${entry.en}** בעברית?`,
      correctAnswer: entry.he,
      distractors: pickHeDistractors(HE_VOCABULARY, entry.he, 3, idx * 53 + 13),
    });

    // 3. En → He translate
    exercises.push({
      id: `gen-voc-tr-${idx}`,
      type: 'translate',
      learningPair: 'en-he',
      difficulty: Math.min(10, diff + 1),
      category: 'vocabulary',
      question: `כתבו בעברית: **${entry.en}**`,
      questionEn: `Write in Hebrew: **${entry.en}**`,
      correctAnswer: entry.he,
      distractors: [],
    });
  });

  return exercises;
}

/**
 * Generic letter-trace exercise generator for any alphabet and language pair.
 * nativeLang is used to pick the question/hint text language.
 */
function generateLetterTraceForAlphabet(
  alphabet: LetterData[],
  learningPair: string,
  scriptLabel: string,
): Exercise[] {
  const allNames = alphabet.map((l) => l.name);

  return alphabet.map((letter) => {
    const otherNames = allNames.filter((n) => n !== letter.name);
    const distractors = deterministicShuffle(otherNames, letter.gematria * 17).slice(0, 3);

    return {
      id: `gen-lt-${learningPair}-${letter.char}`,
      type: 'letter-trace' as const,
      learningPair,
      difficulty: 2,
      category: 'alphabet' as const,
      question: `Trace the ${scriptLabel} letter and identify it`,
      questionEn: `Which letter is this: **${letter.char}**?`,
      correctAnswer: letter.name,
      distractors,
      letterData: letter,
    };
  });
}

export function generateLetterTraceExercises(): Exercise[] {
  const allNames = HE_ALPHABET.map((l) => l.name);

  return HE_ALPHABET.map((letter) => {
    const otherNames = allNames.filter((n) => n !== letter.name);
    const distractors = deterministicShuffle(otherNames, letter.gematria * 17).slice(0, 3);

    return {
      id: `gen-lt-${letter.char}`,
      type: 'letter-trace' as const,
      learningPair: 'en-he',
      difficulty: 2,
      category: 'alphabet' as const,
      question: `Trace the Hebrew letter and identify it`,
      questionEn: `Which letter is this: **${letter.char}**?`,
      correctAnswer: letter.name,
      distractors,
      letterData: letter,
    };
  });
}

/** English alphabet exercises for Hebrew-native learners of English (he-en) */
export function generateEnLetterTraceExercises(): Exercise[] {
  return generateLetterTraceForAlphabet(EN_ALPHABET, 'he-en', 'English');
}

/** Arabic alphabet exercises for English-native learners of Arabic (en-ar) */
export function generateArLetterTraceExercises(): Exercise[] {
  return generateLetterTraceForAlphabet(AR_ALPHABET, 'en-ar', 'Arabic');
}

/** Spanish alphabet exercises for English-native learners of Spanish (en-es) */
export function generateEsLetterTraceExercises(): Exercise[] {
  return generateLetterTraceForAlphabet(ES_ALPHABET, 'en-es', 'Spanish');
}

/** French alphabet exercises for English-native learners of French (en-fr) */
export function generateFrLetterTraceExercises(): Exercise[] {
  return generateLetterTraceForAlphabet(FR_ALPHABET, 'en-fr', 'French');
}

/** Russian alphabet exercises for English-native learners of Russian (en-ru) */
export function generateRuLetterTraceExercises(): Exercise[] {
  return generateLetterTraceForAlphabet(RU_ALPHABET, 'en-ru', 'Russian');
}

/** German alphabet exercises for English-native learners of German (en-de) */
export function generateDeLetterTraceExercises(): Exercise[] {
  return generateLetterTraceForAlphabet(DE_ALPHABET, 'en-de', 'German');
}

export function generateSentenceExercises(): Exercise[] {
  const exercises: Exercise[] = [];
  const allEn = HE_SENTENCES.map((s) => s.en);

  HE_SENTENCES.forEach((entry, idx) => {
    const diff = Math.min(10, Math.max(1, entry.difficulty * 2));

    // 1. He → En multiple choice
    const distractors = deterministicShuffle(
      allEn.filter((e) => e !== entry.en),
      idx * 37 + 11,
    ).slice(0, 3);
    exercises.push({
      id: `gen-sent-mc-${idx}`,
      type: 'multiple-choice',
      learningPair: 'en-he',
      difficulty: diff,
      category: 'sentences',
      question: `מה פירוש המשפט: **${entry.he}**?`,
      questionEn: `What does this sentence mean: **${entry.he}**?`,
      correctAnswer: entry.en,
      distractors,
    });

    // 2. En → He translate
    exercises.push({
      id: `gen-sent-tr-${idx}`,
      type: 'translate',
      learningPair: 'en-he',
      difficulty: Math.min(10, diff + 1),
      category: 'sentences',
      question: `תרגמו לעברית: **${entry.en}**`,
      questionEn: `Translate to Hebrew: **${entry.en}**`,
      correctAnswer: entry.he,
      distractors: [],
    });

    // 3. Reorder — only for sentences with 2–6 words
    const words = entry.he.trim().split(/\s+/);
    if (words.length >= 2 && words.length <= 6) {
      const shuffled = deterministicShuffle(words, idx * 53 + 7);
      exercises.push({
        id: `gen-sent-re-${idx}`,
        type: 'reorder',
        learningPair: 'en-he',
        difficulty: diff,
        category: 'sentences',
        question: `סדרו את המילים לכדי משפט`,
        questionEn: `Arrange the words to form a sentence: **${entry.en}**`,
        correctAnswer: entry.he,
        distractors: [],
        reorderWords: shuffled,
      });
    }
  });

  return exercises;
}

/** Vocabulary exercises for Hebrew-native learners of English (he-en) */
export function generateHeEnVocabularyExercises(): Exercise[] {
  const exercises: Exercise[] = [];

  HE_VOCABULARY.forEach((entry, idx) => {
    const diff = Math.min(10, Math.max(1, entry.difficulty * 2));

    // 1. He → En multiple choice
    exercises.push({
      id: `gen-voc-mc-he-en-${idx}`,
      type: 'multiple-choice',
      learningPair: 'he-en',
      difficulty: diff,
      category: 'vocabulary',
      question: `מה המשמעות של **${entry.he}** באנגלית?`,
      questionEn: `What is the English meaning of **${entry.he}**?`,
      correctAnswer: entry.en,
      distractors: pickDistractors(HE_VOCABULARY, entry.en, 3, idx * 41 + 3),
    });

    // 2. He → En translate (type English)
    exercises.push({
      id: `gen-voc-tr-he-en-${idx}`,
      type: 'translate',
      learningPair: 'he-en',
      difficulty: Math.min(10, diff + 1),
      category: 'vocabulary',
      question: `כתבו באנגלית: **${entry.he}**`,
      questionEn: `Write in English: **${entry.he}**`,
      correctAnswer: entry.en,
      distractors: [],
    });
  });

  return exercises;
}

/** Sentence exercises for Hebrew-native learners of English (he-en) */
export function generateHeEnSentenceExercises(): Exercise[] {
  const exercises: Exercise[] = [];
  const allEn = HE_SENTENCES.map((s) => s.en);

  HE_SENTENCES.forEach((entry, idx) => {
    const diff = Math.min(10, Math.max(1, entry.difficulty * 2));

    // 1. He → En multiple choice
    const distractors = deterministicShuffle(
      allEn.filter((e) => e !== entry.en),
      idx * 43 + 17,
    ).slice(0, 3);
    exercises.push({
      id: `gen-sent-mc-he-en-${idx}`,
      type: 'multiple-choice',
      learningPair: 'he-en',
      difficulty: diff,
      category: 'sentences',
      question: `מה פירוש המשפט באנגלית: **${entry.he}**?`,
      questionEn: `What does this sentence mean in English: **${entry.he}**?`,
      correctAnswer: entry.en,
      distractors,
    });

    // 2. He → En translate (type English)
    exercises.push({
      id: `gen-sent-tr-he-en-${idx}`,
      type: 'translate',
      learningPair: 'he-en',
      difficulty: Math.min(10, diff + 1),
      category: 'sentences',
      question: `תרגמו לאנגלית: **${entry.he}**`,
      questionEn: `Translate to English: **${entry.he}**`,
      correctAnswer: entry.en,
      distractors: [],
    });

    // 3. Reorder English words — only for sentences with 2–6 English words
    const words = entry.en.trim().split(/\s+/);
    if (words.length >= 2 && words.length <= 6) {
      const shuffled = deterministicShuffle(words, idx * 59 + 11);
      exercises.push({
        id: `gen-sent-re-he-en-${idx}`,
        type: 'reorder',
        learningPair: 'he-en',
        difficulty: diff,
        category: 'sentences',
        question: `סדרו את המילים לכדי משפט באנגלית`,
        questionEn: `Arrange the English words to form a sentence: **${entry.he}**`,
        correctAnswer: entry.en,
        distractors: [],
        reorderWords: shuffled,
      });
    }
  });

  return exercises;
}

/** Final forms (sofit) as extra alphabet exercises */
export function generateFinalFormExercises(): Exercise[] {
  const finalForms = HE_ALPHABET.filter((l) => l.finalForm);
  const allNames = HE_ALPHABET.map((l) => l.name);

  return finalForms.map((letter) => {
    const otherNames = allNames.filter((n) => n !== letter.name);
    const distractors = deterministicShuffle(otherNames, letter.gematria * 23).slice(0, 3);

    return {
      id: `gen-lt-final-${letter.char}`,
      type: 'multiple-choice' as const,
      learningPair: 'en-he',
      difficulty: 4,
      category: 'alphabet' as const,
      question: `הצורה הסופית **${letter.finalForm}** — של איזו אות היא?`,
      questionEn: `The final form **${letter.finalForm}** belongs to which letter?`,
      correctAnswer: `${letter.char} (${letter.name})`,
      distractors,
    };
  });
}
