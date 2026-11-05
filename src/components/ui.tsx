import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '../context/PreferencesContext';
import { cardShadowStyle } from '../utils/platformStyles';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Button({ label, onPress, variant = 'primary', disabled, loading, icon, style, testID }: ButtonProps) {
  const theme = useAppTheme();
  const c = theme.colors;
  const bg =
    variant === 'primary' ? c.primary
      : variant === 'success' ? c.success
        : variant === 'danger' ? c.danger
          : variant === 'secondary' ? c.surface
            : 'transparent';
  const fg = variant === 'secondary' || variant === 'ghost' ? c.primary : c.onPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: variant === 'secondary' ? c.border : 'transparent',
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.btnInner}>
          {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
          <Text style={[styles.btnLabel, { color: fg }]}>{label}</Text>
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
  style,
  testID,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      style={({ pressed }) => [
        styles.iconBtn,
        { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color ?? theme.colors.primary} />
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        cardShadowStyle(theme),
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ProgressBar({ value, color, height = 12 }: { value: number; color?: string; height?: number }) {
  const theme = useAppTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: theme.colors.border }]}>
      <View
        style={{
          width: `${pct * 100}%`,
          height,
          borderRadius: height / 2,
          backgroundColor: color ?? theme.colors.success,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnLabel: { fontSize: 17, fontWeight: '700' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  track: { width: '100%', overflow: 'hidden' },
});
