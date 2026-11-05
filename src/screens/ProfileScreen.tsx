import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/ui';
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

  const tile = (emoji: string, value: number, label: string) => (
    <Card style={styles.tile}>
      <Text style={styles.tileEmoji}>{emoji}</Text>
      <Text style={[styles.tileValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: c.textSecondary }]}>{label}</Text>
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title={t('profile.title')} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.column}>
          <View style={styles.grid}>
            {tile('⚡', state.xp, t('profile.totalXp'))}
            {tile('🔥', state.streak, t('complete.streak'))}
            {tile('🏅', state.bestStreak, t('profile.bestStreak'))}
            {tile('✅', lessons, t('profile.lessonsDone'))}
            {tile('🧠', learned, t('profile.itemsLearned'))}
            {tile('📚', words, t('profile.wordsLearned'))}
          </View>
          <Card style={{ gap: 12 }}>
            <Text style={[styles.weekTitle, { color: c.text }, textStart(isRTL)]}>{t('profile.week')}</Text>
            <View style={[styles.bars, { flexDirection: rowDir(isRTL) }]}>
              {days.map((d) => {
                const xp = state.xpByDay[d.key] ?? 0;
                return (
                  <View key={d.key} style={styles.barCol}>
                    <Text style={[styles.barValue, { color: c.textSecondary }]}>{xp || ''}</Text>
                    <View style={[styles.barTrack, { backgroundColor: c.border }]}>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  tile: { width: '31%', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6 },
  tileEmoji: { fontSize: 24 },
  tileValue: { fontSize: 24, fontWeight: '800' },
  tileLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  weekTitle: { fontSize: 16, fontWeight: '800' },
  bars: { justifyContent: 'space-between', height: 150 },
  barCol: { alignItems: 'center', flex: 1, gap: 4 },
  barValue: { fontSize: 11, height: 14 },
  barTrack: { width: 22, flex: 1, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barLabel: { fontSize: 12, fontWeight: '700' },
});
