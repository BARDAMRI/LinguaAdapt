import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Share, StyleSheet, Text, View } from 'react-native';
import Animated, { BounceIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Pill, Stat, tint, type IconName } from '../components/ui';
import { useAppTheme } from '../context/PreferencesContext';
import { goBackOrHome } from '../navigation/goBack';
import type { AppNav, AppStackParamList } from '../navigation/types';
import { isRTL, t } from '../services/i18n';
import { rowDir } from '../utils/platformStyles';
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
        : params.mode === 'speed'
          ? t('complete.speedDone', { count: params.correct ?? params.xp })
          : t('complete.reviewTitle');

  const heroIcon: IconName = failed ? 'barbell' : params.mode === 'checkpoint' ? 'trophy' : params.mode === 'speed' ? 'flash' : accuracy === 100 ? 'star' : 'checkmark';
  const heroColor = failed ? c.primary : params.mode === 'speed' || accuracy === 100 ? c.secondary : c.success;

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]} testID="complete_root">
      <View style={styles.column}>
        <Animated.View entering={BounceIn.duration(700)} style={[styles.heroRing, { backgroundColor: tint(theme, heroColor) }]}>
          <View style={[styles.heroDisc, { backgroundColor: heroColor }]}>
            <Ionicons name={heroIcon} size={52} color="#FFFFFF" />
          </View>
        </Animated.View>
        <Animated.Text entering={FadeInUp.delay(150)} style={[styles.title, { color: c.text }]}>
          {title}
        </Animated.Text>
        {failed ? (
          <Text style={[styles.sub, { color: c.textSecondary }]}>
            {t('complete.checkpointFailedBody', { need: Math.round(CHECKPOINT_PASS * 100) })}
          </Text>
        ) : null}
        {params.streakExtended && !failed ? (
          <Pill icon="flame" label={t('complete.streakUp')} color={c.warning} />
        ) : null}

        <Animated.View entering={FadeInUp.delay(300)} style={[styles.stats, { flexDirection: rowDir(isRTL) }]}>
          <Stat icon="locate" color={c.success} value={`${accuracy}%`} label={t('complete.accuracy')} />
          <Stat icon="flash" color={c.secondary} value={`+${params.xp}`} label={t('complete.xpEarned')} />
          <Stat icon="flame" color={c.warning} value={String(params.streak)} label={t('complete.streak')} />
        </Animated.View>

        {params.learned.length > 0 ? (
          <Animated.View entering={FadeInUp.delay(450)} style={styles.learned}>
            <Text style={[styles.learnedTitle, { color: c.textSecondary }]}>{t('complete.learned')}</Text>
            <View style={styles.chips}>
              {params.learned.map((l) => (
                <View key={l} style={[styles.chip, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <Text style={[styles.chipText, { color: c.text }]}>{l}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}
      </View>
      <View style={[styles.column, styles.buttons]}>
        <Button label={t('complete.next')} onPress={() => goBackOrHome(navigation)} testID="complete_btn_continue" />
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
  column: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 16, alignItems: 'center' },
  heroRing: { width: 136, height: 136, borderRadius: 68, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroDisc: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '800', textAlign: 'center' },
  sub: { fontSize: 16, lineHeight: 23, textAlign: 'center', fontWeight: '500' },
  stats: { gap: 10, width: '100%', marginTop: 8 },
  learned: { width: '100%', gap: 10, alignItems: 'center', marginTop: 4 },
  learnedTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  chipText: { fontSize: 20, fontWeight: '700' },
  buttons: { alignItems: 'stretch', gap: 6 },
});
