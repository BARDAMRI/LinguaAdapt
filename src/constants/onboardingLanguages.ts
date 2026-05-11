/** ISO-ish codes stored in `profiles.native_language` / `profiles.target_language`. */
export const ONBOARDING_LANGUAGE_CODES = [
  'he',
  'en',
  'ar',
  'es',
  'fr',
  'ru',
  'de',
] as const;

export type OnboardingLanguageCode = (typeof ONBOARDING_LANGUAGE_CODES)[number];

/**
 * Defaults match `initialExercises.json`: English UI/helpers, Hebrew as L2 (`learningPair` en-he).
 * Users can still pick other pairs; unsupported pairs show an empty-state until more catalogs exist.
 */
export const DEFAULT_NATIVE_LANGUAGE: OnboardingLanguageCode = 'en';
export const DEFAULT_TARGET_LANGUAGE: OnboardingLanguageCode = 'he';
