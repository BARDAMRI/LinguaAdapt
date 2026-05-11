import { supabase } from './supabase';

export type SchemaStatus = {
  profilesOk: boolean;
  otherCoursesOk: boolean;
  userVocabularyOk: boolean;
  /** true when every required table + column exists */
  allOk: boolean;
};

/**
 * Probe the database for required tables and columns.
 * Uses cheap queries that return quickly even on large datasets.
 */
export async function checkDatabaseSchema(): Promise<SchemaStatus> {
  const [profilesResult, vocabResult] = await Promise.all([
    // Fetch the profile row (or nothing) selecting all expected columns.
    // A 400 means a column is missing; a 404 means the table is missing.
    supabase
      .from('profiles')
      .select('id, other_courses')
      .limit(1)
      .maybeSingle(),

    // A head-only count is the lightest way to check if the table exists.
    supabase
      .from('user_vocabulary')
      .select('id', { count: 'exact', head: true })
      .limit(1),
  ]);

  const profilesOk =
    !profilesResult.error ||
    // PGRST116 = "no rows" = table exists, just empty — that's fine
    profilesResult.error.code === 'PGRST116';

  const otherCoursesOk =
    profilesOk &&
    !(profilesResult.error?.message ?? '').toLowerCase().includes('other_courses');

  const userVocabularyOk =
    !vocabResult.error ||
    vocabResult.error.code === 'PGRST116';

  return {
    profilesOk,
    otherCoursesOk,
    userVocabularyOk,
    allOk: profilesOk && otherCoursesOk && userVocabularyOk,
  };
}
