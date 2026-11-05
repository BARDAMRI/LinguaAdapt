import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../context/PreferencesContext';
import type { ChoiceExercise } from '../../engine/types';
import { speak } from '../../services/tts';
import { tapHaptic } from '../../utils/exerciseFeedback';
import { DisplayView, SpeakButton, useAutoplay } from '../DisplayView';
import { CheckFooter, ExerciseFrame, useVerdictFeedback, type DoneResult, type Verdict } from './common';

export function ChoiceView({ exercise, onDone }: { exercise: ChoiceExercise; onDone: (r: DoneResult) => void }) {
  const theme = useAppTheme();
  const c = theme.colors;
  const [selected, setSelected] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const feedback = useVerdictFeedback();
  useAutoplay(exercise.audio ?? exercise.prompt?.speak);

  const check = () => {
    if (!selected) return;
    const v = { correct: selected === exercise.correctId };
    setVerdict(v);
    feedback(v);
  };

  const grid = exercise.layout === 'grid';
  return (
    <ExerciseFrame
      instruction={exercise.instruction}
      footer={
        <CheckFooter
          verdict={verdict}
          canCheck={selected !== null}
          onCheck={check}
          onContinue={() => onDone({ correct: verdict?.correct ?? false })}
          reveal={exercise.reveal}
        />
      }
    >
      {exercise.prompt || exercise.audio ? (
        <View style={styles.prompt}>
          {exercise.prompt ? <DisplayView display={exercise.prompt} /> : null}
          {exercise.audio && !exercise.prompt?.speak ? (
            <View style={styles.audioRow}>
              <SpeakButton speakable={exercise.audio} size="lg" />
              <SpeakButton speakable={exercise.audio} size="md" slow />
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.options, grid && styles.grid]} testID="exercise_options">
        {exercise.options.map((opt, i) => {
          const isSel = selected === opt.id;
          const showRight = verdict && opt.id === exercise.correctId;
          const showWrong = verdict && isSel && opt.id !== exercise.correctId;
          return (
            <Pressable
              key={opt.id}
              testID={`exercise_option_${i}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSel }}
              disabled={verdict !== null}
              onPress={() => {
                tapHaptic();
                setSelected(opt.id);
                if (opt.display.speak) void speak(opt.display.speak.text, opt.display.speak.lang);
              }}
              style={({ pressed }) => [
                styles.option,
                grid && styles.gridOption,
                {
                  borderColor: showRight ? c.success : showWrong ? c.danger : isSel ? c.primary : c.border,
                  backgroundColor: showRight ? c.successSoft : showWrong ? c.dangerSoft : isSel ? c.primarySoft : c.surface,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <DisplayView display={{ ...opt.display, speak: undefined, size: opt.display.size === 'glyph' ? 'glyph' : opt.display.size }} showSpeaker={false} />
            </Pressable>
          );
        })}
      </View>
    </ExerciseFrame>
  );
}

const styles = StyleSheet.create({
  prompt: { alignItems: 'center', gap: 12, paddingVertical: 8 },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  options: { gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  option: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  gridOption: { width: '48%', minHeight: 96 },
});
