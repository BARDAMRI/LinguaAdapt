import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/PreferencesContext';
import { AlphabetOverviewScreen } from '../screens/AlphabetOverviewScreen';
import { AppBootstrapScreen } from '../screens/AppBootstrapScreen';
import { ConversationScreen } from '../screens/ConversationScreen';
import { LearningSessionScreen } from '../screens/LearningSessionScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PlacementTestScreen } from '../screens/PlacementTestScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import type { AppStackParamList, AuthStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator
      initialRouteName="AppBootstrap"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <AppStack.Screen name="AppBootstrap" component={AppBootstrapScreen} />
      <AppStack.Screen name="Welcome" component={WelcomeScreen} />
      <AppStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AppStack.Screen name="Profile" component={ProfileScreen} />
      <AppStack.Screen name="PlacementTest" component={PlacementTestScreen} />
      <AppStack.Screen name="AlphabetOverview" component={AlphabetOverviewScreen} />
      <AppStack.Screen name="LearningSession" component={LearningSessionScreen} />
      <AppStack.Screen name="Summary" component={SummaryScreen} />
      <AppStack.Screen name="Settings" component={SettingsScreen} />
      <AppStack.Screen name="Conversation" component={ConversationScreen} />
    </AppStack.Navigator>
  );
}

export function RootNavigator() {
  const { session, loading } = useAuth();
  const theme = useAppTheme();

  const loadingStyles = useMemo(
    () =>
      StyleSheet.create({
        loading: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        },
      }),
    [theme.colors.background],
  );

  if (loading) {
    return (
      <View style={loadingStyles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return session ? <AppNavigator /> : <AuthNavigator />;
}
