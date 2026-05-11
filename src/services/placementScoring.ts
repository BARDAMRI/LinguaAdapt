import type {
  ExerciseCategory,
  PlacementAnswerRecord,
} from '../../types/learning';
import type { ProfileSkills } from './profileService';

type CoreCategory = Exclude<ExerciseCategory, 'mixed'>;

export type CatScore = Record<
  CoreCategory,
  { earned: number; total: number }
>;

function emptyCat(): CatScore {
  return {
    alphabet: { earned: 0, total: 0 },
    vocabulary: { earned: 0, total: 0 },
    sentences: { earned: 0, total: 0 },
  };
}

/**
 * Weighted score by question difficulty; outputs skill levels 1–5 per category.
 */
export function computePlacementSkillLevels(
  records: PlacementAnswerRecord[],
): Pick<ProfileSkills, 'alphabet' | 'vocabulary' | 'sentences'> & {
  current_level: number;
} {
  const acc = emptyCat();

  for (const r of records) {
    const cat = r.exercise.category as CoreCategory;
    if (!(cat in acc)) continue;
    const w = Math.max(1, r.exercise.difficulty);
    acc[cat].total += w;
    if (r.correct) {
      acc[cat].earned += w;
    }
  }

  const levelFor = (c: CoreCategory): number => {
    const { earned, total } = acc[c];
    if (total <= 0) return 1;
    const ratio = earned / total;
    const mapped = Math.round(1 + ratio * 4);
    return Math.max(1, Math.min(5, mapped));
  };

  const alphabet = levelFor('alphabet');
  const vocabulary = levelFor('vocabulary');
  const sentences = levelFor('sentences');
  const current_level = Math.max(
    1,
    Math.round((alphabet + vocabulary + sentences) / 3),
  );

  return { alphabet, vocabulary, sentences, current_level };
}
