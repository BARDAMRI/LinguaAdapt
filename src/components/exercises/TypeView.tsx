import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useAppTheme } from '../../context/PreferencesContext';
import type { TypeExercise } from '../../engine/types';
import { t } from '../../services/i18n';
import { gradeTypedAnswer } from '../../utils/hebrew';
import { DisplayView, SpeakButton, useAutoplay } from '../DisplayView';
import { CheckFooter, ExerciseFrame, useVerdictFeedback, type DoneResult, type Verdict } from './common';

export function TypeView({ exercise, onDone }: { exercise: TypeExercise; onDone: (r: DoneResult) => void }) {
  const theme = useAppTheme();
  const c = theme.colors;
  const [text, setText] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const feedback = useVerdictFeedback();
  useAutoplay(exercise.audio);

  const check = () => {
    const g = gradeTypedAnswer(text, exercise.accepted);
    const v = { correct: g !== 'wrong', typo: g === 'typo' };
    setVerdict(v);
    feedback(v);
  };

  const rtl = exercise.lang === 'he';
  return (
    <ExerciseFrame
      instruction={exercise.instruction}
      footer={
        <CheckFooter
          verdict={verdict}
          canCheck={text.trim().length > 0}
          onCheck={check}
          onContinue={() => onDone({ correct: verdict?.correct ?? false, typo: verdict?.typo })}
          reveal={exercise.reveal}
        />
      }
    >
      <View style={styles.prompt}>
        {exercise.prompt ? <DisplayView display={exercise.prompt} /> : null}
        {exercise.audio && !exercise.prompt?.speak ? <SpeakButton speakable={exercise.audio} size="lg" /> : null}
      </View>
      <TextInput
        value={text}
        onChangeText={setText}
        editable={verdict === null}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        placeholder={rtl ? t('lesson.typeInHebrew') : t('lesson.typeInEnglish')}
        placeholderTextColor={c.textSecondary}
        onSubmitEditing={() => text.trim() && !verdict && check()}
        returnKeyType="done"
        style={[
          styles.input,
          {
            borderColor: c.border,
            color: c.text,
            backgroundColor: c.surface,
            textAlign: rtl ? 'right' : 'left',
            writingDirection: rtl ? 'rtl' : 'ltr',
          },
        ]}
        testID="type_input"
      />
    </ExerciseFrame>
  );
}

const styles = StyleSheet.create({
  prompt: { alignItems: 'center', gap: 10 },
  input: {
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 20,
    minHeight: 64,
  },
});
