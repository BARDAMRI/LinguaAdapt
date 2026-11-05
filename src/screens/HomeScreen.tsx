import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, ProgressBar, type IconName } from '../components/ui';
import { useAppTheme } from '../context/PreferencesContext';
import { useCourseContentVersion } from '../content/courseContent';
import type { PairId } from '../content/types';
import { buildCourse } from '../course/build';
import { computePath, type NodeState } from '../course/progress';
import { STAGES, type Bilingual, type LessonDef, type StageId, type UnitDef } from '../course/types';
import type { AppNav, AppStackParamList } from '../navigation/types';
import { useProgress } from '../progress/ProgressContext';
import { getUiLanguage, isRTL, t } from '../services/i18n';
import { rowDir, textStart } from '../utils/platformStyles';

export function stageTitle(stage: StageId, pair: PairId): string {
  if (stage === 'reading') return pair === 'en-he' ? t('stages.readingHe') : t('stages.readingEn');
  return t(`stages.${stage}`);
}

function stageSub(stage: StageId, pair: PairId): string {
  if (stage === 'reading') return pair === 'en-he' ? t('stages.readingHeSub') : t('stages.readingEnSub');
  return t(`stages.${stage}Sub`);
}

const STAGE_ICON: Record<StageId, IconName> = {
  letters: 'text',
  reading: 'book',
  words: 'chatbubble-ellipses',
  sentences: 'chatbubbles',
};

function bi(b: Bilingual): string {
  return getUiLanguage() === 'he' ? b.he : b.en;
}

function confirm(title: string, body: string, okLabel: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${body}`)) onOk();
    return;
  }
  Alert.alert(title, body, [
    { text: t('common.cancel'), style: 'cancel' },
    { text: okLabel, onPress: onOk },
  ]);
}

export function HomeScreen() {
  const theme = useAppTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const route = useRoute<RouteProp<AppStackParamList, 'Home'>>();
  const { state, course: progress, dueItemIds, xpToday } = useProgress();
  const pair = state.activePair ?? 'en-he';
  const contentVersion = useCourseContentVersion(pair);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const course = useMemo(() => buildCourse(pair), [pair, contentVersion]);
  const path = useMemo(() => computePath(course, progress), [course, progress]);
  const [stage, setStage] = useState<StageId>(() => route.params?.stage ?? path.next?.stage.id ?? 'letters');
  const due = dueItemIds().length;
  const goal = state.settings.dailyGoalXp;
  const stageIndex = STAGES.indexOf(stage);
  const stageColor = c.stage[stageIndex];
  const stageDef = course.stages.find((s) => s.id === stage);

  const openLesson = (l: LessonDef, st: NodeState, u: UnitDef) => {
    if (st === 'locked') {
      confirm(t('home.jumpHere'), t('home.jumpHereBody'), t('home.startTest'), () =>
        navigation.navigate('Lesson', { mode: 'checkpoint', unitId: u.id }),
      );
      return;
    }
    navigation.navigate('Lesson', { mode: 'lesson', lessonId: l.id });
  };

  const quick: { icon: IconName; label: string; onPress: () => void; badge?: number }[] = [
    { icon: 'refresh', label: t('home.review'), onPress: () => navigation.navigate('Lesson', { mode: 'review' }), badge: due },
    { icon: 'search', label: t('home.dictionary'), onPress: () => navigation.navigate('Dictionary') },
    { icon: 'chatbox-ellipses', label: t('home.phrasebook'), onPress: () => navigation.navigate('Phrasebook') },
    { icon: 'grid', label: t('home.chart'), onPress: () => navigation.navigate('Chart') },
  ];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.column}>
          {/* Top bar */}
          <View style={[styles.topBar, { flexDirection: rowDir(isRTL) }]}>
            <Pressable onPress={() => navigation.navigate('Profile')} style={[styles.pill, { backgroundColor: c.warningSoft, flexDirection: rowDir(isRTL) }]} testID="home_btn_streak">
              <Text style={styles.pillIcon}>🔥</Text>
              <Text style={[styles.pillText, { color: c.warning }]}>{state.streak}</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Profile')} style={[styles.pill, { backgroundColor: c.primarySoft, flexDirection: rowDir(isRTL) }]}>
              <Text style={styles.pillIcon}>⚡</Text>
              <Text style={[styles.pillText, { color: c.primary }]}>{state.xp}</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={10} accessibilityLabel={t('home.settings')} testID="home_btn_settings">
              <Ionicons name="settings-outline" size={26} color={c.textSecondary} />
            </Pressable>
          </View>

          {/* Daily goal */}
          <Card style={styles.goalCard}>
            <View style={[styles.goalHead, { flexDirection: rowDir(isRTL) }]}>
              <Text style={[styles.goalTitle, { color: c.text }]}>{t('home.dailyGoal')}</Text>
              <Text style={[styles.goalValue, { color: c.textSecondary }]}>{t('home.dailyGoalValue', { xp: xpToday, goal })}</Text>
            </View>
            <View style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
              <ProgressBar value={xpToday / goal} color={xpToday >= goal ? c.success : c.secondary} />
            </View>
            <Text style={[styles.goalSub, { color: c.textSecondary }, textStart(isRTL)]}>
              {state.streak > 0 ? t('home.streak', { count: state.streak }) : t('home.noStreak')}
            </Text>
          </Card>

          {/* Continue */}
          {path.next ? (
            <Animated.View entering={FadeInUp}>
              <Pressable
                onPress={() => navigation.navigate('Lesson', { mode: 'lesson', lessonId: path.next!.lesson.id })}
                style={({ pressed }) => [styles.continueCard, { backgroundColor: c.stage[STAGES.indexOf(path.next!.stage.id)], opacity: pressed ? 0.9 : 1 }]}
                testID="home_btn_continue"
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.continueKicker, textStart(isRTL)]}>
                    {stageTitle(path.next.stage.id, pair)} · {path.next.unit.emoji} {bi(path.next.unit.title)}
                  </Text>
                  <Text style={[styles.continueTitle, textStart(isRTL)]}>{bi(path.next.lesson.title)}</Text>
                </View>
                <View style={styles.playCircle}>
                  <Ionicons name="play" size={28} color={c.stage[STAGES.indexOf(path.next.stage.id)]} />
                </View>
              </Pressable>
            </Animated.View>
          ) : null}

          {/* Quick actions */}
          <View style={[styles.quickRow, { flexDirection: rowDir(isRTL) }]}>
            {quick.map((q) => (
              <Pressable key={q.label} onPress={q.onPress} style={({ pressed }) => [styles.quick, { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.8 : 1 }]}>
                <Ionicons name={q.icon} size={24} color={c.primary} />
                <Text style={[styles.quickLabel, { color: c.text }]} numberOfLines={1}>{q.label}</Text>
                {q.badge ? (
                  <View style={[styles.badge, { backgroundColor: c.danger }]}>
                    <Text style={styles.badgeText}>{q.badge > 99 ? '99+' : q.badge}</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>

          {/* Stage tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tabs, { flexDirection: rowDir(isRTL) }]}>
            {STAGES.map((s, i) => {
              const st = path.stage.get(s) ?? 'locked';
              const active = s === stage;
              return (
                <Pressable
                  key={s}
                  onPress={() => setStage(s)}
                  testID={`home_tab_${s}`}
                  style={[styles.tab, { borderColor: c.stage[i], backgroundColor: active ? c.stage[i] : c.surface }]}
                >
                  <Ionicons name={st === 'locked' ? 'lock-closed' : st === 'done' ? 'checkmark-circle' : STAGE_ICON[s]} size={16} color={active ? '#fff' : c.stage[i]} />
                  <Text style={[styles.tabText, { color: active ? '#fff' : c.stage[i] }]}>{i + 1}. {stageTitle(s, pair)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.stageSub, { color: c.textSecondary }, textStart(isRTL)]}>{stageSub(stage, pair)}</Text>
          {path.stage.get(stage) === 'locked' && stageIndex > 0 ? (
            <Text style={[styles.lockedHint, { color: c.textSecondary }, textStart(isRTL)]}>
              🔒 {t('stages.lockedHint', { stage: stageTitle(STAGES[stageIndex - 1], pair) })}
            </Text>
          ) : null}

          {/* Units */}
          {stageDef && stageDef.units.length > 0 ? (
            stageDef.units.map((u, ui) => {
              const ust = path.unit.get(u.id) ?? 'locked';
              const doneCount = u.lessons.filter((l) => path.lesson.get(l.id) === 'done').length;
              return (
                <View key={u.id} style={styles.unit} testID={`unit_${u.id}`}>
                  <View style={[styles.unitHead, { backgroundColor: ust === 'locked' ? c.surfaceElevated : stageColor, flexDirection: rowDir(isRTL) }]}>
                    <Text style={styles.unitEmoji}>{u.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.unitKicker, { color: ust === 'locked' ? c.textSecondary : 'rgba(255,255,255,0.85)' }, textStart(isRTL)]}>
                        {t('home.unit', { n: ui + 1 })} · {doneCount}/{u.lessons.length}
                      </Text>
                      <Text style={[styles.unitTitle, { color: ust === 'locked' ? c.text : '#fff' }, textStart(isRTL)]}>{bi(u.title)}</Text>
                    </View>
                    {ust === 'locked' ? (
                      <Pressable
                        onPress={() => confirm(t('home.jumpHere'), t('home.jumpHereBody'), t('home.startTest'), () => navigation.navigate('Lesson', { mode: 'checkpoint', unitId: u.id }))}
                        style={[styles.jumpBtn, { borderColor: c.border }]}
                        testID={`unit_jump_${u.id}`}
                      >
                        <Text style={[styles.jumpText, { color: c.primary }]}>{t('home.jumpHere')}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <View style={styles.nodes}>
                    {u.lessons.map((l, li) => {
                      const st = path.lesson.get(l.id) ?? 'locked';
                      const offset = [0, 46, 70, 46, 0, -46, -70, -46][li % 8];
                      const isNext = path.next?.lesson.id === l.id;
                      return (
                        <View key={l.id} style={[styles.nodeWrap, { transform: [{ translateX: isRTL ? -offset : offset }] }]}>
                          <Pressable
                            onPress={() => openLesson(l, st, u)}
                            testID={`lesson_node_${l.id}`}
                            accessibilityLabel={bi(l.title)}
                            style={({ pressed }) => [
                              styles.node,
                              {
                                backgroundColor: st === 'locked' ? c.locked : st === 'done' ? c.secondary : stageColor,
                                borderColor: isNext ? c.text : 'transparent',
                                transform: [{ scale: pressed ? 0.94 : isNext ? 1.08 : 1 }],
                              },
                            ]}
                          >
                            <Ionicons
                              name={st === 'locked' ? 'lock-closed' : st === 'done' ? 'star' : l.review ? 'barbell' : 'play'}
                              size={28}
                              color="#fff"
                            />
                          </Pressable>
                          <Text style={[styles.nodeLabel, { color: st === 'locked' ? c.textSecondary : c.text }]} numberOfLines={1}>
                            {bi(l.title)}
                          </Text>
                          {st === 'done' ? (
                            <Text style={styles.stars}>{'★'.repeat(progress.lessons[l.id]?.stars ?? 1)}</Text>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })
          ) : (
            <Card style={{ alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 40 }}>🚧</Text>
              <Text style={{ color: c.textSecondary, fontSize: 16 }}>{t('home.comingSoon')}</Text>
            </Card>
          )}

          <Button label={t('home.profile')} variant="secondary" icon="stats-chart" onPress={() => navigation.navigate('Profile')} style={{ marginTop: 12 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16 },
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 14 },
  topBar: { alignItems: 'center', gap: 8 },
  pill: { alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pillIcon: { fontSize: 16 },
  pillText: { fontSize: 16, fontWeight: '800' },
  goalCard: { gap: 8 },
  goalHead: { justifyContent: 'space-between', alignItems: 'center' },
  goalTitle: { fontSize: 16, fontWeight: '800' },
  goalValue: { fontSize: 14, fontWeight: '600' },
  goalSub: { fontSize: 13 },
  continueCard: { borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  continueKicker: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700' },
  continueTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  playCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  quickRow: { gap: 10 },
  quick: { flex: 1, borderWidth: 1, borderRadius: 16, paddingVertical: 12, alignItems: 'center', gap: 4 },
  quickLabel: { fontSize: 12, fontWeight: '700' },
  badge: { position: 'absolute', top: 6, right: 8, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  tabs: { gap: 8, paddingVertical: 2 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  tabText: { fontSize: 14, fontWeight: '800' },
  stageSub: { fontSize: 14 },
  lockedHint: { fontSize: 14, fontWeight: '600' },
  unit: { gap: 10, marginTop: 6 },
  unitHead: { borderRadius: 18, padding: 14, alignItems: 'center', gap: 12 },
  unitEmoji: { fontSize: 30 },
  unitKicker: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  unitTitle: { fontSize: 19, fontWeight: '800' },
  jumpBtn: { backgroundColor: '#fff', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  jumpText: { fontSize: 12, fontWeight: '800' },
  nodes: { alignItems: 'center', gap: 6, paddingVertical: 6 },
  nodeWrap: { alignItems: 'center', width: 140 },
  node: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderBottomWidth: 6 },
  nodeLabel: { fontSize: 13, fontWeight: '700', marginTop: 4, maxWidth: 140 },
  stars: { color: '#f59e0b', fontSize: 13 },
});
