import { createNavigationContainerRef } from '@react-navigation/native';
import type { AppStackParamList } from './types';

/** Root ref so screens can dispatch reset/replace reliably (esp. web). */
export const rootNavigationRef =
  createNavigationContainerRef<AppStackParamList>();
