import type { NiqqudSign } from '../types';

/**
 * Vowel signs (niqqud) and reading marks, taught after the letters.
 * Own content. Every Hebrew string here is fully vowelled.
 */
export const NIQQUD_SIGNS: NiqqudSign[] = [
  {
    id: 'he:vowel:kamatz', key: 'kamatz', mark: 'ָ', nameHe: 'קָמָץ', nameEn: 'Kamatz', sound: 'a',
    explainEn: 'A small "T" under the letter. Sounds like "a" in "father".',
    syllables: ['מָ', 'לָ', 'סָ', 'נָ'],
    words: [
      { he: 'יָד', translit: 'yad', en: 'hand', emoji: '✋' },
      { he: 'דָּג', translit: 'dag', en: 'fish', emoji: '🐟' },
      { he: 'גָּמָל', translit: 'gamal', en: 'camel', emoji: '🐫' },
    ],
  },
  {
    id: 'he:vowel:patach', key: 'patach', mark: 'ַ', nameHe: 'פַּתָּח', nameEn: 'Patach', sound: 'a',
    explainEn: 'A short line under the letter. Also "a" — exactly like kamatz in modern Hebrew.',
    syllables: ['מַ', 'לַ', 'סַ', 'רַ'],
    words: [
      { he: 'בַּת', translit: 'bat', en: 'daughter', emoji: '👧' },
      { he: 'גַּן', translit: 'gan', en: 'garden', emoji: '🌷' },
      { he: 'אַבָּא', translit: 'aba', en: 'dad', emoji: '👨' },
    ],
  },
  {
    id: 'he:vowel:tsere', key: 'tsere', mark: 'ֵ', nameHe: 'צֵירֵה', nameEn: 'Tsere', sound: 'e',
    explainEn: 'Two dots side by side under the letter. Sounds like "e" in "bed".',
    syllables: ['מֵ', 'לֵ', 'סֵ', 'שֵׁ'],
    words: [
      { he: 'עֵץ', translit: 'ets', en: 'tree', emoji: '🌳' },
      { he: 'שֵׁם', translit: 'shem', en: 'name', emoji: '📛' },
      { he: 'אֵם', translit: 'em', en: 'mother', emoji: '👩' },
    ],
  },
  {
    id: 'he:vowel:segol', key: 'segol', mark: 'ֶ', nameHe: 'סֶגּוֹל', nameEn: 'Segol', sound: 'e',
    explainEn: 'Three dots in a triangle under the letter. Also "e", like tsere.',
    syllables: ['מֶ', 'לֶ', 'סֶ', 'יֶ'],
    words: [
      { he: 'כֶּלֶב', translit: 'kelev', en: 'dog', emoji: '🐕' },
      { he: 'יֶלֶד', translit: 'yeled', en: 'boy', emoji: '👦' },
      { he: 'שֶׁמֶשׁ', translit: 'shemesh', en: 'sun', emoji: '☀️' },
    ],
  },
  {
    id: 'he:vowel:chirik', key: 'chirik', mark: 'ִ', nameHe: 'חִירִיק', nameEn: 'Chirik', sound: 'i',
    explainEn: 'One dot under the letter. Sounds like "ee" in "see". Often followed by י.',
    syllables: ['מִ', 'לִ', 'סִי', 'נִי'],
    words: [
      { he: 'פִּיל', translit: 'pil', en: 'elephant', emoji: '🐘' },
      { he: 'אִמָּא', translit: 'ima', en: 'mom', emoji: '👩' },
      { he: 'שִׁיר', translit: 'shir', en: 'song', emoji: '🎵' },
    ],
  },
  {
    id: 'he:vowel:cholam', key: 'cholam', mark: 'ֹ', nameHe: 'חוֹלָם', nameEn: 'Cholam', sound: 'o',
    explainEn: 'A dot above the top left of the letter, or above a ו (וֹ). Sounds like "o" in "more".',
    syllables: ['מוֹ', 'לוֹ', 'סוֹ', 'לֹ'],
    words: [
      { he: 'קוֹף', translit: 'kof', en: 'monkey', emoji: '🐒' },
      { he: 'טוֹב', translit: 'tov', en: 'good', emoji: '👍' },
      { he: 'שָׁלוֹם', translit: 'shalom', en: 'hello / peace', emoji: '👋' },
    ],
  },
  {
    id: 'he:vowel:shuruk', key: 'shuruk', mark: 'וּ', nameHe: 'שׁוּרוּק', nameEn: 'Shuruk', sound: 'u',
    explainEn: 'A ו with a dot in its middle (וּ). Sounds like "oo" in "moon".',
    syllables: ['מוּ', 'לוּ', 'סוּ', 'נוּ'],
    words: [
      { he: 'סוּס', translit: 'sus', en: 'horse', emoji: '🐎' },
      { he: 'תּוּת', translit: 'tut', en: 'strawberry', emoji: '🍓' },
      { he: 'חָתוּל', translit: 'chatul', en: 'cat', emoji: '🐈' },
    ],
  },
  {
    id: 'he:vowel:kubutz', key: 'kubutz', mark: 'ֻ', nameHe: 'קֻבּוּץ', nameEn: 'Kubutz', sound: 'u',
    explainEn: 'Three diagonal dots under the letter. Also "oo", like shuruk.',
    syllables: ['מֻ', 'לֻ', 'סֻ', 'כֻּ'],
    words: [
      { he: 'שֻׁלְחָן', translit: 'shulchan', en: 'table', emoji: '🪑' },
      { he: 'סֻכָּר', translit: 'sukar', en: 'sugar', emoji: '🍬' },
      { he: 'כֻּלָּם', translit: 'kulam', en: 'everyone', emoji: '👥' },
    ],
  },
  {
    id: 'he:vowel:shva', key: 'shva', mark: 'ְ', nameHe: 'שְׁוָא', nameEn: 'Shva', sound: '',
    explainEn: 'Two dots one above the other under the letter. Either no vowel at all, or a very short "e".',
    syllables: ['מְ', 'לְ', 'שְׁ', 'סְ'],
    words: [
      { he: 'שְׁנַיִם', translit: 'shnayim', en: 'two', emoji: '2️⃣' },
      { he: 'זְאֵב', translit: "ze'ev", en: 'wolf', emoji: '🐺' },
      { he: 'תְּמוּנָה', translit: 'tmuna', en: 'picture', emoji: '🖼️' },
    ],
  },
  {
    id: 'he:vowel:chataf', key: 'chataf', mark: 'ֲ', nameHe: 'חֲטָפִים', nameEn: 'Chataf vowels', sound: 'a',
    explainEn: 'A shva joined to another vowel (ֲ ֱ ֳ). Read it as that vowel: "a", "e" or "o". Mostly under א ה ח ע.',
    syllables: ['אֲ', 'חֲ', 'אֱ', 'עֲ'],
    words: [
      { he: 'אֲנִי', translit: 'ani', en: 'I', emoji: '🙋' },
      { he: 'חֲבֵר', translit: 'chaver', en: 'friend', emoji: '🤝' },
      { he: 'אֱמֶת', translit: 'emet', en: 'truth', emoji: '✅' },
    ],
  },
];

export type ReadingMark = {
  id: string;
  key: string;
  titleEn: string;
  explainEn: string;
  /** Pairs that differ only by this mark. */
  pairs: { with: { he: string; translit: string; en: string; emoji: string }; without: { he: string; translit: string; en: string; emoji: string } }[];
};

/** The dot that changes a letter's sound (dagesh) and the shin/sin dot. */
export const READING_MARKS: ReadingMark[] = [
  {
    id: 'he:mark:dagesh-b', key: 'dagesh-b', titleEn: 'בּ = b, ב = v',
    explainEn: 'A dot inside ב (dagesh) makes it "b". Without the dot it is "v".',
    pairs: [
      {
        with: { he: 'בַּיִת', translit: 'bayit', en: 'house', emoji: '🏠' },
        without: { he: 'אָבִיב', translit: 'aviv', en: 'spring', emoji: '🌸' },
      },
    ],
  },
  {
    id: 'he:mark:dagesh-k', key: 'dagesh-k', titleEn: 'כּ = k, כ = ch',
    explainEn: 'With a dot, כּ is "k". Without it, כ is the throaty "ch".',
    pairs: [
      {
        with: { he: 'כֶּלֶב', translit: 'kelev', en: 'dog', emoji: '🐕' },
        without: { he: 'מֶלֶךְ', translit: 'melech', en: 'king', emoji: '👑' },
      },
    ],
  },
  {
    id: 'he:mark:dagesh-p', key: 'dagesh-p', titleEn: 'פּ = p, פ = f',
    explainEn: 'With a dot, פּ is "p". Without it, פ is "f".',
    pairs: [
      {
        with: { he: 'פִּיל', translit: 'pil', en: 'elephant', emoji: '🐘' },
        without: { he: 'סֵפֶר', translit: 'sefer', en: 'book', emoji: '📖' },
      },
    ],
  },
  {
    id: 'he:mark:shin-sin', key: 'shin-sin', titleEn: 'שׁ = sh, שׂ = s',
    explainEn: 'A dot on the right of ש makes "sh". A dot on the left makes "s".',
    pairs: [
      {
        with: { he: 'שֶׁמֶשׁ', translit: 'shemesh', en: 'sun', emoji: '☀️' },
        without: { he: 'שָׂמֵחַ', translit: 'sameach', en: 'happy', emoji: '😊' },
      },
    ],
  },
];

/** Consonants used to build syllables in the syllable builder (no dagesh issues). */
export const SYLLABLE_CONSONANTS = ['מ', 'ל', 'נ', 'ס', 'ר', 'שׁ'];

/** Builds a vowelled syllable from a consonant and a sign. */
export function buildSyllable(consonant: string, sign: NiqqudSign): string {
  if (sign.key === 'shuruk') return `${consonant}וּ`;
  if (sign.key === 'cholam') return `${consonant}וֹ`;
  return `${consonant}${sign.mark}`.normalize('NFC');
}
