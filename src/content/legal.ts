/** Credits and privacy text, in both UI languages. */

export type Credit = {
  name: string;
  what: { en: string; he: string };
  license: string;
  licenseUrl: string;
  url: string;
};

export const CREDITS: Credit[] = [
  {
    name: 'Tatoeba',
    what: {
      en: 'Hebrew–English example sentences, written and translated by Tatoeba contributors. Sentences were selected and shortened lists were made by LinguaAdapt; each sentence keeps its Tatoeba id.',
      he: 'משפטים לדוגמה בעברית ובאנגלית, שנכתבו ותורגמו על ידי תורמי Tatoeba. LinguaAdapt בחרה וסיננה את המשפטים; לכל משפט נשמר המזהה שלו ב-Tatoeba.',
    },
    license: 'CC BY 2.0 FR',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/fr/',
    url: 'https://tatoeba.org',
  },
  {
    name: 'Wiktionary',
    what: {
      en: 'Dictionary entries (vowelled spelling, transliteration, gender, plural, meanings) from English Wiktionary, by Wiktionary contributors, extracted with wiktextract (kaikki.org). The adapted dictionary is published under the same license.',
      he: 'ערכי מילון (ניקוד, תעתיק, מין, רבים, פירושים) מוויקימילון האנגלי, מאת תורמי ויקימילון, שחולצו בעזרת wiktextract (kaikki.org). המילון המעובד מתפרסם תחת אותו רישיון.',
    },
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    url: 'https://en.wiktionary.org',
  },
  {
    name: 'Dicta — DictaBERT-large-char-menaked',
    what: {
      en: 'Automatic niqqud (vowel signs) for sentences, added ahead of time with Dicta’s open model. Automatic vowels can contain mistakes.',
      he: 'ניקוד אוטומטי למשפטים, שנוסף מראש בעזרת המודל הפתוח של דיקטה. בניקוד אוטומטי ייתכנו טעויות.',
    },
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    url: 'https://huggingface.co/dicta-il/dictabert-large-char-menaked',
  },
  {
    name: 'Google Cloud Text-to-Speech',
    what: {
      en: 'The Hebrew and English voices are computer-generated (AI) with Google Cloud Text-to-Speech, recorded ahead of time. Where no recording exists, your device’s built-in voice reads the text.',
      he: 'הקולות בעברית ובאנגלית נוצרו במחשב (בינה מלאכותית) בעזרת Google Cloud Text-to-Speech והוקלטו מראש. כשאין הקלטה, הקול המובנה של המכשיר מקריא את הטקסט.',
    },
    license: 'Google Cloud Terms of Service',
    licenseUrl: 'https://cloud.google.com/terms',
    url: 'https://cloud.google.com/text-to-speech',
  },
];

export const OWN_CONTENT_NOTE = {
  en: 'Letters, niqqud and reading lessons, the phrasebook, the course order and the sounds were written for LinguaAdapt. Speech uses the voices built into your device.',
  he: 'שיעורי האותיות, הניקוד והקריאה, השיחון, סדר הקורס והצלילים נכתבו עבור LinguaAdapt. ההשמעה משתמשת בקולות שמובנים במכשיר שלכם.',
};

export const PRIVACY_TEXT = {
  en: [
    'You can use LinguaAdapt without an account. Your progress is then stored only on this device.',
    'If you create an account, your email address and your learning progress are stored with our backend provider (Supabase) so you can sync between devices. You can delete the account and that data at any time in Settings → Delete account.',
    'Speech is produced on your device. Nothing you type or say is sent to a third party.',
    'The full dictionary and sentence lists are downloaded once from our public website (GitHub Pages). Like any website, GitHub may log the request.',
    'LinguaAdapt shows no ads and does not track you across apps or websites.',
  ],
  he: [
    'אפשר להשתמש ב-LinguaAdapt בלי חשבון. במקרה כזה ההתקדמות נשמרת רק במכשיר הזה.',
    'אם תפתחו חשבון, כתובת האימייל וההתקדמות שלכם יישמרו אצל ספק השרת שלנו (Supabase), כדי לסנכרן בין מכשירים. אפשר למחוק את החשבון ואת המידע הזה בכל עת דרך הגדרות ← מחיקת חשבון.',
    'ההשמעה נוצרת במכשיר שלכם. שום דבר שאתם מקלידים או אומרים לא נשלח לגורם שלישי.',
    'המילון המלא ורשימות המשפטים יורדים פעם אחת מהאתר הציבורי שלנו (GitHub Pages). כמו בכל אתר, GitHub עשויה לרשום את הבקשה.',
    'ב-LinguaAdapt אין פרסומות והיא לא עוקבת אחריכם בין אפליקציות או אתרים.',
  ],
};
