export type ThemeColors = {
  primary: string;
  /** Pressed / darker brand tone. */
  primaryStrong: string;
  primaryMuted: string;
  primarySoft: string;
  /** Accent for XP, stars and the daily goal. */
  secondary: string;
  secondaryMuted: string;
  secondarySoft: string;
  background: string;
  surface: string;
  /** Tonal fill for tracks, chips and segmented controls. */
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  /** Hairline separators inside cards. */
  divider: string;
  onPrimary: string;
  skeleton: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  /** Streak / fire tone. */
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

type TextToken = { fontSize: number; lineHeight: number; fontWeight: '400' | '500' | '600' | '700' | '800' };

export type AppTheme = {
  colors: ThemeColors;
  radii: { sm: number; md: number; lg: number; xl: number; full: number };
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
  /** Type scale shared by every screen (system font: SF Pro / SF Hebrew on iOS). */
  type: {
    display: TextToken;
    title: TextToken;
    headline: TextToken;
    body: TextToken;
    callout: TextToken;
    caption: TextToken;
    overline: TextToken;
  };
  typography: {
    title: { fontSize: number; fontWeight: '700'; lineHeight: number };
    body: { fontSize: number; lineHeight: number };
    button: { fontSize: number; fontWeight: '600' };
  };
  shadows: { card: Shadow; strong: Shadow };
  isDark: boolean;
};

const type: AppTheme['type'] = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: '800' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  callout: { fontSize: 15, lineHeight: 21, fontWeight: '500' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
};

export const lightTheme: AppTheme = {
  isDark: false,
  colors: {
    primary: '#4F46E5',
    primaryStrong: '#4338CA',
    primaryMuted: '#A5B4FC',
    primarySoft: '#EEF0FE',
    secondary: '#F59E0B',
    secondaryMuted: '#FCD34D',
    secondarySoft: '#FEF6E4',
    background: '#F5F6FA',
    surface: '#FFFFFF',
    surfaceElevated: '#EEF0F5',
    text: '#111827',
    textSecondary: '#5B6475',
    textTertiary: '#9AA1AE',
    border: '#E3E6ED',
    divider: '#EDEFF3',
    onPrimary: '#FFFFFF',
    skeleton: '#E8EAF0',
    success: '#16A34A',
    successSoft: '#EAF7EF',
    danger: '#DC2626',
    dangerSoft: '#FDEEEE',
    warning: '#EA580C',
    warningSoft: '#FFF1E8',
    stage: ['#4F46E5', '#0284C7', '#059669', '#DB2777'],
    locked: '#C9CED8',
  },
  radii: { sm: 8, md: 12, lg: 16, xl: 22, full: 9999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  type,
  typography: {
    title: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
    body: { fontSize: 16, lineHeight: 24 },
    button: { fontSize: 17, fontWeight: '600' },
  },
  shadows: {
    card: {
      shadowColor: '#101828',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    strong: {
      shadowColor: '#101828',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};

export const darkTheme: AppTheme = {
  ...lightTheme,
  isDark: true,
  colors: {
    primary: '#8B93F8',
    primaryStrong: '#A5ABFA',
    primaryMuted: '#4F46E5',
    primarySoft: '#1F2147',
    secondary: '#FBBF24',
    secondaryMuted: '#FCD34D',
    secondarySoft: '#2E2410',
    background: '#0C0D12',
    surface: '#16181F',
    surfaceElevated: '#20232C',
    text: '#F2F4F8',
    textSecondary: '#A0A7B5',
    textTertiary: '#6B7280',
    border: '#2A2E39',
    divider: '#22252E',
    onPrimary: '#0C0D12',
    skeleton: '#20232C',
    success: '#4ADE80',
    successSoft: '#0E2A1A',
    danger: '#F87171',
    dangerSoft: '#341515',
    warning: '#FB923C',
    warningSoft: '#33200F',
    // Filled surfaces carry white text, so stage colors stay mid-tone in dark mode too.
    stage: ['#6366F1', '#0284C7', '#059669', '#DB2777'],
    locked: '#3A3F4B',
  },
  shadows: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 2,
    },
    strong: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};

/** Default light theme for static imports outside providers. */
export const theme = lightTheme;
