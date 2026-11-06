/**
 * Builds the course path for a language pair:
 * letters → reading (niqqud / phonics) → words → sentences & phrases.
 */
import { ENGLISH_LETTER_GROUPS } from '../content/en/letters';
import { PHONICS_GROUPS } from '../content/en/phonics';
import { HEBREW_FINAL_LETTERS, HEBREW_LETTER_GROUPS } from '../content/he/letters';
import { NIQQUD_SIGNS, READING_MARKS } from '../content/he/niqqud';
import type { PairId } from '../content/types';
import { getCourseContent } from '../content/courseContent';
import type { CourseDef, LessonDef, StageDef, UnitDef } from './types';

const heLetterId = (ch: string) => `he:letter:${ch}`;
const enLetterId = (ch: string) => `en:letter:${ch}`;
const vowelId = (key: string) => `he:vowel:${key}`;

function lesson(
  id: string,
  kind: LessonDef['kind'],
  title: LessonDef['title'],
  itemIds: string[],
  review = false,
): LessonDef {
  return { id, kind, title, itemIds, review };
}

function hebrewLettersStage(): StageDef {
  const g = HEBREW_LETTER_GROUPS;
  const ids = (i: number) => g[i].map(heLetterId);
  const label = (i: number) => g[i].join(' ');
  const units: UnitDef[] = [
    {
      id: 'he-l-u1', stage: 'letters', emoji: '🌱',
      title: { en: 'First letters', he: 'אותיות ראשונות' },
      lessons: [
        lesson('he-l-1', 'he-letters', { en: label(0), he: label(0) }, ids(0)),
        lesson('he-l-2', 'he-letters', { en: label(1), he: label(1) }, ids(1)),
        lesson('he-l-3', 'he-letters', { en: 'Review', he: 'חזרה' }, [...ids(0), ...ids(1)], true),
      ],
    },
    {
      id: 'he-l-u2', stage: 'letters', emoji: '🌿',
      title: { en: 'More letters', he: 'עוד אותיות' },
      lessons: [
        lesson('he-l-4', 'he-letters', { en: label(2), he: label(2) }, ids(2)),
        lesson('he-l-5', 'he-letters', { en: label(3), he: label(3) }, ids(3)),
        lesson('he-l-6', 'he-letters', { en: 'Review', he: 'חזרה' }, [...ids(2), ...ids(3)], true),
      ],
    },
    {
      id: 'he-l-u3', stage: 'letters', emoji: '🌳',
      title: { en: 'The whole alphabet', he: 'כל האלף־בית' },
      lessons: [
        lesson('he-l-7', 'he-letters', { en: label(4), he: label(4) }, ids(4)),
        lesson('he-l-8', 'he-letters', { en: label(5), he: label(5) }, ids(5)),
        lesson('he-l-9', 'he-letters', { en: 'All 22 letters', he: 'כל 22 האותיות' }, g.flat().map(heLetterId), true),
      ],
    },
    {
      id: 'he-l-u4', stage: 'letters', emoji: '🔚',
      title: { en: 'Final letters', he: 'אותיות סופיות' },
      lessons: [
        lesson('he-l-10', 'he-finals', { en: 'ך ם ן', he: 'ך ם ן' }, HEBREW_FINAL_LETTERS.slice(0, 3).map((f) => f.id)),
        lesson('he-l-11', 'he-finals', { en: 'ף ץ', he: 'ף ץ' }, HEBREW_FINAL_LETTERS.slice(3).map((f) => f.id)),
        lesson('he-l-12', 'he-lookalikes', { en: 'Look-alikes', he: 'אותיות דומות' },
          ['ב', 'כ', 'ד', 'ר', 'ה', 'ח', 'ת', 'ו', 'ז', 'ס', 'ע', 'צ', 'ג', 'נ', 'ט', 'מ'].map(heLetterId), true),
      ],
    },
  ];
  return { id: 'letters', units };
}

function niqqudStage(): StageDef {
  const v = (keys: string[]) => keys.map(vowelId);
  const units: UnitDef[] = [
    {
      id: 'he-r-u1', stage: 'reading', emoji: '🅰️',
      title: { en: 'The sounds “a” and “e”', he: 'הצלילים a ו-e' },
      lessons: [
        lesson('he-r-1', 'he-vowels', { en: 'Kamatz & Patach', he: 'קמץ ופתח' }, v(['kamatz', 'patach'])),
        lesson('he-r-2', 'he-vowels', { en: 'Tsere & Segol', he: 'צירה וסגול' }, v(['tsere', 'segol'])),
        lesson('he-r-3', 'he-read', { en: 'Read words', he: 'קריאת מילים' }, v(['kamatz', 'patach', 'tsere', 'segol']), true),
      ],
    },
    {
      id: 'he-r-u2', stage: 'reading', emoji: '🎵',
      title: { en: 'The sounds “i”, “o”, “u”', he: 'הצלילים i, o, u' },
      lessons: [
        lesson('he-r-4', 'he-vowels', { en: 'Chirik', he: 'חיריק' }, v(['chirik'])),
        lesson('he-r-5', 'he-vowels', { en: 'Cholam', he: 'חולם' }, v(['cholam'])),
        lesson('he-r-6', 'he-vowels', { en: 'Shuruk & Kubutz', he: 'שורוק וקובוץ' }, v(['shuruk', 'kubutz'])),
        lesson('he-r-7', 'he-read', { en: 'Read words', he: 'קריאת מילים' }, v(['chirik', 'cholam', 'shuruk', 'kubutz']), true),
      ],
    },
    {
      id: 'he-r-u3', stage: 'reading', emoji: '🔍',
      title: { en: 'Shva and special dots', he: 'שווא ודגשים' },
      lessons: [
        lesson('he-r-8', 'he-vowels', { en: 'Shva & Chataf', he: 'שווא וחטפים' }, v(['shva', 'chataf'])),
        lesson('he-r-9', 'he-marks', { en: 'Dagesh: b/v, k/kh, p/f', he: 'דגש' }, READING_MARKS.slice(0, 3).map((m) => m.id)),
        lesson('he-r-10', 'he-marks', { en: 'Shin & Sin', he: 'שׁ ו-שׂ' }, [READING_MARKS[3].id]),
        lesson('he-r-11', 'he-read', { en: 'Read everything', he: 'קוראים הכול' }, NIQQUD_SIGNS.map((s) => s.id), true),
      ],
    },
  ];
  return { id: 'reading', units };
}

function englishLettersStage(): StageDef {
  const g = ENGLISH_LETTER_GROUPS;
  const ids = (i: number) => g[i].map(enLetterId);
  const label = (i: number) => `${g[i][0]}–${g[i][g[i].length - 1]}`;
  const units: UnitDef[] = [
    {
      id: 'en-l-u1', stage: 'letters', emoji: '🌱',
      title: { en: 'First letters', he: 'אותיות ראשונות' },
      lessons: [
        lesson('en-l-1', 'en-letters', { en: label(0), he: label(0) }, ids(0)),
        lesson('en-l-2', 'en-letters', { en: label(1), he: label(1) }, ids(1)),
        lesson('en-l-3', 'en-letters', { en: 'Review', he: 'חזרה' }, [...ids(0), ...ids(1)], true),
      ],
    },
    {
      id: 'en-l-u2', stage: 'letters', emoji: '🌿',
      title: { en: 'More letters', he: 'עוד אותיות' },
      lessons: [
        lesson('en-l-4', 'en-letters', { en: label(2), he: label(2) }, ids(2)),
        lesson('en-l-5', 'en-letters', { en: label(3), he: label(3) }, ids(3)),
        lesson('en-l-6', 'en-letters', { en: 'Review', he: 'חזרה' }, [...ids(2), ...ids(3)], true),
      ],
    },
    {
      id: 'en-l-u3', stage: 'letters', emoji: '🌳',
      title: { en: 'The whole alphabet', he: 'כל האלף־בית' },
      lessons: [
        lesson('en-l-7', 'en-letters', { en: label(4), he: label(4) }, ids(4)),
        lesson('en-l-8', 'en-case', { en: 'Capital & small', he: 'גדולות וקטנות' }, g.flat().map(enLetterId), true),
        lesson('en-l-9', 'en-lookalikes', { en: 'b d p q …', he: 'b d p q …' },
          ['B', 'D', 'P', 'Q', 'M', 'N', 'U', 'V', 'W', 'I', 'L', 'J'].map(enLetterId), true),
      ],
    },
  ];
  return { id: 'letters', units };
}

function phonicsStage(): StageDef {
  const p = (keys: string[]) => keys.map((k) => `en:phon:${k}`);
  const titles: { en: string; he: string; emoji: string }[] = [
    { en: 'Short vowels', he: 'תנועות קצרות', emoji: '🔤' },
    { en: 'Letter pairs', he: 'צמדי אותיות', emoji: '🤝' },
    { en: 'Magic e & vowel teams', he: 'e שקטה וצמדי תנועות', emoji: '✨' },
    { en: 'R sounds & tricky spellings', he: 'צלילי r ואיותים מבלבלים', emoji: '🧩' },
  ];
  const unitGroups = [
    [0, 1],
    [2, 3],
    [4, 5, 6, 7],
    [8, 9],
  ];
  let n = 0;
  const units: UnitDef[] = unitGroups.map((groupIdx, ui) => {
    const lessons = groupIdx.map((gi) => {
      n++;
      const keys = PHONICS_GROUPS[gi];
      return lesson(`en-r-${n}`, 'en-phonics', { en: keys.join(' · '), he: keys.join(' · ') }, p(keys));
    });
    n++;
    lessons.push(
      lesson(`en-r-${n}`, 'en-phonics', { en: 'Review', he: 'חזרה' }, p(groupIdx.flatMap((gi) => PHONICS_GROUPS[gi])), true),
    );
    return {
      id: `en-r-u${ui + 1}`,
      stage: 'reading',
      emoji: titles[ui].emoji,
      title: { en: titles[ui].en, he: titles[ui].he },
      lessons,
    };
  });
  return { id: 'reading', units };
}

const cache = new Map<string, CourseDef>();

export function buildCourse(pair: PairId): CourseDef {
  const content = getCourseContent(pair);
  const key = `${pair}:${content.version}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const course: CourseDef = {
    pair,
    stages: [
      pair === 'en-he' ? hebrewLettersStage() : englishLettersStage(),
      pair === 'en-he' ? niqqudStage() : phonicsStage(),
      { id: 'words', units: content.wordUnits },
      { id: 'sentences', units: content.sentenceUnits },
    ],
  };
  cache.set(key, course);
  return course;
}

export function findLesson(course: CourseDef, lessonId: string): { lesson: LessonDef; unit: UnitDef } | null {
  for (const s of course.stages) {
    for (const u of s.units) {
      const l = u.lessons.find((x) => x.id === lessonId);
      if (l) return { lesson: l, unit: u };
    }
  }
  return null;
}

export function findUnit(course: CourseDef, unitId: string): UnitDef | null {
  for (const s of course.stages) {
    const u = s.units.find((x) => x.id === unitId);
    if (u) return u;
  }
  return null;
}
