import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import type { AppTheme } from '../theme/theme';

/**
 * Avoid invalid `direction` on web ScrollView/View; use `writingDirection` on Text
 * and `textAlign` / `flexDirection: 'row-reverse'` for rows. Native keeps `direction`
 * for proper RTL layout.
 */
export function layoutDirectionStyle(isRTL: boolean): ViewStyle {
  if (Platform.OS === 'web') {
    return {};
  }
  return { direction: isRTL ? 'rtl' : 'ltr' };
}

function expandHex(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return h;
}

function hexToRgba(hex: string, alpha: number): string {
  const full = expandHex(hex);
  if (full.length !== 6) {
    return `rgba(0,0,0,${alpha})`;
  }
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Card elevation: `boxShadow` on web, legacy shadow* + `elevation` on native.
 */
export function cardShadowStyle(theme: AppTheme): ViewStyle {
  const s = theme.shadows.card;
  if (Platform.OS === 'web') {
    const color = s.shadowColor.startsWith('#')
      ? hexToRgba(s.shadowColor, s.shadowOpacity)
      : s.shadowColor;
    return {
      boxShadow: `${s.shadowOffset.width}px ${s.shadowOffset.height}px ${s.shadowRadius}px ${color}`,
    };
  }
  return {
    shadowColor: s.shadowColor,
    shadowOffset: s.shadowOffset,
    shadowOpacity: s.shadowOpacity,
    shadowRadius: s.shadowRadius,
    elevation: s.elevation,
  };
}

export function textWritingDirection(isRTL: boolean): TextStyle {
  return {
    writingDirection: isRTL ? 'rtl' : 'ltr',
  };
}
