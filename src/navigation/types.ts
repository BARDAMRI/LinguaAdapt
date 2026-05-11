import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExerciseCategory } from '../../types/learning';
import type { ProfileSkills, SkillKey } from '../services/profileService';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type SummaryScreenParams = {
  category: ExerciseCategory;
  total: number;
  correct: number;
  newWordsLearned: number;
  pointsEarned: number;
  streak: number;
  totalPoints: number;
  leveledUp: SkillKey[];
  skillsBefore: ProfileSkills;
  skillsAfter: ProfileSkills;
};

export type AppStackParamList = {
  AppBootstrap: undefined;
  Welcome: undefined;
  Onboarding: undefined;
  Profile: undefined;
  PlacementTest: undefined;
  AlphabetOverview: undefined;
  LearningSession: { category: ExerciseCategory; letterChar?: string };
  Summary: SummaryScreenParams;
  Settings: undefined;
  Conversation: { topic?: string };
};

export type AuthNav = NativeStackNavigationProp<AuthStackParamList>;
export type AppNav = NativeStackNavigationProp<AppStackParamList>;
