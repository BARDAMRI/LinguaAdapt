import 'react-native-gesture-handler';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { getNavigationLinking } from './src/navigation/linking';
import { rootNavigationRef } from './src/navigation/rootNavigationRef';
import { AuthProvider } from './src/context/AuthContext';
import { PreferencesProvider, useAppTheme, usePreferences } from './src/context/PreferencesContext';
import { ProgressProvider } from './src/progress/ProgressContext';
import { ProgressSync } from './src/progress/ProgressSync';

function ThemedNavigation() {
  const appTheme = useAppTheme();
  const { isDark } = usePreferences();

  const navigationTheme = useMemo((): NavTheme => {
    const base = isDark ? DarkTheme : DefaultTheme;
    const c = appTheme.colors;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: c.primary,
        background: c.background,
        card: c.surface,
        text: c.text,
        border: c.border,
        notification: c.secondary,
      },
    };
  }, [appTheme.colors, isDark]);

  const linking = useMemo(() => getNavigationLinking(), []);

  return (
    <>
      <NavigationContainer ref={rootNavigationRef} theme={navigationTheme} linking={linking}>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  // Changing the UI language rebuilds the tree so every screen re-reads its strings.
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshApp = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <PreferencesProvider onLocaleChange={refreshApp}>
      <AuthProvider>
        <ProgressProvider>
          <ProgressSync />
          <GestureHandlerRootView key={refreshKey} style={styles.root}>
            <SafeAreaProvider>
              <ThemedNavigation />
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </ProgressProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
