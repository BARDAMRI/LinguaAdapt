import { Platform } from 'react-native';
import type { LinkingOptions } from '@react-navigation/native';

/** GitHub Pages project site (must match app.json experiments.baseUrl + repo name). */
export const GITHUB_PAGES_APP_ROOT = 'https://BARDAMRI.github.io/LinguaAdapt';

/**
 * Deep-link prefixes so React Navigation resolves URLs under the /LinguaAdapt base path
 * when hosted on GitHub Pages, while keeping plain origin for local `expo start --web`.
 */
export function getNavigationLinking(): LinkingOptions<Record<string, unknown>> {
  const prefixes = new Set<string>([GITHUB_PAGES_APP_ROOT]);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { origin, pathname } = window.location;
    if (pathname.startsWith('/LinguaAdapt')) {
      prefixes.add(`${origin}/LinguaAdapt`);
    }
    prefixes.add(origin);
  }

  return {
    prefixes: [...prefixes],
  };
}
