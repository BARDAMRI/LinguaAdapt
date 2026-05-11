import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { useAppTheme } from '../context/PreferencesContext';

type SkeletonProps = {
  width?: ViewStyle['width'];
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  style,
}: SkeletonProps) {
  const theme = useAppTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: theme.colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function WelcomeCardSkeleton() {
  const theme = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        row: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md },
      }),
    [theme],
  );
  return (
    <View style={styles.card}>
      <Skeleton height={36} width="75%" />
      <Skeleton height={20} width="100%" />
      <Skeleton height={20} width="90%" />
      <View style={styles.row}>
        <Skeleton height={40} width={72} radius={theme.radii.md} />
        <Skeleton height={40} width={72} radius={theme.radii.md} />
      </View>
      <Skeleton height={48} width="100%" radius={theme.radii.md} />
    </View>
  );
}

export function ProfileSkeleton() {
  const theme = useAppTheme();
  return (
    <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
      <Skeleton height={28} width="60%" />
      <Skeleton height={120} width="100%" radius={theme.radii.lg} />
      <Skeleton height={22} width="40%" />
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} height={56} width="100%" radius={theme.radii.md} />
      ))}
    </View>
  );
}
