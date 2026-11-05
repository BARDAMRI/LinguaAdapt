import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useAppTheme } from '../../context/PreferencesContext';
import type { TilesExercise } from '../../engine/types';
import { tapHaptic } from '../../utils/exerciseFeedback';
import { normalizeAnswer } from '../../utils/hebrew';
import { DisplayView, SpeakButton, useAutoplay } from '../DisplayView';
import { CheckFooter, ExerciseFrame, useVerdictFeedback, type DoneResult, type Verdict } from './common';

/** Build a word from letter tiles or a sentence from word tiles. */
export function TilesView({ exercise, onDone }: { exercise: TilesExercise; onDone: (r: DoneResult) => void }) {
  const theme = useAppTheme();
  const c = theme.colors;
  const [picked, setPicked] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const feedback = useVerdictFeedback();
  useAutoplay(exercise.audio);

  const rtl = exercise.lang === 'he';
  const letters = exercise.joiner === '';
  const built = picked.map((i) => exercise.tiles[i]);

  const check = () => {
    const given = normalizeAnswer(built.join(exercise.joiner));
    const ok = [exercise.answer.join(exercise.joiner), ...exercise.accepted].some((a) => normalizeAnswer(a) === given);
    // Letter tiles: final forms matter, so compare exactly as well.
    const exact = !letters || built.join('') === exercise.answer.join('');
    const v = { correct: ok && exact };
    setVerdict(v);
    feedback(v);
  };

  const tileText = (s: string) => (
    <Text style={[styles.tileText, { color: c.text, fontSize: letters ? 26 : 19, writingDirection: rtl ? 'rtl' : 'ltr' }]}>{s}</Text>
  );

  return (
    <ExerciseFrame
      instruction={exercise.instruction}
      footer={
        <CheckFooter
          verdict={verdict}
          canCheck={picked.length > 0}
          onCheck={check}
          onContinue={() => onDone({ correct: verdict?.correct ?? false })}
          reveal={exercise.reveal}
        />
      }
    >
      <View style={styles.prompt}>
        {exercise.prompt ? <DisplayView display={exercise.prompt} /> : null}
        {exercise.audio ? (
          <View style={styles.audioRow}>
            <SpeakButton speakable={exercise.audio} size={exercise.prompt ? 'md' : 'lg'} />
            <SpeakButton speakable={exercise.audio} size="md" slow />
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.answerArea,
          { borderColor: c.border, flexDirection: rtl ? 'row-reverse' : 'row', justifyContent: letters ? 'center' : 'flex-start' },
        ]}
        testID="tiles_answer"
      >
        {built.map((tok, k) => (
          <Animated.View key={`a-${picked[k]}`} entering={ZoomIn.duration(140)}>
            <Pressable
              disabled={verdict !== null}
              onPress={() => {
                tapHaptic();
                setPicked((p) => p.filter((_, j) => j !== k));
              }}
              style={[styles.tile, { backgroundColor: c.primarySoft, borderColor: c.primary }]}
            >
              {tileText(tok)}
            </Pressable>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeIn} style={[styles.bank, { flexDirection: rtl ? 'row-reverse' : 'row' }]} testID="tiles_bank">
        {exercise.tiles.map((tok, i) => {
          const used = picked.includes(i);
          return (
            <Pressable
              key={`b-${i}`}
              testID={`tile_${i}`}
              disabled={used || verdict !== null}
              onPress={() => {
                tapHaptic();
                setPicked((p) => [...p, i]);
              }}
              style={[
                styles.tile,
                { backgroundColor: used ? c.border : c.surface, borderColor: c.border, opacity: used ? 0.35 : 1 },
              ]}
            >
              {tileText(tok)}
            </Pressable>
          );
        })}
      </Animated.View>
    </ExerciseFrame>
  );
}

const styles = StyleSheet.create({
  prompt: { alignItems: 'center', gap: 10 },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  answerArea: {
    minHeight: 72,
    borderBottomWidth: 2,
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  bank: { flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  tile: {
    minWidth: 48,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: { fontWeight: '600' },
});
