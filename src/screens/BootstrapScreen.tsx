import { CommonActions, useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAppTheme, usePreferences } from '../context/PreferencesContext';
import type { AppNav } from '../navigation/types';
import { useProgress } from '../progress/ProgressContext';
import { ensureCourseContent, ensurePhrases } from '../content/packs';

/** Waits for saved progress and preferences, then opens Home or Onboarding. */
export function BootstrapScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<AppNav>();
  const { loaded, state } = useProgress();
  const { preferencesLoaded } = usePreferences();

  useEffect(() => {
    if (!loaded || !preferencesLoaded) return;
    ensurePhrases();
    // Words and sentences download in the background; letters work offline.
    if (state.activePair) void ensureCourseContent(state.activePair);
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: state.activePair ? 'Home' : 'Onboarding' }] }),
    );
  }, [loaded, preferencesLoaded, state.activePair, navigation]);

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]} testID="bootstrap_root">
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
