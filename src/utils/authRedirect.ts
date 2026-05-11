import { Platform } from 'react-native';

/** Must match Supabase Auth → URL Configuration → Redirect URLs. */
const PRODUCTION_WEB_APP_URL = 'https://BARDAMRI.github.io/LinguaAdapt/';

/**
 * Email confirmation / magic-link redirect target for `signUp` on web.
 * - Local dev: current origin (e.g. http://localhost:8081/).
 * - GitHub Pages: canonical app URL under the repo path.
 */
export function getAuthEmailRedirectTo(): string | undefined {
  if (Platform.OS !== 'web') {
    return undefined;
  }
  if (typeof window === 'undefined') {
    return undefined;
  }

  const { hostname, origin, pathname } = window.location;
  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local');

  if (isLocal) {
    if (pathname.startsWith('/LinguaAdapt')) {
      return `${origin}/LinguaAdapt/`;
    }
    return `${origin}/`;
  }

  if (hostname.endsWith('github.io') && pathname.startsWith('/LinguaAdapt')) {
    return PRODUCTION_WEB_APP_URL;
  }

  return `${origin}/`;
}
