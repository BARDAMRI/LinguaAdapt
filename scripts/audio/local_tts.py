"""
Free, local voices for the recorded clips (no account, runs on this Mac).

  Hebrew : Resemble AI Chatterbox Multilingual (MIT)   — venv .cache/tts-he
  English: hexgrad Kokoro-82M (Apache-2.0)             — venv .cache/tts-en

Called by scripts/audio/generate.ts (npm run audio:generate); by hand:
  .cache/tts-he/bin/python -I scripts/audio/local_tts.py he jobs.json
  .cache/tts-en/bin/python -I scripts/audio/local_tts.py en jobs.json --voice af_heart

jobs.json: [{"out": "/abs/file.mp3", "attempts": ["text", "alt text", ...], "letters": 5}, ...]
Existing outputs are skipped, so a run can be stopped and resumed at any time.

Chatterbox sometimes rambles past the end of a short text or stops early.
Each Hebrew clip is therefore length-capped and checked against the length its
text should have; a bad take is retried (another take, then the alternative
spelling), and a clip that never passes is left out, so the app reads that one
with the device voice. Rejections are logged to <jobs>.rejected.jsonl.
"""
import json
import math
import os
import subprocess
import sys
import time

SPEED = 0.92  # English: a little slower than conversation, these are learners
TOKEN_HZ = 25  # Chatterbox speech tokens per second of audio


def encode_mp3(wav_path: str, mp3_path: str) -> None:
    trim = (
        "silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.06,"
        "areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.06,areverse"
    )
    tmp = mp3_path + ".tmp.mp3"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", wav_path, "-af", trim, "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "40k", tmp],
        check=True,
    )
    os.replace(tmp, mp3_path)
    os.remove(wav_path)


def expected_seconds(letters: int) -> float:
    return 0.25 + 0.1 * letters


def run_hebrew(jobs, rejected_log):
    import torch
    import torchaudio as ta
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    model = ChatterboxMultilingualTTS.from_pretrained(device=device)
    original = model.t3.inference
    state = {"cap": 1000, "tokens": 0}

    def capped(*args, **kwargs):
        kwargs["max_new_tokens"] = state["cap"]
        out = original(*args, **kwargs)
        state["tokens"] = int(out.shape[-1])
        return out

    model.t3.inference = capped

    for i, job in enumerate(jobs):
        exp = expected_seconds(job["letters"])
        state["cap"] = math.ceil(TOKEN_HZ * (2.4 * exp + 1.0))
        too_long = 2.2 * exp + 0.6
        too_short = 0.5 * exp
        tries = []
        for n, text in enumerate(job["attempts"]):
            temperature = 0.8 if n == 0 else 0.6
            wav = model.generate(text, language_id="he", temperature=temperature)
            dur = wav.shape[-1] / model.sr
            hit_cap = state["tokens"] >= state["cap"] - 1
            ok = not hit_cap and too_short <= dur <= too_long
            tries.append({"text": text, "seconds": round(dur, 2), "hit_cap": hit_cap})
            if ok:
                tmp = job["out"] + ".wav"
                ta.save(tmp, wav, model.sr)
                encode_mp3(tmp, job["out"])
                break
        else:
            rejected_log.write(json.dumps({"out": job["out"], "expected": round(exp, 2), "tries": tries}, ensure_ascii=False) + "\n")
            rejected_log.flush()
        yield i


def run_english(jobs, voice):
    import numpy as np
    import soundfile as sf
    from kokoro import KPipeline

    pipeline = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
    for i, job in enumerate(jobs):
        text = job["attempts"][0]
        parts = [audio for _, _, audio in pipeline(text, voice=voice, speed=SPEED)]
        if parts:
            audio = np.concatenate([p.numpy() if hasattr(p, "numpy") else p for p in parts])
            tmp = job["out"] + ".wav"
            sf.write(tmp, audio, 24000)
            encode_mp3(tmp, job["out"])
        yield i


def main():
    lang, jobs_path = sys.argv[1], sys.argv[2]
    voice = sys.argv[sys.argv.index("--voice") + 1] if "--voice" in sys.argv else "af_heart"
    with open(jobs_path, encoding="utf-8") as f:
        jobs = [j for j in json.load(f) if not os.path.exists(j["out"])]
    for d in {os.path.dirname(j["out"]) for j in jobs}:
        os.makedirs(d, exist_ok=True)
    print(f"{lang}: {len(jobs)} clips to record", flush=True)
    started = time.time()
    with open(jobs_path + ".rejected.jsonl", "a", encoding="utf-8") as rejected:
        runner = run_hebrew(jobs, rejected) if lang == "he" else run_english(jobs, voice)
        for i in runner:
            if (i + 1) % 50 == 0 or i + 1 == len(jobs):
                rate = (i + 1) / max(1e-6, time.time() - started)
                left = (len(jobs) - i - 1) / max(rate, 1e-6) / 3600
                print(f"{lang}: {i + 1}/{len(jobs)} ({rate * 60:.1f}/min, ~{left:.1f} h left)", flush=True)


if __name__ == "__main__":
    main()
