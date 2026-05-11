import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Exercise } from '../../types/learning';
import { evaluateSentence, type SentenceEvaluation } from '../services/aiService';
import { usePreferences } from '../context/PreferencesContext';
import {
  answersMatch,
  getReorderTokens,
  shuffleInPlace,
} from '../services/exerciseService';
import { isRTL, t } from '../services/i18n';
import type { AppTheme } from '../theme/theme';
import { playAnswerSound, triggerAnswerHaptics } from '../utils/exerciseFeedback';
import { layoutDirectionStyle } from '../utils/platformStyles';
import { LetterTraceCard } from './LetterTraceCard';

type Props = {
  exercise: Exercise;
  onComplete: (result: { correct: boolean; userAnswer: string }) => void;
};

function hasHebrewText(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}

function createExerciseCardStyles(theme: AppTheme) {
  const c = theme.colors;
  return StyleSheet.create({
    cardScroll: { flexGrow: 0 },
    cardInner: { paddingBottom: theme.spacing.lg },
    promptBlock: { marginBottom: theme.spacing.lg },
    promptHe: {
      ...theme.typography.body,
      fontSize: 18,
      color: c.text,
      textAlign: 'left',
    },
    promptHeRtl: { textAlign: 'right', writingDirection: 'rtl' },
    promptEn: {
      ...theme.typography.body,
      marginTop: theme.spacing.sm,
      color: c.textSecondary,
      textAlign: 'left',
      writingDirection: 'ltr',
    },
    boldInline: { fontWeight: '700' },
    optionsWrap: { gap: theme.spacing.sm },
    mcRow: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: theme.radii.md,
      padding: theme.spacing.md,
      backgroundColor: c.surface,
    },
    mcRowSelected: {
      borderColor: c.primary,
      backgroundColor: theme.isDark
        ? 'rgba(96,165,250,0.14)'
        : 'rgba(59,130,246,0.08)',
    },
    mcRowWrong: {
      borderColor: c.danger,
      backgroundColor: theme.isDark
        ? 'rgba(248,113,113,0.12)'
        : 'rgba(254,242,242,1)',
    },
    mcRowRight: {
      borderColor: c.success,
      backgroundColor: theme.isDark
        ? 'rgba(74,222,128,0.12)'
        : 'rgba(240,253,244,1)',
    },
    mcText: { fontSize: 16, color: c.text },
    textInput: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: theme.radii.md,
      padding: theme.spacing.md,
      fontSize: 17,
      color: c.text,
      minHeight: 96,
      backgroundColor: c.surface,
      marginBottom: theme.spacing.md,
    },
    reorderSection: { marginBottom: theme.spacing.md },
    reorderHint: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    poolRow: {
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    chip: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radii.md,
      backgroundColor: c.border,
    },
    chipOrdered: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radii.md,
      backgroundColor: theme.isDark
        ? 'rgba(96,165,250,0.18)'
        : 'rgba(219,234,254,1)',
      borderWidth: 1,
      borderColor: c.primary,
    },
    chipText: { fontSize: 17, color: c.text },
    feedbackWrap: { marginBottom: theme.spacing.lg },
    feedbackGood: {
      fontSize: 17,
      fontWeight: '700',
      color: c.success,
    },
    feedbackBad: {
      fontSize: 17,
      fontWeight: '700',
      color: c.danger,
      marginBottom: theme.spacing.xs,
    },
    feedbackAnswer: {
      fontSize: 16,
      color: c.danger,
    },
    tutorBox: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.isDark
        ? 'rgba(251,191,36,0.12)'
        : 'rgba(255,251,235,1)',
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: theme.radii.md,
      overflow: 'hidden',
    },
    tutorTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: c.secondary,
      marginBottom: theme.spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    tutorBody: {
      fontSize: 16,
      color: c.text,
      lineHeight: 24,
      marginBottom: theme.spacing.sm,
    },
    tutorSuggestion: {
      fontSize: 15,
      fontWeight: '600',
      color: c.textSecondary,
      lineHeight: 22,
    },
    primaryBtn: {
      backgroundColor: c.primary,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radii.md,
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    primaryBtnPressed: { backgroundColor: c.primaryMuted },
    primaryBtnDisabled: { opacity: 0.65 },
    primaryBtnLabel: {
      ...theme.typography.button,
      color: c.onPrimary,
    },
  });
}

export function ExerciseCard({ exercise, onComplete }: Props) {
  const { theme: appTheme, soundEnabled } = usePreferences();
  const styles = useMemo(
    () => createExerciseCardStyles(appTheme),
    [appTheme],
  );

  const formatQuestionParts = useCallback(
    (text: string): ReactNode => {
      const segments = text.split(/\*\*/);
      return (
        <>
          {segments.map((seg, i) =>
            i % 2 === 1 ? (
              <Text key={i} style={styles.boldInline}>
                {seg}
              </Text>
            ) : (
              <Text key={i}>{seg}</Text>
            ),
          )}
        </>
      );
    },
    [styles],
  );

  const [phase, setPhase] = useState<'answering' | 'revealed'>('answering');
  const [selectedMc, setSelectedMc] = useState<string | null>(null);
  const [writtenText, setWrittenText] = useState('');
  const [checkingAi, setCheckingAi] = useState(false);
  const [tutorEval, setTutorEval] = useState<SentenceEvaluation | null>(null);
  const [pool, setPool] = useState<string[]>([]);
  const [ordered, setOrdered] = useState<string[]>([]);
  const [wasCorrect, setWasCorrect] = useState(false);
  const prevPhaseRef = useRef(phase);

  const mcOptions = useMemo(() => {
    if (exercise.type !== 'multiple-choice') return [];
    return shuffleInPlace([exercise.correctAnswer, ...exercise.distractors]);
  }, [exercise]);

  useEffect(() => {
    setPhase('answering');
    setSelectedMc(null);
    setWrittenText('');
    setCheckingAi(false);
    setTutorEval(null);
    setWasCorrect(false);
    if (exercise.type === 'reorder') {
      setPool(shuffleInPlace(getReorderTokens(exercise)));
      setOrdered([]);
    }
  }, [exercise]);

  useEffect(() => {
    if (phase === 'revealed' && prevPhaseRef.current !== 'revealed') {
      triggerAnswerHaptics(wasCorrect);
      playAnswerSound(wasCorrect, soundEnabled);
    }
    prevPhaseRef.current = phase;
  }, [phase, wasCorrect, soundEnabled]);

  const userAnswer = useMemo(() => {
    if (exercise.type === 'multiple-choice') {
      return selectedMc ?? '';
    }
    if (exercise.type === 'translate' || exercise.type === 'free-write') {
      return writtenText;
    }
    return ordered.join(' ');
  }, [exercise.type, ordered, selectedMc, writtenText]);

  const handleCheck = useCallback(async () => {
    if (exercise.type === 'free-write') {
      setCheckingAi(true);
      const ctx = [
        exercise.tutorContext,
        exercise.question,
        exercise.questionEn,
        exercise.questionHe,
      ]
        .filter(Boolean)
        .join('\n');
      const ev = await evaluateSentence(
        writtenText,
        exercise.correctAnswer,
        ctx,
      );
      setWasCorrect(ev.isCorrect);
      setTutorEval(ev);
      setCheckingAi(false);
      setPhase('revealed');
      return;
    }
    const ok = answersMatch(exercise, userAnswer, exercise.correctAnswer);
    setWasCorrect(ok);
    setPhase('revealed');
  }, [exercise, userAnswer, writtenText]);

  const onNextPress = useCallback(() => {
    onComplete({ correct: wasCorrect, userAnswer });
  }, [onComplete, userAnswer, wasCorrect]);

  const primaryHebrewStyle = [styles.promptHe, isRTL && styles.promptHeRtl];
  const primaryIsHebrew = hasHebrewText(exercise.question);
  const c = appTheme.colors;

  if (exercise.type === 'letter-trace') {
    return <LetterTraceCard exercise={exercise} onComplete={onComplete} />;
  }

  return (
    <ScrollView
      style={[styles.cardScroll, layoutDirectionStyle(isRTL)]}
      contentContainerStyle={styles.cardInner}
      keyboardShouldPersistTaps="handled"
      testID="exercise_scroll"
    >
      <View style={styles.promptBlock} testID="exercise_block_prompt">
        <Text
          style={
            primaryIsHebrew
              ? primaryHebrewStyle
              : [styles.promptEn, { fontSize: 18, color: c.text }]
          }
          testID="exercise_text_question"
        >
          {formatQuestionParts(exercise.question)}
        </Text>
        {exercise.questionEn ? (
          <Text style={styles.promptEn} testID="exercise_text_question_en">
            {formatQuestionParts(exercise.questionEn)}
          </Text>
        ) : null}
        {exercise.questionHe ? (
          <Text style={primaryHebrewStyle} testID="exercise_text_question_he">
            {formatQuestionParts(exercise.questionHe)}
          </Text>
        ) : null}
      </View>

      {exercise.type === 'multiple-choice' ? (
        <View style={styles.optionsWrap} testID="exercise_wrap_mc_options">
          {mcOptions.map((opt, optIndex) => {
            const selected = selectedMc === opt;
            const revealedWrong =
              phase === 'revealed' &&
              !wasCorrect &&
              selected &&
              opt !== exercise.correctAnswer;
            const revealedCorrect =
              phase === 'revealed' && opt === exercise.correctAnswer;
            return (
              <Pressable
                key={`${optIndex}-${opt.slice(0, 24)}`}
                onPress={() => phase === 'answering' && setSelectedMc(opt)}
                style={[
                  styles.mcRow,
                  selected && styles.mcRowSelected,
                  revealedWrong && styles.mcRowWrong,
                  revealedCorrect && styles.mcRowRight,
                ]}
                testID={`exercise_option_${optIndex}`}
              >
                <Text
                  style={[
                    styles.mcText,
                    { textAlign: isRTL ? 'right' : 'left' },
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {exercise.type === 'translate' || exercise.type === 'free-write' ? (
        <TextInput
          value={writtenText}
          onChangeText={setWrittenText}
          editable={phase === 'answering' && !checkingAi}
          placeholder={t('learning.translatePlaceholder')}
          placeholderTextColor={c.textSecondary}
          style={[
            styles.textInput,
            {
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}
          multiline
          testID="exercise_input_translate"
        />
      ) : null}

      {exercise.type === 'reorder' ? (
        <View style={styles.reorderSection} testID="exercise_section_reorder">
          <Text
            style={[
              styles.reorderHint,
              { textAlign: isRTL ? 'right' : 'left' },
            ]}
            testID="exercise_text_reorder_hint"
          >
            {t('learning.reorderHint')}
          </Text>
          <View
            style={[
              styles.poolRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
            testID="exercise_row_pool"
          >
            {pool.map((w, i) => (
              <Pressable
                key={`p-${i}-${w}`}
                style={styles.chip}
                onPress={() => {
                  if (phase !== 'answering') return;
                  setPool((p) => p.filter((_, j) => j !== i));
                  setOrdered((o) => [...o, w]);
                }}
                disabled={phase !== 'answering'}
                testID={`exercise_chip_pool_${i}`}
              >
                <Text style={styles.chipText}>{w}</Text>
              </Pressable>
            ))}
          </View>
          <Text
            style={[
              styles.reorderHint,
              { textAlign: isRTL ? 'right' : 'left' },
            ]}
            testID="exercise_text_your_order"
          >
            {t('learning.yourOrder')}
          </Text>
          <View
            style={[
              styles.poolRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
            testID="exercise_row_ordered"
          >
            {ordered.map((w, idx) => (
              <Pressable
                key={`o-${idx}-${w}`}
                style={styles.chipOrdered}
                onPress={() => {
                  if (phase !== 'answering') return;
                  setOrdered((o) => o.filter((_, j) => j !== idx));
                  setPool((p) => [...p, w]);
                }}
                disabled={phase !== 'answering'}
                testID={`exercise_chip_ordered_${idx}`}
              >
                <Text style={styles.chipText}>{w}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {phase === 'revealed' ? (
        <View style={styles.feedbackWrap} testID="exercise_wrap_feedback">
          {exercise.type === 'free-write' ? (
            <>
              {wasCorrect ? (
                <Text style={styles.feedbackGood} testID="exercise_text_feedback_good">
                  {t('learning.feedbackGood')}
                </Text>
              ) : (
                <Text style={styles.feedbackBad} testID="exercise_text_feedback_bad">
                  {t('learning.feedbackBad')}
                </Text>
              )}
            </>
          ) : wasCorrect ? (
            <Text style={styles.feedbackGood} testID="exercise_text_feedback_good">{t('learning.feedbackGood')}</Text>
          ) : (
            <View testID="exercise_wrap_wrong_answer">
              <Text style={styles.feedbackBad} testID="exercise_text_feedback_bad">{t('learning.feedbackBad')}</Text>
              <Text
                style={[
                  styles.feedbackAnswer,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
                testID="exercise_text_correct_answer"
              >
                {t('learning.correctWas', { answer: exercise.correctAnswer })}
              </Text>
            </View>
          )}
          {exercise.type === 'free-write' && tutorEval ? (
            <View
              style={[
                styles.tutorBox,
                {
                  borderStartWidth: 4,
                  borderStartColor: c.secondary,
                },
              ]}
              testID="exercise_box_tutor"
            >
              <Text
                style={[
                  styles.tutorTitle,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
                testID="exercise_text_tutor_title"
              >
                {t('learning.tutorTitle')}
              </Text>
              {tutorEval.feedback ? (
                <Text
                  style={[
                    styles.tutorBody,
                    { textAlign: isRTL ? 'right' : 'left' },
                  ]}
                  testID="exercise_text_tutor_feedback"
                >
                  {tutorEval.feedback}
                </Text>
              ) : null}
              {tutorEval.suggestion ? (
                <Text
                  style={[
                    styles.tutorSuggestion,
                    { textAlign: isRTL ? 'right' : 'left' },
                  ]}
                  testID="exercise_text_tutor_suggestion"
                >
                  {t('learning.tutorSuggestion', {
                    text: tutorEval.suggestion,
                  })}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {phase === 'answering' ? (
        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
            (checkingAi || !userAnswer.trim()) && styles.primaryBtnDisabled,
          ]}
          onPress={() => {
            void handleCheck();
          }}
          disabled={checkingAi || !userAnswer.trim()}
          testID="exercise_btn_check"
        >
          {checkingAi && exercise.type === 'free-write' ? (
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <Text style={styles.primaryBtnLabel}>{t('learning.check')}</Text>
          )}
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
          ]}
          onPress={onNextPress}
          testID="exercise_btn_next"
        >
          <Text style={styles.primaryBtnLabel}>{t('learning.next')}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
