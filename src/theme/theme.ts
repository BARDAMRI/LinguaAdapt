export type ThemeColors = {
  primary: string;
  primaryMuted: string;
  primarySoft: string;
  secondary: string;
  secondaryMuted: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  border: string;
  onPrimary: string;
  skeleton: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  /** One color per course stage: letters, reading, words, sentences. */
  stage: [string, string, string, string];
  locked: string;
};

type Shadow = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

export type AppTheme = {
  colors: ThemeColors;
  radii: { sm: number; md: number; lg: number; xl: number; full: number };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    title: { fontSize: number; fontWeight: '700'; lineHeight: number };
    body: { fontSize: number; lineHeight: number };
    button: { fontSize: number; fontWeight: '600' };
  };
  shadows: { card: Shadow; strong: Shadow };
  isDark: boolean;
};

export const lightTheme: AppTheme = {
  isDark: false,
  colors: {
    primary: '#4f46e5',
    primaryMuted: '#a5b4fc',
    primarySoft: '#eef2ff',
    secondary: '#d97706',
    secondaryMuted: '#fcd34d',
    background: '#f8f8fc',
    surface: '#ffffff',
    surfaceElevated: '#f1f0fb',
    text: '#0f0f1a',
    textSecondary: '#5b6475',
    border: '#e4e4f0',
    onPrimary: '#ffffff',
    skeleton: '#e8e8f2',
    success: '#059669',
    successSoft: '#ecfdf5',
    danger: '#e11d48',
    dangerSoft: '#fff1f2',
    warning: '#b45309',
    warningSoft: '#fffbeb',
    stage: ['#4f46e5', '#0891b2', '#16a34a', '#db2777'],
    locked: '#c7c7d6',
  },
  radii: { sm: 8, md: 12, lg: 18, xl: 24, full: 9999 },
  spacing: { xs: 6, sm: 12, md: 16, lg: 24, xl: 36, xxl: 52 },
  typography: {
    title: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
    body: { fontSize: 16, lineHeight: 24 },
    button: { fontSize: 17, fontWeight: '600' },
  },
  shadows: {
    card: {
      shadowColor: '#4f46e5',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    strong: {
      shadowColor: '#4f46e5',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};

export const darkTheme: AppTheme = {
  ...lightTheme,
  isDark: true,
  colors: {
    primary: '#818cf8',
    primaryMuted: '#6366f1',
    primarySoft: '#1e1b4b',
    secondary: '#fbbf24',
    secondaryMuted: '#fcd34d',
    background: '#0b0b14',
    surface: '#13131f',
    surfaceElevated: '#1c1c2e',
    text: '#f0f0ff',
    textSecondary: '#9a9ab8',
    border: '#2a2a40',
    onPrimary: '#0b0b14',
    skeleton: '#1c1c2e',
    success: '#34d399',
    successSoft: '#052e22',
    danger: '#fb7185',
    dangerSoft: '#3a0d18',
    warning: '#fbbf24',
    warningSoft: '#33240a',
    stage: ['#818cf8', '#22d3ee', '#4ade80', '#f472b6'],
    locked: '#3a3a52',
  },
  shadows: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 6,
    },
    strong: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 24,
      elevation: 12,
    },
  },
};

/** Default light theme for static imports outside providers. */
export const theme = lightTheme;
