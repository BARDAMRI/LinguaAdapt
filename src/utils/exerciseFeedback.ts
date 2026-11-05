import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type Sfx = 'correct' | 'wrong' | 'complete' | 'tap';

const SOURCES: Record<Sfx, number> = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  complete: require('../../assets/sounds/complete.wav'),
  tap: require('../../assets/sounds/tap.wav'),
};

const players: Partial<Record<Sfx, AudioPlayer>> = {};

function player(name: Sfx): AudioPlayer | null {
  try {
    if (!players[name]) {
      players[name] = createAudioPlayer(SOURCES[name]);
      players[name]!.volume = 0.6;
    }
    return players[name]!;
  } catch {
    return null;
  }
}

export function playSfx(name: Sfx, enabled: boolean): void {
  if (!enabled) return;
  const p = player(name);
  if (!p) return;
  try {
    void p.seekTo(0);
    p.play();
  } catch {
    /* ignore */
  }
}

export function triggerAnswerHaptics(correct: boolean): void {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(
    correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
  ).catch(() => {});
}

export function tapHaptic(): void {
  if (Platform.OS === 'web') return;
  void Haptics.selectionAsync().catch(() => {});
}

/** Sound + haptics when an answer is revealed. */
export function answerFeedback(correct: boolean, soundEnabled: boolean): void {
  triggerAnswerHaptics(correct);
  playSfx(correct ? 'correct' : 'wrong', soundEnabled);
}
