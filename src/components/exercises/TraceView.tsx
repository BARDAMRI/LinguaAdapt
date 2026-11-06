import { useRef, useState } from 'react';
import { PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context/PreferencesContext';
import type { TraceExercise } from '../../engine/types';
import { t } from '../../services/i18n';
import { SpeakButton, useAutoplay } from '../DisplayView';
import { Button, IconButton } from '../ui';
import { ExerciseFrame, type DoneResult } from './common';

type Dot = { x: number; y: number };

const webNoSelect =
  Platform.OS === 'web' ? ({ userSelect: 'none', touchAction: 'none', cursor: 'crosshair' } as object) : {};

/** Draw over a faded letter with a finger (not graded). */
export function TraceView({ exercise, onDone }: { exercise: TraceExercise; onDone: (r: DoneResult) => void }) {
  const theme = useAppTheme();
  const c = theme.colors;
  const [dots, setDots] = useState<Dot[]>([]);
  useAutoplay(exercise.speak);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        setDots((p) => [...p.slice(-400), { x: locationX, y: locationY }]);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        setDots((p) => [...p.slice(-400), { x: locationX, y: locationY }]);
      },
    }),
  ).current;

  return (
    <ExerciseFrame
      instruction={`${exercise.instruction}: ${exercise.label}`}
      footer={
        <View style={styles.buttons}>
          <IconButton icon="refresh" label={t('common.retry')} onPress={() => setDots([])} style={styles.clear} color={theme.colors.primary} />
          <Button
            label={t('common.continue')}
            onPress={() => onDone({ correct: true })}
            disabled={dots.length < 5}
            style={{ flex: 1 }}
            testID="trace_btn_done"
          />
        </View>
      }
    >
      <View style={styles.speakRow}>
        <SpeakButton speakable={exercise.speak} />
      </View>
      <View style={[styles.canvas, { borderColor: c.border, backgroundColor: c.surface }, webNoSelect]} {...pan.panHandlers} testID="trace_canvas">
        <View style={styles.guide} pointerEvents="none">
          <Text style={[styles.guideText, { color: c.primaryMuted }]}>{exercise.glyph}</Text>
        </View>
        {dots.map((d, i) => (
          <View key={i} pointerEvents="none" style={[styles.dot, { left: d.x - 9, top: d.y - 9, backgroundColor: c.primary }]} />
        ))}
      </View>
    </ExerciseFrame>
  );
}

const styles = StyleSheet.create({
  speakRow: { alignItems: 'center' },
  canvas: { height: 300, borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  guide: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  guideText: { fontSize: 210, fontWeight: '600', opacity: 0.35 },
  dot: { position: 'absolute', width: 18, height: 18, borderRadius: 9, opacity: 0.8 },
  buttons: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingTop: 10 },
  clear: { width: 54, height: 54, borderRadius: 14 },
});
