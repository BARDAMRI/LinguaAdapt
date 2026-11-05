import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BootstrapScreen } from '../screens/BootstrapScreen';
import { ChartScreen } from '../screens/ChartScreen';
import { CreditsScreen, PrivacyScreen } from '../screens/CreditsScreen';
import { DictionaryScreen } from '../screens/DictionaryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LessonCompleteScreen } from '../screens/LessonCompleteScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PhrasebookScreen } from '../screens/PhrasebookScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { WordDetailScreen } from '../screens/WordDetailScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

/** One stack for everyone: accounts are optional (guest mode). */
export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Bootstrap" screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Bootstrap" component={BootstrapScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Lesson" component={LessonScreen} options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      <Stack.Screen name="LessonComplete" component={LessonCompleteScreen} options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="Dictionary" component={DictionaryScreen} options={{ animation: 'default' }} />
      <Stack.Screen name="WordDetail" component={WordDetailScreen} options={{ animation: 'default' }} />
      <Stack.Screen name="Phrasebook" component={PhrasebookScreen} options={{ animation: 'default' }} />
      <Stack.Screen name="Chart" component={ChartScreen} options={{ animation: 'default' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ animation: 'default' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'default' }} />
      <Stack.Screen name="Credits" component={CreditsScreen} options={{ animation: 'default' }} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ animation: 'default' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ animation: 'default' }} />
    </Stack.Navigator>
  );
}
