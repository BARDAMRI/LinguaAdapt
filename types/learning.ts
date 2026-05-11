/** Learning content & engine (not tied to navigation). */
export type ExerciseType =
  | 'multiple-choice'
  | 'translate'
  | 'reorder'
  | 'free-write'
  | 'letter-trace';

export type ExerciseCategory = 'alphabet' | 'vocabulary' | 'sentences' | 'mixed';

export interface LetterData {
  char: string;
  name: string;
  nameHe: string;
  /** Letter name keyed by language code (e.g. { en: 'Ay', he: 'אֵי' }). */
  names?: Record<string, string>;
  /** BCP-47 language tag of the script (e.g. 'he', 'en', 'ar', 'ru'). Used for TTS. */
  scriptLanguage?: string;
  phonetic: string;
  ipa: string;
  finalForm?: string;
  finalFormName?: string;
  gematria: number;
  memoryHint: string;
  strokeHint: string;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  /**
   * `${native}-${target}` ISO codes, e.g. `en-he` = English speakers learning Hebrew.
   * Omitted in JSON → treated as `en-he` in code (current catalog).
   */
  learningPair?: string;
  /** 1 (easiest) – 10 (hardest) */
  difficulty: number;
  category: ExerciseCategory;
  /** Primary prompt (often Hebrew in this course) */
  question: string;
  /** Expected answer */
  correctAnswer: string;
  /** Wrong options for multiple-choice */
  distractors: string[];
  /** Optional English line (LTR) shown with Hebrew prompt */
  questionEn?: string;
  /** Optional Hebrew line when `question` is English */
  questionHe?: string;
  /** Extra context passed to the AI tutor for free-write exercises */
  tutorContext?: string;
  /** Tokens for reorder exercises */
  reorderWords?: string[];
  /** Letter metadata for letter-trace exercises */
  letterData?: LetterData;
}

export type PlacementAnswerRecord = {
  exercise: Exercise;
  correct: boolean;
  userAnswer: string;
};
