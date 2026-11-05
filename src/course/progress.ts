/** Which lessons and units are done, open or locked. */
import type { CourseProgress } from '../progress/ProgressContext';
import type { CourseDef, LessonDef, StageDef, StageId, UnitDef } from './types';

export type NodeState = 'done' | 'open' | 'locked';

export type PathState = {
  lesson: Map<string, NodeState>;
  unit: Map<string, NodeState>;
  stage: Map<StageId, NodeState>;
  /** Next lesson to do, for the big "Continue" button. */
  next: { lesson: LessonDef; unit: UnitDef; stage: StageDef } | null;
};

function unitDone(u: UnitDef, p: CourseProgress): boolean {
  return u.lessons.length > 0 && u.lessons.every((l) => p.lessons[l.id]);
}

function stageDone(s: StageDef, p: CourseProgress): boolean {
  return s.units.length > 0 && s.units.every((u) => unitDone(u, p));
}

export function computePath(course: CourseDef, p: CourseProgress): PathState {
  const lesson = new Map<string, NodeState>();
  const unit = new Map<string, NodeState>();
  const stage = new Map<StageId, NodeState>();
  let next: PathState['next'] = null;
  const unlocked = new Set(p.unlockedUnits);
  const words = course.stages.find((s) => s.id === 'words');

  course.stages.forEach((s, si) => {
    const prev = course.stages[si - 1];
    const anyUnlocked = s.units.some((u) => unlocked.has(u.id));
    let stageOpen: boolean;
    if (si === 0) stageOpen = true;
    else if (s.id === 'sentences') {
      // Sentences open unit by unit, alongside the word units.
      stageOpen = anyUnlocked || (words ? words.units.some((u) => unitDone(u, p)) : false) || (prev ? stageDone(prev, p) : false);
    } else stageOpen = anyUnlocked || (prev ? stageDone(prev, p) || stage.get(prev.id) === 'done' : true);

    s.units.forEach((u, ui) => {
      let open: boolean;
      if (!stageOpen) open = false;
      else if (unlocked.has(u.id)) open = true;
      else if (s.id === 'sentences' && words) {
        const wu = words.units[ui];
        open = wu ? unitDone(wu, p) : ui === 0 || unitDone(s.units[ui - 1], p);
      } else open = ui === 0 || unitDone(s.units[ui - 1], p) || unlocked.has(s.units[ui - 1].id);
      const done = unitDone(u, p);
      unit.set(u.id, done ? 'done' : open ? 'open' : 'locked');
      u.lessons.forEach((l, li) => {
        const lDone = Boolean(p.lessons[l.id]);
        const lOpen = open && (li === 0 || Boolean(p.lessons[u.lessons[li - 1].id]));
        const st: NodeState = lDone ? 'done' : lOpen ? 'open' : 'locked';
        lesson.set(l.id, st);
        if (!next && st === 'open') next = { lesson: l, unit: u, stage: s };
      });
    });
    stage.set(s.id, stageDone(s, p) ? 'done' : stageOpen ? 'open' : 'locked');
  });
  return { lesson, unit, stage, next };
}

/** Item ids a checkpoint for `unitId` tests: everything before it in the course. */
export function checkpointItems(course: CourseDef, unitId: string): { itemIds: string[]; unlock: string[] } {
  const itemIds: string[] = [];
  const unlock: string[] = [];
  for (const s of course.stages) {
    for (const u of s.units) {
      unlock.push(u.id);
      if (u.id === unitId) {
        // Test what comes before, or this unit's own content if it is the very first.
        if (itemIds.length === 0) itemIds.push(...u.lessons.flatMap((l) => l.itemIds));
        return { itemIds: [...new Set(itemIds)], unlock };
      }
      // Keep the checkpoint focused on the most recent stage.
      if (s.units.indexOf(u) === 0) itemIds.length = 0;
      itemIds.push(...u.lessons.flatMap((l) => l.itemIds));
    }
  }
  return { itemIds: [...new Set(itemIds)], unlock };
}
