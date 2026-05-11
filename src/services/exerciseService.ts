import type { Exercise, ExerciseCategory } from '../../types/learning';
import initialExercises from '../data/initialExercises.json';
import {
  generateVocabularyExercises,
  generateLetterTraceExercises,
  generateFinalFormExercises,
  generateSentenceExercises,
  generateHeEnVocabularyExercises,
  generateHeEnSentenceExercises,
  generateEnLetterTraceExercises,
  generateArLetterTraceExercises,
  generateEsLetterTraceExercises,
  generateFrLetterTraceExercises,
  generateRuLetterTraceExercises,
  generateDeLetterTraceExercises,
} from './exerciseGenerator';

const _generated = [
  ...generateLetterTraceExercises(),
  ...generateFinalFormExercises(),
  ...generateVocabularyExercises(),
  ...generateSentenceExercises(),
  ...generateHeEnVocabularyExercises(),
  ...generateHeEnSentenceExercises(),
  ...generateEnLetterTraceExercises(),
  ...generateArLetterTraceExercises(),
  ...generateEsLetterTraceExercises(),
  ...generateFrLetterTraceExercises(),
  ...generateRuLetterTraceExercises(),
  ...generateDeLetterTraceExercises(),
];

export const ALL_EXERCISES: Exercise[] = [
  ...(initialExercises as Exercise[]),
  ..._generated,
];

/** Append exercises fetched from Supabase, skipping ids that already exist locally. */
export function appendRemoteExercises(remote: Exercise[]): void {
  const existingIds = new Set(ALL_EXERCISES.map((e) => e.id));
  for (const ex of remote) {
    if (!existingIds.has(ex.id)) {
      ALL_EXERCISES.push(ex);
      existingIds.add(ex.id);
    }
  }
}

/**
 * Replace all locally-generated exercises (ids starting with "gen-") with the
 * provided DB-generated set.  Called by remoteContentService when the content
 * tables are available.  Exercises from initialExercises.json (no "gen-" prefix)
 * and any previously appended remote exercises are kept.
 */
export function replaceGeneratedExercises(dbExercises: Exercise[]): void {
  // Remove gen- exercises in place
  for (let i = ALL_EXERCISES.length - 1; i >= 0; i--) {
    if (ALL_EXERCISES[i].id.startsWith('gen-')) {
      ALL_EXERCISES.splice(i, 1);
    }
  }
  // Add DB exercises, skipping any id already present
  const existingIds = new Set(ALL_EXERCISES.map((e) => e.id));
  for (const ex of dbExercises) {
    if (!existingIds.has(ex.id)) {
      ALL_EXERCISES.push(ex);
      existingIds.add(ex.id);
    }
  }
}

/** Catalog in `initialExercises.json` is English-native → Hebrew target unless overridden per exercise. */
export const DEFAULT_CONTENT_LEARNING_PAIR = 'en-he';

export function exerciseLearningPair(ex: Exercise): string {
  const p = ex.learningPair?.trim().toLowerCase();
  return p || DEFAULT_CONTENT_LEARNING_PAIR;
}

export function filterExercisesByLanguagePair(
  exercises: Exercise[],
  nativeCode: string,
  targetCode: string,
): Exercise[] {
  const exactKey = `${nativeCode.trim().toLowerCase()}-${targetCode.trim().toLowerCase()}`;
  const target = targetCode.trim().toLowerCase();

  // Exact native+target match
  const exact = exercises.filter((e) => exerciseLearningPair(e) === exactKey);
  if (exact.length > 0) return exact;

  // Target-language-only match — Hebrew content works for any native speaker learning Hebrew
  const byTarget = exercises.filter((e) => exerciseLearningPair(e).endsWith(`-${target}`));
  if (byTarget.length > 0) return byTarget;

  // Ultimate fallback: no content exists for this pair yet, return everything
  // so the app never shows "no exercises" regardless of language settings
  return exercises;
}

export function shuffleInPlace<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Latin-heavy answers: fold case & spaces */
export function normalizeLatinAnswer(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFKC');
}

export function normalizeHebrewAnswer(s: string): string {
  return s.trim().replace(/\s+/g, ' ').normalize('NFC');
}

function hasHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}

/** Basic match for free-write fallback / scoring without AI. */
export function basicSentenceMatch(
  userSentence: string,
  targetSentence: string,
): boolean {
  const u = userSentence.trim();
  const t = targetSentence.trim();
  if (!u || !t) return false;
  const mostlyLatin =
    !hasHebrew(u) && !hasHebrew(t) && /[a-z]/i.test(u + t);
  if (mostlyLatin) {
    return normalizeLatinAnswer(u) === normalizeLatinAnswer(t);
  }
  return normalizeHebrewAnswer(u) === normalizeHebrewAnswer(t);
}

export function answersMatch(
  exercise: Exercise,
  givenRaw: string,
  correctRaw: string,
): boolean {
  const given = givenRaw.trim();
  const correct = correctRaw.trim();
  if (exercise.type === 'multiple-choice' || exercise.type === 'letter-trace') {
    return given === correct;
  }
  if (exercise.type === 'reorder') {
    const norm = hasHebrew(correct) ? normalizeHebrewAnswer : normalizeLatinAnswer;
    return norm(given) === norm(correct);
  }
  if (exercise.type === 'free-write') {
    return basicSentenceMatch(given, correct);
  }
  const mostlyLatin =
    !hasHebrew(given) &&
    !hasHebrew(correct) &&
    /[a-z]/i.test(given + correct);
  if (mostlyLatin) {
    return normalizeLatinAnswer(given) === normalizeLatinAnswer(correct);
  }
  return normalizeHebrewAnswer(given) === normalizeHebrewAnswer(correct);
}

export function pickPlacementExercises(
  all: Exercise[] = ALL_EXERCISES,
  targetCount = 8,
  nativeCode?: string | null,
  targetCode?: string | null,
): Exercise[] {
  let catalog = all;
  if (nativeCode?.trim() && targetCode?.trim()) {
    catalog = filterExercisesByLanguagePair(all, nativeCode, targetCode);
  }

  const categories: ExerciseCategory[] = [
    'alphabet',
    'vocabulary',
    'sentences',
  ];
  const picked: Exercise[] = [];
  const used = new Set<string>();

  for (const cat of categories) {
    const pool = shuffleInPlace(
      catalog.filter(
        (e) =>
          e.category === cat &&
          e.type !== 'free-write' &&
          e.type !== 'letter-trace',
      ),
    );
    for (const ex of pool) {
      if (picked.length >= targetCount) break;
      if (used.has(ex.id)) continue;
      picked.push(ex);
      used.add(ex.id);
      if (picked.filter((p) => p.category === cat).length >= 2) break;
    }
  }

  const remaining = shuffleInPlace(
    catalog.filter(
      (e) =>
        !used.has(e.id) &&
        e.type !== 'free-write' &&
        e.type !== 'letter-trace',
    ),
  );
  for (const ex of remaining) {
    if (picked.length >= targetCount) break;
    picked.push(ex);
    used.add(ex.id);
  }

  return shuffleInPlace(picked.slice(0, Math.min(targetCount, picked.length)));
}

export function skillToDifficultyAnchor(skillLevel: number): number {
  const s = Math.max(1, Math.min(10, skillLevel || 1));
  return Math.min(10, Math.max(2, s * 2));
}

export function pickSessionExercises(
  category: ExerciseCategory,
  userSkillLevel: number,
  count = 10,
  all: Exercise[] = ALL_EXERCISES,
  nativeCode?: string | null,
  targetCode?: string | null,
): Exercise[] {
  let catalog = all;
  if (nativeCode?.trim() && targetCode?.trim()) {
    catalog = filterExercisesByLanguagePair(all, nativeCode, targetCode);
  }

  const anchor = skillToDifficultyAnchor(userSkillLevel);

  // Helper: pick exercises for one category from a catalog, falling back to
  // the full exercise list if the language-filtered catalog has none for that
  // category (e.g. he-en users have no alphabet exercises yet).
  function poolForCat(cat: ExerciseCategory, src: Exercise[]): Exercise[] {
    const filtered = src.filter((e) => e.category === cat && e.type !== 'free-write');
    if (filtered.length > 0) return filtered;
    // Per-category fallback: return exercises for this category regardless of pair
    return all.filter((e) => e.category === cat && e.type !== 'free-write');
  }

  // Mixed session: pull proportionally from all categories
  if (category === 'mixed') {
    const cats: Array<ExerciseCategory> = ['alphabet', 'vocabulary', 'sentences'];
    const perCat = Math.ceil(count / cats.length);
    const parts: Exercise[] = [];
    for (const cat of cats) {
      const pool = poolForCat(cat, catalog)
        .map((e) => ({ e, d: Math.abs(e.difficulty - anchor) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, Math.max(perCat, Math.min(catalog.length, 20)))
        .map((p) => p.e);
      parts.push(...shuffleInPlace(pool).slice(0, perCat));
    }
    return shuffleInPlace(parts).slice(0, count);
  }

  const pool = poolForCat(category, catalog)
    .map((e) => ({
      e,
      d: Math.abs(e.difficulty - anchor),
    }))
    .sort((a, b) => a.d - b.d);

  const candidates = pool
    .slice(0, Math.max(count, Math.min(pool.length, 15)))
    .map((p) => p.e);
  if (candidates.length === 0) return [];
  return shuffleInPlace(candidates).slice(0, Math.min(count, candidates.length));
}

export function getReorderTokens(exercise: Exercise): string[] {
  if (exercise.reorderWords?.length) {
    return [...exercise.reorderWords];
  }
  return exercise.correctAnswer.trim().split(/\s+/);
}
