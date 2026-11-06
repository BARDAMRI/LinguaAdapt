/**
 * Assembles the exercise sequence for a lesson, a review session or a checkpoint.
 */
import type { AnyItem } from '../content/registry';
import type { PairId } from '../content/types';
import type { LessonDef } from '../course/types';
import {
  matchExercise,
  practiceExercise,
  resolveItems,
  shuffle,
  teachExercises,
  traceExercise,
  type GenContext,
} from './generate';
import { isGraded, type Exercise } from './types';

const MAX_GRADED = 14;

function capGraded(list: Exercise[], max: number): Exercise[] {
  let graded = 0;
  return list.filter((ex) => {
    if (!isGraded(ex)) return true;
    graded++;
    return graded <= max;
  });
}

/** A normal lesson: teach each new item, practise it, then mix everything. */
export function buildLesson(def: LessonDef, pair: PairId, reviewIds: string[] = []): Exercise[] {
  const ctx: GenContext = { pair, kind: def.kind, peers: def.itemIds };
  const items = resolveItems(def.itemIds);
  if (items.length === 0) return [];
  if (def.review) return buildPractice(items, ctx, 12);

  const out: Exercise[] = [];
  items.forEach((item, i) => {
    out.push(...teachExercises(item, ctx));
    out.push(practiceExercise(item, ctx, 0));
    if (i === 0) {
      const tr = traceExercise(item);
      if (tr) out.push(tr);
    }
    if (i > 0) out.push(practiceExercise(items[i - 1], ctx, 1));
  });
  const match = matchExercise(items, ctx);
  if (match) out.push(match);
  for (const item of shuffle(items)) out.push(practiceExercise(item, ctx, 1));
  for (const item of shuffle(items).slice(0, 3)) out.push(practiceExercise(item, ctx, 2));

  const reviews = resolveItems(reviewIds.filter((id) => !def.itemIds.includes(id))).slice(0, 3);
  for (const r of reviews) out.push(practiceExercise(r, { pair, kind: 'review' }, 2));

  return capGraded(out, MAX_GRADED + reviews.length);
}

/** Practice only (review lessons, due reviews, "my words"). */
export function buildPractice(items: AnyItem[], ctx: GenContext, count = 12): Exercise[] {
  if (items.length === 0) return [];
  const picked = shuffle(items).slice(0, Math.min(items.length, count));
  const out: Exercise[] = [];
  const match = matchExercise(picked, ctx);
  picked.forEach((item, i) => {
    out.push(practiceExercise(item, ctx, i < picked.length / 2 ? 1 : 2));
    if (match && i === Math.floor(picked.length / 2)) out.push(match);
  });
  // Top up short sessions with a second round on the same items.
  let k = 0;
  while (out.filter(isGraded).length < Math.min(count, items.length * 2) && k < picked.length) {
    out.push(practiceExercise(picked[k], ctx, 2));
    k++;
  }
  return out;
}

export function buildReview(itemIds: string[], pair: PairId): Exercise[] {
  return buildPractice(resolveItems(itemIds), { pair, kind: 'review' }, 12);
}

/** Checkpoint: one harder question per sampled item; 80% needed to pass. */
export const CHECKPOINT_PASS = 0.8;

export function buildCheckpoint(itemIds: string[], pair: PairId): Exercise[] {
  const items = shuffle(resolveItems(itemIds)).slice(0, 12);
  return items.map((it) => practiceExercise(it, { pair, kind: 'checkpoint' }, 2));
}

/** Speed round: many quick multiple-choice questions on items the learner knows. */
export function buildSpeed(itemIds: string[], pair: PairId): Exercise[] {
  const items = resolveItems(itemIds);
  if (items.length === 0) return [];
  const out: Exercise[] = [];
  let guard = 0;
  while (out.length < 40 && guard < 400) {
    guard++;
    const it = items[Math.floor(Math.random() * items.length)];
    const ex = practiceExercise(it, { pair, kind: 'review' }, Math.random() < 0.5 ? 0 : 1);
    if (ex.type === 'choice') out.push(ex);
  }
  return out;
}

export const SPEED_SECONDS = 60;
