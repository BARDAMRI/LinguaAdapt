/**
 * Spaced repetition per learnable item (letter, vowel, word, sentence …).
 * A small Leitner-style scheduler: each correct review moves an item one box
 * up (longer interval), a mistake moves it two boxes down.
 */

export type ItemState = {
  /** Box 0–7. */
  box: number;
  /** Day number (see `dayNumber`) when the item is due again. */
  due: number;
  /** Times answered wrong after first being learned. */
  lapses: number;
  /** Number of review rounds. */
  reps: number;
  /** Last review time, ms since epoch — used to merge devices. */
  last: number;
};

const INTERVAL_DAYS = [0, 1, 2, 4, 7, 15, 30, 60];

/** Days since 1970-01-01 in the device's local time zone. */
export function dayNumber(date = new Date()): number {
  const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(local / 86_400_000);
}

export function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function newItemState(now = Date.now()): ItemState {
  return { box: 0, due: dayNumber(new Date(now)), lapses: 0, reps: 0, last: now };
}

/** Applies one review outcome. `correct` = answered right on the first try. */
export function review(prev: ItemState | undefined, correct: boolean, now = Date.now()): ItemState {
  const base = prev ?? newItemState(now);
  const today = dayNumber(new Date(now));
  // Reviewing twice on the same day does not climb more than one box.
  const sameDay = prev !== undefined && dayNumber(new Date(prev.last)) === today && prev.reps > 0;
  let box: number;
  if (correct) {
    box = sameDay ? Math.max(base.box, 1) : Math.min(base.box + 1, INTERVAL_DAYS.length - 1);
  } else {
    box = Math.max(0, base.box - 2);
  }
  const interval = correct ? INTERVAL_DAYS[box] : 0;
  return {
    box,
    due: today + Math.max(correct ? 1 : 0, interval),
    lapses: base.lapses + (correct || prev === undefined ? 0 : 1),
    reps: base.reps + 1,
    last: now,
  };
}

export function isDue(state: ItemState, today = dayNumber()): boolean {
  return state.due <= today;
}

/** 0 (new / shaky) … 1 (well known). */
export function strength(state: ItemState | undefined): number {
  if (!state) return 0;
  return Math.min(1, state.box / 5);
}
