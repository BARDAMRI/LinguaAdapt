import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { darkTheme, lightTheme, type AppTheme } from '../theme/theme';
import { applyLocale, getUiLanguage } from '../services/i18n';

const K_DARK = 'lingua_dark_mode';
const K_SOUND = 'lingua_sound_effects';
const K_LANG = 'lingua_app_language';

export type PreferencesContextValue = {
  theme: AppTheme;
  isDark: boolean;
  setDarkMode: (v: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  appLanguage: string;
  /** Changes the UI language. `remount: false` skips rebuilding the app (used mid-onboarding). */
  setAppLanguage: (lang: string, opts?: { remount?: boolean }) => Promise<void>;
  preferencesLoaded: boolean;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined,
);

type ProviderProps = {
  children: React.ReactNode;
  onLocaleChange?: () => void;
};

export function PreferencesProvider({ children, onLocaleChange }: ProviderProps) {
  const [isDark, setIsDark] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [appLanguage, setAppLanguageState] = useState<string>(getUiLanguage());
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [d, s, lang] = await Promise.all([
          AsyncStorage.getItem(K_DARK),
          AsyncStorage.getItem(K_SOUND),
          AsyncStorage.getItem(K_LANG),
        ]);
        if (!alive) return;
        if (d === '1') setIsDark(true);
        if (d === '0') setIsDark(false);
        if (s === '0') setSoundEnabledState(false);
        if (s === '1') setSoundEnabledState(true);
        if (lang) {
          applyLocale(lang);
          setAppLanguageState(lang);
        }
      } finally {
        if (alive) setPreferencesLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setDarkMode = useCallback((v: boolean) => {
    setIsDark(v);
    void AsyncStorage.setItem(K_DARK, v ? '1' : '0');
  }, []);

  const setSoundEnabled = useCallback((v: boolean) => {
    setSoundEnabledState(v);
    void AsyncStorage.setItem(K_SOUND, v ? '1' : '0');
  }, []);

  const setAppLanguage = useCallback(
    async (lang: string, opts?: { remount?: boolean }) => {
      applyLocale(lang);
      setAppLanguageState(lang);
      await AsyncStorage.setItem(K_LANG, lang);
      if (opts?.remount !== false) onLocaleChange?.();
    },
    [onLocaleChange],
  );

  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);

  const value = useMemo(
    () => ({
      theme,
      isDark,
      setDarkMode,
      soundEnabled,
      setSoundEnabled,
      appLanguage,
      setAppLanguage,
      preferencesLoaded,
    }),
    [
      theme,
      isDark,
      setDarkMode,
      soundEnabled,
      setSoundEnabled,
      appLanguage,
      setAppLanguage,
      preferencesLoaded,
    ],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences requires PreferencesProvider');
  }
  return ctx;
}

export function useAppTheme(): AppTheme {
  return usePreferences().theme;
}
