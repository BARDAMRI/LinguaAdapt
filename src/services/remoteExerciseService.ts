import { supabase } from './supabase';
import type { Exercise } from '../../types/learning';
import { appendRemoteExercises } from './exerciseService';

interface ExerciseRow {
  id: string;
  type: string;
  category: string;
  difficulty: number;
  learning_pair: string;
  question: string;
  question_en: string | null;
  question_he: string | null;
  correct_answer: string;
  distractors: string[];
  reorder_words: string[] | null;
  tutor_context: string | null;
}

function rowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    type: row.type as Exercise['type'],
    category: row.category as Exercise['category'],
    difficulty: row.difficulty,
    learningPair: row.learning_pair,
    question: row.question,
    questionEn: row.question_en ?? undefined,
    questionHe: row.question_he ?? undefined,
    correctAnswer: row.correct_answer,
    distractors: row.distractors ?? [],
    reorderWords: row.reorder_words ?? undefined,
    tutorContext: row.tutor_context ?? undefined,
  };
}

/** Fetch active exercises from Supabase and merge into the in-memory catalog. */
export async function loadRemoteExercises(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('id,type,category,difficulty,learning_pair,question,question_en,question_he,correct_answer,distractors,reorder_words,tutor_context')
      .eq('is_active', true);

    if (error || !data) return;
    appendRemoteExercises((data as ExerciseRow[]).map(rowToExercise));
  } catch {
    // Network error or table doesn't exist yet — silently ignore
  }
}
