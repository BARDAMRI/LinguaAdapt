import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import type { AppTheme } from '../theme/theme';

/**
 * RTL is applied by our own styles on every platform (native mirroring is off,
 * see services/i18n). Use these helpers instead of `direction`.
 */
export function rowDir(rtl: boolean): ViewStyle['flexDirection'] {
  return rtl ? 'row-reverse' : 'row';
}

export function textStart(rtl: boolean): TextStyle {
  return { textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' };
}

export function textWritingDirection(isRTL: boolean): TextStyle {
  return { writingDirection: isRTL ? 'rtl' : 'ltr' };
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

export function hexToRgba(hex: string, alpha: number): string {
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
export function cardShadowStyle(theme: AppTheme, strong = false): ViewStyle {
  const s = strong ? theme.shadows.strong : theme.shadows.card;
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
