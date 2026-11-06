/**
 * Recorded voice clips: natural Hebrew and English voices (Google Cloud
 * Text-to-Speech, Chirp 3 HD) generated once by scripts/audio and published on
 * the website next to the content packs. A clip is downloaded the first time it
 * is needed (or ahead of time for the current lesson) and kept on the device.
 * Anything without a clip, or any failure, falls back to the device voice.
 */
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import { fetchText, readCache, siteRoot, writeCache } from '../content/packs';
import { cleanSpeech, clipKey, type ClipLang } from './text';

const CACHE = 'audio-v1';
const DOWNLOAD_TIMEOUT_MS = 6000;
const MANIFEST_RETRY_MS = 60000;
/** Playback speed for the "slow" button (pitch is preserved). */
const SLOW_RATE = 0.72;

type ClipManifest = { version: number; he: string[]; en: string[] };
type Speakable = { text: string; lang: ClipLang };

let available: Record<ClipLang, Set<string>> | null = null;
let manifestLoading: Promise<void> | null = null;
let lastManifestTry = 0;

function audioBase(): string {
  return `${siteRoot()}/audio/v1`;
}

/** Loads the list of recorded clips (network first, then the device copy). Never throws. */
export function loadClipManifest(): Promise<void> {
  if (available) return Promise.resolve();
  if (manifestLoading) return manifestLoading;
  if (Date.now() - lastManifestTry < MANIFEST_RETRY_MS) return Promise.resolve();
  lastManifestTry = Date.now();
  manifestLoading = (async () => {
    let body: string | null = null;
    try {
      const fresh = await fetchText(`${audioBase()}/manifest.json`, 8000);
      JSON.parse(fresh); // a dev server answers unknown paths with index.html
      body = fresh;
      void writeCache('manifest.json', fresh, CACHE);
    } catch (e) {
      // The site answered but has no clip list: no clips (an old copy would list missing files).
      if (e instanceof SyntaxError || /^HTTP 4\d\d/.test((e as Error).message)) {
        available = { he: new Set(), en: new Set() };
        void writeCache('manifest.json', JSON.stringify({ version: 1, he: [], en: [] }), CACHE);
        return;
      }
      // Offline: use the copy saved on the device.
      body = await readCache('manifest.json', CACHE);
    }
    try {
      if (body) {
        const m = JSON.parse(body) as ClipManifest;
        available = { he: new Set(m.he), en: new Set(m.en) };
      }
    } catch {
      available = null;
    }
  })().finally(() => {
    manifestLoading = null;
  });
  return manifestLoading;
}

function clipFor(lang: ClipLang, text: string): string | null {
  if (!available) {
    void loadClipManifest();
    return null;
  }
  const key = clipKey(lang, text);
  return available[lang].has(key) ? key : null;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

const inflight = new Map<string, Promise<string>>();

/** Local file URI of a clip (downloads it once). Web plays the URL directly. */
function clipUri(lang: ClipLang, key: string): Promise<string> {
  const remote = `${audioBase()}/${lang}/${key}.mp3`;
  if (Platform.OS === 'web') return Promise.resolve(remote);
  const id = `${lang}/${key}`;
  const pending = inflight.get(id);
  if (pending) return pending;
  const job = (async () => {
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.cache, CACHE, lang);
    const file = new File(dir, `${key}.mp3`);
    if (file.exists && file.size > 0) return file.uri;
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const got = await withTimeout(File.downloadFileAsync(remote, file), DOWNLOAD_TIMEOUT_MS);
    return got.uri;
  })().finally(() => inflight.delete(id));
  inflight.set(id, job);
  return job;
}

let player: AudioPlayer | null = null;
let onFinish: (() => void) | null = null;
let token = 0;

function getPlayer(): AudioPlayer {
  if (!player) {
    player = createAudioPlayer(null);
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish && onFinish) {
        const cb = onFinish;
        onFinish = null;
        cb();
      }
    });
  }
  return player;
}

/**
 * Plays the recorded clip for `text` if there is one. Returns false when the
 * caller should use the device voice instead (no clip, offline, error).
 */
export async function playClip(lang: ClipLang, text: string, opts: { slow?: boolean; onDone?: () => void } = {}): Promise<boolean> {
  const mine = ++token;
  const key = clipFor(lang, cleanSpeech(text));
  if (!key) return false;
  let uri: string;
  try {
    uri = await clipUri(lang, key);
  } catch {
    return false;
  }
  // A newer speak() started while this clip was downloading: let that one win.
  if (mine !== token) return true;
  try {
    const p = getPlayer();
    onFinish = opts.onDone ?? null;
    p.replace({ uri });
    p.setPlaybackRate(opts.slow ? SLOW_RATE : 1, 'high');
    p.play();
    return true;
  } catch {
    onFinish = null;
    return false;
  }
}

export function stopClip(): void {
  token++;
  onFinish = null;
  try {
    player?.pause();
  } catch {
    /* ignore */
  }
}

/** Downloads the clips a lesson is about to use, a few at a time, in the background. */
export function prefetchClips(list: Speakable[]): void {
  if (!available) {
    void loadClipManifest().then(() => available && prefetchClips(list));
    return;
  }
  const keys = [...new Map(list.map((s) => [`${s.lang}|${cleanSpeech(s.text)}`, s])).values()]
    .map((s) => ({ lang: s.lang, key: clipFor(s.lang, cleanSpeech(s.text)) }))
    .filter((x): x is { lang: ClipLang; key: string } => Boolean(x.key));
  let next = 0;
  const worker = async () => {
    while (next < keys.length) {
      const { lang, key } = keys[next++];
      try {
        if (Platform.OS === 'web') await fetch(`${audioBase()}/${lang}/${key}.mp3`);
        else await clipUri(lang, key);
      } catch {
        /* best effort */
      }
    }
  };
  for (let i = 0; i < 3; i++) void worker();
}

/** Every { text, lang } under a `speak` or `audio` field, at any depth (exercises, teach cards). */
export function collectSpeakables(node: unknown, out: Speakable[] = [], depth = 0): Speakable[] {
  if (!node || typeof node !== 'object' || depth > 8) return out;
  if (Array.isArray(node)) {
    for (const n of node) collectSpeakables(n, out, depth + 1);
    return out;
  }
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if ((k === 'speak' || k === 'audio') && v) {
      for (const s of Array.isArray(v) ? v : [v]) {
        const o = s as Partial<Speakable> | null;
        if (o && typeof o.text === 'string' && (o.lang === 'he' || o.lang === 'en')) out.push({ text: o.text, lang: o.lang });
      }
    } else {
      collectSpeakables(v, out, depth + 1);
    }
  }
  return out;
}
