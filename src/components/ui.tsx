import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '../context/PreferencesContext';
import { isRTL } from '../services/i18n';
import type { AppTheme } from '../theme/theme';
import { cardShadowStyle, hexToRgba, rowDir, textStart } from '../utils/platformStyles';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Soft background for an accent color (icon badges, chips). */
export function tint(theme: AppTheme, color: string, strength = 1): string {
  return hexToRgba(color, (theme.isDark ? 0.2 : 0.11) * strength);
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  /** primary: filled brand · secondary: tonal · outline: bordered · ghost: text only. */
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'danger' | 'ghost' | 'inverse';
  size?: 'lg' | 'md' | 'sm';
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  /** Puts the icon after the label (e.g. a forward arrow). */
  iconAfter?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Button({ label, onPress, variant = 'primary', size = 'lg', disabled, loading, icon, iconAfter, color, style, testID }: ButtonProps) {
  const theme = useAppTheme();
  const c = theme.colors;
  const accent = color ?? (variant === 'success' ? c.success : variant === 'danger' ? c.danger : c.primary);
  const filled = variant === 'primary' || variant === 'success' || variant === 'danger';
  const bg = filled
    ? accent
    : variant === 'secondary'
      ? tint(theme, accent)
      : variant === 'outline'
        ? c.surface
        : variant === 'inverse'
          ? '#FFFFFF'
          : 'transparent';
  const fg = filled ? c.onPrimary : accent;
  const h = size === 'lg' ? 54 : size === 'md' ? 46 : 36;
  const fs = size === 'sm' ? 14 : 16;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      testID={testID}
      style={({ pressed }) => [
        styles.btn,
        {
          minHeight: h,
          borderRadius: size === 'sm' ? 10 : 14,
          paddingHorizontal: size === 'sm' ? 12 : 18,
          backgroundColor: bg,
          borderColor: variant === 'outline' ? c.border : 'transparent',
          opacity: disabled ? 0.4 : pressed ? 0.86 : 1,
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={[styles.btnInner, { flexDirection: rowDir(isRTL !== Boolean(iconAfter)) }]}>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 19} color={fg} /> : null}
          <Text style={[styles.btnLabel, { color: fg, fontSize: fs }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  size = 22,
  color,
  variant = 'tonal',
  style,
  testID,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  size?: number;
  color?: string;
  variant?: 'tonal' | 'surface' | 'plain';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const theme = useAppTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      style={({ pressed }) => [
        styles.iconBtn,
        variant === 'tonal' && { backgroundColor: c.surfaceElevated },
        variant === 'surface' && [{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }, cardShadowStyle(theme)],
        { opacity: pressed ? 0.65 : 1 },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color ?? c.text} />
    </Pressable>
  );
}

export function Card({
  children,
  style,
  onPress,
  testID,
  flat,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
  /** No shadow (cards inside cards, dense lists). */
  flat?: boolean;
}) {
  const theme = useAppTheme();
  const base = [
    styles.card,
    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
    flat ? null : cardShadowStyle(theme),
  ];
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        testID={testID}
        accessibilityRole="button"
        style={({ pressed }) => [...base, { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[...base, style]} testID={testID}>
      {children}
    </View>
  );
}

export function ProgressBar({
  value,
  color,
  height = 8,
  trackColor,
}: {
  value: number;
  color?: string;
  height?: number;
  trackColor?: string;
}) {
  const theme = useAppTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor ?? theme.colors.surfaceElevated, alignItems: isRTL ? 'flex-end' : 'flex-start' },
      ]}
    >
      <View
        style={{
          width: `${pct * 100}%`,
          minWidth: pct > 0 ? height : 0,
          height,
          borderRadius: height / 2,
          backgroundColor: color ?? theme.colors.primary,
        }}
      />
    </View>
  );
}

/** An icon on a tinted rounded square: the app's standard leading visual. */
export function IconBadge({
  icon,
  color,
  size = 40,
  filled,
  round,
  children,
}: {
  icon?: IconName;
  color: string;
  size?: number;
  filled?: boolean;
  round?: boolean;
  children?: ReactNode;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: round ? size / 2 : Math.round(size * 0.3),
        backgroundColor: filled ? color : tint(theme, color),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon ? <Ionicons name={icon} size={Math.round(size * 0.5)} color={filled ? '#FFFFFF' : color} /> : children}
    </View>
  );
}

/** Small rounded label with an optional icon (stats, status). */
export function Pill({
  icon,
  label,
  color,
  onPress,
  testID,
  style,
}: {
  icon?: IconName;
  label: string;
  color: string;
  onPress?: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  const body = (
    <View style={[styles.pill, { backgroundColor: tint(theme, color), flexDirection: rowDir(isRTL) }, style]}>
      {icon ? <Ionicons name={icon} size={15} color={color} /> : null}
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} hitSlop={6} testID={testID} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {body}
    </Pressable>
  );
}

/** Section title with an optional trailing action. */
export function SectionHeader({ title, action, style }: { title: string; action?: { label: string; onPress: () => void }; style?: StyleProp<ViewStyle> }) {
  const theme = useAppTheme();
  const c = theme.colors;
  return (
    <View style={[styles.sectionHead, { flexDirection: rowDir(isRTL) }, style]}>
      <Text style={[theme.type.headline, styles.sectionTitle, { color: c.text }, textStart(isRTL)]}>{title}</Text>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <Text style={[theme.type.callout, { color: c.primary, fontWeight: '600' }]}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** iOS-style segmented control. */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string; icon?: IconName; testID?: string }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  const c = theme.colors;
  return (
    <View style={[styles.segTrack, { backgroundColor: c.surfaceElevated, flexDirection: rowDir(isRTL) }, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            testID={o.testID}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segItem, active && [{ backgroundColor: c.surface }, cardShadowStyle(theme)]]}
          >
            {o.icon ? <Ionicons name={o.icon} size={15} color={active ? c.primary : c.textSecondary} /> : null}
            <Text
              style={[styles.segText, { color: active ? c.text : c.textSecondary, fontWeight: active ? '700' : '600' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Label + value text pair used in stat tiles. */
export function Stat({ icon, color, value, label, style }: { icon: IconName; color: string; value: string; label: string; style?: StyleProp<ViewStyle> }) {
  const theme = useAppTheme();
  const c = theme.colors;
  return (
    <Card style={[styles.stat, style]}>
      <IconBadge icon={icon} color={color} size={34} />
      <Text style={[styles.statValue, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: c.textSecondary }]} numberOfLines={2}>
        {label}
      </Text>
    </Card>
  );
}

export function Caption({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const theme = useAppTheme();
  return <Text style={[theme.type.caption, { color: theme.colors.textSecondary }, textStart(isRTL), style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  btnInner: { alignItems: 'center', gap: 8 },
  btnLabel: { fontWeight: '700', letterSpacing: 0.1 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  track: { width: '100%', overflow: 'hidden' },
  pill: { alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontSize: 14, fontWeight: '700' },
  sectionHead: { alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  sectionTitle: { flex: 1 },
  segTrack: { borderRadius: 12, padding: 3, gap: 3 },
  segItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 9 },
  segText: { fontSize: 14, flexShrink: 1 },
  stat: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 8 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
});
