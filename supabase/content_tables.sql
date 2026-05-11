-- ================================================================
-- Content tables for dynamic learning material (LinguaAdapt)
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- After running this DDL, seed the data:
--   npm run seed
-- ================================================================

-- Vocabulary pairs.  Each active row generates 5 exercises (MC A→B,
-- MC B→A, translate, and he-en variants).
CREATE TABLE IF NOT EXISTS content_vocabulary (
  id         bigserial    PRIMARY KEY,
  lang_a     varchar(10)  NOT NULL DEFAULT 'he',   -- content language A (e.g. 'he')
  lang_b     varchar(10)  NOT NULL DEFAULT 'en',   -- content language B (e.g. 'en')
  text_a     text         NOT NULL,                -- word/phrase in lang_a
  text_b     text         NOT NULL,                -- translation in lang_b
  difficulty smallint     NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  topic      text         NOT NULL DEFAULT 'general',
  is_active  boolean      NOT NULL DEFAULT true,
  sort_order integer      NOT NULL DEFAULT 0,
  created_at timestamptz           DEFAULT now(),
  UNIQUE (lang_a, lang_b, text_a)
);

-- Sentence pairs.  Each active row generates 2–3 exercises per
-- learning direction.
CREATE TABLE IF NOT EXISTS content_sentences (
  id         bigserial    PRIMARY KEY,
  lang_a     varchar(10)  NOT NULL DEFAULT 'he',
  lang_b     varchar(10)  NOT NULL DEFAULT 'en',
  text_a     text         NOT NULL,
  text_b     text         NOT NULL,
  difficulty smallint     NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  topic      text         NOT NULL DEFAULT 'general',
  is_active  boolean      NOT NULL DEFAULT true,
  created_at timestamptz           DEFAULT now(),
  UNIQUE (lang_a, lang_b, text_a)
);

-- Alphabet letters per language.  Each active row generates a
-- letter-trace exercise (and final-form MC for Hebrew).
CREATE TABLE IF NOT EXISTS content_alphabet (
  id              bigserial    PRIMARY KEY,
  lang            varchar(10)  NOT NULL,            -- language code: 'he' | 'en' | 'ar' | ...
  char            text         NOT NULL,
  name            text         NOT NULL,            -- canonical English name (e.g. 'Alef')
  name_he         text,                             -- Hebrew name of the letter
  names           jsonb                DEFAULT '{}',-- { en, he, ar, es, fr, ru, de, ... }
  script_language varchar(10),                      -- BCP-47 prefix for TTS
  phonetic        text,
  ipa             text,
  final_form      text,
  final_form_name text,
  gematria        integer              DEFAULT 0,
  memory_hint     text,
  stroke_hint     text,
  sort_order      smallint     NOT NULL DEFAULT 0,  -- letter order within language
  is_active       boolean      NOT NULL DEFAULT true,
  UNIQUE (lang, char)
);

-- ── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vocab_langs  ON content_vocabulary (lang_a, lang_b);
CREATE INDEX IF NOT EXISTS idx_vocab_active ON content_vocabulary (is_active);
CREATE INDEX IF NOT EXISTS idx_vocab_topic  ON content_vocabulary (topic);

CREATE INDEX IF NOT EXISTS idx_sent_langs   ON content_sentences (lang_a, lang_b);
CREATE INDEX IF NOT EXISTS idx_sent_active  ON content_sentences (is_active);

CREATE INDEX IF NOT EXISTS idx_alpha_lang   ON content_alphabet (lang, sort_order);
CREATE INDEX IF NOT EXISTS idx_alpha_active ON content_alphabet (is_active);

-- ── Row Level Security ────────────────────────────────────────────────────
ALTER TABLE content_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sentences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_alphabet   ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous users) can read active content
CREATE POLICY "public read active vocabulary"
  ON content_vocabulary FOR SELECT
  USING (is_active = true);

CREATE POLICY "public read active sentences"
  ON content_sentences FOR SELECT
  USING (is_active = true);

CREATE POLICY "public read active alphabet"
  ON content_alphabet FOR SELECT
  USING (is_active = true);
