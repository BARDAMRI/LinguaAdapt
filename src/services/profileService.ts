import { Alert } from 'react-native';
import { supabase } from './supabase';

const DB_SETUP_MESSAGE =
  'Database tables not found. Please run the script in supabase/setup_all.sql in your Supabase SQL Editor.';

let missingTablesAlertShown = false;

function isMissingOtherCoursesColumn(error: {
  code?: string;
  message?: string;
}): boolean {
  const msg = (error.message ?? '').toLowerCase();
  return msg.includes('other_courses');
}

function shouldNotifySchemaSetupError(error: {
  code?: string;
  message?: string;
}): boolean {
  // Don't alert for the optional other_courses column — user just hasn't run the migration yet
  if (isMissingOtherCoursesColumn(error)) return false;
  const code = error.code ?? '';
  const msg = (error.message ?? '').toLowerCase();
  if (code === '42P01') return true;
  if (code === 'PGRST205') return true;
  if (
    msg.includes('does not exist') &&
    (msg.includes('profiles') ||
      msg.includes('user_vocabulary') ||
      msg.includes('relation'))
  ) {
    return true;
  }
  return false;
}

function alertMissingDatabaseSetup(): void {
  if (missingTablesAlertShown) {
    return;
  }
  missingTablesAlertShown = true;
  Alert.alert('Database setup required', DB_SETUP_MESSAGE);
}

export type SkillKey =
  | 'alphabet'
  | 'vocabulary'
  | 'sentences'
  | 'conversation';

export type ProfileSkills = Record<SkillKey, number>;

/** A paused course stored alongside the active course */
export interface StoredCourse {
  native: string;
  target: string;
  skills: ProfileSkills;
  currentLevel: number;
}

export type ProfileRow = {
  id: string;
  display_name: string | null;
  current_level: number;
  skills: ProfileSkills;
  practice_streak: number;
  last_practice_date: string | null;
  total_points: number;
  native_language: string | null;
  target_language: string | null;
  other_courses: StoredCourse[];
};

export const PROFILE_COLUMNS =
  'id, display_name, current_level, skills, practice_streak, last_practice_date, total_points, native_language, target_language, other_courses';

const PROFILE_COLUMNS_NO_COURSES =
  'id, display_name, current_level, skills, practice_streak, last_practice_date, total_points, native_language, target_language';

export const DEFAULT_SKILLS: ProfileSkills = {
  alphabet: 0,
  vocabulary: 0,
  sentences: 0,
  conversation: 0,
};

function normalizeSkills(raw: unknown): ProfileSkills {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SKILLS };
  }
  const o = raw as Record<string, unknown>;
  return {
    alphabet: Number(o.alphabet) || 0,
    vocabulary: Number(o.vocabulary) || 0,
    sentences: Number(o.sentences) || 0,
    conversation: Number(o.conversation) || 0,
  };
}

function normalizeOtherCourses(raw: unknown): StoredCourse[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c) => c && typeof c === 'object' && c.native && c.target)
    .map((c) => ({
      native: String(c.native),
      target: String(c.target),
      skills: normalizeSkills(c.skills),
      currentLevel: Number(c.currentLevel) || 0,
    }));
}

function toRow(data: {
  id: string;
  display_name: string | null;
  current_level: number | null;
  skills: unknown;
  practice_streak?: number | null;
  last_practice_date?: string | null;
  total_points?: number | null;
  native_language?: string | null;
  target_language?: string | null;
  other_courses?: unknown;
}): ProfileRow {
  return {
    id: data.id,
    display_name: data.display_name,
    current_level: data.current_level ?? 0,
    skills: normalizeSkills(data.skills),
    practice_streak: data.practice_streak ?? 0,
    last_practice_date: data.last_practice_date ?? null,
    total_points: data.total_points ?? 0,
    native_language: data.native_language ?? null,
    target_language: data.target_language ?? null,
    other_courses: normalizeOtherCourses(data.other_courses),
  };
}

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    // Retry without other_courses if that column hasn't been migrated yet
    if (isMissingOtherCoursesColumn(error)) {
      const { data: data2, error: error2 } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS_NO_COURSES)
        .eq('id', userId)
        .maybeSingle();
      if (error2) {
        if (shouldNotifySchemaSetupError(error2)) alertMissingDatabaseSetup();
        return null;
      }
      if (!data2) return null;
      return toRow({ ...data2, other_courses: [] });
    }
    if (shouldNotifySchemaSetupError(error)) {
      alertMissingDatabaseSetup();
    }
    return null;
  }
  if (!data) return null;
  return toRow(data);
}

export type ProfileUpdate = {
  display_name?: string;
  current_level?: number;
  skills?: Partial<ProfileSkills>;
  practice_streak?: number;
  last_practice_date?: string | null;
  total_points?: number;
  native_language?: string | null;
  target_language?: string | null;
};

export async function updateProfileStats(
  userId: string,
  patch: ProfileUpdate,
): Promise<{ profile: ProfileRow | null; error: string | null }> {
  const existing = await fetchProfile(userId);
  const mergedSkills = {
    ...DEFAULT_SKILLS,
    ...(existing?.skills ?? {}),
    ...(patch.skills ?? {}),
  };

  const payload: Record<string, unknown> = {};
  if (patch.display_name !== undefined) {
    payload.display_name = patch.display_name;
  }
  if (patch.current_level !== undefined) {
    payload.current_level = patch.current_level;
  }
  if (patch.skills !== undefined) {
    payload.skills = mergedSkills;
  }
  if (patch.practice_streak !== undefined) {
    payload.practice_streak = patch.practice_streak;
  }
  if (patch.last_practice_date !== undefined) {
    payload.last_practice_date = patch.last_practice_date;
  }
  if (patch.total_points !== undefined) {
    payload.total_points = patch.total_points;
  }
  if (patch.native_language !== undefined) {
    payload.native_language = patch.native_language;
  }
  if (patch.target_language !== undefined) {
    payload.target_language = patch.target_language;
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...payload }, { onConflict: 'id' })
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    if (shouldNotifySchemaSetupError(error)) {
      alertMissingDatabaseSetup();
    }
    return { profile: null, error: error.message };
  }
  if (!data) {
    return { profile: null, error: 'No profile row returned' };
  }
  return { profile: toRow(data), error: null };
}

export async function upsertProfileBasics(
  userId: string,
  displayName: string | null,
): Promise<{ profile: ProfileRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        display_name: displayName,
        current_level: 0,
        skills: DEFAULT_SKILLS,
        practice_streak: 0,
        total_points: 0,
      },
      { onConflict: 'id' },
    )
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    if (shouldNotifySchemaSetupError(error)) {
      alertMissingDatabaseSetup();
    }
    return { profile: null, error: error.message };
  }
  if (!data) {
    return { profile: null, error: 'No profile row returned' };
  }
  return { profile: toRow(data), error: null };
}

/**
 * Switch to an existing paused course.
 * Saves the current active course into other_courses,
 * then loads the selected course as the new active.
 */
export async function switchCourse(
  userId: string,
  courseIndex: number,
): Promise<{ error: string | null }> {
  const profile = await fetchProfile(userId);
  if (!profile) return { error: 'Could not fetch profile' };

  const target = profile.other_courses[courseIndex];
  if (!target) return { error: 'Course not found' };

  const newOtherCourses = [...profile.other_courses];
  newOtherCourses.splice(courseIndex, 1);

  if (profile.native_language && profile.target_language) {
    newOtherCourses.push({
      native: profile.native_language,
      target: profile.target_language,
      skills: profile.skills,
      currentLevel: profile.current_level,
    });
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      native_language: target.native,
      target_language: target.target,
      skills: target.skills,
      current_level: target.currentLevel,
      other_courses: newOtherCourses,
    })
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Delete the active course. If paused courses exist, promotes the first one.
 * Otherwise resets to a blank state so the user goes through onboarding again.
 */
export async function deleteActiveCourse(
  userId: string,
): Promise<{ error: string | null; hasNewActive: boolean }> {
  const profile = await fetchProfile(userId);
  if (!profile) return { error: 'Could not fetch profile', hasNewActive: false };

  if (profile.other_courses.length > 0) {
    const [newActive, ...rest] = profile.other_courses;
    const { error } = await supabase
      .from('profiles')
      .update({
        native_language: newActive.native,
        target_language: newActive.target,
        skills: newActive.skills,
        current_level: newActive.currentLevel,
        other_courses: rest,
      })
      .eq('id', userId);
    if (error) return { error: error.message, hasNewActive: false };
    return { error: null, hasNewActive: true };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      native_language: null,
      target_language: null,
      skills: DEFAULT_SKILLS,
      current_level: 0,
      other_courses: [],
    })
    .eq('id', userId);

  if (error) return { error: error.message, hasNewActive: false };
  return { error: null, hasNewActive: false };
}

/**
 * Add a brand-new course. Saves the current active course to other_courses
 * and sets up a fresh course for the given language pair.
 */
export async function addCourse(
  userId: string,
  native: string,
  target: string,
): Promise<{ error: string | null }> {
  const profile = await fetchProfile(userId);
  if (!profile) return { error: 'Could not fetch profile' };

  // Duplicate check — active and paused courses
  if (
    (profile.native_language === native && profile.target_language === target) ||
    profile.other_courses.some((c) => c.native === native && c.target === target)
  ) {
    return { error: 'course_exists' };
  }

  const newOtherCourses = [...profile.other_courses];
  if (profile.native_language && profile.target_language) {
    newOtherCourses.push({
      native: profile.native_language,
      target: profile.target_language,
      skills: profile.skills,
      currentLevel: profile.current_level,
    });
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      native_language: native,
      target_language: target,
      skills: DEFAULT_SKILLS,
      current_level: 0,
      other_courses: newOtherCourses,
    })
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Delete a paused course (cannot delete the active course this way).
 */
export async function deletePausedCourse(
  userId: string,
  courseIndex: number,
): Promise<{ error: string | null }> {
  const profile = await fetchProfile(userId);
  if (!profile) return { error: 'Could not fetch profile' };

  const newOtherCourses = [...profile.other_courses];
  newOtherCourses.splice(courseIndex, 1);

  const { error } = await supabase
    .from('profiles')
    .update({ other_courses: newOtherCourses })
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Wipe all user data so the next login lands on fresh onboarding.
 * Uses only standard RLS-governed client calls — no server-side function needed.
 *   1. Delete all SRS rows (user_vocabulary has a delete-own policy).
 *   2. Reset the profile row to a blank slate via the existing update policy.
 *      The auth.users entry is kept; the app re-routes to Onboarding on next login.
 */
export async function deleteAccount(userId: string): Promise<{ error: string | null }> {
  const { error: vocabErr } = await supabase
    .from('user_vocabulary')
    .delete()
    .eq('user_id', userId);
  if (vocabErr) return { error: vocabErr.message };

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      native_language: null,
      target_language: null,
      skills: DEFAULT_SKILLS,
      current_level: 0,
      practice_streak: 0,
      total_points: 0,
      last_practice_date: null,
      other_courses: [],
    })
    .eq('id', userId);
  if (profileErr) return { error: profileErr.message };

  return { error: null };
}

export async function updateOnboardingLanguages(
  userId: string,
  native_language: string,
  target_language: string,
): Promise<{ error: string | null }> {
  // Upsert so this works both for first-time setup and after an account reset
  // where the profile row was deleted but the auth.users row still exists.
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, native_language, target_language }, { onConflict: 'id' });

  if (error) {
    if (shouldNotifySchemaSetupError(error)) {
      alertMissingDatabaseSetup();
    }
    return { error: error.message };
  }
  return { error: null };
}
