/**
 * Records every text in the catalog into public/audio/v1/<lang>/<key>.mp3 and
 * writes public/audio/v1/manifest.json. The app plays these files and falls back
 * to the device voice for anything else.
 *
 * Default engine: free local voices on this Mac (scripts/audio/local_tts.py):
 *   Hebrew  — Chatterbox Multilingual (MIT), English — Kokoro-82M (Apache-2.0).
 *   One-time setup: npm run audio:setup-local
 *
 *   npm run audio:count                      # clips still to record, no recording
 *   npm run audio:generate                   # everything missing, by priority (resumable)
 *   npm run audio:generate -- --only core,phrases,course-words,lesson-sentences
 *   npm run audio:generate -- --lang en      # one language only
 *   npm run audio:manifest                   # rebuild manifest.json from the files present
 *
 * Optional engine: --engine google (Chirp 3 HD, needs GOOGLE_TTS_API_KEY in .env,
 * never EXPO_PUBLIC_; billed per character above the free tier).
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { clipKey, spokenHebrew, type ClipLang } from '../../src/audio/text';
import { buildCatalog, type CatalogItem } from './catalog';

const ROOT = join(__dirname, '..', '..');
const OUT = join(ROOT, 'public', 'audio', 'v1');
const SAMPLE_OUT = join(ROOT, '.cache', 'audio-sample');
const ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

/** Chosen after the listening test (npm run audio:sample). */
export const VOICES: Record<ClipLang, string> = {
  he: 'he-IL-Chirp3-HD-Kore',
  en: 'en-US-Chirp3-HD-Kore',
};
const LOCALE: Record<ClipLang, string> = { he: 'he-IL', en: 'en-US' };
/** Slightly slower than conversational speed: these are learners. */
const SPEAKING_RATE = 0.92;
/** Spoken only on the word page for Hebrew speakers; left to the device voice to stay in the free tier. */
const SKIP = new Set(['dictionary en']);

type Args = {
  engine: 'local' | 'google';
  sample: boolean;
  dryRun: boolean;
  manifestOnly: boolean;
  only: Set<string> | null;
  lang: ClipLang | null;
  limit: number;
  concurrency: number;
  voices: Partial<Record<ClipLang, string>>;
};

function parseArgs(argv: string[]): Args {
  const a: Args = { engine: 'local', sample: false, dryRun: false, manifestOnly: false, only: null, lang: null, limit: Infinity, concurrency: 6, voices: {} };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--engine') a.engine = argv[++i] === 'google' ? 'google' : 'local';
    else if (v === '--manifest') a.manifestOnly = true;
    else if (v === '--lang') a.lang = argv[++i] === 'he' ? 'he' : 'en';
    else if (v === '--sample') a.sample = true;
    else if (v === '--dry-run') a.dryRun = true;
    else if (v === '--only') a.only = new Set(argv[++i].split(','));
    else if (v === '--limit') a.limit = Number(argv[++i]);
    else if (v === '--concurrency') a.concurrency = Number(argv[++i]);
    else if (v === '--voice-he') a.voices.he = argv[++i];
    else if (v === '--voice-en') a.voices.en = argv[++i];
  }
  return a;
}

/** Reads one key from .env without loading (or printing) anything else. */
function apiKey(): string {
  if (process.env.GOOGLE_TTS_API_KEY) return process.env.GOOGLE_TTS_API_KEY.trim();
  const envPath = join(ROOT, '.env');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*GOOGLE_TTS_API_KEY\s*=\s*(.*)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, '').trim();
    }
  }
  throw new Error('GOOGLE_TTS_API_KEY is missing: add it to .env (see scripts/audio/generate.ts).');
}

class FatalError extends Error {}

async function synthesize(key: string, lang: ClipLang, voice: string, text: string): Promise<Buffer> {
  const body = {
    input: { text: lang === 'he' ? spokenHebrew(text) : text },
    voice: { languageCode: LOCALE[lang], name: voice },
    audioConfig: { audioEncoding: 'MP3', speakingRate: SPEAKING_RATE },
  };
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const json = (await res.json()) as { audioContent?: string };
      if (!json.audioContent) throw new Error('empty audio');
      return Buffer.from(json.audioContent, 'base64');
    }
    const detail = (await res.text()).slice(0, 300).replace(/\s+/g, ' ');
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      throw new FatalError(`Google TTS refused the request (${res.status}): ${detail}`);
    }
    if (attempt >= 6) throw new Error(`HTTP ${res.status} after retries: ${detail}`);
    // 429 (quota per minute) and 5xx: back off and retry.
    await new Promise((r) => setTimeout(r, Math.min(60000, 1500 * 2 ** attempt)));
  }
}

/** Trims leading/trailing silence (keeps ~60 ms) and stores mono MP3; best effort. */
function tidy(path: string): void {
  const tmp = `${path}.tmp.mp3`;
  try {
    execFileSync('ffmpeg', [
      '-v', 'error', '-y', '-i', path,
      '-af', 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.06,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.06,areverse',
      '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '40k', tmp,
    ]);
    execFileSync('mv', [tmp, path]);
  } catch {
    /* ffmpeg missing or failed: keep Google's file as is */
  }
}

/** Runs `fn` over `items` with limited concurrency; the first thrown error stops every worker. */
async function runPool<T>(items: T[], concurrency: number, fn: (item: T, i: number) => Promise<void>): Promise<void> {
  let next = 0;
  let stopped: unknown = null;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length && !stopped) {
      const i = next++;
      try {
        await fn(items[i], i);
      } catch (e) {
        stopped = e;
      }
    }
  });
  await Promise.all(workers);
  if (stopped) throw stopped;
}

function writeManifest(voices: Record<ClipLang, string> = VOICES): { he: number; en: number } {
  const keys = (lang: ClipLang) =>
    existsSync(join(OUT, lang)) ? readdirSync(join(OUT, lang)).filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4)).sort() : [];
  const he = keys('he');
  const en = keys('en');
  const manifest = { version: 1, voices, generated: new Date().toISOString().slice(0, 10), he, en };
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest));
  return { he: he.length, en: en.length };
}

/** A small, varied set for the listening test, in several voices. */
function sampleItems(all: CatalogItem[]): CatalogItem[] {
  const pick = (cat: string, lang: ClipLang, n: number, filter: (t: string) => boolean = () => true) =>
    all.filter((x) => x.category === cat && x.lang === lang && filter(x.text)).filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / n)) === 0).slice(0, n);
  return [
    ...pick('core', 'he', 8, (t) => t.replace(/[֑-ׇ]/g, '').length <= 2),
    ...pick('core', 'he', 4, (t) => t.replace(/[֑-ׇ]/g, '').length > 2),
    ...pick('course-words', 'he', 5),
    ...pick('sentences', 'he', 4),
    ...pick('phrases', 'he', 3),
    ...pick('core', 'en', 5, (t) => t.length === 1),
    ...pick('course-words', 'en', 4),
    ...pick('sentences', 'en', 3),
  ];
}

const SAMPLE_VOICES: Record<ClipLang, string[]> = {
  he: ['Kore', 'Aoede', 'Charon', 'Puck'].map((v) => `he-IL-Chirp3-HD-${v}`),
  en: ['Kore', 'Charon'].map((v) => `en-US-Chirp3-HD-${v}`),
};

// ── Local engine ────────────────────────────────────────────────────────────

const LOCAL_ENGINES: Record<ClipLang, { python: string; voice: string; label: string }> = {
  he: { python: join(ROOT, '.cache', 'tts-he', 'bin', 'python'), voice: 'chatterbox-multilingual', label: 'Chatterbox Multilingual' },
  en: { python: join(ROOT, '.cache', 'tts-en', 'bin', 'python'), voice: 'af_heart', label: 'Kokoro-82M af_heart' },
};

const bareLetters = (t: string) => t.replace(/[\u0591-\u05C7]/g, '').replace(/[^\p{L}]/gu, '').length;
const stripNiqqud = (t: string) => t.replace(/[\u0591-\u05C7]/g, '');

/** Takes to try, best first. Syllables and short words need their vowels; sentences read best unpointed. */
function hebrewAttempts(it: CatalogItem): string[] {
  const spoken = spokenHebrew(it.text);
  const letters = bareLetters(spoken);
  if (it.category === 'lesson-sentences' || it.category === 'sentences') return [stripNiqqud(spoken), stripNiqqud(spoken), spoken];
  if (letters >= 4) return [spoken, spoken, stripNiqqud(spoken)];
  // Lone syllables and very short words: punctuation changes the model's take (measured on בָּה/מֶה/לִי/סוֹ/רוּ).
  return [spoken, `${spoken}!`, spoken, `${spoken}.`];
}

function runLocal(lang: ClipLang, jobsPath: string): Promise<number> {
  const engine = LOCAL_ENGINES[lang];
  if (!existsSync(engine.python)) throw new Error(`Missing ${engine.python}: run npm run audio:setup-local first.`);
  const args = ['-i', engine.python, '-I', join(ROOT, 'scripts', 'audio', 'local_tts.py'), lang, jobsPath];
  if (lang === 'en') args.push('--voice', engine.voice);
  return new Promise((resolve) => {
    // caffeinate keeps the Mac awake while recording (hours for Hebrew).
    const child = spawn('caffeinate', args, {
      env: { ...process.env, HF_HOME: join(ROOT, '.cache', 'hf'), PYTORCH_ENABLE_MPS_FALLBACK: '1', PYTHONWARNINGS: 'ignore' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const relay = (buf: Buffer) => {
      for (const line of buf.toString().split('\n')) {
        if (/^(he|en): |Error|Traceback|error:/.test(line)) console.log(line);
      }
    };
    child.stdout.on('data', relay);
    child.stderr.on('data', relay);
    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function generateLocal(args: Args, all: CatalogItem[]): Promise<void> {
  const langs: ClipLang[] = args.lang ? [args.lang] : ['he', 'en'];
  const jobsDir = join(ROOT, '.cache', 'audio-jobs');
  mkdirSync(jobsDir, { recursive: true });
  const runs: Promise<number>[] = [];
  for (const lang of langs) {
    let todo = all.filter((it) => it.lang === lang && (!args.only || args.only.has(it.category)));
    todo = todo.filter((it) => !existsSync(join(OUT, lang, `${clipKey(lang, it.text)}.mp3`)));
    if (Number.isFinite(args.limit)) todo = todo.slice(0, args.limit);
    const byCat = todo.reduce<Record<string, number>>((m, it) => ({ ...m, [it.category]: (m[it.category] ?? 0) + 1 }), {});
    console.log(`${lang}: ${todo.length} clips to record with ${LOCAL_ENGINES[lang].label}`, byCat);
    if (args.dryRun || todo.length === 0) continue;
    const jobs = todo.map((it) => ({
      out: join(OUT, lang, `${clipKey(lang, it.text)}.mp3`),
      letters: lang === 'he' ? bareLetters(spokenHebrew(it.text)) : it.text.length,
      attempts: lang === 'he' ? hebrewAttempts(it) : [it.text],
    }));
    const jobsPath = join(jobsDir, `${lang}.json`);
    writeFileSync(jobsPath, JSON.stringify(jobs));
    runs.push(runLocal(lang, jobsPath));
  }
  const codes = await Promise.all(runs);
  if (!args.dryRun) console.log('Manifest:', writeManifest({ he: LOCAL_ENGINES.he.label, en: LOCAL_ENGINES.en.label }));
  if (codes.some((c) => c !== 0)) process.exitCode = 1;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const voices = { ...VOICES, ...args.voices };
  const all = buildCatalog();

  if (args.manifestOnly) {
    console.log('Manifest:', writeManifest({ he: LOCAL_ENGINES.he.label, en: LOCAL_ENGINES.en.label }));
    return;
  }
  if (args.engine === 'local' && !args.sample) {
    await generateLocal(args, all);
    return;
  }

  if (args.sample) {
    const items = sampleItems(all);
    const jobs = items.flatMap((it) => SAMPLE_VOICES[it.lang].map((voice) => ({ ...it, voice })));
    const chars = jobs.reduce((n, j) => n + j.text.length, 0);
    console.log(`Sample: ${items.length} texts × voices = ${jobs.length} clips, ${chars} characters.`);
    if (args.dryRun) return;
    const key = apiKey();
    mkdirSync(SAMPLE_OUT, { recursive: true });
    const rows: { voice: string; lang: string; text: string; file: string }[] = [];
    await runPool(jobs, args.concurrency, async (j) => {
      const file = `${j.voice}-${clipKey(j.lang, j.text)}.mp3`;
      const path = join(SAMPLE_OUT, file);
      if (!existsSync(path)) {
        writeFileSync(path, await synthesize(key, j.lang, j.voice, j.text));
      }
      rows.push({ voice: j.voice, lang: j.lang, text: j.text, file });
    });
    writeFileSync(join(SAMPLE_OUT, 'sample.json'), JSON.stringify(rows, null, 1));
    console.log(`Wrote ${rows.length} clips to ${SAMPLE_OUT}`);
    return;
  }

  let todo = all.filter((it) => !SKIP.has(`${it.category} ${it.lang}`) && (!args.only || args.only.has(it.category)));
  todo = todo.filter((it) => !existsSync(join(OUT, it.lang, `${clipKey(it.lang, it.text)}.mp3`)));
  if (Number.isFinite(args.limit)) todo = todo.slice(0, args.limit);
  const chars = todo.reduce((n, it) => n + (it.lang === 'he' ? spokenHebrew(it.text) : it.text).length, 0);
  console.log(`To record: ${todo.length} clips, ${chars.toLocaleString()} characters (voices: ${voices.he}, ${voices.en}).`);
  if (args.dryRun || todo.length === 0) {
    if (!args.dryRun) console.log('Manifest:', writeManifest());
    return;
  }
  const key = apiKey();
  for (const lang of ['he', 'en'] as const) mkdirSync(join(OUT, lang), { recursive: true });

  let done = 0;
  let failed = 0;
  const started = Date.now();
  try {
    await runPool(todo, args.concurrency, async (it) => {
      const path = join(OUT, it.lang, `${clipKey(it.lang, it.text)}.mp3`);
      try {
        writeFileSync(path, await synthesize(key, it.lang, voices[it.lang], it.text));
        tidy(path);
      } catch (e) {
        if (e instanceof FatalError) throw e;
        failed += 1;
        console.warn(`skip (${it.lang}) ${it.text.slice(0, 40)}: ${(e as Error).message}`);
      }
      done += 1;
      if (done % 250 === 0) {
        const rate = done / ((Date.now() - started) / 60000);
        console.log(`${done}/${todo.length} (${Math.round(rate)}/min, ${failed} failed)`);
      }
    });
  } finally {
    console.log(`Recorded ${done - failed}, failed ${failed}. Manifest:`, writeManifest());
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
