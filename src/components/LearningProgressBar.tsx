import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../context/PreferencesContext';
import type { AppTheme } from '../theme/theme';

type Props = {
  currentIndex: number;
  total: number;
};

export function LearningProgressBar({ currentIndex, total }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const safeTotal = Math.max(1, total);
  const progress = Math.min(1, (currentIndex + 1) / safeTotal);

  return (
    <View style={styles.outer} testID="progress_outer">
      <View style={styles.track} testID="progress_track">
        <View style={[styles.fill, { width: `${progress * 100}%` }]} testID="progress_fill" />
      </View>
      <Text style={styles.label} testID="progress_label">
        {currentIndex + 1} / {total}
      </Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const c = theme.colors;
  return StyleSheet.create({
    outer: {
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
    },
    track: {
      height: 8,
      borderRadius: theme.radii.full,
      backgroundColor: c.border,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: theme.radii.full,
      backgroundColor: c.primary,
    },
    label: {
      marginTop: theme.spacing.xs,
      fontSize: 13,
      fontWeight: '600',
      color: c.textSecondary,
      textAlign: 'center',
    },
  });
}
