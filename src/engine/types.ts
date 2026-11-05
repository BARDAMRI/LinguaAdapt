/** Exercise model shared by the lesson generator and the exercise components. */

export type Lang = 'he' | 'en';

export type Speakable = { text: string; lang: Lang };

/** A piece of text to show, with optional extras. */
export type Display = {
  text: string;
  lang: Lang;
  size?: 'glyph' | 'big' | 'normal' | 'small';
  /** Keep vowel signs even when the learner hides niqqud (letters & reading stages). */
  keepNiqqud?: boolean;
  translit?: string;
  /** Secondary line, e.g. the meaning. */
  note?: string;
  noteLang?: Lang;
  emoji?: string;
  speak?: Speakable;
};

export type Option = { id: string; display: Display };

export type TeachContent = {
  badge: string;
  glyph?: Display;
  title?: Display;
  rows: { label: string; value: Display }[];
  examples?: Display[];
  tip?: { text: string; lang: Lang };
  /** First entry plays automatically when autoplay is on. */
  speak: Speakable[];
  compare?: Display[];
};

type Base = { id: string };

export type TeachExercise = Base & { type: 'teach'; itemId: string; teach: TeachContent };

export type ChoiceExercise = Base & {
  type: 'choice';
  itemId: string;
  instruction: string;
  prompt: Display | null;
  /** Prompt is (also) audio; played on mount. */
  audio?: Speakable;
  options: Option[];
  correctId: string;
  layout: 'grid' | 'list';
  /** What to show on the result banner. */
  reveal: Display;
};

export type MatchExercise = Base & {
  type: 'match';
  itemIds: string[];
  instruction: string;
  pairs: { id: string; left: Display; right: Display }[];
};

export type TilesExercise = Base & {
  type: 'tiles';
  itemId: string;
  instruction: string;
  prompt: Display | null;
  audio?: Speakable;
  lang: Lang;
  answer: string[];
  /** Other accepted token sequences (joined). */
  accepted: string[];
  tiles: string[];
  joiner: '' | ' ';
  reveal: Display;
};

export type TypeExercise = Base & {
  type: 'type';
  itemId: string;
  instruction: string;
  prompt: Display | null;
  audio?: Speakable;
  lang: Lang;
  accepted: string[];
  reveal: Display;
};

export type TraceExercise = Base & {
  type: 'trace';
  itemId: string;
  instruction: string;
  glyph: string;
  lang: Lang;
  speak: Speakable;
  label: string;
};

export type SyllableExercise = Base & {
  type: 'syllables';
  itemId: string;
  instruction: string;
  vowelKey: string;
};

export type Exercise =
  | TeachExercise
  | ChoiceExercise
  | MatchExercise
  | TilesExercise
  | TypeExercise
  | TraceExercise
  | SyllableExercise;

/** Exercises the learner can get wrong (teach/trace/syllables are not graded). */
export function isGraded(ex: Exercise): boolean {
  return ex.type === 'choice' || ex.type === 'match' || ex.type === 'tiles' || ex.type === 'type';
}

export function exerciseItemIds(ex: Exercise): string[] {
  return ex.type === 'match' ? ex.itemIds : [ex.itemId];
}

export type ExerciseResult = {
  correct: boolean;
  /** Accepted with a small spelling mistake. */
  typo?: boolean;
};
