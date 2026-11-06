/**
 * Content packs (dictionary, course words, sentences) are not bundled in the
 * app. They are downloaded once from the public website and kept on the
 * device, so they work offline afterwards and can be updated without a new
 * app release. Licenses: Wiktionary (CC BY-SA 4.0), Tatoeba (CC BY 2.0 FR).
 */
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';
import { useSyncExternalStore } from 'react';
import type { UnitDef } from '../course/types';
import { setCourseContent } from './courseContent';
import { registerPhrases, registerSentences, registerWords } from './registry';
import type { PairId, Phrase, Sentence, Word } from './types';
import phrasesJson from './generated/phrases.json';

const PROD_SITE = 'https://bardamri.github.io/LinguaAdapt';
const CACHE_DIR = 'content-v1';

/** Public website root that serves content packs and recorded audio. */
export function siteRoot(): string {
  const override = process.env.EXPO_PUBLIC_CONTENT_URL?.trim();
  if (override) return override.replace(/\/$/, '').replace(/\/content\/v1$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Same site as the app: /LinguaAdapt on GitHub Pages, the bare origin locally.
    const onPages = window.location.pathname.startsWith('/LinguaAdapt');
    return `${window.location.origin}${onPages ? '/LinguaAdapt' : ''}`;
  }
  if (__DEV__) {
    // Development: the Metro server that served the JS bundle also serves public/.
    const host = Constants.expoConfig?.hostUri;
    if (host) return `http://${host}`;
    const script: string | undefined = NativeModules.SourceCode?.scriptURL ?? NativeModules.SourceCode?.getConstants?.().scriptURL;
    const m = script?.match(/^(https?:\/\/[^/]+)\//);
    if (m) return m[1];
  }
  return PROD_SITE;
}

function baseUrl(): string {
  return `${siteRoot()}/content/v1`;
}

type Manifest = { version: number; files: Record<string, { hash: string; bytes: number }>; counts: Record<string, number> };

export type PackStatus = 'idle' | 'loading' | 'ready' | 'error';

type State = { course: PackStatus; dictionary: PackStatus; error: string | null; counts: Record<string, number> };

let state: State = { course: 'idle', dictionary: 'idle', error: null, counts: {} };
const listeners = new Set<() => void>();

function set(patch: Partial<State>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function usePackState(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

// ── Device cache ─────────────────────────────────────────────────────────────

export async function readCache(name: string, dir = CACHE_DIR): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof caches === 'undefined') return null;
      const c = await caches.open(dir);
      const hit = await c.match(name);
      return hit ? await hit.text() : null;
    }
    const { File, Paths } = await import('expo-file-system');
    const f = new File(Paths.document, dir, name);
    return f.exists ? await f.text() : null;
  } catch {
    return null;
  }
}

export async function writeCache(name: string, body: string, dir = CACHE_DIR): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof caches === 'undefined') return;
      const c = await caches.open(dir);
      await c.put(name, new Response(body, { headers: { 'content-type': 'application/json' } }));
      return;
    }
    const { Directory, File, Paths } = await import('expo-file-system');
    const folder = new Directory(Paths.document, dir);
    if (!folder.exists) folder.create({ intermediates: true, idempotent: true });
    const f = new File(folder, name);
    f.write(body);
  } catch {
    /* cache is best effort */
  }
}

export async function fetchText(url: string, timeoutMs = 20000): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

let manifestPromise: Promise<Manifest | null> | null = null;

/** Latest manifest from the network, or the cached one when offline. */
function getManifest(): Promise<Manifest | null> {
  if (!manifestPromise) {
    manifestPromise = (async () => {
      try {
        const body = await fetchText(`${baseUrl()}/manifest.json`, 8000);
        const m = JSON.parse(body) as Manifest;
        void writeCache('manifest.json', body);
        return m;
      } catch {
        const cached = await readCache('manifest.json');
        return cached ? (JSON.parse(cached) as Manifest) : null;
      }
    })();
  }
  return manifestPromise;
}

const memory = new Map<string, unknown>();

/** Loads one pack: memory → device cache (if current) → network. */
async function loadPack<T>(name: string): Promise<T> {
  if (memory.has(name)) return memory.get(name) as T;
  const manifest = await getManifest();
  const want = manifest?.files[name]?.hash;
  const cachedHash = await readCache(`${name}.hash`);
  let body: string | null = null;
  if (want && cachedHash === want) body = await readCache(name);
  if (!body) {
    try {
      body = await fetchText(`${baseUrl()}/${name}`, 60000);
      void writeCache(name, body);
      if (want) void writeCache(`${name}.hash`, want);
    } catch (e) {
      // Offline: an older cached copy is better than nothing.
      body = await readCache(name);
      if (!body) throw e;
    }
  }
  const data = JSON.parse(body) as T;
  memory.set(name, data);
  if (manifest?.counts) set({ counts: manifest.counts });
  return data;
}

// ── Public API ───────────────────────────────────────────────────────────────

let phrasesRegistered = false;

export type Situation = { key: string; en: string; he: string; emoji: string };

/** Phrasebook is own content and ships inside the app. */
export function ensurePhrases(): { situations: Situation[]; phrases: Phrase[] } {
  const data = phrasesJson as { situations: Situation[]; phrases: Phrase[] };
  if (!phrasesRegistered) {
    registerPhrases(data.phrases);
    phrasesRegistered = true;
  }
  return data;
}

type CourseFile = { wordUnits: UnitDef[]; sentenceUnits: UnitDef[] };

const loadedCourses = new Set<PairId>();
let coursePromise: Promise<void> | null = null;

/** Words, sentences and the word/sentence units of `pair`. */
export function ensureCourseContent(pair: PairId): Promise<void> {
  if (loadedCourses.has(pair)) return Promise.resolve();
  if (coursePromise) return coursePromise.then(() => ensureCourseContent(pair));
  set({ course: 'loading', error: null });
  coursePromise = (async () => {
    try {
      ensurePhrases();
      const [course, words, sentences] = await Promise.all([
        loadPack<CourseFile>(`course-${pair}.json`),
        loadPack<Word[]>(`words-${pair}.json`),
        loadPack<Sentence[]>('sentences.json'),
      ]);
      registerWords(words, pair);
      registerSentences(sentences);
      setCourseContent(pair, { wordUnits: course.wordUnits, sentenceUnits: course.sentenceUnits });
      loadedCourses.add(pair);
      set({ course: 'ready' });
    } catch (e) {
      set({ course: 'error', error: e instanceof Error ? e.message : String(e) });
    } finally {
      coursePromise = null;
    }
  })();
  return coursePromise;
}

export type DictEntry = Word & { def?: string[]; ex?: string[]; freq?: number };

let dictionary: DictEntry[] | null = null;
let dictPromise: Promise<DictEntry[]> | null = null;

/** The full Hebrew–English dictionary (~11k entries), loaded on demand. */
export function ensureDictionary(): Promise<DictEntry[]> {
  if (dictionary) return Promise.resolve(dictionary);
  if (!dictPromise) {
    set({ dictionary: 'loading' });
    dictPromise = loadPack<DictEntry[]>('dictionary.json')
      .then((d) => {
        dictionary = d;
        registerWords(d);
        set({ dictionary: 'ready' });
        return d;
      })
      .catch((e) => {
        dictPromise = null;
        set({ dictionary: 'error', error: `${e instanceof Error ? e.message : String(e)} (${baseUrl()})` });
        throw e;
      });
  }
  return dictPromise;
}

export function getDictionary(): DictEntry[] | null {
  return dictionary;
}
