#!/bin/sh
# One-time setup for the niqqud step: a local Python env and Dicta's model (pinned revision).
set -e
cd "$(dirname "$0")/../.."
python3 -m venv .cache/venv
.cache/venv/bin/pip install -q torch "transformers==4.46.3" huggingface_hub
HF_HOME="$PWD/.cache/hf" .cache/venv/bin/python -I -c "from huggingface_hub import snapshot_download; snapshot_download('dicta-il/dictabert-large-char-menaked', revision='4dfc20b94565d7868e1c8c00bf039d38c071a062')"
