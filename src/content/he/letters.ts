import type { HebrewLetter } from '../types';

/** The Hebrew alphabet for English speakers. Own content. */
export const HEBREW_LETTERS: HebrewLetter[] = [
  {
    id: 'he:letter:א', char: 'א', nameEn: 'Alef', nameHe: 'אָלֶף', translitName: 'alef',
    soundEn: 'Silent. It carries the vowel written under it, so אַ sounds like "a".',
    soundShort: 'silent', sampleSyllable: 'אַ',
    example: { he: 'אַבָּא', translit: 'aba', en: 'dad', emoji: '👨' },
    memoryHintEn: 'An "X" with arms — it holds a vowel but makes no sound of its own.',
  },
  {
    id: 'he:letter:ב', char: 'ב', nameEn: 'Bet', nameHe: 'בֵּית', translitName: 'bet',
    soundEn: '"b" as in "boy" when it has a dot inside (בּ), "v" as in "van" without it.',
    soundShort: 'b / v', sampleSyllable: 'בָּ',
    example: { he: 'בַּיִת', translit: 'bayit', en: 'house', emoji: '🏠' },
    memoryHintEn: 'Looks like a house open on the left — בַּיִת means house.',
    lookalikes: ['כ', 'פ'],
  },
  {
    id: 'he:letter:ג', char: 'ג', nameEn: 'Gimel', nameHe: 'גִּימֶל', translitName: 'gimel',
    soundEn: '"g" as in "go".',
    soundShort: 'g', sampleSyllable: 'גָּ',
    example: { he: 'גָּמָל', translit: 'gamal', en: 'camel', emoji: '🐫' },
    memoryHintEn: 'A camel (גָּמָל) walking — a neck and one leg stepping out.',
    lookalikes: ['נ'],
  },
  {
    id: 'he:letter:ד', char: 'ד', nameEn: 'Dalet', nameHe: 'דָּלֶת', translitName: 'dalet',
    soundEn: '"d" as in "door".',
    soundShort: 'd', sampleSyllable: 'דָּ',
    example: { he: 'דָּג', translit: 'dag', en: 'fish', emoji: '🐟' },
    memoryHintEn: 'A door frame (דֶּלֶת) — note the small corner sticking out on the right.',
    lookalikes: ['ר', 'ך'],
  },
  {
    id: 'he:letter:ה', char: 'ה', nameEn: 'Hey', nameHe: 'הֵא', translitName: 'hey',
    soundEn: '"h" as in "hello". At the end of a word it is usually silent.',
    soundShort: 'h', sampleSyllable: 'הָ',
    example: { he: 'הַר', translit: 'har', en: 'mountain', emoji: '⛰️' },
    memoryHintEn: 'A window with a gap at the top left — air ("h") gets out.',
    lookalikes: ['ח', 'ת'],
  },
  {
    id: 'he:letter:ו', char: 'ו', nameEn: 'Vav', nameHe: 'וָו', translitName: 'vav',
    soundEn: '"v" as in "van". It also writes the vowels "o" (וֹ) and "u" (וּ).',
    soundShort: 'v · o · u', sampleSyllable: 'וָ',
    example: { he: 'וֶרֶד', translit: 'vered', en: 'rose', emoji: '🌹' },
    memoryHintEn: 'A hook or nail — וָו means hook.',
    lookalikes: ['ז', 'ן', 'י'],
  },
  {
    id: 'he:letter:ז', char: 'ז', nameEn: 'Zayin', nameHe: 'זַיִן', translitName: 'zayin',
    soundEn: '"z" as in "zoo".',
    soundShort: 'z', sampleSyllable: 'זָ',
    example: { he: 'זְאֵב', translit: "ze'ev", en: 'wolf', emoji: '🐺' },
    memoryHintEn: 'Like ו with a hat sticking out to both sides.',
    lookalikes: ['ו', 'ן'],
  },
  {
    id: 'he:letter:ח', char: 'ח', nameEn: 'Chet', nameHe: 'חֵית', translitName: 'chet',
    soundEn: 'A throaty "kh", like "ch" in Scottish "loch" or German "Bach".',
    soundShort: 'kh', sampleSyllable: 'חָ',
    example: { he: 'חָתוּל', translit: 'khatul', en: 'cat', emoji: '🐈' },
    memoryHintEn: 'Like ה but closed at the top — no gap.',
    lookalikes: ['ה', 'ת'],
  },
  {
    id: 'he:letter:ט', char: 'ט', nameEn: 'Tet', nameHe: 'טֵית', translitName: 'tet',
    soundEn: '"t" as in "top" (same sound as ת).',
    soundShort: 't', sampleSyllable: 'טָ',
    example: { he: 'טֶלֶפוֹן', translit: 'telefon', en: 'telephone', emoji: '📞' },
    memoryHintEn: 'A round basket with one side curling inward.',
    lookalikes: ['מ'],
  },
  {
    id: 'he:letter:י', char: 'י', nameEn: 'Yod', nameHe: 'יוֹד', translitName: 'yod',
    soundEn: '"y" as in "yes". It often writes the vowel "i".',
    soundShort: 'y · i', sampleSyllable: 'יָ',
    example: { he: 'יָד', translit: 'yad', en: 'hand', emoji: '✋' },
    memoryHintEn: 'The smallest letter — it floats at the top of the line.',
    lookalikes: ['ו'],
  },
  {
    id: 'he:letter:כ', char: 'כ', nameEn: 'Kaf', nameHe: 'כַּף', translitName: 'kaf',
    soundEn: '"k" with a dot inside (כּ). Without the dot it is the throaty "kh", like ח.',
    soundShort: 'k / kh', sampleSyllable: 'כָּ',
    example: { he: 'כֶּלֶב', translit: 'kelev', en: 'dog', emoji: '🐕' },
    memoryHintEn: 'A cupped palm (כַּף) — round on the right, unlike the square ב.',
    finalForm: 'ך',
    lookalikes: ['ב', 'נ'],
  },
  {
    id: 'he:letter:ל', char: 'ל', nameEn: 'Lamed', nameHe: 'לָמֶד', translitName: 'lamed',
    soundEn: '"l" as in "love".',
    soundShort: 'l', sampleSyllable: 'לָ',
    example: { he: 'לֶחֶם', translit: 'lekhem', en: 'bread', emoji: '🍞' },
    memoryHintEn: 'The only letter that rises above the line — tall like a lighthouse.',
  },
  {
    id: 'he:letter:מ', char: 'מ', nameEn: 'Mem', nameHe: 'מֵם', translitName: 'mem',
    soundEn: '"m" as in "mom".',
    soundShort: 'm', sampleSyllable: 'מָ',
    example: { he: 'מַיִם', translit: 'mayim', en: 'water', emoji: '💧' },
    memoryHintEn: 'A wave of water (מַיִם) with a small opening at the bottom left.',
    finalForm: 'ם',
    lookalikes: ['ט', 'ס'],
  },
  {
    id: 'he:letter:נ', char: 'נ', nameEn: 'Nun', nameHe: 'נוּן', translitName: 'nun',
    soundEn: '"n" as in "no".',
    soundShort: 'n', sampleSyllable: 'נָ',
    example: { he: 'נָחָשׁ', translit: 'nakhash', en: 'snake', emoji: '🐍' },
    memoryHintEn: 'A narrow ג without the foot — a bent fishhook.',
    finalForm: 'ן',
    lookalikes: ['ג', 'כ'],
  },
  {
    id: 'he:letter:ס', char: 'ס', nameEn: 'Samech', nameHe: 'סָמֶךְ', translitName: 'samech',
    soundEn: '"s" as in "sun".',
    soundShort: 's', sampleSyllable: 'סָ',
    example: { he: 'סוּס', translit: 'sus', en: 'horse', emoji: '🐎' },
    memoryHintEn: 'A closed circle — like the letter O.',
    lookalikes: ['ם'],
  },
  {
    id: 'he:letter:ע', char: 'ע', nameEn: 'Ayin', nameHe: 'עַיִן', translitName: 'ayin',
    soundEn: 'Silent in everyday Israeli Hebrew, like א. It carries the vowel under it.',
    soundShort: 'silent', sampleSyllable: 'עָ',
    example: { he: 'עֵץ', translit: 'ets', en: 'tree', emoji: '🌳' },
    memoryHintEn: 'Two eyes on stalks — עַיִן means eye.',
    lookalikes: ['צ'],
  },
  {
    id: 'he:letter:פ', char: 'פ', nameEn: 'Pey', nameHe: 'פֵּא', translitName: 'pey',
    soundEn: '"p" with a dot inside (פּ), "f" without it.',
    soundShort: 'p / f', sampleSyllable: 'פָּ',
    example: { he: 'פִּיל', translit: 'pil', en: 'elephant', emoji: '🐘' },
    memoryHintEn: 'A mouth (פֶּה) with a tongue curling inside.',
    finalForm: 'ף',
    lookalikes: ['כ', 'ב'],
  },
  {
    id: 'he:letter:צ', char: 'צ', nameEn: 'Tsadi', nameHe: 'צָדִי', translitName: 'tsadi',
    soundEn: '"ts" as in "cats".',
    soundShort: 'ts', sampleSyllable: 'צָ',
    example: { he: 'צָב', translit: 'tsav', en: 'turtle', emoji: '🐢' },
    memoryHintEn: 'A person kneeling with an arm raised.',
    finalForm: 'ץ',
    lookalikes: ['ע'],
  },
  {
    id: 'he:letter:ק', char: 'ק', nameEn: 'Kuf', nameHe: 'קוֹף', translitName: 'kuf',
    soundEn: '"k" as in "key" (same sound as כּ).',
    soundShort: 'k', sampleSyllable: 'קָ',
    example: { he: 'קוֹף', translit: 'kof', en: 'monkey', emoji: '🐒' },
    memoryHintEn: 'A monkey (קוֹף) hanging by its tail below the line.',
    lookalikes: ['ה'],
  },
  {
    id: 'he:letter:ר', char: 'ר', nameEn: 'Resh', nameHe: 'רֵישׁ', translitName: 'resh',
    soundEn: 'A soft "r" made in the throat, like French "r".',
    soundShort: 'r', sampleSyllable: 'רָ',
    example: { he: 'רַכֶּבֶת', translit: 'rakevet', en: 'train', emoji: '🚆' },
    memoryHintEn: 'Like ד but with a round corner — a bowed head.',
    lookalikes: ['ד', 'ך'],
  },
  {
    id: 'he:letter:ש', char: 'ש', nameEn: 'Shin', nameHe: 'שִׁין', translitName: 'shin',
    soundEn: '"sh" with the dot on the right (שׁ), "s" with the dot on the left (שׂ).',
    soundShort: 'sh / s', sampleSyllable: 'שָׁ',
    example: { he: 'שֶׁמֶשׁ', translit: 'shemesh', en: 'sun', emoji: '☀️' },
    memoryHintEn: 'Three flames or three teeth — "sh" like a hiss.',
  },
  {
    id: 'he:letter:ת', char: 'ת', nameEn: 'Tav', nameHe: 'תָּו', translitName: 'tav',
    soundEn: '"t" as in "top".',
    soundShort: 't', sampleSyllable: 'תָּ',
    example: { he: 'תַּפּוּחַ', translit: 'tapuakh', en: 'apple', emoji: '🍎' },
    memoryHintEn: 'Like ח with a little foot on the bottom left.',
    lookalikes: ['ח', 'ה'],
  },
];

export type FinalLetter = {
  id: string;
  char: string;
  baseChar: string;
  nameHe: string;
  nameEn: string;
  example: { he: string; translit: string; en: string; emoji: string };
};

/** Five letters change shape at the end of a word. */
export const HEBREW_FINAL_LETTERS: FinalLetter[] = [
  { id: 'he:final:ך', char: 'ך', baseChar: 'כ', nameHe: 'כַּף סוֹפִית', nameEn: 'final Kaf',
    example: { he: 'מֶלֶךְ', translit: 'melekh', en: 'king', emoji: '👑' } },
  { id: 'he:final:ם', char: 'ם', baseChar: 'מ', nameHe: 'מֵם סוֹפִית', nameEn: 'final Mem',
    example: { he: 'יָם', translit: 'yam', en: 'sea', emoji: '🌊' } },
  { id: 'he:final:ן', char: 'ן', baseChar: 'נ', nameHe: 'נוּן סוֹפִית', nameEn: 'final Nun',
    example: { he: 'גַּן', translit: 'gan', en: 'garden', emoji: '🌷' } },
  { id: 'he:final:ף', char: 'ף', baseChar: 'פ', nameHe: 'פֵּא סוֹפִית', nameEn: 'final Pey',
    example: { he: 'קוֹף', translit: 'kof', en: 'monkey', emoji: '🐒' } },
  { id: 'he:final:ץ', char: 'ץ', baseChar: 'צ', nameHe: 'צָדִי סוֹפִית', nameEn: 'final Tsadi',
    example: { he: 'עֵץ', translit: 'ets', en: 'tree', emoji: '🌳' } },
];

/** Teaching order: small groups, then the final forms. */
export const HEBREW_LETTER_GROUPS: string[][] = [
  ['א', 'ב', 'ג', 'ד'],
  ['ה', 'ו', 'ז', 'ח'],
  ['ט', 'י', 'כ', 'ל'],
  ['מ', 'נ', 'ס', 'ע'],
  ['פ', 'צ', 'ק', 'ר'],
  ['ש', 'ת'],
];

export function hebrewLetterByChar(ch: string): HebrewLetter | undefined {
  return HEBREW_LETTERS.find((l) => l.char === ch);
}
