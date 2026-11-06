import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, IconBadge, IconButton, Pill, ProgressBar, SectionHeader, tint, type IconName } from '../components/ui';
import { useAppTheme } from '../context/PreferencesContext';
import { useCourseContentVersion } from '../content/courseContent';
import { ensureCourseContent, usePackState } from '../content/packs';
import type { PairId } from '../content/types';
import { buildCourse } from '../course/build';
import { computePath, type NodeState, type PathState } from '../course/progress';
import { STAGES, type Bilingual, type LessonDef, type StageId, type UnitDef } from '../course/types';
import type { AppNav, AppStackParamList } from '../navigation/types';
import { useProgress } from '../progress/ProgressContext';
import { getUiLanguage, isRTL, t } from '../services/i18n';
import { cardShadowStyle, rowDir, textStart } from '../utils/platformStyles';

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

function lessonsDone(u: UnitDef, path: PathState): number {
  return u.lessons.filter((l) => path.lesson.get(l.id) === 'done').length;
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
  const [extraUnits, setExtraUnits] = useState(0);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const pack = usePackState();
  const due = dueItemIds().length;
  const goal = state.settings.dailyGoalXp;
  const goalDone = xpToday >= goal;
  const stageIndex = STAGES.indexOf(stage);
  const stageColor = c.stage[stageIndex];
  const stageDef = course.stages.find((s) => s.id === stage);
  // Long stages (words: ~90 units): show up to a few units past the learner's position.
  const firstLocked = stageDef ? stageDef.units.findIndex((u) => path.unit.get(u.id) === 'locked') : -1;
  const visibleCount = stageDef
    ? Math.min(stageDef.units.length, (firstLocked === -1 ? stageDef.units.length : firstLocked) + 3 + extraUnits)
    : 0;

  const stageProgress = (id: StageId) => {
    const s = course.stages.find((x) => x.id === id);
    if (!s) return 0;
    const all = s.units.flatMap((u) => u.lessons);
    return all.length ? all.filter((l) => path.lesson.get(l.id) === 'done').length / all.length : 0;
  };

  const jump = (u: UnitDef) =>
    confirm(t('home.jumpHere'), t('home.jumpHereBody'), t('home.startTest'), () => navigation.navigate('Lesson', { mode: 'checkpoint', unitId: u.id }));

  const openLesson = (l: LessonDef, st: NodeState, u: UnitDef) => {
    if (st === 'locked') return jump(u);
    navigation.navigate('Lesson', { mode: 'lesson', lessonId: l.id });
  };

  const next = path.next;
  const nextColor = next ? c.stage[STAGES.indexOf(next.stage.id)] : c.primary;
  const nextUnitDone = next ? lessonsDone(next.unit, path) : 0;

  const tools: { icon: IconName; label: string; onPress: () => void; color: string; testID: string }[] = [
    { icon: 'search', label: t('home.dictionary'), onPress: () => navigation.navigate('Dictionary'), color: c.stage[2], testID: 'home_btn_dictionary' },
    { icon: 'chatbox-ellipses', label: t('home.phrasebook'), onPress: () => navigation.navigate('Phrasebook'), color: c.stage[3], testID: 'home_btn_phrasebook' },
    { icon: 'grid', label: t('home.chart'), onPress: () => navigation.navigate('Chart'), color: c.stage[1], testID: 'home_btn_chart' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.column}>
          {/* Top bar */}
          <View style={[styles.topBar, { flexDirection: rowDir(isRTL) }]}>
            <View style={{ flex: 1 }}>
              <Text style={[theme.type.overline, styles.brand, { color: c.textTertiary }, textStart(isRTL)]}>LinguaAdapt</Text>
              <Text style={[theme.type.title, { color: c.text }, textStart(isRTL)]} numberOfLines={1}>
                {pair === 'en-he' ? t('home.learningHe') : t('home.learningEn')}
              </Text>
            </View>
            <Pill icon="flame" label={String(state.streak)} color={c.warning} onPress={() => navigation.navigate('Profile')} testID="home_btn_streak" />
            <Pill icon="flash" label={String(state.xp)} color={c.primary} onPress={() => navigation.navigate('Profile')} />
            <IconButton icon="settings-outline" variant="surface" onPress={() => navigation.navigate('Settings')} label={t('home.settings')} testID="home_btn_settings" />
          </View>

          {/* Continue */}
          {next ? (
            <Animated.View entering={FadeInUp.duration(300)}>
              <Pressable
                onPress={() => navigation.navigate('Lesson', { mode: 'lesson', lessonId: next.lesson.id })}
                style={({ pressed }) => [styles.hero, cardShadowStyle(theme, true), { backgroundColor: nextColor, opacity: pressed ? 0.94 : 1 }]}
                testID="home_btn_continue"
              >
                <View style={[styles.heroDecor, { [isRTL ? 'left' : 'right']: -40 }]} pointerEvents="none" />
                <View style={[styles.heroDecorSmall, { [isRTL ? 'left' : 'right']: 50 }]} pointerEvents="none" />
                <View style={[styles.heroKickerRow, { flexDirection: rowDir(isRTL) }]}>
                  <Ionicons name={STAGE_ICON[next.stage.id]} size={14} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.heroKicker} numberOfLines={1}>
                    {t('home.continueKicker')} · {stageTitle(next.stage.id, pair)}
                  </Text>
                </View>
                <Text style={[styles.heroTitle, textStart(isRTL)]} numberOfLines={2}>
                  {bi(next.unit.title)}
                </Text>
                <Text style={[styles.heroSub, textStart(isRTL)]} numberOfLines={1}>
                  {bi(next.lesson.title)}
                </Text>
                <View style={[styles.heroFoot, { flexDirection: rowDir(isRTL) }]}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <ProgressBar value={nextUnitDone / next.unit.lessons.length} color="#FFFFFF" trackColor="rgba(255,255,255,0.25)" height={6} />
                    <Text style={[styles.heroMeta, textStart(isRTL)]}>
                      {t('home.lessonsCount', { done: nextUnitDone, total: next.unit.lessons.length })}
                    </Text>
                  </View>
                  <View style={[styles.heroBtn, { flexDirection: rowDir(isRTL) }]}>
                    <Ionicons name="play" size={16} color={nextColor} />
                    <Text style={[styles.heroBtnText, { color: nextColor }]}>{t('home.start')}</Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ) : null}

          {/* Daily goal */}
          <Card style={[styles.goal, { flexDirection: rowDir(isRTL) }]}>
            <IconBadge icon={goalDone ? 'checkmark' : 'flag'} color={goalDone ? c.success : c.secondary} size={42} filled={goalDone} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={[styles.rowBetween, { flexDirection: rowDir(isRTL) }]}>
                <Text style={[theme.type.headline, { color: c.text }]}>{goalDone ? t('home.goalDone') : t('home.dailyGoal')}</Text>
                <Text style={[theme.type.caption, { color: c.textSecondary }]}>{t('home.dailyGoalValue', { xp: Math.min(xpToday, goal), goal })}</Text>
              </View>
              <ProgressBar value={xpToday / goal} color={goalDone ? c.success : c.secondary} />
              <Text style={[theme.type.caption, { color: c.textSecondary }, textStart(isRTL)]}>
                {state.streak > 0 ? t('home.streak', { count: state.streak }) : t('home.noStreak')}
              </Text>
            </View>
          </Card>

          {/* Practice */}
          <SectionHeader title={t('home.practiceTitle')} />
          <View style={[styles.practiceRow, { flexDirection: rowDir(isRTL) }]}>
            <Card onPress={() => navigation.navigate('Lesson', { mode: 'review' })} style={styles.practiceCard} testID="home_btn_review">
              <View style={[styles.rowBetween, { flexDirection: rowDir(isRTL) }]}>
                <IconBadge icon="refresh" color={c.primary} />
                {due > 0 ? (
                  <View style={[styles.badge, { backgroundColor: c.danger }]}>
                    <Text style={styles.badgeText}>{due > 99 ? '99+' : due}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[theme.type.headline, { color: c.text }, textStart(isRTL)]}>{t('home.review')}</Text>
              <Text style={[theme.type.caption, { color: c.textSecondary }, textStart(isRTL)]} numberOfLines={2}>
                {due > 0 ? t('home.reviewSub', { count: due }) : t('home.reviewWeak')}
              </Text>
            </Card>
            <Card onPress={() => navigation.navigate('Lesson', { mode: 'speed' })} style={styles.practiceCard} testID="home_btn_speed">
              <IconBadge icon="flash" color={c.secondary} />
              <Text style={[theme.type.headline, { color: c.text }, textStart(isRTL)]}>{t('home.speed')}</Text>
              <Text style={[theme.type.caption, { color: c.textSecondary }, textStart(isRTL)]} numberOfLines={2}>
                {t('home.speedSub')}
              </Text>
            </Card>
          </View>
          <View style={[styles.practiceRow, { flexDirection: rowDir(isRTL) }]}>
            {tools.map((tool) => (
              <Card key={tool.label} onPress={tool.onPress} style={styles.tool} testID={tool.testID}>
                <IconBadge icon={tool.icon} color={tool.color} size={36} />
                <Text style={[styles.toolLabel, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {tool.label}
                </Text>
              </Card>
            ))}
          </View>

          {/* Course */}
          <SectionHeader title={t('home.courseTitle')} />
          <View style={[styles.stages, { backgroundColor: c.surfaceElevated, flexDirection: rowDir(isRTL) }]}>
            {STAGES.map((s, i) => {
              const st = path.stage.get(s) ?? 'locked';
              const active = s === stage;
              const color = c.stage[i];
              return (
                <Pressable
                  key={s}
                  onPress={() => {
                    setStage(s);
                    setExtraUnits(0);
                  }}
                  testID={`home_tab_${s}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[styles.stageTab, active && [{ backgroundColor: c.surface }, cardShadowStyle(theme)]]}
                >
                  <Ionicons
                    name={st === 'locked' ? 'lock-closed' : st === 'done' ? 'checkmark-circle' : STAGE_ICON[s]}
                    size={18}
                    color={st === 'locked' && !active ? c.textTertiary : color}
                  />
                  <Text
                    style={[styles.stageTabText, { color: active ? c.text : c.textSecondary, fontWeight: active ? '700' : '600' }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {stageTitle(s, pair)}
                  </Text>
                  <View style={{ width: '70%' }}>
                    <ProgressBar value={stageProgress(s)} color={color} height={3} trackColor={active ? c.surfaceElevated : c.border} />
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.stageHead, { flexDirection: rowDir(isRTL) }]}>
            <Text style={[theme.type.callout, { color: c.textSecondary, flex: 1 }, textStart(isRTL)]}>{stageSub(stage, pair)}</Text>
            <Text style={[theme.type.caption, { color: stageColor, fontWeight: '700' }]}>{Math.round(stageProgress(stage) * 100)}%</Text>
          </View>
          {path.stage.get(stage) === 'locked' && stageIndex > 0 ? (
            <View style={[styles.lockedHint, { backgroundColor: c.surfaceElevated, flexDirection: rowDir(isRTL) }]}>
              <Ionicons name="lock-closed" size={16} color={c.textSecondary} />
              <Text style={[theme.type.caption, { color: c.textSecondary, flex: 1 }, textStart(isRTL)]}>
                {t('stages.lockedHint', { stage: stageTitle(STAGES[stageIndex - 1], pair) })}
              </Text>
            </View>
          ) : null}

          {/* Units */}
          {stageDef && stageDef.units.length > 0 ? (
            stageDef.units.slice(0, visibleCount).map((u, ui) => {
              const ust = path.unit.get(u.id) ?? 'locked';
              const done = lessonsDone(u, path);
              const containsNext = next?.unit.id === u.id;
              const expanded = toggled[u.id] ?? (ust === 'open' || containsNext);
              const locked = ust === 'locked';
              return (
                <Card key={u.id} style={styles.unit} testID={`unit_${u.id}`}>
                  <View style={[styles.unitHead, { flexDirection: rowDir(isRTL) }]}>
                    <Pressable
                      onPress={() => setToggled((m) => ({ ...m, [u.id]: !expanded }))}
                      style={[styles.unitHeadMain, { flexDirection: rowDir(isRTL) }]}
                      accessibilityRole="button"
                      accessibilityState={{ expanded }}
                      testID={`unit_toggle_${u.id}`}
                    >
                      <IconBadge color={locked ? c.textTertiary : stageColor} size={44} filled={!locked}>
                        <Text style={[styles.unitNum, { color: locked ? c.textSecondary : '#FFFFFF' }]}>{ui + 1}</Text>
                      </IconBadge>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[theme.type.overline, { color: locked ? c.textTertiary : stageColor }, textStart(isRTL)]}>
                          {t('home.unit', { n: ui + 1 })}
                        </Text>
                        <Text style={[theme.type.headline, { color: locked ? c.textSecondary : c.text }, textStart(isRTL)]} numberOfLines={2}>
                          {bi(u.title)}
                        </Text>
                        <Text style={[theme.type.caption, { color: c.textSecondary }, textStart(isRTL)]}>
                          {ust === 'done' ? t('home.unitDone') : t('home.lessonsCount', { done, total: u.lessons.length })}
                        </Text>
                      </View>
                    </Pressable>
                    {locked ? (
                      <Button label={t('home.skipAhead')} size="sm" variant="secondary" onPress={() => jump(u)} testID={`unit_jump_${u.id}`} />
                    ) : ust === 'done' ? (
                      <Ionicons name="checkmark-circle" size={26} color={c.success} />
                    ) : null}
                    <Pressable onPress={() => setToggled((m) => ({ ...m, [u.id]: !expanded }))} hitSlop={10} accessibilityLabel={bi(u.title)}>
                      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.textTertiary} />
                    </Pressable>
                  </View>
                  {!locked || expanded ? (
                    <View style={{ paddingHorizontal: 2 }}>
                      <ProgressBar value={done / u.lessons.length} color={stageColor} height={4} />
                    </View>
                  ) : null}
                  {expanded ? (
                    <View style={styles.lessons}>
                      {u.lessons.map((l, li) => {
                        const st = path.lesson.get(l.id) ?? 'locked';
                        const isNext = next?.lesson.id === l.id;
                        const stars = progress.lessons[l.id]?.stars ?? 1;
                        return (
                          <Pressable
                            key={l.id}
                            onPress={() => openLesson(l, st, u)}
                            testID={`lesson_node_${l.id}`}
                            accessibilityRole="button"
                            accessibilityLabel={bi(l.title)}
                            style={({ pressed }) => [
                              styles.lesson,
                              { flexDirection: rowDir(isRTL), borderTopColor: c.divider, borderTopWidth: li === 0 ? 0 : StyleSheet.hairlineWidth },
                              isNext && { backgroundColor: tint(theme, stageColor, 0.7), borderRadius: 12, borderTopWidth: 0 },
                              { opacity: pressed ? 0.7 : 1 },
                            ]}
                          >
                            <View
                              style={[
                                styles.lessonDot,
                                st === 'done'
                                  ? { backgroundColor: stageColor }
                                  : st === 'open'
                                    ? { borderWidth: 2, borderColor: stageColor, backgroundColor: c.surface }
                                    : { backgroundColor: c.surfaceElevated },
                              ]}
                            >
                              <Ionicons
                                name={st === 'done' ? 'checkmark' : st === 'locked' ? 'lock-closed' : l.review ? 'barbell' : 'play'}
                                size={st === 'done' ? 18 : 14}
                                color={st === 'done' ? '#FFFFFF' : st === 'open' ? stageColor : c.textTertiary}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[theme.type.callout, { color: st === 'locked' ? c.textSecondary : c.text, fontWeight: isNext ? '700' : '500' }, textStart(isRTL)]} numberOfLines={1}>
                                {bi(l.title)}
                              </Text>
                            </View>
                            {st === 'done' ? (
                              <View style={[styles.stars, { flexDirection: rowDir(isRTL) }]}>
                                {[0, 1, 2].map((k) => (
                                  <Ionicons key={k} name={k < stars ? 'star' : 'star-outline'} size={14} color={k < stars ? c.secondary : c.textTertiary} />
                                ))}
                              </View>
                            ) : isNext ? (
                              <View style={[styles.startChip, { backgroundColor: stageColor }]}>
                                <Text style={styles.startChipText}>{t('home.start')}</Text>
                              </View>
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </Card>
              );
            })
          ) : pack.course === 'error' ? (
            <Card style={styles.stateCard}>
              <IconBadge icon="cloud-offline-outline" color={c.textSecondary} size={48} round />
              <Text style={[theme.type.callout, { color: c.textSecondary, textAlign: 'center' }]}>{t('home.downloadError')}</Text>
              <Button label={t('common.retry')} size="md" onPress={() => void ensureCourseContent(pair)} />
            </Card>
          ) : (
            <Card style={styles.stateCard}>
              <ActivityIndicator color={c.primary} />
              <Text style={[theme.type.callout, { color: c.textSecondary, textAlign: 'center' }]}>{t('home.downloading')}</Text>
            </Card>
          )}

          {stageDef && visibleCount < stageDef.units.length ? (
            <Button
              label={t('home.showMore', { count: stageDef.units.length - visibleCount })}
              variant="ghost"
              icon="chevron-down"
              onPress={() => setExtraUnits((n) => n + 10)}
              testID="home_btn_more_units"
            />
          ) : null}
          <Button label={t('home.profile')} variant="outline" icon="stats-chart" onPress={() => navigation.navigate('Profile')} style={{ marginTop: 4 }} />
        </View>
      </ScrollView>
      {/* Keeps scrolled content from running under the status bar. */}
      <View pointerEvents="none" style={[styles.statusShade, { height: insets.top, backgroundColor: c.background }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  statusShade: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0.96 },
  content: { paddingHorizontal: 16 },
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 12 },
  topBar: { alignItems: 'center', gap: 8, marginBottom: 4 },
  brand: { letterSpacing: 1.2, textTransform: 'uppercase' },
  rowBetween: { alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  hero: { borderRadius: 22, padding: 20, gap: 4, overflow: 'hidden' },
  heroDecor: { position: 'absolute', top: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.10)' },
  heroDecorSmall: { position: 'absolute', bottom: -30, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroKickerRow: { alignItems: 'center', gap: 6 },
  heroKicker: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', flexShrink: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 30, fontWeight: '800', marginTop: 4 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '500' },
  heroFoot: { alignItems: 'center', gap: 16, marginTop: 14 },
  heroMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  heroBtn: { backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 18, height: 42, alignItems: 'center', gap: 6 },
  heroBtnText: { fontSize: 15, fontWeight: '800' },
  goal: { alignItems: 'center', gap: 14 },
  practiceRow: { gap: 12 },
  practiceCard: { flex: 1, gap: 8, padding: 14 },
  tool: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 6 },
  toolLabel: { fontSize: 14, fontWeight: '600' },
  badge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  stages: { borderRadius: 14, padding: 4, gap: 4 },
  stageTab: { flex: 1, alignItems: 'center', gap: 4, paddingTop: 10, paddingBottom: 9, paddingHorizontal: 4, borderRadius: 11 },
  stageTabText: { fontSize: 13 },
  stageHead: { alignItems: 'center', gap: 8, paddingHorizontal: 2 },
  lockedHint: { alignItems: 'center', gap: 8, padding: 12, borderRadius: 12 },
  unit: { gap: 12, padding: 14 },
  unitHead: { alignItems: 'center', gap: 10 },
  unitHeadMain: { flex: 1, alignItems: 'center', gap: 12 },
  unitNum: { fontSize: 18, fontWeight: '800' },
  lessons: { gap: 2 },
  lesson: { alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 8 },
  lessonDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stars: { gap: 1 },
  startChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  startChipText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  stateCard: { alignItems: 'center', gap: 12, paddingVertical: 24 },
});
