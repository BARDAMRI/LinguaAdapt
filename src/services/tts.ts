/**
 * One text-to-speech entry point for iOS, Android and web.
 *
 * Plays recorded natural voices when available (audio/clips) and otherwise
 * the voices built into the device (iOS: AVSpeechSynthesizer, web:
 * speechSynthesis). The best device voice per language is picked once.
 */
import { setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { playClip, stopClip } from '../audio/clips';
import { cleanSpeech, spokenHebrew } from '../audio/text';

export type SpeechLang = 'he' | 'en';

const LOCALE: Record<SpeechLang, string> = { he: 'he-IL', en: 'en-US' };

/** Speed multipliers relative to the platform's normal rate. */
export const SPEECH_RATES = { normal: 0.9, slow: 0.7 } as const;
export type SpeechSpeed = keyof typeof SPEECH_RATES;

let speed: SpeechSpeed = 'normal';
let voicesPromise: Promise<Speech.Voice[]> | null = null;
const chosenVoice: Partial<Record<SpeechLang, string | null>> = {};
let audioModeSet = false;

export function setSpeechSpeed(next: SpeechSpeed): void {
  speed = next;
}

export function getSpeechSpeed(): SpeechSpeed {
  return speed;
}

async function loadVoices(): Promise<Speech.Voice[]> {
  if (!voicesPromise) {
    voicesPromise = (async () => {
      try {
        let voices = await Speech.getAvailableVoicesAsync();
        if (voices.length === 0 && Platform.OS === 'web') {
          // Chrome fills the list asynchronously.
          await new Promise((r) => setTimeout(r, 800));
          voices = await Speech.getAvailableVoicesAsync();
        }
        return voices;
      } catch {
        return [];
      }
    })();
  }
  const list = await voicesPromise;
  if (list.length === 0) voicesPromise = null; // retry next time
  return list;
}

function qualityScore(v: Speech.Voice): number {
  const q = String(v.quality ?? '').toLowerCase();
  if (q.includes('premium')) return 3;
  if (q.includes('enhanced')) return 2;
  return 1;
}

async function pickVoice(lang: SpeechLang): Promise<string | null> {
  if (chosenVoice[lang] !== undefined) return chosenVoice[lang] ?? null;
  const voices = await loadVoices();
  const prefix = lang === 'he' ? ['he', 'iw'] : ['en'];
  const candidates = voices.filter((v) =>
    prefix.some((p) => v.language?.toLowerCase().startsWith(p)),
  );
  if (candidates.length === 0) {
    if (voices.length > 0) chosenVoice[lang] = null;
    return null;
  }
  const locale = LOCALE[lang].toLowerCase();
  candidates.sort((a, b) => {
    const exact = Number(b.language.toLowerCase() === locale) - Number(a.language.toLowerCase() === locale);
    if (exact !== 0) return exact;
    // Siri / novelty voices on Apple platforms sound odd for teaching.
    const odd = (v: Speech.Voice) => /eloquence|novelty|bad news|bells|bubbles|cellos|jester|organ|trinoids|whisper|zarvox|albert|bahh|boing|wobble|superstar|grandpa|grandma|rocko|shelley|flo|reed|sandy|eddy/i.test(v.name);
    const oddDiff = Number(odd(a)) - Number(odd(b));
    if (oddDiff !== 0) return oddDiff;
    return qualityScore(b) - qualityScore(a);
  });
  chosenVoice[lang] = candidates[0].identifier;
  return candidates[0].identifier;
}

/** True when the device has a voice for the language (unknown → true). */
export async function hasVoiceFor(lang: SpeechLang): Promise<boolean> {
  const voices = await loadVoices();
  if (voices.length === 0) return true;
  return (await pickVoice(lang)) !== null;
}

async function ensureAudioMode(): Promise<void> {
  if (audioModeSet || Platform.OS === 'web') return;
  audioModeSet = true;
  try {
    // Learners tap the speaker on purpose: play even with the ring switch on silent.
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' });
  } catch {
    /* not fatal */
  }
}

export type SpeakOptions = {
  slow?: boolean;
  onDone?: () => void;
};

/**
 * Speaks `text` in the given language, interrupting anything already playing.
 * A recorded natural voice is used when the text has a clip (see audio/clips);
 * otherwise the device voice reads it.
 */
export async function speak(text: string, lang: SpeechLang, opts: SpeakOptions = {}): Promise<void> {
  const clean = cleanSpeech(text);
  if (!clean) return;
  await ensureAudioMode();
  stopClip();
  try {
    await Speech.stop();
  } catch {
    /* ignore */
  }
  if (await playClip(lang, clean, opts)) return;
  const voice = await pickVoice(lang);
  const rate = SPEECH_RATES[opts.slow ? 'slow' : speed];
  Speech.speak(lang === 'he' ? spokenHebrew(clean) : clean, {
    language: LOCALE[lang],
    ...(voice ? { voice } : {}),
    rate,
    onDone: opts.onDone,
    onStopped: opts.onDone,
    onError: () => opts.onDone?.(),
  });
}

export function stopSpeaking(): void {
  stopClip();
  void Speech.stop();
}

