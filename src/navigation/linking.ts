import { Platform } from 'react-native';
import type { LinkingOptions } from '@react-navigation/native';
import { WEB_BASE_PATH } from '../utils/webBase';

/** GitHub Pages project site (must match app.json experiments.baseUrl + repo name). */
export const GITHUB_PAGES_APP_ROOT = 'https://BARDAMRI.github.io/LinguaAdapt';

/**
 * Deep-link prefixes so React Navigation resolves URLs under the /LinguaAdapt base path
 * when hosted on GitHub Pages, while keeping plain origin for local `expo start --web`.
 * On Pages the root `path` keeps /LinguaAdapt in the address bar (/LinguaAdapt/Home), so a
 * reload stays inside the site instead of landing on github.io/Home.
 */
export function getNavigationLinking(): LinkingOptions<Record<string, unknown>> {
  const prefixes = new Set<string>([GITHUB_PAGES_APP_ROOT]);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { origin } = window.location;
    if (WEB_BASE_PATH) prefixes.add(`${origin}${WEB_BASE_PATH}`);
    prefixes.add(origin);
  }

  // No `screens` on purpose: without it React Navigation uses the screen names as paths
  // (/LinguaAdapt/Home); an empty `screens: {}` would match nothing. The type requires it.
  const config = WEB_BASE_PATH ? ({ path: WEB_BASE_PATH.slice(1) } as LinkingOptions<Record<string, unknown>>['config']) : undefined;
  return { prefixes: [...prefixes], ...(config ? { config } : {}) };
}
