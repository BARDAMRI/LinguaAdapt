import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function triggerAnswerHaptics(correct: boolean): void {
  if (Platform.OS === 'web') return;
  void (correct
    ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

/** Short tonal feedback on web when sound toggle is on. */
export function playAnswerSound(correct: boolean, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = correct ? 880 : 200;
    gain.gain.value = 0.06;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
    osc.onended = () => ctx.close();
  } catch {
    /* ignore */
  }
}
