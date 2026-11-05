/**
 * Learner progress, stored on the device (guest mode works with no account).
 * When the learner is signed in, `progressSync` mirrors it to Supabase.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PairId } from '../content/types';
import { setSpeechSpeed, type SpeechSpeed } from '../services/tts';
import { dayKey, dayNumber, isDue, review, type ItemState } from './srs';

const STORAGE_KEY = 'lingua_progress_v2';

export type LessonRecord = { stars: number; at: number; best: number };

export type CourseProgress = {
  lessons: Record<string, LessonRecord>;
  /** Units opened early by passing their checkpoint. */
  unlockedUnits: string[];
  items: Record<string, ItemState>;
  /** Words the learner saved from the dictionary. */
  myWords: string[];
};

export type LearnerSettings = {
  showNiqqud: boolean;
  showTranslit: boolean;
  speechSpeed: SpeechSpeed;
  autoPlayAudio: boolean;
  dailyGoalXp: number;
};

export type ProgressState = {
  version: 2;
  activePair: PairId | null;
  courses: Partial<Record<PairId, CourseProgress>>;
  xp: number;
  /** XP per day (YYYY-MM-DD), last 60 days. */
  xpByDay: Record<string, number>;
  streak: number;
  bestStreak: number;
  lastPracticeDay: string | null;
  settings: LearnerSettings;
  updatedAt: number;
};

export const DEFAULT_SETTINGS: LearnerSettings = {
  showNiqqud: true,
  showTranslit: true,
  speechSpeed: 'normal',
  autoPlayAudio: true,
  dailyGoalXp: 30,
};

export function emptyCourse(): CourseProgress {
  return { lessons: {}, unlockedUnits: [], items: {}, myWords: [] };
}

export function initialProgress(): ProgressState {
  return {
    version: 2,
    activePair: null,
    courses: {},
    xp: 0,
    xpByDay: {},
    streak: 0,
    bestStreak: 0,
    lastPracticeDay: null,
    settings: { ...DEFAULT_SETTINGS },
    updatedAt: 0,
  };
}

export type ItemResult = { itemId: string; correct: boolean };

export type LessonOutcome = {
  lessonId: string | null;
  results: ItemResult[];
  xp: number;
  stars: number;
};

type ProgressContextValue = {
  loaded: boolean;
  state: ProgressState;
  course: CourseProgress;
  setActivePair: (pair: PairId) => void;
  finishLesson: (outcome: LessonOutcome) => { streak: number; streakExtended: boolean };
  unlockUnits: (unitIds: string[]) => void;
  toggleMyWord: (wordId: string) => void;
  updateSettings: (patch: Partial<LearnerSettings>) => void;
  /** Replaces everything (used by sync after merging with the server copy). */
  replaceState: (next: ProgressState) => void;
  resetProgress: () => void;
  dueItemIds: () => string[];
  xpToday: number;
};

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

function trimXpByDay(map: Record<string, number>): Record<string, number> {
  const keys = Object.keys(map).sort();
  if (keys.length <= 60) return map;
  const out: Record<string, number> = {};
  for (const k of keys.slice(-60)) out[k] = map[k];
  return out;
}

function sanitize(raw: unknown): ProgressState {
  const base = initialProgress();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Partial<ProgressState>;
  if (o.version !== 2) return base;
  return {
    ...base,
    ...o,
    courses: o.courses ?? {},
    xpByDay: o.xpByDay ?? {},
    settings: { ...DEFAULT_SETTINGS, ...(o.settings ?? {}) },
  };
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(initialProgress);
  const [loaded, setLoaded] = useState(false);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (!alive || !json) return;
        const parsed = sanitize(JSON.parse(json));
        setState(parsed);
        setSpeechSpeed(parsed.settings.speechSpeed);
      })
      .catch(() => {
        /* start fresh */
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const commit = useCallback((updater: (prev: ProgressState) => ProgressState) => {
    setState((prev) => {
      const next = { ...updater(prev), updatedAt: Date.now() };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      }, 300);
      return next;
    });
  }, []);

  const pair = state.activePair;
  const course = useMemo(
    () => (pair ? state.courses[pair] ?? emptyCourse() : emptyCourse()),
    [pair, state.courses],
  );

  const setActivePair = useCallback(
    (next: PairId) => {
      commit((prev) => ({
        ...prev,
        activePair: next,
        courses: { ...prev.courses, [next]: prev.courses[next] ?? emptyCourse() },
      }));
    },
    [commit],
  );

  const finishLesson = useCallback(
    (outcome: LessonOutcome) => {
      const prev = stateRef.current;
      const today = dayKey();
      const practicedToday = prev.lastPracticeDay === today;
      const streak = practicedToday
        ? prev.streak
        : prev.lastPracticeDay === yesterdayKey()
          ? prev.streak + 1
          : 1;
      commit((p) => {
        const activePair = p.activePair;
        if (!activePair) return p;
        const c = p.courses[activePair] ?? emptyCourse();
        const now = Date.now();
        const items = { ...c.items };
        // One verdict per item: right only if every exercise for it was right.
        const verdict = new Map<string, boolean>();
        for (const r of outcome.results) {
          verdict.set(r.itemId, (verdict.get(r.itemId) ?? true) && r.correct);
        }
        for (const [id, ok] of verdict) items[id] = review(items[id], ok, now);
        const lessons = { ...c.lessons };
        if (outcome.lessonId) {
          const old = lessons[outcome.lessonId];
          lessons[outcome.lessonId] = {
            stars: Math.max(old?.stars ?? 0, outcome.stars),
            best: Math.max(old?.best ?? 0, outcome.xp),
            at: now,
          };
        }
        const xpByDay = trimXpByDay({ ...p.xpByDay, [today]: (p.xpByDay[today] ?? 0) + outcome.xp });
        return {
          ...p,
          courses: { ...p.courses, [activePair]: { ...c, items, lessons } },
          xp: p.xp + outcome.xp,
          xpByDay,
          streak,
          bestStreak: Math.max(p.bestStreak, streak),
          lastPracticeDay: today,
        };
      });
      return { streak, streakExtended: !practicedToday };
    },
    [commit],
  );

  const unlockUnits = useCallback(
    (unitIds: string[]) => {
      commit((p) => {
        if (!p.activePair) return p;
        const c = p.courses[p.activePair] ?? emptyCourse();
        const set = new Set([...c.unlockedUnits, ...unitIds]);
        return { ...p, courses: { ...p.courses, [p.activePair]: { ...c, unlockedUnits: [...set] } } };
      });
    },
    [commit],
  );

  const toggleMyWord = useCallback(
    (wordId: string) => {
      commit((p) => {
        if (!p.activePair) return p;
        const c = p.courses[p.activePair] ?? emptyCourse();
        const has = c.myWords.includes(wordId);
        const myWords = has ? c.myWords.filter((w) => w !== wordId) : [...c.myWords, wordId];
        return { ...p, courses: { ...p.courses, [p.activePair]: { ...c, myWords } } };
      });
    },
    [commit],
  );

  const updateSettings = useCallback(
    (patch: Partial<LearnerSettings>) => {
      if (patch.speechSpeed) setSpeechSpeed(patch.speechSpeed);
      commit((p) => ({ ...p, settings: { ...p.settings, ...patch } }));
    },
    [commit],
  );

  const replaceState = useCallback(
    (next: ProgressState) => {
      setSpeechSpeed(next.settings.speechSpeed);
      commit(() => next);
    },
    [commit],
  );

  const resetProgress = useCallback(() => {
    commit(() => initialProgress());
  }, [commit]);

  const dueItemIds = useCallback(() => {
    const today = dayNumber();
    return Object.entries(course.items)
      .filter(([, s]) => isDue(s, today))
      .sort((a, b) => a[1].due - b[1].due || a[1].box - b[1].box)
      .map(([id]) => id);
  }, [course.items]);

  const xpToday = state.xpByDay[dayKey()] ?? 0;

  const value = useMemo(
    () => ({
      loaded,
      state,
      course,
      setActivePair,
      finishLesson,
      unlockUnits,
      toggleMyWord,
      updateSettings,
      replaceState,
      resetProgress,
      dueItemIds,
      xpToday,
    }),
    [loaded, state, course, setActivePair, finishLesson, unlockUnits, toggleMyWord, updateSettings, replaceState, resetProgress, dueItemIds, xpToday],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress requires ProgressProvider');
  return ctx;
}
