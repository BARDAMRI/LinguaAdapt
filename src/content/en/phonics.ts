import type { PhonicsPattern } from '../types';

/**
 * English "reading" stage for Hebrew speakers — the English counterpart of niqqud:
 * how letter combinations sound. Own content.
 */
export const PHONICS_PATTERNS: PhonicsPattern[] = [
  // ── Short vowels ───────────────────────────────────────────────────────────
  { id: 'en:phon:short-a', key: 'short-a', pattern: 'a', soundHe: 'אֶ פתוחה',
    explainHe: 'a קצרה במילה קצרה: צליל בין "אַ" ל"אֶ", הפה פתוח לרוחב.',
    words: [
      { en: 'cat', he: 'חתול', emoji: '🐈' }, { en: 'hat', he: 'כובע', emoji: '🎩' },
      { en: 'bag', he: 'תיק', emoji: '👜' }, { en: 'map', he: 'מפה', emoji: '🗺️' },
    ] },
  { id: 'en:phon:short-e', key: 'short-e', pattern: 'e', soundHe: 'אֶ',
    explainHe: 'e קצרה נשמעת כמו "אֶ".',
    words: [
      { en: 'bed', he: 'מיטה', emoji: '🛏️' }, { en: 'red', he: 'אדום', emoji: '🔴' },
      { en: 'pen', he: 'עט', emoji: '🖊️' }, { en: 'ten', he: 'עשר', emoji: '🔟' },
    ] },
  { id: 'en:phon:short-i', key: 'short-i', pattern: 'i', soundHe: 'אִ קצרה',
    explainHe: 'i קצרה: "אִ" קצרה ורפויה, קצרה יותר מ"אִי".',
    words: [
      { en: 'pig', he: 'חזיר', emoji: '🐖' }, { en: 'fish', he: 'דג', emoji: '🐟' },
      { en: 'six', he: 'שש', emoji: '6️⃣' }, { en: 'milk', he: 'חלב', emoji: '🥛' },
    ] },
  { id: 'en:phon:short-o', key: 'short-o', pattern: 'o', soundHe: 'אָ',
    explainHe: 'o קצרה באנגלית אמריקאית נשמעת כמו "אָ" פתוחה.',
    words: [
      { en: 'dog', he: 'כלב', emoji: '🐕' }, { en: 'box', he: 'קופסה', emoji: '📦' },
      { en: 'hot', he: 'חם', emoji: '🔥' }, { en: 'sock', he: 'גרב', emoji: '🧦' },
    ] },
  { id: 'en:phon:short-u', key: 'short-u', pattern: 'u', soundHe: 'אַ',
    explainHe: 'u קצרה נשמעת כמו "אַ" קצרה: sun = "סַן".',
    words: [
      { en: 'sun', he: 'שמש', emoji: '☀️' }, { en: 'bus', he: 'אוטובוס', emoji: '🚌' },
      { en: 'cup', he: 'כוס', emoji: '☕' }, { en: 'duck', he: 'ברווז', emoji: '🦆' },
    ] },
  // ── Consonant pairs ────────────────────────────────────────────────────────
  { id: 'en:phon:sh', key: 'sh', pattern: 'sh', soundHe: 'שׁ',
    explainHe: 's ו-h ביחד נשמעות כמו שׁ (שין): ship.',
    words: [
      { en: 'ship', he: 'ספינה', emoji: '🚢' }, { en: 'shoe', he: 'נעל', emoji: '👟' },
      { en: 'shop', he: 'חנות', emoji: '🏪' }, { en: 'fish', he: 'דג', emoji: '🐟' },
    ] },
  { id: 'en:phon:ch', key: 'ch', pattern: 'ch', soundHe: 'צ׳',
    explainHe: 'c ו-h ביחד נשמעות כמו צ׳ (צ עם גרש): chair.',
    words: [
      { en: 'chair', he: 'כיסא', emoji: '🪑' }, { en: 'cheese', he: 'גבינה', emoji: '🧀' },
      { en: 'chicken', he: 'תרנגולת', emoji: '🐔' }, { en: 'lunch', he: 'ארוחת צהריים', emoji: '🍱' },
    ] },
  { id: 'en:phon:th', key: 'th', pattern: 'th', soundHe: 'ת׳',
    explainHe: 'צליל שאין בעברית: שמים את קצה הלשון בין השיניים ונושפים. לא "ס" ולא "ת".',
    words: [
      { en: 'three', he: 'שלוש', emoji: '3️⃣' }, { en: 'bath', he: 'אמבטיה', emoji: '🛁' },
      { en: 'tooth', he: 'שן', emoji: '🦷' }, { en: 'think', he: 'לחשוב', emoji: '🤔' },
    ] },
  { id: 'en:phon:ph', key: 'ph', pattern: 'ph', soundHe: 'פ (f)',
    explainHe: 'p ו-h ביחד נשמעות כמו f, פ׳ רפויה: phone.',
    words: [
      { en: 'phone', he: 'טלפון', emoji: '📱' }, { en: 'photo', he: 'תמונה', emoji: '📷' },
      { en: 'elephant', he: 'פיל', emoji: '🐘' }, { en: 'dolphin', he: 'דולפין', emoji: '🐬' },
    ] },
  { id: 'en:phon:wh', key: 'wh', pattern: 'wh', soundHe: 'ו (w)',
    explainHe: 'w ו-h ביחד נשמעות כמו w: whale. ה-h כמעט לא נשמעת.',
    words: [
      { en: 'whale', he: 'לווייתן', emoji: '🐋' }, { en: 'white', he: 'לבן', emoji: '⚪' },
      { en: 'wheel', he: 'גלגל', emoji: '🛞' }, { en: 'what', he: 'מה', emoji: '❓' },
    ] },
  { id: 'en:phon:ck', key: 'ck', pattern: 'ck', soundHe: 'ק',
    explainHe: 'c ו-k ביחד אחרי תנועה קצרה הן ק׳ אחת: duck.',
    words: [
      { en: 'duck', he: 'ברווז', emoji: '🦆' }, { en: 'clock', he: 'שעון', emoji: '⏰' },
      { en: 'sock', he: 'גרב', emoji: '🧦' }, { en: 'black', he: 'שחור', emoji: '⚫' },
    ] },
  { id: 'en:phon:ng', key: 'ng', pattern: 'ng', soundHe: 'נג',
    explainHe: 'n ו-g בסוף מילה נשמעות כמו "נ" מהאף, וה-g כמעט לא נשמעת: ring.',
    words: [
      { en: 'ring', he: 'טבעת', emoji: '💍' }, { en: 'king', he: 'מלך', emoji: '👑' },
      { en: 'sing', he: 'לשיר', emoji: '🎤' }, { en: 'long', he: 'ארוך', emoji: '📏' },
    ] },
  // ── Magic e ────────────────────────────────────────────────────────────────
  { id: 'en:phon:a_e', key: 'a_e', pattern: 'a_e', soundHe: 'אֵיי',
    explainHe: 'e שקטה בסוף המילה הופכת את ה-a ל"אֵיי": cake.',
    words: [
      { en: 'cake', he: 'עוגה', emoji: '🎂' }, { en: 'name', he: 'שם', emoji: '📛' },
      { en: 'lake', he: 'אגם', emoji: '🏞️' }, { en: 'game', he: 'משחק', emoji: '🎲' },
    ] },
  { id: 'en:phon:i_e', key: 'i_e', pattern: 'i_e', soundHe: 'אַיי',
    explainHe: 'e שקטה בסוף הופכת את ה-i ל"אַיי": bike.',
    words: [
      { en: 'bike', he: 'אופניים', emoji: '🚲' }, { en: 'five', he: 'חמש', emoji: '5️⃣' },
      { en: 'kite', he: 'עפיפון', emoji: '🪁' }, { en: 'time', he: 'זמן', emoji: '⏰' },
    ] },
  { id: 'en:phon:o_e', key: 'o_e', pattern: 'o_e', soundHe: 'אוֹ',
    explainHe: 'e שקטה בסוף הופכת את ה-o ל"אוֹ": home.',
    words: [
      { en: 'home', he: 'בית', emoji: '🏠' }, { en: 'nose', he: 'אף', emoji: '👃' },
      { en: 'rose', he: 'ורד', emoji: '🌹' }, { en: 'bone', he: 'עצם', emoji: '🦴' },
    ] },
  { id: 'en:phon:u_e', key: 'u_e', pattern: 'u_e', soundHe: 'יוּ / אוּ',
    explainHe: 'e שקטה בסוף הופכת את ה-u ל"יוּ" או "אוּ": cube, June.',
    words: [
      { en: 'cube', he: 'קובייה', emoji: '🧊' }, { en: 'June', he: 'יוני', emoji: '📅' },
      { en: 'rule', he: 'כלל', emoji: '📏' }, { en: 'huge', he: 'ענק', emoji: '🐘' },
    ] },
  // ── Vowel teams ────────────────────────────────────────────────────────────
  { id: 'en:phon:ee', key: 'ee', pattern: 'ee', soundHe: 'אִי',
    explainHe: 'שתי e ביחד נשמעות "אִי" ארוכה: tree.',
    words: [
      { en: 'tree', he: 'עץ', emoji: '🌳' }, { en: 'bee', he: 'דבורה', emoji: '🐝' },
      { en: 'feet', he: 'כפות רגליים', emoji: '🦶' }, { en: 'green', he: 'ירוק', emoji: '🟢' },
    ] },
  { id: 'en:phon:ea', key: 'ea', pattern: 'ea', soundHe: 'אִי',
    explainHe: 'e ו-a ביחד נשמעות בדרך כלל "אִי": sea.',
    words: [
      { en: 'sea', he: 'ים', emoji: '🌊' }, { en: 'tea', he: 'תה', emoji: '🍵' },
      { en: 'eat', he: 'לאכול', emoji: '🍽️' }, { en: 'read', he: 'לקרוא', emoji: '📖' },
    ] },
  { id: 'en:phon:ai', key: 'ai', pattern: 'ai / ay', soundHe: 'אֵיי',
    explainHe: 'ai באמצע מילה ו-ay בסופה נשמעות "אֵיי": rain, day.',
    words: [
      { en: 'rain', he: 'גשם', emoji: '🌧️' }, { en: 'train', he: 'רכבת', emoji: '🚆' },
      { en: 'day', he: 'יום', emoji: '🌞' }, { en: 'play', he: 'לשחק', emoji: '🧸' },
    ] },
  { id: 'en:phon:oa', key: 'oa', pattern: 'oa / ow', soundHe: 'אוֹ',
    explainHe: 'oa ו-ow (בחלק מהמילים) נשמעות "אוֹ": boat, snow.',
    words: [
      { en: 'boat', he: 'סירה', emoji: '⛵' }, { en: 'coat', he: 'מעיל', emoji: '🧥' },
      { en: 'snow', he: 'שלג', emoji: '❄️' }, { en: 'slow', he: 'איטי', emoji: '🐢' },
    ] },
  { id: 'en:phon:oo', key: 'oo', pattern: 'oo', soundHe: 'אוּ',
    explainHe: 'שתי o ביחד נשמעות "אוּ": moon. לפעמים "אוּ" קצרה: book.',
    words: [
      { en: 'moon', he: 'ירח', emoji: '🌙' }, { en: 'food', he: 'אוכל', emoji: '🍲' },
      { en: 'school', he: 'בית ספר', emoji: '🏫' }, { en: 'book', he: 'ספר', emoji: '📖' },
    ] },
  { id: 'en:phon:ou', key: 'ou', pattern: 'ou / ow', soundHe: 'אַאוּ',
    explainHe: 'ou ו-ow (בחלק מהמילים) נשמעות "אַאוּ": house, cow.',
    words: [
      { en: 'house', he: 'בית', emoji: '🏠' }, { en: 'mouse', he: 'עכבר', emoji: '🐭' },
      { en: 'cow', he: 'פרה', emoji: '🐄' }, { en: 'now', he: 'עכשיו', emoji: '⏱️' },
    ] },
  // ── R-controlled vowels ────────────────────────────────────────────────────
  { id: 'en:phon:ar', key: 'ar', pattern: 'ar', soundHe: 'אַר',
    explainHe: 'a לפני r נשמעת "אַר": car.',
    words: [
      { en: 'car', he: 'מכונית', emoji: '🚗' }, { en: 'star', he: 'כוכב', emoji: '⭐' },
      { en: 'park', he: 'פארק', emoji: '🏞️' }, { en: 'farm', he: 'חווה', emoji: '🚜' },
    ] },
  { id: 'en:phon:or', key: 'or', pattern: 'or', soundHe: 'אוֹר',
    explainHe: 'o לפני r נשמעת "אוֹר": horse.',
    words: [
      { en: 'horse', he: 'סוס', emoji: '🐎' }, { en: 'fork', he: 'מזלג', emoji: '🍴' },
      { en: 'corn', he: 'תירס', emoji: '🌽' }, { en: 'door', he: 'דלת', emoji: '🚪' },
    ] },
  { id: 'en:phon:er', key: 'er', pattern: 'er / ir / ur', soundHe: 'אֶר',
    explainHe: 'er, ir ו-ur נשמעות אותו דבר: "אֶר" עמומה עם r רכה: bird, nurse.',
    words: [
      { en: 'bird', he: 'ציפור', emoji: '🐦' }, { en: 'girl', he: 'ילדה', emoji: '👧' },
      { en: 'nurse', he: 'אחות (בבית חולים)', emoji: '🧑‍⚕️' }, { en: 'teacher', he: 'מורה', emoji: '🧑‍🏫' },
    ] },
  // ── Tricky spellings ───────────────────────────────────────────────────────
  { id: 'en:phon:soft-cg', key: 'soft-cg', pattern: 'ce / ci / ge / gi', soundHe: 'ס / ג׳',
    explainHe: 'לפני e, i, y: האות c נשמעת ס׳ והאות g נשמעת לרוב ג׳ עם גרש.',
    words: [
      { en: 'city', he: 'עיר', emoji: '🏙️' }, { en: 'ice', he: 'קרח', emoji: '🧊' },
      { en: 'giraffe', he: 'ג׳ירפה', emoji: '🦒' }, { en: 'orange', he: 'תפוז', emoji: '🍊' },
    ] },
  { id: 'en:phon:silent', key: 'silent', pattern: 'kn / wr / mb', soundHe: 'אות שקטה',
    explainHe: 'יש אותיות שכותבים ולא אומרים: k לפני n, w לפני r, b אחרי m.',
    words: [
      { en: 'knife', he: 'סכין', emoji: '🔪' }, { en: 'knee', he: 'ברך', emoji: '🦵' },
      { en: 'write', he: 'לכתוב', emoji: '✍️' }, { en: 'lamb', he: 'טלה', emoji: '🐑' },
    ] },
  { id: 'en:phon:y', key: 'y', pattern: 'y', soundHe: 'אִי / אַיי',
    explainHe: 'y בסוף מילה היא תנועה: "אִי" במילים ארוכות (happy), "אַיי" במילים קצרות (my).',
    words: [
      { en: 'happy', he: 'שמח', emoji: '😊' }, { en: 'baby', he: 'תינוק', emoji: '👶' },
      { en: 'fly', he: 'לעוף', emoji: '🪽' }, { en: 'sky', he: 'שמיים', emoji: '🌌' },
    ] },
];

/** Lesson groups for the reading stage. */
export const PHONICS_GROUPS: string[][] = [
  ['short-a', 'short-e', 'short-i'],
  ['short-o', 'short-u'],
  ['sh', 'ch', 'th'],
  ['ph', 'wh', 'ck', 'ng'],
  ['a_e', 'i_e'],
  ['o_e', 'u_e'],
  ['ee', 'ea', 'ai'],
  ['oa', 'oo', 'ou'],
  ['ar', 'or', 'er'],
  ['soft-cg', 'silent', 'y'],
];
