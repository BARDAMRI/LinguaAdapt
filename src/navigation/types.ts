import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StageId } from '../course/types';

export type LessonParams =
  | { mode: 'lesson'; lessonId: string }
  | { mode: 'review' }
  | { mode: 'checkpoint'; unitId: string }
  | { mode: 'practice'; itemIds: string[]; title: string };

export type LessonCompleteParams = {
  mode: LessonParams['mode'];
  accuracy: number;
  xp: number;
  streak: number;
  streakExtended: boolean;
  passed?: boolean;
  learned: string[];
  lessonId?: string;
};

export type AppStackParamList = {
  Bootstrap: undefined;
  Onboarding: undefined;
  Home: { stage?: StageId } | undefined;
  Lesson: LessonParams;
  LessonComplete: LessonCompleteParams;
  Dictionary: undefined;
  WordDetail: { wordId: string };
  Phrasebook: undefined;
  Chart: undefined;
  Profile: undefined;
  Settings: undefined;
  Credits: undefined;
  Privacy: undefined;
  Login: undefined;
  Signup: undefined;
};

export type AppNav = NativeStackNavigationProp<AppStackParamList>;
