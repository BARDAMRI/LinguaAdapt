import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseCard } from '../components/ExerciseCard';
import { LearningProgressBar } from '../components/LearningProgressBar';
import { useAuth } from '../context/AuthContext';
import type { AppNav } from '../navigation/types';
import { rootNavigationRef } from '../navigation/rootNavigationRef';
import {
  pickPlacementExercises,
} from '../services/exerciseService';
import { fetchProfile, updateProfileStats } from '../services/profileService';
import { isRTL, t } from '../services/i18n';
import { computePlacementSkillLevels } from '../services/placementScoring';
import type { PlacementAnswerRecord } from '../../types/learning';
import { theme } from '../theme/theme';
import { cardShadowStyle, layoutDirectionStyle, textWritingDirection } from '../utils/platformStyles';

const PLACEMENT_QUESTION_COUNT = 6;

export function PlacementTestScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [langNative, setLangNative] = useState<string | undefined>();
  const [langTarget, setLangTarget] = useState<string | undefined>();
  const [langLoading, setLangLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        setLangLoading(false);
        return;
      }
      const profile = await fetchProfile(user.id);
      if (cancelled) return;
      const n = profile?.native_language?.trim();
      const tg = profile?.target_language?.trim();
      setLangNative(n || undefined);
      setLangTarget(tg || undefined);
      setLangLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const exercises = useMemo(
    () =>
      pickPlacementExercises(
        undefined,
        PLACEMENT_QUESTION_COUNT,
        langNative,
        langTarget,
      ),
    [langNative, langTarget],
  );

  const exerciseIds = useMemo(
    () => exercises.map((e) => e.id).join(','),
    [exercises],
  );

  const [index, setIndex] = useState(0);
  const [records, setRecords] = useState<PlacementAnswerRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const finishInFlightRef = useRef(false);

  const finish = useCallback(
    async (final: PlacementAnswerRecord[]) => {
      if (!user?.id || finishInFlightRef.current) return;
      finishInFlightRef.current = true;
      setSaving(true);
      setFinishError(null);
      try {
        const scored = computePlacementSkillLevels(final);
        const result = await updateProfileStats(user.id, {
          current_level: scored.current_level,
          skills: {
            alphabet: scored.alphabet,
            vocabulary: scored.vocabulary,
            sentences: scored.sentences,
            conversation: 2,
          },
        });
        if (result.error) {
          setFinishError(t('learning.saveError'));
          return;
        }
        navigation.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'Welcome' }] }),
        );
      } catch (e) {
        console.error('PlacementTest finish failed', e);
        setFinishError(t('learning.saveError'));
      } finally {
        finishInFlightRef.current = false;
        setSaving(false);
      }
    },
    [navigation, user?.id],
  );

  const onExerciseComplete = useCallback(
    ({ correct, userAnswer }: { correct: boolean; userAnswer: string }) => {
      const exercise = exercises[index];
      const nextRecord: PlacementAnswerRecord = {
        exercise,
        correct,
        userAnswer,
      };
      setRecords((prev) => [...prev, nextRecord]);
      setIndex((i) => (i < exercises.length - 1 ? i + 1 : i));
    },
    [exercises, index],
  );

  useEffect(() => {
    if (exercises.length === 0 || records.length !== exercises.length) return;
    void finish(records);
  }, [exercises.length, records, finish]);

  useEffect(() => {
    setIndex(0);
    setRecords([]);
  }, [exerciseIds]);

  const current = exercises[index];
  const goChangeLanguages = useCallback(() => {
    const a = CommonActions.reset({
      index: 0,
      routes: [{ name: 'Onboarding' }],
    });
    const run = () => {
      if (rootNavigationRef.isReady()) {
        rootNavigationRef.dispatch(a);
      } else {
        navigation.dispatch(a);
      }
    };
    setTimeout(run, 0);
  }, [navigation]);

  if (langLoading) {
    return (
      <View
        style={[
          styles.root,
          styles.fillCenter,
          { paddingTop: insets.top, ...layoutDirectionStyle(isRTL) },
        ]}
        testID="placement_root"
      >
        <ActivityIndicator size="large" color={theme.colors.primary} testID="placement_spinner" />
      </View>
    );
  }

  if (exercises.length === 0) {
    return (
      <View
        style={[
          styles.root,
          { paddingTop: insets.top, ...layoutDirectionStyle(isRTL) },
        ]}
        testID="placement_root"
      >
        <View style={[styles.header, isWide && styles.headerWide]} testID="placement_header">
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]} testID="placement_text_title">
            {t('learning.placementTitle')}
          </Text>
        </View>
        <Text
          style={[
            styles.emptyNote,
            { textAlign: isRTL ? 'right' : 'left' },
            textWritingDirection(isRTL),
          ]}
          testID="placement_text_empty"
        >
          {t('learning.noExercisesForPair')}
        </Text>
        <Pressable style={styles.secondaryBtn} onPress={goChangeLanguages} testID="placement_btn_change_language">
          <Text
            style={[
              styles.secondaryBtnLabel,
              textWritingDirection(isRTL),
            ]}
          >
            🌐  {t('learning.backToLanguages')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryBtn, { marginTop: theme.spacing.sm }]}
          onPress={() => void finish([])}
          disabled={saving}
          testID="placement_btn_skip"
        >
          <Text
            style={[styles.secondaryBtnLabel, textWritingDirection(isRTL)]}
          >
            {isRTL ? '◀' : '▶'}  {t('learning.skipPlacement')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, ...layoutDirectionStyle(isRTL) },
      ]}
      testID="placement_root"
    >
      <View style={[styles.header, isWide && styles.headerWide]} testID="placement_header">
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]} testID="placement_text_title">
          {t('learning.placementTitle')}
        </Text>
        <Text
          style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}
          testID="placement_text_subtitle"
        >
          {t('learning.placementSubtitle')}
        </Text>
      </View>
      <LearningProgressBar currentIndex={index} total={exercises.length} />
      <View
        style={[
          styles.cardShell,
          { maxWidth: isWide ? 640 : '100%' },
          cardShadowStyle(theme),
        ]}
        testID="placement_card_shell"
      >
        {current ? (
          <ExerciseCard
            key={current.id}
            exercise={current}
            onComplete={onExerciseComplete}
          />
        ) : null}
      </View>
      {saving || finishError ? (
        <View style={styles.savingOverlay} testID="placement_overlay_saving">
          {finishError ? (
            <>
              <Text style={styles.overlayError} testID="placement_text_error">{finishError}</Text>
              <Pressable
                style={styles.retryBtn}
                onPress={() => void finish(records)}
                testID="placement_btn_retry"
              >
                <Text style={styles.retryLabel}>{t('learning.retrySubmit')}</Text>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fillCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  emptyNote: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  secondaryBtnLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  headerWide: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 640,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  cardShell: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    overflow: 'hidden',
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  overlayError: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.md,
  },
  retryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
});
