/**
 * Word and sentence units of each course. They are filled in when the word /
 * sentence packs are loaded (bundled core first, downloaded packs later), so
 * the path can grow without an app update.
 */
import { useSyncExternalStore } from 'react';
import type { UnitDef } from '../course/types';
import type { PairId } from './types';

export type CourseContent = {
  version: number;
  wordUnits: UnitDef[];
  sentenceUnits: UnitDef[];
};

const state: Record<PairId, CourseContent> = {
  'en-he': { version: 0, wordUnits: [], sentenceUnits: [] },
  'he-en': { version: 0, wordUnits: [], sentenceUnits: [] },
};

const listeners = new Set<() => void>();

export function getCourseContent(pair: PairId): CourseContent {
  return state[pair];
}

export function setCourseContent(
  pair: PairId,
  patch: Partial<Omit<CourseContent, 'version'>>,
): void {
  state[pair] = { ...state[pair], ...patch, version: state[pair].version + 1 };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Re-renders when the course content of `pair` changes. */
export function useCourseContentVersion(pair: PairId | null): number {
  return useSyncExternalStore(
    subscribe,
    () => (pair ? state[pair].version : -1),
    () => (pair ? state[pair].version : -1),
  );
}
