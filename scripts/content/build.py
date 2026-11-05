"""
Builds LinguaAdapt's word, sentence and course packs.

Sources (downloaded to .cache/content by `fetch.sh`):
  * Wiktionary (English edition) Hebrew entries via kaikki.org — CC BY-SA 4.0
  * Tatoeba Hebrew/English sentences and links — CC BY 2.0 FR
  * Own content: curated word list (src/data), phrasebook (scripts/content)

Outputs:
  public/content/v1/*.json      downloaded by the app on first use
  src/content/generated/*.json  small own-content files bundled in the app
  .cache/niqqud-todo.txt        Hebrew lines that still need niqqud

Run:  python3 -I scripts/content/build.py   (stdlib only)
Then: npm run content:niqqud
and build again to fold the vowels in.
"""
import collections
import hashlib
import json
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CACHE = os.path.join(ROOT, '.cache', 'content')
OUT_PUBLIC = os.path.join(ROOT, 'public', 'content', 'v1')
OUT_BUNDLED = os.path.join(ROOT, 'src', 'content', 'generated')
NIQQUD_JSON = os.path.join(HERE, 'niqqud-cache.json')
NIQQUD_TODO = os.path.join(ROOT, '.cache', 'niqqud-todo.txt')

PACK_VERSION = 1

MARKS = re.compile(r'[֑-ֽֿ-ׇׂׅׄ]')
HEB = re.compile(r'[א-ת]')
FINALS = str.maketrans('ךםןףץ', 'כמנפצ')


def strip(s: str) -> str:
    return MARKS.sub('', unicodedata.normalize('NFC', s))


def norm_he(s: str) -> str:
    return strip(s).replace('־', ' ').strip()


def sid(prefix: str, *parts: str) -> str:
    h = hashlib.sha1('|'.join(parts).encode('utf8')).hexdigest()[:8]
    return f'{prefix}{h}'


def load_niqqud() -> dict:
    if os.path.exists(NIQQUD_JSON):
        return json.load(open(NIQQUD_JSON, encoding='utf8'))
    return {}


NIQQUD = load_niqqud()
NEED_NIQQUD = set()


def vowelled(plain: str) -> str:
    """Vowelled form from the Dicta run, or the plain text (queued for the next run)."""
    v = NIQQUD.get(plain)
    if v:
        return unicodedata.normalize('NFC', v)
    NEED_NIQQUD.add(plain)
    return plain


# ───────────────────────────────────────────────────────── transliteration ──

CONS = {
    'א': '', 'ב': 'v', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z', 'ח': 'kh', 'ט': 't',
    'י': 'y', 'כ': 'kh', 'ך': 'kh', 'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's',
    'ע': '', 'פ': 'f', 'ף': 'f', 'צ': 'ts', 'ץ': 'ts', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't',
}
HARD = {'ב': 'b', 'כ': 'k', 'ך': 'k', 'פ': 'p', 'ף': 'p'}
VOWEL = {
    'ַ': 'a', 'ָ': 'a', 'ֲ': 'a', 'ֵ': 'e', 'ֶ': 'e', 'ֱ': 'e',
    'ִ': 'i', 'ֹ': 'o', 'ֺ': 'o', 'ֳ': 'o', 'ֻ': 'u', 'ׇ': 'o',
}


def translit_word(word: str) -> str:
    g = []  # graphemes: (letter, marks)
    for ch in unicodedata.normalize('NFD', word):
        if HEB.match(ch):
            g.append([ch, ''])
        elif g and '֑' <= ch <= 'ׇ':
            g[-1][1] += ch
        elif ch in "'׳":
            if g:
                g[-1][1] += '׳'
        else:
            g.append([ch, None])
    out = []
    prev_shva = False
    for i, (ch, marks) in enumerate(g):
        if marks is None:
            out.append(ch)
            prev_shva = False
            continue
        last = i == len(g) - 1
        dagesh = 'ּ' in marks
        geresh = '׳' in marks
        vowel = ''.join(VOWEL[m] for m in marks if m in VOWEL)
        shva = 'ְ' in marks
        if ch == 'ו' and marks.replace('ּ', '') == '' and dagesh and not vowel:
            out.append('u')  # shuruk
            prev_shva = False
            continue
        if ch == 'ו' and 'ֹ' in marks and not vowel.replace('o', ''):
            out.append('o')  # cholam male
            prev_shva = False
            continue
        if ch == 'י' and not marks and i > 0 and g[i - 1][1] and any(v in g[i - 1][1] for v in 'ִֵֶ'):
            continue  # yod as a vowel letter after i / e
        if ch == 'ו' and not marks and i > 0 and g[i - 1][1] and 'ֹ' in (g[i - 1][1] or ''):
            continue
        if ch in 'אה' and not marks and (last or i > 0):
            continue  # silent
        if ch == 'ש':
            c = 's' if 'ׂ' in marks else 'sh'
        elif geresh and ch in 'גזצ':
            c = {'ג': 'j', 'ז': 'zh', 'צ': 'ch'}[ch]
        elif dagesh and ch in HARD:
            c = HARD[ch]
        elif ch == 'ב' and i == 0 and not marks:
            c = 'b'
        elif ch in 'כפ' and i == 0 and not marks:
            c = HARD[ch]
        else:
            c = CONS.get(ch, '')
        if ch in 'אע' and out and out[-1] and out[-1][-1] in 'aeiou' and vowel:
            c = "'"
        # Patach under a final ח / ע is read before the consonant (tapuach).
        if last and ch in 'חע' and vowel == 'a':
            out.append('a' + c)
            continue
        if shva:
            first = i == 0
            sound = ''
            if first and ch in 'בכלמוש':
                sound = 'e'
            elif prev_shva and not last:
                sound = 'e'
            out.append(c + sound)
            prev_shva = sound == ''
            continue
        out.append(c + vowel)
        prev_shva = False
    return ''.join(out)


def translit(text: str) -> str:
    parts = re.split(r'(\s+|[,.!?;:"״־–—…]+)', text)
    res = []
    for p in parts:
        if HEB.search(p):
            w = translit_word(p)
            w = re.sub(r'ayy?$', 'ai', w)
            w = re.sub(r'yy', 'y', w)
            res.append(w)
        else:
            res.append(p.replace('־', '-'))
    return re.sub(r'\s+', ' ', ''.join(res)).strip()


def clean_tr(tr: str) -> str:
    t = tr.split(',')[0].split(' / ')[0].strip()
    t = unicodedata.normalize('NFD', t)
    t = ''.join(ch for ch in t if not unicodedata.combining(ch))
    t = t.replace('ḥ', 'kh').replace('ʾ', "'").replace('ʿ', "'").replace('ṭ', 't').replace('ṣ', 'ts').replace('š', 'sh')
    return t


# ─────────────────────────────────────────────────────────── curated input ──

def load_curated():
    src = open(os.path.join(ROOT, 'src', 'data', 'heVocabularyData.ts'), encoding='utf8').read()
    rx = r"\{ he: '((?:[^'\\]|\\.)*)', en: '((?:[^'\\]|\\.)*)', difficulty: (\d), topic: '(\w+)' \}"
    words = [(h.replace("\\'", "'"), e.replace("\\'", "'"), int(d), t) for h, e, d, t in re.findall(rx, src)]
    src = open(os.path.join(ROOT, 'src', 'data', 'heSentenceData.ts'), encoding='utf8').read()
    sents = [(h.replace("\\'", "'"), e.replace("\\'", "'"), int(d), t) for h, e, d, t in re.findall(rx, src)]
    return words, sents


FIXES = {'אפטיקה': 'אופטיקה'}

TOPICS = {
    'greetings': ('Greetings', 'ברכות', '👋'), 'numbers': ('Numbers', 'מספרים', '🔢'),
    'family': ('Family', 'משפחה', '👪'), 'colors': ('Colors', 'צבעים', '🎨'),
    'food': ('Food', 'אוכל', '🍽️'), 'drinks': ('Drinks', 'שתייה', '🥤'),
    'animals': ('Animals', 'בעלי חיים', '🐾'), 'body': ('The body', 'הגוף', '🧍'),
    'home': ('Home', 'בית', '🏠'), 'furniture': ('Furniture', 'רהיטים', '🛋️'),
    'clothing': ('Clothes', 'בגדים', '👕'), 'time': ('Time', 'זמן', '⏰'),
    'weather': ('Weather', 'מזג אוויר', '🌤️'), 'seasons': ('Seasons', 'עונות', '🍂'),
    'nature': ('Nature', 'טבע', '🌿'), 'places': ('Places', 'מקומות', '📍'),
    'transport': ('Transport', 'תחבורה', '🚌'), 'travel': ('Travel', 'טיולים', '✈️'),
    'emotions': ('Feelings', 'רגשות', '😊'), 'adjectives': ('Describing words', 'תארים', '✨'),
    'verbs': ('Action words', 'פעלים', '🏃'), 'questions': ('Questions', 'שאלות', '❓'),
    'positions': ('Where things are', 'מיקום', '📦'), 'people': ('People', 'אנשים', '🧑'),
    'professions': ('Jobs', 'מקצועות', '🧑‍⚕️'), 'work': ('Work', 'עבודה', '💼'),
    'school': ('School', 'בית ספר', '🏫'), 'money': ('Money', 'כסף', '💰'),
    'shopping': ('Shopping', 'קניות', '🛒'), 'health': ('Health', 'בריאות', '🩺'),
    'medical': ('At the doctor', 'אצל הרופא', '💊'), 'emergency': ('Emergencies', 'חירום', '🚨'),
    'hobbies': ('Hobbies', 'תחביבים', '🎨'), 'sports': ('Sports', 'ספורט', '⚽'),
    'tech': ('Technology', 'טכנולוגיה', '💻'), 'culture': ('Culture', 'תרבות', '🕎'),
    'expressions': ('Expressions', 'ביטויים', '💬'), 'advanced': ('Advanced words', 'מילים מתקדמות', '🎓'),
}
TOPIC_ORDER = [
    'greetings', 'numbers', 'family', 'colors', 'food', 'drinks', 'animals', 'body', 'home',
    'clothing', 'time', 'weather', 'questions', 'people', 'emotions', 'adjectives', 'verbs',
    'places', 'transport', 'nature', 'seasons', 'furniture', 'school', 'work', 'professions',
    'money', 'shopping', 'health', 'medical', 'travel', 'hobbies', 'sports', 'tech', 'culture',
    'positions', 'emergency', 'expressions', 'advanced',
]

EMOJI = json.load(open(os.path.join(HERE, 'emoji.json'), encoding='utf8'))


def emoji_for(en: str):
    e = en.lower().strip()
    for cand in [e, e.split(' / ')[0], e.split('/')[0].strip(), re.sub(r'\s*\(.*?\)', '', e).strip(), re.sub(r'^(a|an|the)\s+', '', e)]:
        cand = cand.strip()
        if cand in EMOJI:
            return EMOJI[cand]
    return None


# ───────────────────────────────────────────────────────────── Wiktionary ──

POS = {'noun': 'noun', 'verb': 'verb', 'adj': 'adj', 'adv': 'adv', 'pron': 'pron', 'prep': 'prep',
       'conj': 'conj', 'num': 'num', 'intj': 'intj', 'phrase': 'phrase', 'det': 'other', 'particle': 'other',
       'prep_phrase': 'phrase', 'contraction': 'other'}
SKIP_TAGS = {'obsolete', 'archaic', 'Biblical-Hebrew', 'Mishnaic-Hebrew', 'rare', 'Rabbinic', 'Aramaic',
             'historical', 'dated', 'poetic', 'literary', 'form-of', 'alt-of', 'misspelling', 'abbreviation',
             'Medieval-Hebrew', 'Talmudic', 'nonstandard', 'Tiberian', 'vulgar', 'offensive', 'derogatory',
             'slur', 'pejorative', 'ethnic'}
RUDE = re.compile(r'\b(fuck\w*|shit\w*|penis|vagina|cunt|dick|cock|whore|prostitut\w*|bitch|bastard|ass|asshole|arse|sex\w*|testicle\w*|scrotum|anus|fart\w*|piss\w*|faggot|nigger|slut|horny|orgasm|masturbat\w*|genital\w*|erection|porn\w*|crap)\b', re.I)


def gloss_clean(g: str) -> str:
    g = re.sub(r'\s+', ' ', g).strip().rstrip('.')
    return g


def short_gloss(g: str) -> str:
    """'Of, belonging to, owned by' -> 'of, belonging to'; drops notes in brackets."""
    prev = None
    while prev != g:
        prev = g
        g = re.sub(r'\s*\([^()]*\)', '', g)
    g = g.replace('(', '').replace(')', '').strip().rstrip(':').strip()
    g = g.split(';')[0].split(':')[0].strip()
    parts = [p.strip() for p in g.split(',') if p.strip()]
    out = parts[0] if parts else g
    if len(parts) > 1 and len(out) + len(parts[1]) < 24:
        out = f'{out}, {parts[1]}'
    if out[:1].isupper() and not out[1:2].isupper() and out.split(' ')[0] not in ('I', 'God', 'Israel', 'Shabbat', 'Jewish'):
        out = out[0].lower() + out[1:]
    out = re.sub(r'^to to ', 'to ', out, flags=re.I)
    out = re.sub(r'^to (can|must|may|should)\b', r'\1', out)
    return out


INFINITIVE_OF = {}


def load_wiktionary():
    entries = []
    path = os.path.join(CACHE, 'kaikki.org-dictionary-Hebrew.jsonl')
    for line in open(path, encoding='utf8'):
        e = json.loads(line)
        pos = POS.get(e.get('pos'))
        word = e.get('word', '')
        if not pos or not HEB.search(word) or len(word) > 30:
            continue
        glosses = []
        ht0 = (e.get('head_templates') or [{}])[0]
        for s in e.get('senses', []):
            tags = set(s.get('tags', []))
            if tags & SKIP_TAGS or s.get('form_of') or s.get('alt_of'):
                continue
            for g in s.get('glosses', [])[:1]:
                g = gloss_clean(g)
                m_inf = re.match(r'^(?:to-)?infinitive of ([\u0590-\u05FF]+)', g)
                if m_inf:
                    INFINITIVE_OF[strip(m_inf.group(1))] = (strip(word), (ht0.get('args', {}).get('wv') or word))
                    continue
                if re.match(r'^(\S+ ){0,3}(infinitive|plural|singular|inflection|form|participle|spelling|tense|imperative|construct state) of', g, re.I) or g.lower().startswith('alternative'):
                    continue
                if RUDE.search(g):
                    glosses = None
                    break
                if g and len(g) < 90 and g not in glosses:
                    glosses.append(g)
            if glosses is None:
                break
        if not glosses:
            continue
        ht = (e.get('head_templates') or [{}])[0]
        args = ht.get('args', {})
        wv = args.get('wv') or next((f['form'] for f in e.get('forms', []) if 'canonical' in f.get('tags', [])), word)
        plain = word
        tr = clean_tr(args['tr']) if args.get('tr') else ''
        if pos == 'verb':
            inf = args.get('inf') or next((f['form'] for f in e.get('forms', []) if 'infinitive' in f.get('tags', []) and not MARKS.search(f['form'])), None)
            infv = args.get('infdwv') or next((f['form'] for f in e.get('forms', []) if 'infinitive' in f.get('tags', []) and MARKS.search(f['form'])), None)
            if not inf and infv:
                inf = strip(infv.split(' / ')[0])
            if inf:
                plain = inf.split(' / ')[0].strip()
                wv = (infv or '').split(' / ')[0].strip() or plain
                tr = translit(wv) if MARKS.search(wv) else ''
            glosses = [g if g.lower().startswith('to ') else f'to {g}' for g in glosses]
        g = args.get('g', '')
        gender = 'f' if g.startswith('f') else 'm' if g.startswith('m') else None
        if g in ('mf', 'm-f', 'm/f'):
            gender = 'mf'
        pl = args.get('pl')
        plural = pl if pl and pl != '-' and HEB.search(pl) else None
        root = None
        for t in e.get('etymology_templates', []):
            if t.get('name') in ('he-rootbox', 'he-root'):
                root = t.get('args', {}).get('1')
            elif t.get('name') == 'etymon' and t.get('args', {}).get('2') == ':root':
                root = t['args'].get('3')
            if root:
                break
        forms = {strip(word)}
        for f in ([] if ' ' in word else e.get('forms', [])):
            fm = f.get('form', '')
            if HEB.search(fm):
                forms.add(strip(fm).rstrip('־'))
            for ln in f.get('links') or []:
                if len(ln) > 1 and HEB.search(ln[1]):
                    forms.add(strip(ln[1].split('#')[0]))
        forms.add(strip(plain))
        entries.append({
            'word': word, 'plain': strip(plain), 'v': unicodedata.normalize('NFC', wv), 'tr': tr,
            'pos': pos, 'gender': gender, 'plural': plural, 'root': root, 'glosses': glosses[:4],
            'forms': forms,
            'lemma_v': unicodedata.normalize('NFC', args.get('wv') or word),
        })
    for e in entries:
        if e['pos'] != 'verb' or e['plain'] != strip(e['word']):
            continue
        hit = INFINITIVE_OF.get(strip(e['lemma_v'])) or INFINITIVE_OF.get(strip(e['word']))
        if hit:
            e['plain'], e['v'] = hit[0], unicodedata.normalize('NFC', hit[1])
            e['tr'] = translit(e['v']) if MARKS.search(e['v']) else ''
            e['forms'].add(hit[0])
    return entries


# ───────────────────────────────────────────────────────────────── Tatoeba ──

def tokens_he(s: str):
    return [t for t in re.split(r'[^א-ת׳״׳״"\']+', strip(s)) if HEB.search(t)]


def tokens_en(s: str):
    return re.findall(r"[a-z]+(?:'[a-z]+)?", s.lower())


def load_tatoeba():
    he = {}
    owner = {}
    for line in open(os.path.join(CACHE, 'heb_sentences_detailed.tsv'), encoding='utf8'):
        p = line.rstrip('\n').split('\t')
        if len(p) >= 4:
            he[int(p[0])] = p[2]
            owner[int(p[0])] = p[3]
    natives = set()
    for line in open(os.path.join(CACHE, 'user_languages.csv'), encoding='utf8'):
        p = line.rstrip('\n').split('\t')
        if len(p) >= 3 and p[0] == 'heb' and p[1] in ('4', '5'):
            natives.add(p[2])
    links = collections.defaultdict(list)
    need_en = set()
    for line in open(os.path.join(CACHE, 'heb-eng_links.tsv'), encoding='utf8'):
        a, b = line.split('\t')
        a, b = int(a), int(b)
        if a in he:
            links[a].append(b)
            need_en.add(b)
    en = {}
    en_counts = collections.Counter()
    for line in open(os.path.join(CACHE, 'eng_sentences.tsv'), encoding='utf8'):
        p = line.rstrip('\n').split('\t')
        if len(p) < 3:
            continue
        i = int(p[0])
        en_counts.update(tokens_en(p[2]))
        if i in need_en:
            en[i] = p[2]
    return he, owner, natives, links, en, en_counts


# ─────────────────────────────────────────────────────────────────── build ──

PREFIXES = ['ו', 'ה', 'ב', 'ל', 'מ', 'ש', 'כ']
NAMES_EN = {'tom', 'mary', 'john', 'boston', 'alice', 'jack', 'sami', 'layla', 'dan', 'linda', 'ken', 'tony',
            'mike', 'bob', 'jim', 'paris', 'london', 'japan', 'australia', 'america', 'french', 'england', 'tokyo',
            'mennad', 'baya', 'ziri', 'skura', 'yanni', 'rima', 'taninna'}
NAMES_HE = {'טום', 'תום', 'מרי', 'ג׳ון', "ג'ון", 'בוסטון', 'אליס', 'ג׳ק', 'סמי', 'ליילה', 'דן'}


def lookup(token, form_map):
    if token in form_map:
        return form_map[token]
    t = token
    for _ in range(2):
        if len(t) > 2 and t[0] in PREFIXES:
            t = t[1:]
            if t in form_map:
                return form_map[t]
            if t.startswith('ה') and t[1:] in form_map:
                return form_map[t[1:]]
        else:
            break
    return None


EN_IRREG = {'went': 'go', 'gone': 'go', 'was': 'be', 'were': 'be', 'is': 'be', 'are': 'be', 'am': 'be', 'been': 'be',
            'did': 'do', 'does': 'do', 'done': 'do', 'had': 'have', 'has': 'have', 'saw': 'see', 'seen': 'see',
            'ate': 'eat', 'eaten': 'eat', 'came': 'come', 'took': 'take', 'taken': 'take', 'made': 'make',
            'said': 'say', 'told': 'tell', 'got': 'get', 'gave': 'give', 'given': 'give', 'knew': 'know',
            'known': 'know', 'thought': 'think', 'bought': 'buy', 'wrote': 'write', 'written': 'write',
            'children': 'child', 'men': 'man', 'women': 'woman', 'feet': 'foot', 'teeth': 'tooth', 'mice': 'mouse',
            'people': 'person', 'better': 'good', 'best': 'good', 'worse': 'bad', 'ran': 'run', 'sat': 'sit',
            'stood': 'stand', 'slept': 'sleep', 'left': 'leave', 'felt': 'feel', 'found': 'find', 'heard': 'hear',
            'met': 'meet', 'paid': 'pay', 'read': 'read', 'spoke': 'speak', 'spoken': 'speak', 'drank': 'drink',
            'swam': 'swim', 'sang': 'sing', 'began': 'begin', 'brought': 'bring', 'taught': 'teach', 'lost': 'lose',
            'won': 'win', 'flew': 'fly', 'drove': 'drive', 'fell': 'fall', 'kept': 'keep', 'sent': 'send', 'built': 'build',
            "i'm": 'i', "don't": 'do', "doesn't": 'do', "didn't": 'do', "can't": 'can', "isn't": 'be', "it's": 'it',
            "i've": 'i', "i'll": 'i', "you're": 'you', "that's": 'that', "won't": 'will', "aren't": 'be',
            "wasn't": 'be', "we're": 'we', "they're": 'they', "let's": 'let', "he's": 'he', "she's": 'she',
            "what's": 'what', "there's": 'there', "you'll": 'you', "i'd": 'i', "couldn't": 'could', "shouldn't": 'should',
            "wouldn't": 'would', "haven't": 'have', "hasn't": 'have'}


def en_lemmas(tok):
    out = [tok]
    if tok in EN_IRREG:
        out.append(EN_IRREG[tok])
    for suf, rep in (('ies', 'y'), ('es', ''), ('s', ''), ('ied', 'y'), ('ed', ''), ('ed', 'e'), ('ing', ''), ('ing', 'e'), ("'s", '')):
        if tok.endswith(suf) and len(tok) > len(suf) + 2:
            out.append(tok[: -len(suf)] + rep)
    if re.match(r'.*(.)\1(ed|ing)$', tok):
        out.append(re.sub(r'(.)\1(ed|ing)$', r'\1', tok))
    return out


# Common English words whose automatic Hebrew pick is poor. '' = leave out of the word list.
EN_HE_OVERRIDE = {
    'people': 'אנשים', 'want': 'לרצות', 'need': 'צריך', 'say': 'להגיד', 'make': 'לעשות', 'look': 'להסתכל',
    'talk': 'לדבר', 'leave': 'לעזוב', 'right': 'נכון', 'well': 'טוב', 'better': 'יותר טוב', 'ever': 'אי פעם',
    'every': 'כל', 'even': 'אפילו', 'way': 'דרך', 'lot': 'הרבה', 'again': 'שוב', 'home': 'בית', 'into': 'לתוך',
    'any': 'כל', 'might': 'אולי', 'tell': 'לספר', 'next': 'הבא', 'little': 'קטן', 'other': 'אחר', 'too': 'גם',
    'some': 'כמה', 'about': 'על', 'there': 'שם', 'up': 'למעלה', 'like': 'כמו', 'you': 'אתה', 'they': 'הם',
    'can': 'יכול', 'know': 'לדעת', 'think': 'לחשוב', 'come': 'לבוא', 'take': 'לקחת', 'give': 'לתת', 'put': 'לשים',
    'find': 'למצוא', 'go': 'ללכת', 'see': 'לראות', 'help': 'לעזור', 'work': 'לעבוד', 'love': 'לאהוב',
    'life': 'חיים', 'much': 'הרבה', 'many': 'הרבה', 'only': 'רק', 'very': 'מאוד', 'here': 'כאן', 'not': 'לא',
    'we': 'אנחנו', 'he': 'הוא', 'she': 'היא', 'this': 'זה', 'what': 'מה', 'my': 'שלי', 'your': 'שלך', 'his': 'שלו',
    'her': 'שלה', 'our': 'שלנו', 'their': 'שלהם', 'me': 'אותי', 'him': 'אותו', 'us': 'אותנו', 'them': 'אותם',
    'all': 'כל', 'when': 'מתי', 'where': 'איפה', 'why': 'למה', 'how': 'איך', 'who': 'מי', 'if': 'אם', 'but': 'אבל',
    'or': 'או', 'so': 'אז', 'because': 'כי', 'yes': 'כן', 'no': 'לא', 'now': 'עכשיו', 'today': 'היום',
    'tomorrow': 'מחר', 'yesterday': 'אתמול', 'always': 'תמיד', 'never': 'אף פעם', 'still': 'עדיין', 'already': 'כבר',
    'also': 'גם', 'more': 'יותר', 'most': 'הכי', 'good': 'טוב', 'bad': 'רע', 'new': 'חדש', 'old': 'ישן', 'big': 'גדול',
    'small': 'קטן', 'long': 'ארוך', 'thing': 'דבר', 'things': '', 'something': 'משהו', 'anything': 'משהו',
    'nothing': 'כלום', 'everything': 'הכול', 'someone': 'מישהו', 'everyone': 'כולם', 'nobody': 'אף אחד',
    'man': 'איש', 'woman': 'אישה', 'child': 'ילד', 'friend': 'חבר', 'house': 'בית', 'day': 'יום', 'night': 'לילה',
    'time': 'זמן', 'year': 'שנה', 'week': 'שבוע', 'hour': 'שעה', 'water': 'מים', 'money': 'כסף', 'book': 'ספר',
    'car': 'מכונית', 'school': 'בית ספר', 'family': 'משפחה', 'thought': '', 'wanted': '', 'made': '', 'done': '',
    'let': '', 'off': '', 'away': '', 'left': '', 'got': '', 'said': '', 'went': '', 'came': '', 'took': '',
    'told': '', 'knew': '', 'saw': '', 'gave': '', 'found': '', 'felt': '', 'heard': '', 'asked': '', 'tried': '',
    'used': '', 'called': '', 'seemed': '', 'became': '', 'kept': '', 'began': '', 'must': 'חייב', 'could': '',
    'would': '', 'may': '', 'shall': '', 'been': '', 'being': '', 'was': '', 'were': '', 'did': '', 'does': '', 'has': '',
    'have': 'יש', 'am': '', 'is': '', 'are': '', 'back': 'בחזרה', 'down': 'למטה', 'over': 'מעל', 'out': 'בחוץ',
    'sure': 'בטוח', 'able': 'מסוגל', 'eat': 'לאכול', 'drink': 'לשתות', 'sleep': 'לישון', 'live': 'לגור',
    'buy': 'לקנות', 'speak': 'לדבר', 'read': 'לקרוא', 'write': 'לכתוב', 'learn': 'ללמוד', 'study': 'ללמוד',
    'play': 'לשחק', 'run': 'לרוץ', 'walk': 'ללכת', 'sit': 'לשבת', 'stand': 'לעמוד', 'open': 'לפתוח', 'close': 'לסגור',
    'start': 'להתחיל', 'stop': 'לעצור', 'wait': 'לחכות', 'ask': 'לשאול', 'answer': 'לענות', 'understand': 'להבין',
    'remember': 'לזכור', 'forget': 'לשכוח', 'like_v': '', 'try': 'לנסות', 'use': 'להשתמש', 'call': 'להתקשר',
    'feel': 'להרגיש', 'hear': 'לשמוע', 'listen': 'להקשיב', 'show': 'להראות', 'bring': 'להביא', 'send': 'לשלוח',
    'pay': 'לשלם', 'meet': 'לפגוש', 'become': 'להיות', 'keep': 'לשמור', 'happen': 'לקרות', 'believe': 'להאמין',
    'world': 'עולם', 'hope': 'לקוות', 'die': 'למות', 'win': 'לנצח', 'lose': 'להפסיד', 'cook': 'לבשל', 'wash': 'לשטוף', 'clean': 'לנקות',
}


def chunk(seq, n):
    return [seq[i:i + n] for i in range(0, len(seq), n)]


def main():
    os.makedirs(OUT_PUBLIC, exist_ok=True)
    os.makedirs(OUT_BUNDLED, exist_ok=True)
    curated_words, curated_sents = load_curated()
    print('curated', len(curated_words), 'words,', len(curated_sents), 'sentences')
    wik = load_wiktionary()
    print('wiktionary entries', len(wik))
    he, owner, natives, links, en, en_counts = load_tatoeba()
    print('tatoeba he', len(he), 'linked', len(links), 'en', len(en))

    # Hebrew frequency from Tatoeba, attributed to dictionary entries through their forms.
    form_map = collections.defaultdict(list)
    for i, e in enumerate(wik):
        for f in e['forms']:
            form_map[f].append(i)
    tok_counts = collections.Counter()
    for s in he.values():
        tok_counts.update(t for t in tokens_he(s) if t not in NAMES_HE)
    plain_map = collections.defaultdict(list)
    for i, e in enumerate(wik):
        plain_map[e['plain']].append(i)
        plain_map[strip(e['word'])].append(i)
    STOP = {'to', 'a', 'an', 'the', 'be', 'of', 'one', 'or', 'and', 'in', 'something', 'someone', 'oneself'}

    def en_score(e):
        best = 0
        for gi, g in enumerate(e['glosses'][:3]):
            words = [w for w in re.findall(r"[a-z]+", re.sub(r'\(.*?\)', '', g).lower()) if w not in STOP]
            if words:
                best = max(best, en_counts.get(words[0], 0) / (1 + gi))
        return best

    escore = [en_score(e) for e in wik]
    freq = [0] * len(wik)
    for tok, c in tok_counts.items():
        cands = {i for i in set(plain_map.get(tok, [])) | set(lookup(tok, form_map) or []) if ' ' not in wik[i]['plain']}
        if cands:
            # Homographs: the most common meaning gets the count.
            win = max(cands, key=lambda i: (escore[i], len(wik[i]['glosses'])))
            freq[win] += c
    for i, e in enumerate(wik):
        e['freq'] = freq[i]

    # ── Dictionary entries (all usable Hebrew words) ─────────────────────────
    dict_entries = []
    by_plain = collections.defaultdict(list)
    for e in wik:
        wid = sid('w:he:', e['plain'], e['pos'], e['v'])
        e['id'] = wid
        by_plain[e['plain']].append(e)
    seen_ids = set()
    for e in sorted(wik, key=lambda x: -x['freq']):
        if e['id'] in seen_ids:
            continue
        seen_ids.add(e['id'])
        dict_entries.append(e)

    # ── en-he course words: curated first (by topic), then frequency ────────
    def match_curated(h, en_text):
        h = FIXES.get(h, h)
        cands = by_plain.get(strip(h), [])
        en_words = set(re.findall(r'[a-z]+', en_text.lower())) - {'to', 'a', 'the', 'an', 'of'}
        best, best_score = None, -1
        for c in cands:
            gw = set(re.findall(r'[a-z]+', ' '.join(c['glosses']).lower()))
            score = len(en_words & gw) * 10 + min(c['freq'], 9999) / 10000
            if score > best_score:
                best, best_score = c, score
        return h, best if best_score >= 10 else None

    course_he = []  # list of word dicts in course order (en-he)
    used_plain = set()
    for topic in TOPIC_ORDER:
        rows = sorted([w for w in curated_words if w[3] == topic], key=lambda w: w[2])
        for h, en_text, diff, _ in rows:
            h2, m = match_curated(h, en_text)
            if strip(h2) in used_plain:
                continue
            used_plain.add(strip(h2))
            if m:
                mv = m['v'] if MARKS.search(m['v']) else vowelled(m['plain'])
                word = {'id': m['id'], 'he': m['plain'], 'heNiqqud': mv, 'translit': m['tr'] or translit(mv),
                        'en': en_text, 'pos': m['pos'], 'gender': m['gender'], 'plural': m['plural'], 'root': m['root']}
            else:
                v = vowelled(h2)
                word = {'id': sid('w:he:', strip(h2), 'own', en_text), 'he': strip(h2), 'heNiqqud': v,
                        'translit': translit(v) if v != h2 else '', 'en': en_text, 'pos': 'phrase' if ' ' in h2 else None}
            word['topic'] = topic
            word['emoji'] = emoji_for(en_text) or emoji_for(en_text.split(' / ')[0])
            course_he.append(word)
    curated_count = len(course_he)
    FREQ_TARGET = 1600
    added = 0
    for e in dict_entries:
        if added >= FREQ_TARGET:
            break
        if e['plain'] in used_plain or e['freq'] < 8 or e['pos'] in ('phrase',) or len(e['plain']) < 2:
            continue
        if e['plain'] in NAMES_HE or ' ' in e['plain'] or '־' in e['plain'] or '־' in e['v']:
            continue
        g0 = short_gloss(e['glosses'][0])
        if not g0 or len(g0) > 32 or re.search(r'(given name|surname|letter of the|alternative|plural of|feminine of|construct|abbreviation|nominative|particle)', e['glosses'][0], re.I):
            continue
        used_plain.add(e['plain'])
        course_he.append({'id': e['id'], 'he': e['plain'], 'heNiqqud': e['v'], 'translit': e['tr'] or translit(e['v']),
                          'en': g0, 'enAlt': [short_gloss(x) for x in e['glosses'][1:3]], 'pos': e['pos'], 'gender': e['gender'],
                          'plural': e['plural'], 'root': e['root'], 'emoji': emoji_for(g0), 'topic': 'common'})
        added += 1
    print('en-he course words', len(course_he), f'({curated_count} curated)')

    # ── he-en course words: English targets with Hebrew meanings ─────────────
    inverse = collections.defaultdict(list)
    for e in dict_entries:
        if '־' in e['plain'] or '־' in e['v'] or ' ' in e['plain']:
            continue
        for gi, g in enumerate(e['glosses'][:3]):
            core = re.sub(r'\s*\(.*?\)', '', g).strip().lower()
            core = re.sub(r'^(a|an|the)\s+', '', core)
            pieces = [p.strip() for p in re.split(r'[;,]', core) if p.strip()]
            for pi, piece in enumerate(pieces):
                # rank: whole gloss > first piece > later pieces; then by how common the Hebrew word is
                rank = 0 if len(pieces) == 1 else 1 if pi == 0 else 2
                inverse[piece].append((rank + gi, -e['freq'], e))
    course_en = []
    used_en = set()
    for topic in TOPIC_ORDER:
        rows = sorted([w for w in curated_words if w[3] == topic], key=lambda w: w[2])
        for h, en_text, diff, _ in rows:
            first = re.sub(r'\s*\(.*?\)', '', en_text.split(' / ')[0]).strip()
            if not first or first.lower() in used_en:
                continue
            used_en.add(first.lower())
            h2, m = match_curated(h, en_text)
            v = m['v'] if m else vowelled(h2)
            alts = [a.strip() for a in en_text.split(' / ')[1:] if a.strip()]
            course_en.append({'id': sid('w:en:', first.lower()), 'en': first, 'enAlt': alts, 'he': strip(h2), 'heNiqqud': v,
                              'translit': (m['tr'] if m and m['tr'] else translit(v) if v != h2 else ''),
                              'pos': m['pos'] if m else None, 'topic': topic, 'emoji': emoji_for(en_text)})
    curated_en = len(course_en)
    added = 0
    for word, c in en_counts.most_common(8000):
        if added >= 1600:
            break
        if word in used_en or word in NAMES_EN or word in ('it', 'a', 'an', 'the', 'to', 'of', 'in', 'and', 'on', 'at', 'for', 'with', 'from', 'by', 'than', 'as', 'that', 'be', 'do', 'had', 'should', 'will', 'would', 'get', 'got', 'just', 'one') or len(word) < 2 or "'" in word or c < 30:
            continue
        if any(l != word and l in used_en for l in en_lemmas(word)[1:]):
            continue  # "friends" when "friend" is already in the list
        if word in EN_HE_OVERRIDE:
            h_plain = EN_HE_OVERRIDE[word]
            if not h_plain:
                continue
            m = by_plain.get(h_plain, [])
            e = max(m, key=lambda x: x['freq']) if m else None
            v = e['v'] if e and strip(e['v']) == h_plain else vowelled(h_plain)
            used_en.add(word)
            course_en.append({'id': sid('w:en:', word), 'en': word, 'enAlt': [], 'he': h_plain, 'heNiqqud': v,
                              'translit': (e['tr'] if e and strip(e['v']) == h_plain and e['tr'] else translit(v) if v != h_plain else ''),
                              'pos': e['pos'] if e else None, 'topic': 'common', 'emoji': emoji_for(word)})
            added += 1
            continue
        cands = list(inverse.get(word, [])) + [(r + 0.5, f, e) for r, f, e in inverse.get(f'to {word}', [])]
        if not cands:
            continue
        cands.sort(key=lambda x: (x[0], x[1]))
        best_rank = cands[0][0]
        top = [c2 for c2 in cands if c2[0] <= best_rank + 1]
        top.sort(key=lambda x: (x[1], x[0]))
        e = top[0][2]
        if e['freq'] < 20:
            continue
        used_en.add(word)
        is_verb = e['pos'] == 'verb'
        course_en.append({'id': sid('w:en:', word), 'en': f'to {word}' if is_verb else word,
                          'enAlt': [word] if is_verb else [], 'he': e['plain'], 'heNiqqud': e['v'],
                          'translit': e['tr'] or translit(e['v']), 'pos': e['pos'], 'topic': 'common',
                          'emoji': emoji_for(word) or emoji_for(f'to {word}')})
        added += 1
    print('he-en course words', len(course_en), f'({curated_en} curated)')

    # ── Sentences ────────────────────────────────────────────────────────────
    he_pos = {w['he']: i for i, w in enumerate(course_he)}
    he_form_pos = {}
    by_id = {e['id']: e for e in wik}
    for i, w in enumerate(course_he):
        e = by_id.get(w['id'])
        for f in (e['forms'] if e else {w['he']}):
            if f not in he_form_pos or he_form_pos[f] > i:
                he_form_pos[f] = i
    for n in NAMES_HE:
        he_form_pos[n] = -1
    en_pos = {}
    for i, w in enumerate(course_en):
        for f in [w['en'].lower().replace('to ', '', 1)] + [a.lower() for a in w.get('enAlt', [])]:
            if f not in en_pos:
                en_pos[f] = i
    FUNCTION_EN = {'i', 'you', 'he', 'she', 'it', 'we', 'they', 'a', 'an', 'the', 'is', 'to', 'of', 'and', 'be', 'do', 'not'}

    def need_he(text):
        worst = -1
        for tok in tokens_he(text):
            hit = he_form_pos.get(tok)
            if hit is None:
                t = tok
                for _ in range(2):
                    if len(t) > 2 and t[0] in PREFIXES:
                        t = t[1:]
                        hit = he_form_pos.get(t)
                        if hit is not None:
                            break
                    else:
                        break
            if hit is None:
                return None
            worst = max(worst, hit)
        return worst

    def need_en(text):
        worst = -1
        for tok in tokens_en(text):
            if tok in NAMES_EN:
                continue
            hit = None
            for lem in en_lemmas(tok):
                if lem in en_pos:
                    hit = en_pos[lem]
                    break
            if hit is None:
                if tok in FUNCTION_EN or (tok in EN_IRREG and EN_IRREG[tok] in FUNCTION_EN):
                    continue
                return None
            worst = max(worst, hit)
        return worst

    # Keep the course friendly for all ages.
    UNSUITABLE = re.compile(r"\b(kill\w*|murder\w*|suicid\w*|rap(e|ed|ist)|sex\w*|drug\w*|guns?|shoot\w*|shot|bomb\w*|terror\w*|masochis\w*|sadis\w*|naked|nude|drunk\w*|beer|vodka|whisk(e)?y|alcohol\w*|cocaine|heroin|weed|blood\w*|dead|death|die[sd]?|dying|corpse|prostitut\w*|nazi\w*|hitler|slave\w*|tortur\w*|abus\w*|hell|damn|stupid|idiot\w*|moron|ugly|fat|hat(e|ed|es|red)|weapon\w*|wars?|army|soldier\w*|prison\w*|jail|police|steal\w*|stole\w*|thie(f|ves)|crim\w*|divorc\w*|pregnan\w*|kiss\w*|bed with|girlfriend|boyfriend|cancer|disease|sick of|virgin|gay|lesbian|god|jesus|bible|church|religio\w*|politic\w*|president|islam\w*|muslim\w*|jew(s|ish)?|christian\w*)\b", re.I)

    pairs = []
    seen_he = set()
    for hid, ens in links.items():
        h = he[hid].strip()
        if owner.get(hid) not in natives or re.search(r'[A-Za-z0-9]', h):
            continue
        toks = tokens_he(h)
        if not 2 <= len(toks) <= 9:
            continue
        key = re.sub(r'[^א-ת ]', '', strip(h))
        if key in seen_he:
            continue
        cand = sorted((en[e] for e in ens if e in en), key=len)
        cand = [c for c in cand if len(tokens_en(c)) <= 13 and not UNSUITABLE.search(c) and not RUDE.search(c)]
        if not cand:
            continue
        seen_he.add(key)
        eid = next(e for e in ens if e in en and en[e] == cand[0])
        pairs.append((hid, eid, h, cand[0]))
    print('candidate pairs', len(pairs))

    def tomish(h, e):
        return 'טום' in h or 'Tom' in e or 'Mary' in e

    def assign(units_words, need_fn, text_fn, per_unit=15):
        """Give each word unit the sentences that just became readable."""
        bounds = []
        total = 0
        for u in units_words:
            total += len(u)
            bounds.append(total - 1)
        scored = []
        for p in pairs:
            n = need_fn(text_fn(p))
            if n is not None:
                scored.append((n, p))
        scored.sort(key=lambda x: (x[0], len(x[1][2])))
        out = [[] for _ in bounds]
        tom = [0] * len(bounds)
        ui = 0
        for n, p in scored:
            while ui < len(bounds) and n > bounds[ui]:
                ui += 1
            if ui >= len(bounds):
                break
            # Fill this unit, or the next one with space.
            for k in range(ui, min(ui + 3, len(bounds))):
                if len(out[k]) < per_unit and (not tomish(p[2], p[3]) or tom[k] < 3):
                    out[k].append(p)
                    if tomish(p[2], p[3]):
                        tom[k] += 1
                    break
        return out

    WORDS_PER_LESSON = 5
    LESSONS_PER_UNIT = 6

    def units_of(words):
        groups = []
        cur = []
        cur_topic = None
        for w in words:
            topic = w['topic']
            if cur and (topic != cur_topic or len(cur) >= WORDS_PER_LESSON * LESSONS_PER_UNIT):
                groups.append((cur_topic, cur))
                cur = []
            cur_topic = topic
            cur.append(w)
        if cur:
            groups.append((cur_topic, cur))
        # Merge tiny topic groups into the next one.
        merged = []
        for topic, ws in groups:
            if merged and len(merged[-1][1]) < 10 and merged[-1][0] != 'common' and topic != 'common':
                merged[-1] = (merged[-1][0], merged[-1][1] + ws)
            else:
                merged.append((topic, ws))
        return merged

    he_units = units_of(course_he)
    en_units = units_of(course_en)
    he_sent_units = assign([ws for _, ws in he_units], lambda p: need_he(p[2]), lambda p: p)
    en_sent_units = assign([ws for _, ws in en_units], lambda p: need_en(p[3]), lambda p: p)

    # Example sentences for the dictionary: up to 2 per common entry.
    examples = collections.defaultdict(list)
    for hid, eid, h, e in pairs:
        if len(tokens_he(h)) > 7:
            continue
        for tok in tokens_he(h):
            hit = lookup(tok, form_map)
            if not hit:
                continue
            for i in hit[:1]:
                if len(examples[i]) < 2:
                    examples[i].append((hid, eid, h, e))

    used_pairs = {}
    for unit in he_sent_units + en_sent_units:
        for p in unit:
            used_pairs[p[0]] = p
    for lst in examples.values():
        for p in lst:
            used_pairs.setdefault(p[0], p)
    print('sentences in pack', len(used_pairs))

    sentences_out = []
    for hid, eid, h, e in used_pairs.values():
        v = vowelled(h)
        s = {'id': f's:{hid}', 'he': h, 'en': e, 'src': [hid, eid]}
        if v != h:
            s['heNiqqud'] = v
            s['translit'] = translit(v)
        sentences_out.append(s)

    # Curated own sentences come first in their units.
    own_sents = []
    for h, e, d, topic in curated_sents:
        v = vowelled(h)
        s = {'id': sid('s:own:', h), 'he': h, 'en': e, 'own': True}
        if v != h:
            s['heNiqqud'] = v
            s['translit'] = translit(v)
        own_sents.append((d, s))
    own_sents.sort(key=lambda x: x[0])
    sentences_out.extend(s for _, s in own_sents)

    # ── Phrasebook (own, bundled) ────────────────────────────────────────────
    phrases = []
    counter = collections.Counter()
    with open(os.path.join(HERE, 'phrasebook.tsv'), encoding='utf8') as f:
        next(f)
        for line in f:
            p = line.rstrip('\n').split('\t')
            if len(p) < 4:
                continue
            situation, h, tr, e = p[0], p[1], p[2], p[3]
            note_en = p[4] if len(p) > 4 else ''
            note_he = p[5] if len(p) > 5 else ''
            counter[situation] += 1
            v = vowelled(h)
            ph = {'id': f'p:{situation.replace(" ", "-")}:{counter[situation]}', 'situation': situation, 'he': h,
                  'heNiqqud': v, 'translit': tr, 'en': e}
            if note_en:
                ph['noteEn'] = note_en
            if note_he:
                ph['noteHe'] = note_he
            phrases.append(ph)
    situations = list(dict.fromkeys(p['situation'] for p in phrases))

    # ── Course files ─────────────────────────────────────────────────────────
    SIT = {
        'greetings': ('Saying hello', 'שלום ולהתראות', '👋'), 'introductions': ('Getting to know someone', 'היכרות', '🤝'),
        'courtesy': ('Being polite', 'נימוס', '🙏'), 'learning': ('Learning the language', 'ללמוד שפה', '📚'),
        'cafe': ('At the café', 'בבית קפה', '☕'), 'shopping': ('Shopping', 'קניות', '🛍️'),
        'directions': ('Finding your way', 'הכוונה', '🧭'), 'transport': ('Getting around', 'תחבורה', '🚌'),
        'hotel': ('At the hotel', 'במלון', '🏨'), 'health': ('Health', 'בריאות', '🩺'),
        'emergency': ('Emergencies', 'חירום', '🚨'), 'phone': ('On the phone', 'בטלפון', '📞'),
        'time': ('Time and days', 'זמן וימים', '🕐'), 'small talk': ('Small talk', 'שיחת חולין', '💬'),
        'feelings': ('Feelings', 'רגשות', '❤️'), 'home': ('At home', 'בבית', '🏠'), 'work': ('At work', 'בעבודה', '💼'),
    }

    def word_units_json(units, prefix):
        out = []
        common_n = 0
        topic_seen = collections.Counter()
        for ui, (topic, ws) in enumerate(units):
            if topic == 'common':
                common_n += 1
                title = {'en': f'Everyday words {common_n}', 'he': f'מילים יומיומיות {common_n}'}
                emoji = ['🧩', '🌟', '🚀', '🎯', '🔑', '💡', '🧠', '📌'][common_n % 8]
            else:
                topic_seen[topic] += 1
                t_en, t_he, emoji = TOPICS.get(topic, (topic.title(), topic, '📘'))
                n = topic_seen[topic]
                title = {'en': t_en if n == 1 else f'{t_en} {n}', 'he': t_he if n == 1 else f'{t_he} {n}'}
            lessons = []
            for li, grp in enumerate(chunk([w['id'] for w in ws], WORDS_PER_LESSON)):
                lessons.append({'id': f'{prefix}-w{ui + 1}-{li + 1}', 'kind': 'words',
                                'title': {'en': f'Lesson {li + 1}', 'he': f'שיעור {li + 1}'}, 'itemIds': grp})
            if len(ws) > WORDS_PER_LESSON:
                lessons.append({'id': f'{prefix}-w{ui + 1}-r', 'kind': 'words', 'review': True,
                                'title': {'en': 'Review', 'he': 'חזרה'}, 'itemIds': [w['id'] for w in ws]})
            out.append({'id': f'{prefix}-wu{ui + 1}', 'stage': 'words', 'title': title, 'emoji': emoji, 'lessons': lessons})
        return out

    def sentence_units_json(sent_units, prefix, own_first):
        out = []
        for ui, sents in enumerate(sent_units):
            lessons = []
            sit = situations[ui] if ui < len(situations) else None
            if sit:
                ids = [p['id'] for p in phrases if p['situation'] == sit]
                for li, grp in enumerate(chunk(ids, 6)):
                    lessons.append({'id': f'{prefix}-s{ui + 1}-p{li + 1}', 'kind': 'phrases',
                                    'title': {'en': f'Phrases {li + 1}', 'he': f'ביטויים {li + 1}'}, 'itemIds': grp})
            ids = [f's:{p[0]}' for p in sents]
            if ui == 0:
                ids = own_first + ids
            for li, grp in enumerate(chunk(ids, 5)):
                lessons.append({'id': f'{prefix}-s{ui + 1}-{li + 1}', 'kind': 'sentences',
                                'title': {'en': f'Sentences {li + 1}', 'he': f'משפטים {li + 1}'}, 'itemIds': grp})
            if not lessons:
                continue
            t_en, t_he, emoji = SIT.get(sit, ('Real sentences', 'משפטים אמיתיים', '💬')) if sit else ('Real sentences', 'משפטים אמיתיים', '💬')
            out.append({'id': f'{prefix}-su{ui + 1}', 'stage': 'sentences', 'title': {'en': t_en, 'he': t_he},
                        'emoji': emoji, 'lessons': lessons})
        return out

    own_ids = [s['id'] for _, s in own_sents[:10]]
    course_files = {
        'course-en-he.json': {'wordUnits': word_units_json(he_units, 'eh'),
                              'sentenceUnits': sentence_units_json(he_sent_units, 'eh', own_ids)},
        'course-he-en.json': {'wordUnits': word_units_json(en_units, 'he'),
                              'sentenceUnits': sentence_units_json(en_sent_units, 'he', own_ids)},
    }

    # ── Dictionary pack ──────────────────────────────────────────────────────
    course_he_ids = {w['id'] for w in course_he}
    dict_out = []
    for e in dict_entries:
        d = {'id': e['id'], 'he': e['plain'], 'heNiqqud': e['v'], 'translit': e['tr'] or translit(e['v']),
             'en': short_gloss(e['glosses'][0]) or e['glosses'][0], 'pos': e['pos']}
        if len(e['glosses']) > 1 or short_gloss(e['glosses'][0]) != e['glosses'][0]:
            d['def'] = e['glosses'][:4]
        for k in ('gender', 'plural', 'root'):
            if e[k]:
                d[k] = e[k]
        if e['freq']:
            d['freq'] = e['freq']
        em = emoji_for(e['glosses'][0])
        if em:
            d['emoji'] = em
        dict_out.append(d)
    # Example links (entry id -> sentence ids), computed by index for speed.
    idx_of = {id(e): i for i, e in enumerate(wik)}
    ex_map = {}
    for e in dict_entries:
        lst = examples.get(idx_of[id(e)])
        if lst:
            ex_map[e['id']] = [f's:{p[0]}' for p in lst]
    # Own curated words that are not in Wiktionary still belong in the dictionary.
    known = {d['id'] for d in dict_out}
    for w in course_he:
        if w['id'] not in known:
            dict_out.append({k: v for k, v in w.items() if v not in (None, [], '') and k != 'topic'})
    for d in dict_out:
        if d['id'] in ex_map:
            d['ex'] = ex_map[d['id']]
    print('dictionary entries', len(dict_out))

    def clean_word(w):
        return {k: v for k, v in w.items() if v not in (None, [], '')}

    files = {
        'dictionary.json': dict_out,
        'words-en-he.json': [clean_word(w) for w in course_he],
        'words-he-en.json': [clean_word(w) for w in course_en],
        'sentences.json': sentences_out,
        **course_files,
    }
    manifest = {'version': PACK_VERSION, 'files': {}}
    for name, data in files.items():
        path = os.path.join(OUT_PUBLIC, name)
        body = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        open(path, 'w', encoding='utf8').write(body)
        h = hashlib.sha1(body.encode('utf8')).hexdigest()[:12]
        manifest['files'][name] = {'hash': h, 'bytes': len(body.encode('utf8')),
                                   'count': len(data) if isinstance(data, list) else None}
    manifest['counts'] = {'dictionary': len(dict_out), 'sentences': len(sentences_out),
                          'wordsEnHe': len(course_he), 'wordsHeEn': len(course_en)}
    json.dump(manifest, open(os.path.join(OUT_PUBLIC, 'manifest.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    sit_out = [{'key': k, 'en': SIT.get(k, (k, k, '💬'))[0], 'he': SIT.get(k, (k, k, '💬'))[1], 'emoji': SIT.get(k, (k, k, '💬'))[2]} for k in situations]
    json.dump({'situations': sit_out, 'phrases': phrases}, open(os.path.join(OUT_BUNDLED, 'phrases.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=0)

    with open(NIQQUD_TODO, 'w', encoding='utf8') as f:
        for line in sorted(NEED_NIQQUD):
            f.write(line + '\n')
    print('needs niqqud:', len(NEED_NIQQUD))
    for name, info in manifest['files'].items():
        print(f"  {name}: {info['bytes'] / 1024:.0f} KB")


if __name__ == '__main__':
    main()
