import { Platform } from 'react-native';

/**
 * '/LinguaAdapt' when the web app is served from GitHub Pages (app.json
 * experiments.baseUrl), '' locally. Read once when the bundle loads, so it does
 * not depend on the screen the address bar shows later.
 */
export const WEB_BASE_PATH =
  Platform.OS === 'web' && typeof window !== 'undefined' && window.location.pathname.startsWith('/LinguaAdapt') ? '/LinguaAdapt' : '';
