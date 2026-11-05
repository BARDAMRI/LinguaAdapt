import type { PairId } from '../content/types';

export type StageId = 'letters' | 'reading' | 'words' | 'sentences';

export const STAGES: StageId[] = ['letters', 'reading', 'words', 'sentences'];

export type LessonKind =
  | 'he-letters'
  | 'he-finals'
  | 'he-lookalikes'
  | 'he-vowels'
  | 'he-marks'
  | 'he-read'
  | 'en-letters'
  | 'en-case'
  | 'en-lookalikes'
  | 'en-phonics'
  | 'words'
  | 'phrases'
  | 'sentences';

export type Bilingual = { en: string; he: string };

export type LessonDef = {
  id: string;
  kind: LessonKind;
  title: Bilingual;
  /** Items taught (or, for review lessons, practised) in this lesson. */
  itemIds: string[];
  /** Review lesson: practice only, no teaching cards. */
  review?: boolean;
};

export type UnitDef = {
  id: string;
  stage: StageId;
  title: Bilingual;
  emoji: string;
  lessons: LessonDef[];
};

export type StageDef = {
  id: StageId;
  units: UnitDef[];
};

export type CourseDef = {
  pair: PairId;
  stages: StageDef[];
};
