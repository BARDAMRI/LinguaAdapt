import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseCard } from '../components/ExerciseCard';
import { LearningProgressBar } from '../components/LearningProgressBar';
import { ProfileSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/PreferencesContext';
import type { AppNav, AppStackParamList } from '../navigation/types';
import { pickSessionExercises } from '../services/exerciseService';
import {
  DEFAULT_SKILLS,
  fetchProfile,
  type ProfileSkills,
} from '../services/profileService';
import {
  finalizePracticeSession,
  recordResult,
  type SessionResultLine,
} from '../services/learningService';
import { isRTL, t } from '../services/i18n';
import type { AppTheme } from '../theme/theme';
import type { Exercise } from '../../types/learning';
import { cardShadowStyle, layoutDirectionStyle } from '../utils/platformStyles';

function categoryTitle(cat: string): string {
  switch (cat) {
    case 'alphabet':
      return t('profile.skillAlphabet');
    case 'vocabulary':
      return t('profile.skillVocabulary');
    case 'sentences':
      return t('profile.skillSentences');
    case 'mixed':
      return t('learning.practiceMixed');
    default:
      return cat;
  }
}

export function LearningSessionScreen() {
  const appTheme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const route = useRoute<RouteProp<AppStackParamList, 'LearningSession'>>();
  const { category, letterChar } = route.params;
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [list, setList] = useState<Exercise[]>([]);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const skillsBeforeRef = useRef<ProfileSkills>(DEFAULT_SKILLS);
  const sessionLinesRef = useRef<SessionResultLine[]>([]);

  const styles = useMemo(() => makeSessionStyles(appTheme, insets), [appTheme, insets]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setReady(false);
    const profile = await fetchProfile(user.id);
    skillsBeforeRef.current = profile?.skills ?? DEFAULT_SKILLS;
    const skills = profile?.skills ?? DEFAULT_SKILLS;
    const lvl = category === 'mixed'
      ? Math.round((skills.alphabet + skills.vocabulary + skills.sentences) / 3) || 1
      : (skills[category] ?? 1);

    let picked = pickSessionExercises(
      category,
      lvl,
      10,
      undefined,
      profile?.native_language,
      profile?.target_language,
    );

    if (letterChar) {
      picked = picked.filter((e) => e.letterData?.char === letterChar);
      // If filtered list is empty, fall back to all letter-trace exercises for that char
      if (picked.length === 0) {
        picked = pickSessionExercises(
          category,
          lvl,
          50,
          undefined,
          profile?.native_language,
          profile?.target_language,
        ).filter((e) => e.letterData?.char === letterChar);
      }
    }

    sessionLinesRef.current = [];
    setList(picked);
    setIndex(0);
    setReady(true);
  }, [category, letterChar, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onExerciseComplete = useCallback(
    async (result: { correct: boolean; userAnswer: string }) => {
      if (!user?.id) return;
      const current = list[index];
      if (!current) return;

      const line: SessionResultLine = {
        exerciseId: current.id,
        correct: result.correct,
        category: current.category,
      };
      sessionLinesRef.current.push(line);
      void recordResult(user.id, current.id, result.correct);

      const next = index + 1;
      if (next >= list.length) {
        const snapshot = [...sessionLinesRef.current];
        sessionLinesRef.current = [];
        const fin = await finalizePracticeSession(
          user.id,
          category,
          snapshot,
          skillsBeforeRef.current,
        );
        if (fin.error) {
          navigation.goBack();
          return;
        }
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'Summary',
                params: {
                  category,
                  total: list.length,
                  correct: snapshot.filter((r) => r.correct).length,
                  newWordsLearned: fin.newWordsLearned,
                  pointsEarned: fin.pointsEarned,
                  streak: fin.streak,
                  totalPoints: fin.totalPoints,
                  leveledUp: fin.leveledUp,
                  skillsBefore: skillsBeforeRef.current,
                  skillsAfter: fin.skillsAfter,
                },
              },
            ],
          }),
        );
        return;
      }
      setIndex(next);
    },
    [category, index, list, navigation, user?.id],
  );

  const current = list[index];
  const catLabel = categoryTitle(category);

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, ...layoutDirectionStyle(isRTL) },
      ]}
      testID="session_root"
    >
      <View
        style={[
          styles.toolbar,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
        testID="session_toolbar"
      >
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()} hitSlop={12} testID="session_btn_back">
          <Text style={styles.iconBtnText}>{isRTL ? '›' : '‹'}</Text>
        </Pressable>
        <Text style={styles.toolbarTitle} testID="session_text_title">
          {t('learning.sessionTitle', { category: catLabel })}
        </Text>
      </View>

      {!ready ? (
        <ScrollView
          contentContainerStyle={{ paddingTop: appTheme.spacing.md }}
          showsVerticalScrollIndicator={false}
        >
          <LearningProgressBar currentIndex={0} total={8} />
          <View
            style={[
              styles.cardShell,
              { maxWidth: isWide ? 640 : '100%' },
              cardShadowStyle(appTheme),
            ]}
            testID="session_card_shell"
          >
            <ProfileSkeleton />
          </View>
        </ScrollView>
      ) : list.length === 0 ? (
        <Text
          style={[
            styles.empty,
            {
              textAlign: isRTL ? 'right' : 'left',
              paddingHorizontal: 8,
            },
          ]}
          testID="session_text_empty"
        >
          {t('learning.sessionNoExercises')}
        </Text>
      ) : (
        <>
          <LearningProgressBar currentIndex={index} total={list.length} />
          <View
            style={[
              styles.cardShell,
              { maxWidth: isWide ? 640 : '100%' },
              cardShadowStyle(appTheme),
            ]}
            testID="session_card_shell"
          >
            {current ? (
              <Animated.View
                key={current.id}
                entering={SlideInRight.duration(320)}
                exiting={SlideOutLeft.duration(260)}
                style={{ flexGrow: 0 }}
                testID="session_exercise_animated"
              >
                <ExerciseCard
                  exercise={current}
                  onComplete={(r) => {
                    void onExerciseComplete(r);
                  }}
                />
              </Animated.View>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}

function makeSessionStyles(theme: AppTheme, insets: { bottom: number; top: number }) {
  const c = theme.colors;
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.lg + insets.bottom,
    },
    toolbar: {
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    iconBtnText: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: c.primary,
    },
    toolbarTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
    },
    empty: {
      ...theme.typography.body,
      color: c.textSecondary,
      marginTop: theme.spacing.xl,
    },
    cardShell: {
      flex: 1,
      alignSelf: 'center',
      width: '100%',
      backgroundColor: c.surface,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: theme.spacing.lg,
      overflow: 'hidden',
    },
  });
}
