import Ionicons from '@expo/vector-icons/Ionicons';
import { CommonActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseView, type DoneResult } from '../components/exercises/ExerciseView';
import { ProgressBar } from '../components/ui';
import { useAppTheme, usePreferences } from '../context/PreferencesContext';
import { getItem } from '../content/registry';
import { useCourseContentVersion } from '../content/courseContent';
import { ensureCourseContent, usePackState } from '../content/packs';
import { buildCourse, findLesson } from '../course/build';
import { checkpointItems } from '../course/progress';
import { buildCheckpoint, buildLesson, buildPractice, buildReview, CHECKPOINT_PASS } from '../engine/lesson';
import { resolveItems } from '../engine/generate';
import { exerciseItemIds, isGraded, type Exercise } from '../engine/types';
import type { AppNav, AppStackParamList } from '../navigation/types';
import { useProgress, type ItemResult } from '../progress/ProgressContext';
import { isRTL, t } from '../services/i18n';
import { stopSpeaking } from '../services/tts';
import { playSfx } from '../utils/exerciseFeedback';
import { rowDir } from '../utils/platformStyles';

function itemLabel(id: string): string | null {
  const it = getItem(id);
  if (!it) return null;
  switch (it.kind) {
    case 'he-letter': return it.data.char;
    case 'he-final': return it.data.char;
    case 'he-vowel': return it.data.nameHe;
    case 'he-mark': return it.data.titleEn;
    case 'en-letter': return `${it.data.upper}${it.data.lower}`;
    case 'en-phonics': return it.data.pattern;
    case 'word': return it.data.he;
    case 'sentence':
    case 'phrase': return null;
  }
}

export function LessonScreen() {
  const theme = useAppTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const { params } = useRoute<RouteProp<AppStackParamList, 'Lesson'>>();
  const { state, finishLesson, unlockUnits, dueItemIds } = useProgress();
  const { soundEnabled } = usePreferences();
  const pair = state.activePair ?? 'en-he';

  const build = (): Exercise[] => {
    const course = buildCourse(pair);
    if (params.mode === 'lesson') {
      const found = findLesson(course, params.lessonId);
      return found ? buildLesson(found.lesson, pair, dueItemIds().slice(0, 6)) : [];
    }
    if (params.mode === 'review') return buildReview(dueItemIds().slice(0, 15), pair);
    if (params.mode === 'checkpoint') return buildCheckpoint(checkpointItems(course, params.unitId).itemIds, pair);
    return buildPractice(resolveItems(params.itemIds), { pair, kind: 'review' }, 12);
  };
  const [queue, setQueue] = useState<Exercise[]>(build);
  const contentVersion = useCourseContentVersion(pair);
  const pack = usePackState();

  // Opened before the word/sentence packs finished loading (e.g. a deep link): build once they arrive.
  useEffect(() => {
    void ensureCourseContent(pair);
  }, [pair]);
  useEffect(() => {
    if (queue.length === 0) setQueue(build());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentVersion]);
  const [index, setIndex] = useState(0);
  const [combo, setCombo] = useState(0);
  const firstAttempt = useRef(new Map<string, boolean>());
  const results = useRef<ItemResult[]>([]);
  const retried = useRef(new Set<string>());
  const finished = useRef(false);

  useEffect(() => () => stopSpeaking(), []);

  const graded = useMemo(() => queue.filter(isGraded).length, [queue]);
  const doneGraded = useMemo(() => queue.slice(0, index).filter(isGraded).length, [queue, index]);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const answers = [...firstAttempt.current.values()];
    const correct = answers.filter(Boolean).length;
    const accuracy = answers.length ? correct / answers.length : 1;
    const passed = params.mode === 'checkpoint' ? accuracy >= CHECKPOINT_PASS : undefined;
    const base = params.mode === 'lesson' ? 10 : params.mode === 'checkpoint' ? (passed ? 20 : 0) : 5;
    const xp = base + correct + (accuracy === 1 && answers.length >= 5 ? 5 : 0);
    const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;
    const lessonId = params.mode === 'lesson' ? params.lessonId : null;
    const { streak, streakExtended } = finishLesson({
      lessonId: params.mode === 'checkpoint' ? null : lessonId,
      // A failed checkpoint should not punish items the learner never studied.
      results: params.mode === 'checkpoint' && !passed ? [] : results.current,
      xp,
      stars,
    });
    if (params.mode === 'checkpoint' && passed) {
      unlockUnits(checkpointItems(buildCourse(pair), params.unitId).unlock);
    }
    playSfx('complete', soundEnabled);
    const learned =
      params.mode === 'lesson'
        ? [...new Set(queue.filter((e) => e.type === 'teach').map((e) => (e.type === 'teach' ? e.itemId : '')))]
            .map(itemLabel)
            .filter((x): x is string => Boolean(x))
        : [];
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'Home' },
          {
            name: 'LessonComplete',
            params: {
              mode: params.mode,
              accuracy,
              xp,
              streak,
              streakExtended,
              passed,
              learned,
              lessonId: lessonId ?? undefined,
            },
          },
        ],
      }),
    );
  }, [finishLesson, navigation, pair, params, queue, soundEnabled, unlockUnits]);

  const onDone = useCallback(
    (r: DoneResult) => {
      const ex = queue[index];
      if (!ex) return;
      let willRetry = false;
      if (isGraded(ex)) {
        const key = ex.id.replace(/~r$/, '');
        if (!firstAttempt.current.has(key)) {
          firstAttempt.current.set(key, r.correct);
          const wrongIds = new Set(r.wrongItemIds ?? []);
          for (const id of exerciseItemIds(ex)) {
            results.current.push({ itemId: id, correct: ex.type === 'match' ? r.correct && !wrongIds.has(id) : r.correct });
          }
        }
        setCombo((n) => (r.correct ? n + 1 : 0));
        // Mistakes come back once at the end (not in checkpoints).
        if (!r.correct && params.mode !== 'checkpoint' && !retried.current.has(key)) {
          retried.current.add(key);
          willRetry = true;
          setQueue((q) => [...q, { ...ex, id: `${key}~r` } as Exercise]);
        }
      }
      const next = index + 1;
      if (next >= queue.length + (willRetry ? 1 : 0)) {
        finish();
        return;
      }
      setIndex(next);
    },
    [finish, index, params.mode, queue],
  );

  const quit = () => {
    const leave = () => navigation.goBack();
    if (doneGraded === 0) return leave();
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${t('lesson.quitTitle')}\n${t('lesson.quitBody')}`)) leave();
      return;
    }
    Alert.alert(t('lesson.quitTitle'), t('lesson.quitBody'), [
      { text: t('lesson.keepGoing'), style: 'cancel' },
      { text: t('lesson.quit'), style: 'destructive', onPress: leave },
    ]);
  };

  const current = queue[index];
  const title =
    params.mode === 'review' ? t('lesson.reviewTitle') : params.mode === 'checkpoint' ? t('lesson.checkpointTitle') : params.mode === 'practice' ? params.title : '';

  if (queue.length === 0) {
    const waiting = pack.course === 'loading' || pack.course === 'idle';
    return (
      <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + 16 }]}>
        <Ionicons name="close" size={30} color={c.textSecondary} onPress={() => navigation.goBack()} accessibilityLabel={t('common.close')} />
        {waiting ? <ActivityIndicator style={{ marginTop: 40 }} color={c.primary} /> : null}
        <Text style={[styles.empty, { color: c.textSecondary }]}>{waiting ? t('home.downloading') : t('home.reviewNone')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + 8 }]} testID="lesson_root">
      <View style={[styles.header, { flexDirection: rowDir(isRTL) }]}>
        <Ionicons name="close" size={30} color={c.textSecondary} onPress={quit} accessibilityLabel={t('common.close')} testID="lesson_btn_close" />
        <View style={{ flex: 1, transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
          <ProgressBar value={graded ? doneGraded / graded : 0} />
        </View>
        {combo >= 3 ? (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={[styles.combo, { color: c.secondary }]}>
            🔥 {combo}
          </Animated.Text>
        ) : null}
      </View>
      {title ? <Text style={[styles.modeTitle, { color: c.textSecondary }]}>{title}</Text> : null}
      <View style={styles.body}>
        {current ? (
          <Animated.View key={current.id} entering={SlideInRight.duration(260)} style={styles.flex}>
            <ExerciseView exercise={current} onDone={onDone} />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 18 },
  header: { alignItems: 'center', gap: 12, marginBottom: 8 },
  combo: { fontSize: 16, fontWeight: '800' },
  modeTitle: { textAlign: 'center', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  body: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center' },
  flex: { flex: 1 },
  empty: { textAlign: 'center', fontSize: 17, marginTop: 40 },
});
