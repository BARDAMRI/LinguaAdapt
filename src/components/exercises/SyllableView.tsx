import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useAppTheme } from '../../context/PreferencesContext';
import { NIQQUD_SIGNS, SYLLABLE_CONSONANTS, buildSyllable } from '../../content/he/niqqud';
import type { SyllableExercise } from '../../engine/types';
import { t } from '../../services/i18n';
import { speak } from '../../services/tts';
import { tapHaptic } from '../../utils/exerciseFeedback';
import { Button } from '../ui';
import { ExerciseFrame, type DoneResult } from './common';

/** Pick a consonant and a vowel sign, see and hear the syllable. */
export function SyllableView({ exercise, onDone }: { exercise: SyllableExercise; onDone: (r: DoneResult) => void }) {
  const theme = useAppTheme();
  const c = theme.colors;
  const focus = NIQQUD_SIGNS.find((s) => s.key === exercise.vowelKey) ?? NIQQUD_SIGNS[0];
  // The sign being taught plus the ones learned before it.
  const idx = NIQQUD_SIGNS.indexOf(focus);
  const signs = NIQQUD_SIGNS.slice(0, idx + 1).filter((s) => s.key !== 'chataf').slice(-4);
  const [cons, setCons] = useState(SYLLABLE_CONSONANTS[0]);
  const [sign, setSign] = useState(focus.key === 'chataf' ? signs[0] : focus);
  const [tries, setTries] = useState(0);
  const syllable = buildSyllable(cons, sign);

  const play = (cc: string, s: typeof sign) => {
    tapHaptic();
    setTries((n) => n + 1);
    void speak(buildSyllable(cc, s), 'he');
  };

  return (
    <ExerciseFrame
      instruction={exercise.instruction}
      footer={<Button label={t('common.continue')} onPress={() => onDone({ correct: true })} disabled={tries < 3} testID="syllable_btn_done" />}
    >
      <Animated.View key={syllable} entering={ZoomIn.duration(160)} style={[styles.result, { backgroundColor: c.primarySoft }]}>
        <Text style={[styles.resultText, { color: c.primary }]}>{syllable}</Text>
      </Animated.View>
      <View style={styles.row}>
        {SYLLABLE_CONSONANTS.map((cc) => (
          <Pressable
            key={cc}
            onPress={() => {
              setCons(cc);
              play(cc, sign);
            }}
            style={[styles.chip, { borderColor: cc === cons ? c.primary : c.border, backgroundColor: cc === cons ? c.primarySoft : c.surface }]}
          >
            <Text style={[styles.chipText, { color: c.text }]}>{cc}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        {signs.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => {
              setSign(s);
              play(cons, s);
            }}
            style={[styles.signChip, { borderColor: s.key === sign.key ? c.primary : c.border, backgroundColor: s.key === sign.key ? c.primarySoft : c.surface }]}
          >
            <Text style={[styles.chipText, { color: c.text }]}>{buildSyllable('ב', s).replace('ב', '◌')}</Text>
            <Text style={[styles.signName, { color: c.textSecondary }]}>{s.nameEn}</Text>
          </Pressable>
        ))}
      </View>
    </ExerciseFrame>
  );
}

const styles = StyleSheet.create({
  result: { alignSelf: 'center', width: 160, height: 160, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  resultText: { fontSize: 84, lineHeight: 120, fontWeight: '600' },
  row: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  chip: { width: 56, height: 56, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  signChip: { minWidth: 76, paddingVertical: 6, borderRadius: 14, borderWidth: 2, alignItems: 'center' },
  chipText: { fontSize: 30, lineHeight: 42 },
  signName: { fontSize: 12, fontWeight: '600' },
});
