/**
 * Fetches vocabulary, sentences, and alphabet from the DB content tables,
 * generates exercises from them, and replaces the locally-generated exercises
 * in the runtime pool.
 *
 * Offline / table-not-yet-created: silently no-ops so local data still works.
 */

import { supabase } from './supabase';
import type { Exercise, LetterData } from '../../types/learning';
import { replaceGeneratedExercises } from './exerciseService';
import { setRemoteAlphabet } from './alphabetService';

// ── DB row shapes ─────────────────────────────────────────────────────────────

interface VocabRow {
  id: number;
  lang_a: string;
  lang_b: string;
  text_a: string;
  text_b: string;
  difficulty: number;
  topic: string;
}

interface SentenceRow {
  id: number;
  lang_a: string;
  lang_b: string;
  text_a: string;
  text_b: string;
  difficulty: number;
  topic: string;
}

interface AlphabetRow {
  id: number;
  lang: string;
  char: string;
  name: string;
  name_he: string | null;
  names: Record<string, string> | null;
  script_language: string | null;
  phonetic: string | null;
  ipa: string | null;
  final_form: string | null;
  final_form_name: string | null;
  gematria: number;
  memory_hint: string | null;
  stroke_hint: string | null;
  sort_order: number;
}

// ── Deterministic shuffle (mirrors exerciseGenerator.ts) ─────────────────────

function det<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Exercise generators ───────────────────────────────────────────────────────

function buildVocabExercises(vocab: VocabRow[]): Exercise[] {
  const exercises: Exercise[] = [];

  for (const row of vocab) {
    const diff = Math.min(10, Math.max(1, row.difficulty * 2));
    const isHe = row.lang_a === 'he' && row.lang_b === 'en';

    const poolB = vocab
      .filter((v) => v.lang_a === row.lang_a && v.lang_b === row.lang_b && v.text_b !== row.text_b)
      .map((v) => v.text_b);
    const poolA = vocab
      .filter((v) => v.lang_a === row.lang_a && v.lang_b === row.lang_b && v.text_a !== row.text_a)
      .map((v) => v.text_a);

    const distB = det(poolB, row.id * 31 + 7).slice(0, 3);
    const distA = det(poolA, row.id * 53 + 13).slice(0, 3);

    if (isHe) {
      // ── en-he (English native → learning Hebrew) ──────────────────────────

      // He → En MC
      exercises.push({
        id: `db-voc-mc-he-${row.id}`,
        type: 'multiple-choice',
        learningPair: 'en-he',
        difficulty: diff,
        category: 'vocabulary',
        question: `מה המשמעות של **${row.text_a}**?`,
        questionEn: `What does **${row.text_a}** mean?`,
        correctAnswer: row.text_b,
        distractors: distB,
      });

      // En → He MC
      exercises.push({
        id: `db-voc-mc-en-${row.id}`,
        type: 'multiple-choice',
        learningPair: 'en-he',
        difficulty: diff,
        category: 'vocabulary',
        question: `How do you say **${row.text_b}** in Hebrew?`,
        questionHe: `איך אומרים **${row.text_b}** בעברית?`,
        correctAnswer: row.text_a,
        distractors: distA,
      });

      // En → He translate
      exercises.push({
        id: `db-voc-tr-${row.id}`,
        type: 'translate',
        learningPair: 'en-he',
        difficulty: Math.min(10, diff + 1),
        category: 'vocabulary',
        question: `כתבו בעברית: **${row.text_b}**`,
        questionEn: `Write in Hebrew: **${row.text_b}**`,
        correctAnswer: row.text_a,
        distractors: [],
      });

      // ── he-en (Hebrew native → learning English) ──────────────────────────

      // He → En MC
      exercises.push({
        id: `db-voc-mc-he-en-${row.id}`,
        type: 'multiple-choice',
        learningPair: 'he-en',
        difficulty: diff,
        category: 'vocabulary',
        question: `מה המשמעות של **${row.text_a}** באנגלית?`,
        questionEn: `What is the English meaning of **${row.text_a}**?`,
        correctAnswer: row.text_b,
        distractors: distB,
      });

      // He → En translate
      exercises.push({
        id: `db-voc-tr-he-en-${row.id}`,
        type: 'translate',
        learningPair: 'he-en',
        difficulty: Math.min(10, diff + 1),
        category: 'vocabulary',
        question: `כתבו באנגלית: **${row.text_a}**`,
        questionEn: `Write in English: **${row.text_a}**`,
        correctAnswer: row.text_b,
        distractors: [],
      });
    } else {
      // Generic pair — one MC each direction + one translate
      exercises.push({
        id: `db-voc-mc-ab-${row.id}`,
        type: 'multiple-choice',
        learningPair: `${row.lang_b}-${row.lang_a}`,
        difficulty: diff,
        category: 'vocabulary',
        question: `What does **${row.text_a}** mean?`,
        correctAnswer: row.text_b,
        distractors: distB,
      });
      exercises.push({
        id: `db-voc-tr-ab-${row.id}`,
        type: 'translate',
        learningPair: `${row.lang_b}-${row.lang_a}`,
        difficulty: Math.min(10, diff + 1),
        category: 'vocabulary',
        question: `Translate: **${row.text_b}**`,
        correctAnswer: row.text_a,
        distractors: [],
      });
    }
  }

  return exercises;
}

function buildSentenceExercises(sentences: SentenceRow[]): Exercise[] {
  const exercises: Exercise[] = [];
  const allB = sentences.map((s) => s.text_b);
  const allA = sentences.map((s) => s.text_a);

  for (const row of sentences) {
    const diff = Math.min(10, Math.max(1, row.difficulty * 2));
    const isHe = row.lang_a === 'he' && row.lang_b === 'en';

    const distB = det(allB.filter((b) => b !== row.text_b), row.id * 37 + 11).slice(0, 3);
    const distA = det(allA.filter((a) => a !== row.text_a), row.id * 43 + 17).slice(0, 3);

    if (isHe) {
      // en-he
      exercises.push({
        id: `db-sent-mc-${row.id}`,
        type: 'multiple-choice',
        learningPair: 'en-he',
        difficulty: diff,
        category: 'sentences',
        question: `מה פירוש המשפט: **${row.text_a}**?`,
        questionEn: `What does this sentence mean: **${row.text_a}**?`,
        correctAnswer: row.text_b,
        distractors: distB,
      });

      exercises.push({
        id: `db-sent-tr-${row.id}`,
        type: 'translate',
        learningPair: 'en-he',
        difficulty: Math.min(10, diff + 1),
        category: 'sentences',
        question: `תרגמו לעברית: **${row.text_b}**`,
        questionEn: `Translate to Hebrew: **${row.text_b}**`,
        correctAnswer: row.text_a,
        distractors: [],
      });

      const wordsA = row.text_a.trim().split(/\s+/);
      if (wordsA.length >= 2 && wordsA.length <= 6) {
        exercises.push({
          id: `db-sent-re-${row.id}`,
          type: 'reorder',
          learningPair: 'en-he',
          difficulty: diff,
          category: 'sentences',
          question: `סדרו את המילים לכדי משפט`,
          questionEn: `Arrange the words to form a sentence: **${row.text_b}**`,
          correctAnswer: row.text_a,
          distractors: [],
          reorderWords: det(wordsA, row.id * 53 + 7),
        });
      }

      // he-en
      exercises.push({
        id: `db-sent-mc-he-en-${row.id}`,
        type: 'multiple-choice',
        learningPair: 'he-en',
        difficulty: diff,
        category: 'sentences',
        question: `מה פירוש המשפט באנגלית: **${row.text_a}**?`,
        questionEn: `What does this sentence mean in English: **${row.text_a}**?`,
        correctAnswer: row.text_b,
        distractors: distB,
      });

      exercises.push({
        id: `db-sent-tr-he-en-${row.id}`,
        type: 'translate',
        learningPair: 'he-en',
        difficulty: Math.min(10, diff + 1),
        category: 'sentences',
        question: `תרגמו לאנגלית: **${row.text_a}**`,
        questionEn: `Translate to English: **${row.text_a}**`,
        correctAnswer: row.text_b,
        distractors: [],
      });

      const wordsB = row.text_b.trim().split(/\s+/);
      if (wordsB.length >= 2 && wordsB.length <= 6) {
        exercises.push({
          id: `db-sent-re-he-en-${row.id}`,
          type: 'reorder',
          learningPair: 'he-en',
          difficulty: diff,
          category: 'sentences',
          question: `סדרו את המילים לכדי משפט באנגלית`,
          questionEn: `Arrange the English words to form a sentence: **${row.text_a}**`,
          correctAnswer: row.text_b,
          distractors: [],
          reorderWords: det(wordsB, row.id * 59 + 11),
        });
      }
    } else {
      exercises.push({
        id: `db-sent-mc-ab-${row.id}`,
        type: 'multiple-choice',
        learningPair: `${row.lang_b}-${row.lang_a}`,
        difficulty: diff,
        category: 'sentences',
        question: `What does this sentence mean: **${row.text_a}**?`,
        correctAnswer: row.text_b,
        distractors: distB,
      });
      exercises.push({
        id: `db-sent-tr-ab-${row.id}`,
        type: 'translate',
        learningPair: `${row.lang_b}-${row.lang_a}`,
        difficulty: Math.min(10, diff + 1),
        category: 'sentences',
        question: `Translate: **${row.text_b}**`,
        correctAnswer: row.text_a,
        distractors: [],
      });
    }
  }

  return exercises;
}

function buildAlphabetExercises(alphabet: AlphabetRow[]): Exercise[] {
  const exercises: Exercise[] = [];

  const LEARNING_PAIRS: Record<string, string> = {
    he: 'en-he', en: 'he-en', ar: 'en-ar',
    es: 'en-es', fr: 'en-fr', ru: 'en-ru', de: 'en-de',
  };
  const SCRIPT_LABELS: Record<string, string> = {
    he: 'Hebrew', en: 'English', ar: 'Arabic',
    es: 'Spanish', fr: 'French', ru: 'Russian', de: 'German',
  };

  // Group by lang to pick distractors from the same alphabet
  const byLang: Record<string, AlphabetRow[]> = {};
  for (const row of alphabet) {
    (byLang[row.lang] ??= []).push(row);
  }

  for (const [lang, letters] of Object.entries(byLang)) {
    const learningPair = LEARNING_PAIRS[lang] ?? `en-${lang}`;
    const scriptLabel = SCRIPT_LABELS[lang] ?? lang;
    const allNames = letters.map((l) => l.name);

    // Build LetterData for the alphabet cache (used by AlphabetOverviewScreen)
    const letterDataList: LetterData[] = letters
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((l) => ({
        char: l.char,
        name: l.name,
        nameHe: l.name_he ?? l.name,
        names: l.names ?? undefined,
        scriptLanguage: l.script_language ?? lang,
        phonetic: l.phonetic ?? '',
        ipa: l.ipa ?? '',
        finalForm: l.final_form ?? undefined,
        finalFormName: l.final_form_name ?? undefined,
        gematria: l.gematria,
        memoryHint: l.memory_hint ?? '',
        strokeHint: l.stroke_hint ?? '',
      }));

    setRemoteAlphabet(lang, letterDataList);

    for (const letter of letters) {
      const others = allNames.filter((n) => n !== letter.name);
      const distractors = det(others, letter.gematria * 17).slice(0, 3);

      const letterData: LetterData = {
        char: letter.char,
        name: letter.name,
        nameHe: letter.name_he ?? letter.name,
        names: letter.names ?? undefined,
        scriptLanguage: letter.script_language ?? lang,
        phonetic: letter.phonetic ?? '',
        ipa: letter.ipa ?? '',
        finalForm: letter.final_form ?? undefined,
        finalFormName: letter.final_form_name ?? undefined,
        gematria: letter.gematria,
        memoryHint: letter.memory_hint ?? '',
        strokeHint: letter.stroke_hint ?? '',
      };

      exercises.push({
        id: `db-lt-${lang}-${letter.id}`,
        type: 'letter-trace',
        learningPair,
        difficulty: 2,
        category: 'alphabet',
        question: `Trace the ${scriptLabel} letter and identify it`,
        questionEn: `Which letter is this: **${letter.char}**?`,
        correctAnswer: letter.name,
        distractors,
        letterData,
      });
    }

    // Hebrew-only: final-form MC exercises
    if (lang === 'he') {
      const finals = letters.filter((l) => l.final_form);
      for (const letter of finals) {
        const others = allNames.filter((n) => n !== letter.name);
        const distractors = det(others, letter.gematria * 23).slice(0, 3);
        exercises.push({
          id: `db-lt-final-${letter.id}`,
          type: 'multiple-choice',
          learningPair: 'en-he',
          difficulty: 4,
          category: 'alphabet',
          question: `הצורה הסופית **${letter.final_form}** — של איזו אות היא?`,
          questionEn: `The final form **${letter.final_form}** belongs to which letter?`,
          correctAnswer: `${letter.char} (${letter.name})`,
          distractors,
        });
      }
    }
  }

  return exercises;
}

// ── Public entry point ────────────────────────────────────────────────────────

/**
 * Fetch all active content from the DB, generate exercises, then replace
 * the locally-generated pool.  Called once at app bootstrap.
 * Silently no-ops on network error or missing tables.
 */
export async function loadRemoteContent(): Promise<void> {
  try {
    const [vocabRes, sentRes, alphaRes] = await Promise.all([
      supabase
        .from('content_vocabulary')
        .select('id,lang_a,lang_b,text_a,text_b,difficulty,topic')
        .eq('is_active', true),
      supabase
        .from('content_sentences')
        .select('id,lang_a,lang_b,text_a,text_b,difficulty,topic')
        .eq('is_active', true),
      supabase
        .from('content_alphabet')
        .select('id,lang,char,name,name_he,names,script_language,phonetic,ipa,final_form,final_form_name,gematria,memory_hint,stroke_hint,sort_order')
        .eq('is_active', true)
        .order('sort_order'),
    ]);

    // All three tables must exist and return data to proceed
    if (vocabRes.error || sentRes.error || alphaRes.error) return;
    if (!vocabRes.data?.length && !sentRes.data?.length && !alphaRes.data?.length) return;

    const exercises: Exercise[] = [
      ...buildVocabExercises((vocabRes.data ?? []) as VocabRow[]),
      ...buildSentenceExercises((sentRes.data ?? []) as SentenceRow[]),
      ...buildAlphabetExercises((alphaRes.data ?? []) as AlphabetRow[]),
    ];

    replaceGeneratedExercises(exercises);
  } catch {
    // Network error or tables not yet created — local data remains active
  }
}
