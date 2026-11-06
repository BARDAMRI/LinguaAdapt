#!/bin/sh
# One-time setup for the free local voices (models download on first use into .cache/hf).
#   Hebrew : Chatterbox Multilingual (MIT)   English: Kokoro-82M (Apache-2.0)
set -e
cd "$(dirname "$0")/../.."
PY=${PYTHON:-python3.11}
$PY -m venv .cache/tts-he
.cache/tts-he/bin/pip install -q --upgrade pip
.cache/tts-he/bin/pip install -q "chatterbox-tts==0.1.7"
$PY -m venv .cache/tts-en
.cache/tts-en/bin/pip install -q --upgrade pip
.cache/tts-en/bin/pip install -q "kokoro==0.9.4" soundfile
command -v ffmpeg >/dev/null || echo "Note: install ffmpeg (brew install ffmpeg) to encode the clips."
