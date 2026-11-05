import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useAppTheme } from '../../context/PreferencesContext';
import type { TeachExercise } from '../../engine/types';
import { isRTL, t } from '../../services/i18n';
import { textStart } from '../../utils/platformStyles';
import { DisplayView, LangText, SpeakButton, useAutoplay } from '../DisplayView';
import { Button } from '../ui';
import { ExerciseFrame, type DoneResult } from './common';

/** Introduces a new letter, vowel, pattern, word or phrase. */
export function TeachView({ exercise, onDone }: { exercise: TeachExercise; onDone: (r: DoneResult) => void }) {
  const theme = useAppTheme();
  const c = theme.colors;
  const tc = exercise.teach;
  useAutoplay(tc.speak[0]);
  const align = isRTL ? 'right' : 'left';

  return (
    <ExerciseFrame
      footer={<Button label={t('lesson.gotIt')} onPress={() => onDone({ correct: true })} testID="teach_btn_got_it" />}
    >
      <View style={[styles.badge, { backgroundColor: c.warningSoft, alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.badgeText, { color: c.warning }]}>★ {t('lesson.newItem')} · {tc.badge}</Text>
      </View>

      {tc.glyph ? (
        <Animated.View entering={ZoomIn.springify().damping(14)} style={[styles.hero, { backgroundColor: c.primarySoft }]}>
          {tc.glyph.emoji ? <Text style={styles.heroEmoji}>{tc.glyph.emoji}</Text> : null}
          <LangText display={{ ...tc.glyph, emoji: undefined }} style={{ color: c.primary }} />
          {tc.glyph.translit ? <DisplayView display={{ text: tc.glyph.translit, lang: 'en', size: 'small' }} /> : null}
          <View style={styles.speakRow}>
            {tc.speak.map((s, i) => (
              <SpeakButton key={`${s.text}-${i}`} speakable={s} size={i === 0 ? 'lg' : 'md'} />
            ))}
            {tc.speak[0] ? <SpeakButton speakable={tc.speak[0]} size="md" slow /> : null}
          </View>
        </Animated.View>
      ) : null}

      {tc.title ? <DisplayView display={{ ...tc.title, size: 'big' }} /> : null}

      {tc.rows.map((r) => (
        <Animated.View key={r.label} entering={FadeInUp.delay(80)} style={[styles.row, { borderColor: c.border }]}>
          <Text style={[styles.rowLabel, { color: c.textSecondary }, textStart(isRTL)]}>{r.label}</Text>
          <DisplayView display={r.value} align={align} />
        </Animated.View>
      ))}

      {tc.examples && tc.examples.length > 0 ? (
        <View style={styles.examples}>
          <Text style={[styles.rowLabel, { color: c.textSecondary }, textStart(isRTL)]}>{t('teach.example')}</Text>
          <View style={styles.exampleGrid}>
            {tc.examples.map((ex, i) => (
              <View key={`${ex.text}-${i}`} style={[styles.exampleCard, { borderColor: c.border, backgroundColor: c.surface }]}>
                <DisplayView display={ex} />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {tc.compare && tc.compare.length > 0 ? (
        <View style={styles.examples}>
          <Text style={[styles.rowLabel, { color: c.textSecondary }, textStart(isRTL)]}>{t('teach.lookalikeTitle')}</Text>
          <View style={styles.compareRow}>
            {tc.compare.map((d, i) => (
              <View key={`${d.text}-${i}`} style={[styles.compareCard, { borderColor: c.border }]}>
                <LangText display={{ ...d, size: 'big' }} />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {tc.tip ? (
        <View style={[styles.tip, { backgroundColor: c.surfaceElevated }]}>
          <Text style={[styles.tipText, { color: c.text, writingDirection: tc.tip.lang === 'he' ? 'rtl' : 'ltr', textAlign: tc.tip.lang === 'he' ? 'right' : 'left' }]}>
            💡 {tc.tip.text}
          </Text>
        </View>
      ) : null}
    </ExerciseFrame>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 13, fontWeight: '800' },
  hero: { borderRadius: 24, paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center', gap: 6 },
  heroEmoji: { fontSize: 52 },
  speakRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 },
  row: { borderTopWidth: 1, paddingTop: 10, gap: 4 },
  rowLabel: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  examples: { gap: 8 },
  exampleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  exampleCard: { borderWidth: 1, borderRadius: 14, padding: 10, minWidth: 96, alignItems: 'center' },
  compareRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  compareCard: { borderWidth: 1, borderRadius: 12, width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  tip: { borderRadius: 14, padding: 12 },
  tipText: { fontSize: 16, lineHeight: 23 },
});
