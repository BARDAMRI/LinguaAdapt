import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, usePreferences } from '../../context/PreferencesContext';
import type { Display } from '../../engine/types';
import { isRTL, t } from '../../services/i18n';
import { answerFeedback } from '../../utils/exerciseFeedback';
import type { AppTheme } from '../../theme/theme';
import { cardShadowStyle, rowDir, textStart } from '../../utils/platformStyles';
import { DisplayView } from '../DisplayView';
import { Button } from '../ui';

export type DoneResult = { correct: boolean; typo?: boolean; wrongItemIds?: string[] };

export type ChoiceState = 'idle' | 'selected' | 'right' | 'wrong' | 'done';

/** Shared look of every tappable answer (options, match cards, tiles). */
export function choiceSurface(theme: AppTheme, state: ChoiceState): ViewStyle {
  const c = theme.colors;
  const border = state === 'right' ? c.success : state === 'wrong' ? c.danger : state === 'selected' ? c.primary : c.border;
  const bg = state === 'right' || state === 'done' ? c.successSoft : state === 'wrong' ? c.dangerSoft : state === 'selected' ? c.primarySoft : c.surface;
  return {
    borderWidth: state === 'idle' || state === 'done' ? 1 : 2,
    borderColor: state === 'done' ? 'transparent' : border,
    backgroundColor: bg,
    borderRadius: 16,
    ...(state === 'idle' ? cardShadowStyle(theme) : null),
  };
}

export type Verdict = { correct: boolean; typo?: boolean };

/** Instruction on top, scrollable body, sticky footer. */
export function ExerciseFrame({
  instruction,
  children,
  footer,
}: {
  instruction?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.frame}>
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {instruction ? (
          <Text style={[styles.instruction, { color: theme.colors.text }, textStart(isRTL)]} testID="exercise_instruction">
            {instruction}
          </Text>
        ) : null}
        {children}
      </ScrollView>
      <View style={{ paddingBottom: Math.max(insets.bottom, 12) }}>{footer}</View>
    </View>
  );
}

/** Check button, or the result banner with Continue. */
export function CheckFooter({
  verdict,
  canCheck,
  onCheck,
  onContinue,
  reveal,
  checkLabel,
}: {
  verdict: Verdict | null;
  canCheck: boolean;
  onCheck: () => void;
  onContinue: () => void;
  reveal?: Display;
  checkLabel?: string;
}) {
  const theme = useAppTheme();
  const c = theme.colors;
  if (!verdict) {
    return (
      <View style={styles.footerPad}>
        <Button label={checkLabel ?? t('common.check')} onPress={onCheck} disabled={!canCheck} testID="exercise_btn_check" />
      </View>
    );
  }
  const good = verdict.correct;
  const title = good ? (verdict.typo ? t('lesson.almost') : t('lesson.correct')) : t('lesson.wrong');
  const showAnswer = (!good || verdict.typo) && reveal;
  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      style={[styles.banner, { backgroundColor: good ? c.successSoft : c.dangerSoft }]}
      testID={good ? 'exercise_banner_correct' : 'exercise_banner_wrong'}
    >
      <View style={[styles.bannerHead, { flexDirection: rowDir(isRTL) }]}>
        <View style={[styles.bannerIcon, { backgroundColor: good ? c.success : c.danger }]}>
          <Ionicons name={good ? 'checkmark' : 'close'} size={20} color="#FFFFFF" />
        </View>
        <Text style={[styles.bannerTitle, { color: good ? c.success : c.danger }, textStart(isRTL)]}>{title}</Text>
      </View>
      {showAnswer ? (
        <View style={styles.bannerAnswer}>
          {!good ? <Text style={[styles.answerLabel, { color: c.danger }, textStart(isRTL)]}>{t('lesson.answerWas')}</Text> : null}
          <DisplayView display={reveal} align={isRTL ? 'right' : 'left'} />
        </View>
      ) : good && reveal?.speak ? (
        <View style={styles.bannerAnswer}>
          <DisplayView display={{ ...reveal, size: 'small' }} align={isRTL ? 'right' : 'left'} />
        </View>
      ) : null}
      <Button label={t('common.continue')} onPress={onContinue} variant={good ? 'success' : 'danger'} testID="exercise_btn_continue" />
    </Animated.View>
  );
}

/** Plays the right sound and vibration when a verdict appears. */
export function useVerdictFeedback() {
  const { soundEnabled } = usePreferences();
  return (v: Verdict) => answerFeedback(v.correct, soundEnabled);
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { paddingTop: 4, paddingBottom: 24, gap: 20 },
  instruction: { fontSize: 21, fontWeight: '700', lineHeight: 28 },
  footerPad: { paddingTop: 10 },
  banner: { borderRadius: 20, padding: 16, gap: 12, marginTop: 8, marginHorizontal: -4 },
  bannerHead: { alignItems: 'center', gap: 10 },
  bannerIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontSize: 19, fontWeight: '800', flex: 1 },
  bannerAnswer: { gap: 4 },
  answerLabel: { fontSize: 13, fontWeight: '700' },
});
