import { useCallback, useRef, useState } from 'react';
import {
  Platform,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Exercise, LetterData } from '../../types/learning';
import { usePreferences } from '../context/PreferencesContext';
import { getLetterSpeechLang } from '../services/alphabetService';
import { shuffleInPlace } from '../services/exerciseService';
import { isRTL } from '../services/i18n';
import { playAnswerSound, triggerAnswerHaptics } from '../utils/exerciseFeedback';

// ── Speech helpers ─────────────────────────────────────────────────────────────

async function speakOnWeb(letter: LetterData): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;

  let voices = synth.getVoices();
  if (voices.length === 0) {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 1500);
      synth.onvoiceschanged = () => { clearTimeout(timer); resolve(); };
    });
    voices = synth.getVoices();
  }

  const targetLang = getLetterSpeechLang(letter);
  const langPrefix = targetLang.split('-')[0];

  const matchedVoice = voices.find(
    (v) => v.lang.startsWith(langPrefix),
  );

  synth.cancel();

  const textToSpeak = letter.names?.[langPrefix] ?? letter.nameHe ?? letter.name;

  if (matchedVoice) {
    const utter = new SpeechSynthesisUtterance(textToSpeak);
    utter.voice = matchedVoice;
    utter.lang = targetLang;
    utter.rate = 0.8;
    synth.speak(utter);
  } else {
    const utter = new SpeechSynthesisUtterance(`${letter.name}: ${letter.phonetic}`);
    utter.lang = 'en-US';
    utter.rate = 0.85;
    synth.speak(utter);
  }
}

function speakLetter(letter: LetterData): void {
  const lang = getLetterSpeechLang(letter);
  const langPrefix = lang.split('-')[0];
  const textToSpeak = letter.names?.[langPrefix] ?? letter.nameHe ?? letter.name;

  if (Platform.OS === 'web') {
    void speakOnWeb(letter);
    return;
  }
  import('expo-speech').then((Speech) => {
    Speech.speak(textToSpeak, {
      language: lang,
      rate: 0.8,
      onError: () => {
        Speech.speak(letter.phonetic, { language: 'en-US', rate: 0.85 });
      },
    });
  });
}

// ── Web-safe canvas styles ─────────────────────────────────────────────────────

// On web, prevent the browser from dragging text or scrolling during draw
const webCanvasStyle =
  Platform.OS === 'web'
    ? ({
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        cursor: 'crosshair',
      } as object)
    : {};

const webLetterStyle =
  Platform.OS === 'web'
    ? ({
        userSelect: 'none',
        WebkitUserSelect: 'none',
        pointerEvents: 'none',
      } as object)
    : {};

// ── Types ──────────────────────────────────────────────────────────────────────

type Dot = { x: number; y: number };

type Props = {
  exercise: Exercise;
  onComplete: (result: { correct: boolean; userAnswer: string }) => void;
};

// ── Component ──────────────────────────────────────────────────────────────────

export function LetterTraceCard({ exercise, onComplete }: Props) {
  const { theme, soundEnabled } = usePreferences();
  const c = theme.colors;
  const letter = exercise.letterData as LetterData;

  const [phase, setPhase] = useState<'info' | 'trace' | 'quiz'>('info');
  const [dots, setDots] = useState<Dot[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const mcOptions = useRef(
    shuffleInPlace([exercise.correctAnswer, ...exercise.distractors.slice(0, 3)]),
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      // Capture immediately so children never receive the event
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        setDots((prev) => [...prev.slice(-299), { x: locationX, y: locationY }]);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        setDots((prev) => [...prev.slice(-299), { x: locationX, y: locationY }]);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const clearTrace = useCallback(() => setDots([]), []);
  const doneTapping = useCallback(() => setPhase('quiz'), []);

  const handleCheck = useCallback(() => {
    if (!selectedOption) return;
    const correct = selectedOption === exercise.correctAnswer;
    triggerAnswerHaptics(correct);
    playAnswerSound(correct, soundEnabled);
    setRevealed(true);
  }, [exercise.correctAnswer, selectedOption, soundEnabled]);

  const handleNext = useCallback(() => {
    onComplete({
      correct: selectedOption === exercise.correctAnswer,
      userAnswer: selectedOption ?? '',
    });
  }, [exercise.correctAnswer, onComplete, selectedOption]);

  // ── Phase: info ─────────────────────────────────────────────────────────────
  if (phase === 'info') {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.infoContent}
        showsVerticalScrollIndicator={false}
        testID="trace_scroll_info"
      >
        <View style={styles.letterRow} testID="trace_row_letter_info">
          <Text style={[styles.letterDisplay, { color: c.primary }]} testID="trace_text_letter_display">
            {letter.char}
          </Text>
          <Pressable
            style={[styles.speakerBtn, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => speakLetter(letter)}
            hitSlop={8}
            testID="trace_btn_speaker_info"
          >
            <Text style={styles.speakerIcon}>🔊</Text>
          </Pressable>
        </View>
        {letter.finalForm ? (
          <Text style={[styles.finalFormHint, { color: c.textSecondary }]} testID="trace_text_final_form">
            Final form: {letter.finalForm}
          </Text>
        ) : null}
        <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]} testID="trace_card_info">
          <InfoRow label="Name" value={letter.nameHe ? `${letter.name}  (${letter.nameHe})` : letter.name} c={c} />
          <InfoRow label="Sound" value={letter.phonetic} c={c} />
          <InfoRow label="IPA" value={letter.ipa} c={c} />
          <InfoRow label="Number value" value={String(letter.gematria)} c={c} />
          <View style={styles.hintBlock} testID="trace_block_memory_hint">
            <Text style={[styles.hintLabel, { color: c.textSecondary }]}>Memory hint</Text>
            <Text style={[styles.hintText, { color: c.text }]}>{letter.memoryHint}</Text>
          </View>
          <View style={styles.hintBlock} testID="trace_block_stroke_hint">
            <Text style={[styles.hintLabel, { color: c.textSecondary }]}>How to write</Text>
            <Text style={[styles.hintText, { color: c.text }]}>{letter.strokeHint}</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: pressed ? c.primaryMuted : c.primary },
          ]}
          onPress={() => setPhase('trace')}
          testID="trace_btn_start_tracing"
        >
          <Text style={[styles.primaryBtnLabel, { color: c.onPrimary }]}>
            Practice tracing →
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ── Phase: trace ────────────────────────────────────────────────────────────
  if (phase === 'trace') {
    return (
      <View style={styles.traceRoot} testID="trace_root">
        <View style={styles.traceHeader} testID="trace_header">
          <Text style={[styles.traceInstruction, { color: c.textSecondary }]} testID="trace_text_instruction">
            Trace the letter with your finger
          </Text>
          <Pressable
            style={[styles.speakerBtnSm, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => speakLetter(letter)}
            hitSlop={8}
            testID="trace_btn_speaker_trace"
          >
            <Text style={styles.speakerIconSm}>🔊</Text>
          </Pressable>
        </View>

        {/* Canvas — PanResponder captures all touch/mouse events */}
        <View
          style={[styles.traceCanvas, { borderColor: c.border }, webCanvasStyle]}
          {...panResponder.panHandlers}
          testID="trace_canvas"
        >
          {/* Faded guide letter — absolutely positioned, never receives events */}
          <View style={styles.traceLetterWrap} pointerEvents="none">
            <Text style={[styles.traceLetter, { color: c.border }, webLetterStyle]} testID="trace_text_guide_letter">
              {letter.char}
            </Text>
          </View>

          {/* User's drawn dots */}
          {dots.map((d, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { left: d.x - 8, top: d.y - 8, backgroundColor: c.primary },
              ]}
              pointerEvents="none"
            />
          ))}
        </View>

        <View style={styles.traceButtons} testID="trace_row_buttons">
          <Pressable
            style={[styles.secondaryBtn, { borderColor: c.border }]}
            onPress={clearTrace}
            testID="trace_btn_clear"
          >
            <Text style={[styles.secondaryBtnLabel, { color: c.textSecondary }]}>
              Clear
            </Text>
          </Pressable>
          <Pressable
            style={[styles.primaryBtn, { flex: 1, backgroundColor: c.primary }]}
            onPress={doneTapping}
            testID="trace_btn_done"
          >
            <Text style={[styles.primaryBtnLabel, { color: c.onPrimary }]}>
              Done tracing →
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Phase: quiz ─────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.quizContent}
      showsVerticalScrollIndicator={false}
      testID="trace_scroll_quiz"
    >
      <View style={styles.letterRow} testID="trace_row_letter_quiz">
        <Text style={[styles.letterDisplay, { color: c.primary }]} testID="trace_text_quiz_letter">
          {letter.char}
        </Text>
        <Pressable
          style={[styles.speakerBtn, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={() => speakLetter(letter)}
          hitSlop={8}
          testID="trace_btn_speaker_quiz"
        >
          <Text style={styles.speakerIcon}>🔊</Text>
        </Pressable>
      </View>
      <Text style={[styles.quizQuestion, { color: c.text }]} testID="trace_text_quiz_question">
        What is this letter called?
      </Text>
      <View style={styles.optionsWrap} testID="trace_wrap_quiz_options">
        {mcOptions.map((opt, optIdx) => {
          const selected = selectedOption === opt;
          const isCorrect = opt === exercise.correctAnswer;
          const revealedWrong = revealed && selected && !isCorrect;
          const revealedRight = revealed && isCorrect;
          return (
            <Pressable
              key={opt}
              onPress={() => !revealed && setSelectedOption(opt)}
              style={[
                styles.mcRow,
                { borderColor: c.border, backgroundColor: c.surface },
                selected && !revealed && { borderColor: c.primary },
                revealedWrong && {
                  borderColor: c.danger,
                  backgroundColor: theme.isDark ? 'rgba(248,113,113,0.12)' : 'rgba(254,242,242,1)',
                },
                revealedRight && {
                  borderColor: c.success,
                  backgroundColor: theme.isDark ? 'rgba(74,222,128,0.12)' : 'rgba(240,253,244,1)',
                },
              ]}
              testID={`trace_option_${optIdx}`}
            >
              <Text
                style={[
                  styles.mcText,
                  { color: c.text, textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {revealed ? (
        <View style={styles.feedbackWrap} testID="trace_wrap_feedback">
          <Text
            style={[
              styles.feedbackText,
              {
                color:
                  selectedOption === exercise.correctAnswer
                    ? c.success
                    : c.danger,
              },
            ]}
            testID="trace_text_feedback"
          >
            {selectedOption === exercise.correctAnswer
              ? `Correct! This is ${letter.name} — ${letter.phonetic}`
              : `The answer is ${exercise.correctAnswer} (${letter.char}) — ${letter.phonetic}`}
          </Text>
        </View>
      ) : null}
      {!revealed ? (
        <Pressable
          style={[
            styles.primaryBtn,
            { backgroundColor: c.primary },
            !selectedOption && styles.primaryBtnDisabled,
          ]}
          onPress={handleCheck}
          disabled={!selectedOption}
          testID="trace_btn_check"
        >
          <Text style={[styles.primaryBtnLabel, { color: c.onPrimary }]}>
            Check
          </Text>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: c.primary }]}
          onPress={handleNext}
          testID="trace_btn_next"
        >
          <Text style={[styles.primaryBtnLabel, { color: c.onPrimary }]}>
            Next
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  c,
}: {
  label: string;
  value: string;
  c: Record<string, string>;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  infoContent: { paddingBottom: 24 },
  quizContent: { paddingBottom: 24 },
  letterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 4,
  },
  letterDisplay: {
    fontSize: 96,
    fontWeight: '700',
    textAlign: 'center',
  },
  speakerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  speakerIcon: { fontSize: 20 },
  speakerBtnSm: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerIconSm: { fontSize: 16 },
  traceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  finalFormHint: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 0,
    minWidth: 100,
  },
  infoValue: {
    fontSize: 15,
    flex: 1,
    textAlign: 'right',
  },
  hintBlock: { gap: 4 },
  hintLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  hintText: { fontSize: 14, lineHeight: 20 },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnLabel: { fontSize: 16, fontWeight: '700' },
  primaryBtnDisabled: { opacity: 0.5 },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryBtnLabel: { fontSize: 15, fontWeight: '600' },
  traceRoot: { flex: 1, gap: 12 },
  traceInstruction: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  traceCanvas: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 220,
  },
  traceLetterWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  traceLetter: {
    fontSize: 160,
    fontWeight: '700',
    opacity: 0.15,
  },
  dot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    opacity: 0.75,
  },
  traceButtons: { flexDirection: 'row', gap: 10 },
  optionsWrap: { gap: 10, marginBottom: 16 },
  mcRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  mcText: { fontSize: 16 },
  quizQuestion: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  feedbackWrap: { marginBottom: 12 },
  feedbackText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
});
