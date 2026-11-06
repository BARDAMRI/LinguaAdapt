import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppTheme, usePreferences } from '../../context/PreferencesContext';
import { shuffle } from '../../engine/generate';
import type { MatchExercise } from '../../engine/types';
import { speak } from '../../services/tts';
import { playSfx, tapHaptic, triggerAnswerHaptics } from '../../utils/exerciseFeedback';
import { DisplayView } from '../DisplayView';
import { CheckFooter, choiceSurface, ExerciseFrame, type DoneResult, type Verdict } from './common';

/** Tap a card on the left, then its partner on the right. */
export function MatchView({ exercise, onDone }: { exercise: MatchExercise; onDone: (r: DoneResult) => void }) {
  const theme = useAppTheme();
  const { soundEnabled } = usePreferences();
  const left = useMemo(() => shuffle(exercise.pairs), [exercise.pairs]);
  const right = useMemo(() => shuffle(exercise.pairs), [exercise.pairs]);
  const [pickLeft, setPickLeft] = useState<string | null>(null);
  const [pickRight, setPickRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<{ l: string; r: string } | null>(null);
  const wrong = useRef(new Set<string>());
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const attempt = (l: string | null, r: string | null) => {
    if (!l || !r) return;
    if (l === r) {
      const next = new Set(matched).add(l);
      setMatched(next);
      playSfx('tap', soundEnabled);
      setPickLeft(null);
      setPickRight(null);
      if (next.size === exercise.pairs.length) {
        const v = { correct: wrong.current.size <= 1 };
        triggerAnswerHaptics(true);
        playSfx('correct', soundEnabled);
        setVerdict(v);
      }
    } else {
      wrong.current.add(l);
      wrong.current.add(r);
      triggerAnswerHaptics(false);
      setFlash({ l, r });
      setTimeout(() => {
        setFlash(null);
        setPickLeft(null);
        setPickRight(null);
      }, 500);
    }
  };

  const cardStyle = (id: string, side: 'l' | 'r', picked: boolean) => {
    const isMatched = matched.has(id);
    const isFlash = flash && (side === 'l' ? flash.l === id : flash.r === id);
    return [
      styles.card,
      choiceSurface(theme, isFlash ? 'wrong' : isMatched ? 'done' : picked ? 'selected' : 'idle'),
      { opacity: isMatched ? 0.5 : 1 },
    ];
  };

  return (
    <ExerciseFrame
      instruction={exercise.instruction}
      footer={
        verdict ? (
          <CheckFooter
            verdict={verdict}
            canCheck
            onCheck={() => {}}
            onContinue={() => onDone({ correct: verdict.correct, wrongItemIds: [...wrong.current] })}
          />
        ) : null
      }
    >
      <View style={styles.columns}>
        <View style={styles.col}>
          {left.map((p, i) => (
            <Pressable
              key={`l-${p.id}`}
              testID={`match_left_${i}`}
              disabled={matched.has(p.id) || flash !== null}
              onPress={() => {
                tapHaptic();
                if (p.left.lang === 'he' || p.left.size === 'glyph') {
                  if (p.left.speak) void speak(p.left.speak.text, p.left.speak.lang);
                }
                setPickLeft(p.id);
                attempt(p.id, pickRight);
              }}
              style={cardStyle(p.id, 'l', pickLeft === p.id)}
            >
              <DisplayView display={{ ...p.left, size: p.left.size === 'glyph' ? 'big' : p.left.size, speak: undefined, note: undefined }} showSpeaker={false} />
            </Pressable>
          ))}
        </View>
        <View style={styles.col}>
          {right.map((p, i) => (
            <Pressable
              key={`r-${p.id}`}
              testID={`match_right_${i}`}
              disabled={matched.has(p.id) || flash !== null}
              onPress={() => {
                tapHaptic();
                setPickRight(p.id);
                attempt(pickLeft, p.id);
              }}
              style={cardStyle(p.id, 'r', pickRight === p.id)}
            >
              <DisplayView display={{ ...p.right, size: p.right.size === 'glyph' ? 'big' : p.right.size, speak: undefined }} showSpeaker={false} />
            </Pressable>
          ))}
        </View>
      </View>
    </ExerciseFrame>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', gap: 12 },
  col: { flex: 1, gap: 12 },
  card: {
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
});
