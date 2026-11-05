import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Share, StyleSheet, Text, View } from 'react-native';
import Animated, { BounceIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '../components/ui';
import { useAppTheme } from '../context/PreferencesContext';
import type { AppNav, AppStackParamList } from '../navigation/types';
import { t } from '../services/i18n';
import { CHECKPOINT_PASS } from '../engine/lesson';

export function LessonCompleteScreen() {
  const theme = useAppTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const { params } = useRoute<RouteProp<AppStackParamList, 'LessonComplete'>>();
  const accuracy = Math.round(params.accuracy * 100);
  const failed = params.mode === 'checkpoint' && !params.passed;

  const title = failed
    ? t('complete.checkpointFailed')
    : params.mode === 'checkpoint'
      ? t('complete.checkpointPassed')
      : params.mode === 'lesson'
        ? t('complete.title')
        : t('complete.reviewTitle');

  const stat = (label: string, value: string, color: string, emoji: string) => (
    <Card style={[styles.stat, { borderColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.textSecondary }]}>{label}</Text>
    </Card>
  );

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 20 }]} testID="complete_root">
      <View style={styles.column}>
        <Animated.Text entering={BounceIn.duration(700)} style={styles.hero}>
          {failed ? '💪' : params.mode === 'checkpoint' ? '🏆' : accuracy === 100 ? '🌟' : '🎉'}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(150)} style={[styles.title, { color: c.text }]}>
          {title}
        </Animated.Text>
        {failed ? (
          <Text style={[styles.sub, { color: c.textSecondary }]}>
            {t('complete.checkpointFailedBody', { need: Math.round(CHECKPOINT_PASS * 100) })}
          </Text>
        ) : null}
        {params.streakExtended && !failed ? (
          <Text style={[styles.sub, { color: c.warning }]}>🔥 {t('complete.streakUp')}</Text>
        ) : null}

        <Animated.View entering={FadeInUp.delay(300)} style={styles.stats}>
          {stat(t('complete.accuracy'), `${accuracy}%`, c.success, '🎯')}
          {stat(t('complete.xpEarned'), `+${params.xp}`, c.secondary, '⚡')}
          {stat(t('complete.streak'), String(params.streak), c.warning, '🔥')}
        </Animated.View>

        {params.learned.length > 0 ? (
          <Animated.View entering={FadeInUp.delay(450)} style={styles.learned}>
            <Text style={[styles.learnedTitle, { color: c.textSecondary }]}>{t('complete.learned')}</Text>
            <View style={styles.chips}>
              {params.learned.map((l) => (
                <View key={l} style={[styles.chip, { backgroundColor: c.primarySoft }]}>
                  <Text style={[styles.chipText, { color: c.primary }]}>{l}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}
      </View>
      <View style={[styles.column, styles.buttons]}>
        <Button label={t('complete.next')} onPress={() => navigation.goBack()} testID="complete_btn_continue" />
        {!failed ? (
          <Button
            label={t('complete.share')}
            variant="ghost"
            icon="share-social-outline"
            onPress={() => void Share.share({ message: t('complete.shareText', { accuracy, streak: params.streak }) }).catch(() => {})}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, justifyContent: 'space-between' },
  column: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 14, alignItems: 'center' },
  hero: { fontSize: 88 },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'center' },
  sub: { fontSize: 16, textAlign: 'center', fontWeight: '600' },
  stats: { flexDirection: 'row', gap: 10, width: '100%' },
  stat: { flex: 1, alignItems: 'center', gap: 2, borderWidth: 2, paddingVertical: 14 },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  learned: { width: '100%', gap: 8, alignItems: 'center' },
  learnedTitle: { fontSize: 14, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipText: { fontSize: 20, fontWeight: '700' },
  buttons: { alignItems: 'stretch', gap: 6 },
});
