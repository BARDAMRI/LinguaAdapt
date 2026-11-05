import type { PairId } from '../content/types';
import { emptyCourse, type CourseProgress, type ProgressState } from './ProgressContext';

function mergeCourse(a: CourseProgress | undefined, b: CourseProgress | undefined): CourseProgress {
  const x = a ?? emptyCourse();
  const y = b ?? emptyCourse();
  const lessons: CourseProgress['lessons'] = { ...x.lessons };
  for (const [id, rec] of Object.entries(y.lessons)) {
    const old = lessons[id];
    lessons[id] = old
      ? { stars: Math.max(old.stars, rec.stars), best: Math.max(old.best, rec.best), at: Math.max(old.at, rec.at) }
      : rec;
  }
  const items: CourseProgress['items'] = { ...x.items };
  for (const [id, s] of Object.entries(y.items)) {
    if (!items[id] || items[id].last < s.last) items[id] = s;
  }
  return {
    lessons,
    items,
    unlockedUnits: [...new Set([...x.unlockedUnits, ...y.unlockedUnits])],
    myWords: [...new Set([...x.myWords, ...y.myWords])],
  };
}

/** Combines progress from two devices without losing work from either. */
export function mergeProgress(local: ProgressState, remote: ProgressState): ProgressState {
  const newer = remote.updatedAt > local.updatedAt ? remote : local;
  const pairs = new Set([...Object.keys(local.courses), ...Object.keys(remote.courses)]) as Set<PairId>;
  const courses: ProgressState['courses'] = {};
  for (const p of pairs) courses[p] = mergeCourse(local.courses[p], remote.courses[p]);
  const xpByDay: Record<string, number> = { ...local.xpByDay };
  for (const [d, v] of Object.entries(remote.xpByDay)) xpByDay[d] = Math.max(xpByDay[d] ?? 0, v);
  const lastA = local.lastPracticeDay ?? '';
  const lastB = remote.lastPracticeDay ?? '';
  const streakSrc = lastB > lastA ? remote : lastA > lastB ? local : local.streak >= remote.streak ? local : remote;
  return {
    version: 2,
    activePair: newer.activePair ?? local.activePair ?? remote.activePair,
    courses,
    xp: Math.max(local.xp, remote.xp),
    xpByDay,
    streak: streakSrc.streak,
    bestStreak: Math.max(local.bestStreak, remote.bestStreak),
    lastPracticeDay: streakSrc.lastPracticeDay,
    settings: newer.settings,
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
  };
}
