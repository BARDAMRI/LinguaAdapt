import { supabase } from './supabase';
import type { ExerciseCategory } from '../../types/learning';
import {
  fetchProfile,
  type ProfileRow,
  type ProfileSkills,
  type SkillKey,
} from './profileService';

export function localTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDaysToISODate(iso: string, days: number): string {
  const [y, m, day] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, day);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/**
 * SM-2–style interval: wrong → 1 day; correct → double interval (min 1).
 */
export async function recordResult(
  userId: string,
  exerciseId: string,
  isCorrect: boolean,
): Promise<{ error: string | null }> {
  const ease_factor = 2.5;
  const today = localTodayISO();

  const { data: existing, error: fetchErr } = await supabase
    .from('user_vocabulary')
    .select('interval_days, ease_factor')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .maybeSingle();

  if (fetchErr) {
    return { error: fetchErr.message };
  }

  if (!isCorrect) {
    const nextDate = addDaysToISODate(today, 1);
    const { error } = await supabase.from('user_vocabulary').upsert(
      {
        user_id: userId,
        exercise_id: exerciseId,
        interval_days: 1,
        ease_factor,
        next_review_date: nextDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,exercise_id' },
    );
    return { error: error?.message ?? null };
  }

  const prevInterval = existing?.interval_days ?? 1;
  const nextInterval = Math.max(1, prevInterval) * 2;
  const nextDate = addDaysToISODate(today, nextInterval);
  const ef = existing?.ease_factor ?? ease_factor;

  const { error } = await supabase.from('user_vocabulary').upsert(
    {
      user_id: userId,
      exercise_id: exerciseId,
      interval_days: nextInterval,
      ease_factor: ef,
      next_review_date: nextDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,exercise_id' },
  );
  return { error: error?.message ?? null };
}

export async function countDueReviews(userId: string): Promise<number> {
  const today = localTodayISO();
  const { count, error } = await supabase
    .from('user_vocabulary')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_date', today);

  if (error) {
    return 0;
  }
  return count ?? 0;
}

function computeStreakUpdate(
  lastPractice: string | null | undefined,
  currentStreak: number,
): { practice_streak: number; last_practice_date: string } {
  const today = localTodayISO();
  if (!lastPractice) {
    return { practice_streak: 1, last_practice_date: today };
  }
  if (lastPractice === today) {
    return { practice_streak: currentStreak, last_practice_date: today };
  }
  const yesterday = addDaysToISODate(today, -1);
  if (lastPractice === yesterday) {
    return { practice_streak: currentStreak + 1, last_practice_date: today };
  }
  return { practice_streak: 1, last_practice_date: today };
}

function skillDiffLeveled(
  before: ProfileSkills,
  after: ProfileSkills,
): SkillKey[] {
  const keys: SkillKey[] = [
    'alphabet',
    'vocabulary',
    'sentences',
    'conversation',
  ];
  return keys.filter((k) => (after[k] ?? 0) > (before[k] ?? 0));
}

export type SessionResultLine = {
  exerciseId: string;
  correct: boolean;
  category: ExerciseCategory;
};

export async function finalizePracticeSession(
  userId: string,
  category: ExerciseCategory,
  results: SessionResultLine[],
  skillsBefore: ProfileSkills,
): Promise<{
  skillsAfter: ProfileSkills;
  pointsEarned: number;
  totalPoints: number;
  streak: number;
  newWordsLearned: number;
  leveledUp: SkillKey[];
  error: string | null;
}> {
  const correctCount = results.filter((r) => r.correct).length;
  const total = results.length;
  const ratio = total > 0 ? correctCount / total : 0;

  const newWordsLearned = results.filter(
    (r) => r.correct && r.category === 'vocabulary',
  ).length;

  const pointsEarned = correctCount * 5 + (ratio === 1 && total >= 3 ? 15 : 0);

  const profile = await fetchProfile(userId);
  if (!profile) {
    return {
      skillsAfter: skillsBefore,
      pointsEarned: 0,
      totalPoints: 0,
      streak: 0,
      newWordsLearned,
      leveledUp: [],
      error: 'No profile',
    };
  }

  const streakUpd = computeStreakUpdate(
    profile.last_practice_date,
    profile.practice_streak,
  );

  let nextSkills: ProfileSkills = { ...profile.skills };
  const SKILL_CATS: SkillKey[] = ['alphabet', 'vocabulary', 'sentences', 'conversation'];
  if (ratio >= 0.75 && total >= 2) {
    if (category === 'mixed') {
      // Update each skill based on its own per-category correct ratio
      for (const k of SKILL_CATS) {
        const catResults = results.filter((r) => r.category === k);
        if (catResults.length === 0) continue;
        const catRatio = catResults.filter((r) => r.correct).length / catResults.length;
        if (catRatio >= 0.75) {
          nextSkills = { ...nextSkills, [k]: Math.min(10, (nextSkills[k] ?? 0) + 1) };
        }
      }
    } else {
      const k = category as SkillKey;
      nextSkills = { ...nextSkills, [k]: Math.min(10, (nextSkills[k] ?? 0) + 1) };
    }
  }

  const totalPoints =
    (profile.total_points ?? 0) + pointsEarned;

  const { error } = await supabase
    .from('profiles')
    .update({
      skills: nextSkills,
      total_points: totalPoints,
      practice_streak: streakUpd.practice_streak,
      last_practice_date: streakUpd.last_practice_date,
    })
    .eq('id', userId);

  if (error) {
    return {
      skillsAfter: profile.skills,
      pointsEarned: 0,
      totalPoints: profile.total_points ?? 0,
      streak: profile.practice_streak,
      newWordsLearned,
      leveledUp: [],
      error: error.message,
    };
  }

  const leveledUp = skillDiffLeveled(skillsBefore, nextSkills);

  return {
    skillsAfter: nextSkills,
    pointsEarned,
    totalPoints,
    streak: streakUpd.practice_streak,
    newWordsLearned,
    leveledUp,
    error: null,
  };
}

export async function fetchDashboardStats(
  userId: string,
): Promise<{
  profile: ProfileRow | null;
  dueReviews: number;
}> {
  const [profile, dueReviews] = await Promise.all([
    fetchProfile(userId),
    countDueReviews(userId),
  ]);
  return { profile, dueReviews };
}
