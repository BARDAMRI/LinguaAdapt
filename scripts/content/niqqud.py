"""
Adds niqqud (vowel signs) to Hebrew lines with Dicta's open model
DictaBERT-large-char-menaked (CC BY 4.0), pinned to a reviewed revision.

Letters are never added or removed: the output, with its marks stripped, is
exactly the input. That keeps vowelled and unvowelled text interchangeable.

Usage (from the repo root):
  .cache/venv/bin/python -I scripts/content/niqqud.py .cache/niqqud-todo.txt scripts/content/niqqud-cache.json

IN.txt has one line per text. OUT.json maps text -> vowelled text and is
merged with what is already there, so re-runs only process new lines.
"""
import json
import os
import re
import sys
import time

MODEL = 'dicta-il/dictabert-large-char-menaked'
REVISION = '4dfc20b94565d7868e1c8c00bf039d38c071a062'
MARKS = re.compile(r'[\u0591-\u05BD\u05BF-\u05C2\u05C4\u05C5\u05C7]')


def strip(s: str) -> str:
    return MARKS.sub('', s)


def fix_matres(s: str) -> str:
    """Model output keeps vowel letters bare; put cholam/shuruk on the vav like standard spelling."""
    # letter + (dagesh?) + cholam, then a bare vav  ->  letter, then vav with cholam
    s = re.sub(r'([\u05D0-\u05EA][\u05BC\u05C1\u05C2]*)\u05B9\u05D5(?![\u05B0-\u05BC\u05C7])', '\\1\u05D5\u05B9', s)
    # letter + kubutz, then a bare vav  ->  letter, then shuruk (vav + dagesh)
    s = re.sub(r'([\u05D0-\u05EA][\u05BC\u05C1\u05C2]*)\u05BB\u05D5(?![\u05B0-\u05BC\u05C7])', '\\1\u05D5\u05BC', s)
    return s


def main() -> None:
    src, out = sys.argv[1], sys.argv[2]
    lines = [l.rstrip('\n') for l in open(src, encoding='utf8') if l.strip()]
    done = {}
    if os.path.exists(out):
        done = json.load(open(out, encoding='utf8'))
    todo = [l for l in dict.fromkeys(lines) if l not in done]
    print(f'{len(lines)} lines, {len(todo)} new', flush=True)
    if not todo:
        return

    import torch
    from transformers import AutoModel, AutoTokenizer

    torch.set_grad_enabled(False)
    tok = AutoTokenizer.from_pretrained(MODEL, revision=REVISION, local_files_only=True)
    model = AutoModel.from_pretrained(MODEL, revision=REVISION, trust_remote_code=True, local_files_only=True)
    model.eval()
    device = 'mps' if torch.backends.mps.is_available() else 'cpu'
    model.to(device)

    batch = 32
    rejected = []
    t0 = time.time()
    todo.sort(key=len)
    for i in range(0, len(todo), batch):
        chunk = todo[i:i + batch]
        try:
            res = model.predict(chunk, tok, mark_matres_lectionis='')
        except Exception as e:  # one bad line should not stop the run
            print('batch failed:', e, flush=True)
            res = []
            for one in chunk:
                try:
                    res.append(model.predict([one], tok, mark_matres_lectionis='')[0])
                except Exception:
                    res.append(None)
        for src_line, vow in zip(chunk, res):
            if not vow:
                continue
            vow = fix_matres(vow)
            if strip(vow) != strip(src_line):
                rejected.append({'in': src_line, 'out': vow})
                continue  # never accept output that changed the letters
            done[src_line] = vow
        if (i // batch) % 20 == 0:
            rate = (i + len(chunk)) / max(1e-6, time.time() - t0)
            print(f'{i + len(chunk)}/{len(todo)}  {rate:.1f}/s', flush=True)
            json.dump(done, open(out, 'w', encoding='utf8'), ensure_ascii=False)
    json.dump(done, open(out, 'w', encoding='utf8'), ensure_ascii=False)
    json.dump(rejected, open(out + '.rejected.json', 'w', encoding='utf8'), ensure_ascii=False, indent=0)
    print('done', len(done), 'rejected', len(rejected), flush=True)


if __name__ == '__main__':
    main()
