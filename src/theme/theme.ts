export type ThemeColors = {
  primary: string;
  primaryMuted: string;
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
  danger: string;
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
  shadows: {
    card: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    strong: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
  isDark: boolean;
};

export const lightTheme: AppTheme = {
  isDark: false,
  colors: {
    primary: '#4f46e5',       // indigo-600
    primaryMuted: '#a5b4fc',  // indigo-300
    secondary: '#d97706',     // amber-600
    secondaryMuted: '#fcd34d',
    background: '#f8f8fc',    // barely-purple white
    surface: '#ffffff',
    surfaceElevated: '#f1f0fb', // subtle indigo tint
    text: '#0f0f1a',
    textSecondary: '#64748b',
    border: '#ebebf5',
    onPrimary: '#ffffff',
    skeleton: '#e8e8f2',
    success: '#059669',
    danger: '#e11d48',
  },
  radii: { sm: 8, md: 12, lg: 18, xl: 24, full: 9999 },
  spacing: { xs: 6, sm: 12, md: 16, lg: 24, xl: 36, xxl: 52 },
  typography: {
    title: { fontSize: 30, fontWeight: '700', lineHeight: 38 },
    body: { fontSize: 16, lineHeight: 24 },
    button: { fontSize: 16, fontWeight: '600' },
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
    primary: '#818cf8',       // indigo-400
    primaryMuted: '#6366f1',  // indigo-500
    secondary: '#fbbf24',
    secondaryMuted: '#fcd34d',
    background: '#0b0b14',    // near-black with indigo tint
    surface: '#13131f',       // dark indigo surface
    surfaceElevated: '#1c1c2e',
    text: '#f0f0ff',
    textSecondary: '#8b8baa',
    border: '#252538',
    onPrimary: '#0b0b14',
    skeleton: '#1c1c2e',
    success: '#34d399',
    danger: '#fb7185',
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
