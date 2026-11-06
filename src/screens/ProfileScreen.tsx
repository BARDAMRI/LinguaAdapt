import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, Stat, type IconName } from '../components/ui';
import { useAppTheme } from '../context/PreferencesContext';
import { useProgress } from '../progress/ProgressContext';
import { dayKey } from '../progress/srs';
import { isRTL, t } from '../services/i18n';
import { rowDir, textStart } from '../utils/platformStyles';

export function ProfileScreen() {
  const theme = useAppTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const { state, course } = useProgress();
  const items = Object.entries(course.items);
  const learned = items.filter(([, s]) => s.box >= 1).length;
  const words = items.filter(([id, s]) => id.startsWith('w:') && s.box >= 1).length;
  const lessons = Object.keys(course.lessons).length;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: dayKey(d), label: d.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { weekday: 'narrow' }) };
  });
  const max = Math.max(state.settings.dailyGoalXp, ...days.map((d) => state.xpByDay[d.key] ?? 0));

  const tile = (icon: IconName, color: string, value: number, label: string) => (
    <Stat key={label} icon={icon} color={color} value={value.toLocaleString()} label={label} style={styles.tile} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title={t('profile.title')} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.column}>
          <View style={styles.grid}>
            {tile('flash', c.primary, state.xp, t('profile.totalXp'))}
            {tile('flame', c.warning, state.streak, t('complete.streak'))}
            {tile('trophy', c.secondary, state.bestStreak, t('profile.bestStreak'))}
            {tile('checkmark-done', c.success, lessons, t('profile.lessonsDone'))}
            {tile('bulb', c.stage[1], learned, t('profile.itemsLearned'))}
            {tile('book', c.stage[3], words, t('profile.wordsLearned'))}
          </View>
          <Card style={{ gap: 12 }}>
            <Text style={[styles.weekTitle, { color: c.text }, textStart(isRTL)]}>{t('profile.week')}</Text>
            <View style={[styles.bars, { flexDirection: rowDir(isRTL) }]}>
              {days.map((d) => {
                const xp = state.xpByDay[d.key] ?? 0;
                return (
                  <View key={d.key} style={styles.barCol}>
                    <Text style={[styles.barValue, { color: c.textSecondary }]}>{xp || ''}</Text>
                    <View style={[styles.barTrack, { backgroundColor: c.surfaceElevated }]}>
                      <View style={{ height: `${(xp / max) * 100}%`, backgroundColor: xp >= state.settings.dailyGoalXp ? c.success : c.secondary, borderRadius: 6 }} />
                    </View>
                    <Text style={[styles.barLabel, { color: c.textSecondary }]}>{d.label}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16 },
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexBasis: '30%', flexGrow: 1 },
  weekTitle: { fontSize: 17, fontWeight: '700' },
  bars: { justifyContent: 'space-between', height: 150 },
  barCol: { alignItems: 'center', flex: 1, gap: 4 },
  barValue: { fontSize: 11, height: 14 },
  barTrack: { width: 20, flex: 1, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  barLabel: { fontSize: 12, fontWeight: '700' },
});
