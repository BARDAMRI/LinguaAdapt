export interface SentenceEntry {
  he: string;
  en: string;
  difficulty: number; // 1–5
  topic: string;
}

export const HE_SENTENCES: SentenceEntry[] = [
  // ── Introductions & Identity ──────────────────────────────────────────────
  { he: 'שמי דוד', en: 'My name is David', difficulty: 1, topic: 'intro' },
  { he: 'אני מישראל', en: 'I am from Israel', difficulty: 1, topic: 'intro' },
  { he: 'אני מדבר עברית', en: 'I speak Hebrew', difficulty: 1, topic: 'intro' },
  { he: 'אני לומד עברית', en: 'I am learning Hebrew', difficulty: 1, topic: 'intro' },
  { he: 'נעים מאוד להכיר אותך', en: 'Very nice to meet you', difficulty: 2, topic: 'intro' },
  { he: 'מאיפה אתה', en: 'Where are you from', difficulty: 1, topic: 'intro' },
  { he: 'כמה שנים יש לך', en: 'How old are you', difficulty: 2, topic: 'intro' },
  { he: 'אני בן עשרים', en: 'I am twenty years old', difficulty: 2, topic: 'intro' },

  // ── Greetings & Farewells ────────────────────────────────────────────────
  { he: 'בוקר טוב לכולם', en: 'Good morning everyone', difficulty: 1, topic: 'greetings' },
  { he: 'שלום מה שלומך', en: 'Hello, how are you', difficulty: 1, topic: 'greetings' },
  { he: 'אני בסדר תודה', en: 'I am fine, thank you', difficulty: 1, topic: 'greetings' },
  { he: 'להתראות ושבת שלום', en: 'Goodbye and have a peaceful Shabbat', difficulty: 2, topic: 'greetings' },
  { he: 'תהיה בריא', en: 'Be well / Take care', difficulty: 1, topic: 'greetings' },
  { he: 'נתראה מחר', en: 'See you tomorrow', difficulty: 1, topic: 'greetings' },

  // ── Basic Wants & Needs ───────────────────────────────────────────────────
  { he: 'אני רוצה מים', en: 'I want water', difficulty: 1, topic: 'basic' },
  { he: 'אני צריך עזרה', en: 'I need help', difficulty: 1, topic: 'basic' },
  { he: 'אני רעב', en: 'I am hungry', difficulty: 1, topic: 'basic' },
  { he: 'אני עייף מאוד', en: 'I am very tired', difficulty: 1, topic: 'basic' },
  { he: 'אני לא מבין', en: 'I do not understand', difficulty: 1, topic: 'basic' },
  { he: 'דבר לאט בבקשה', en: 'Please speak slowly', difficulty: 2, topic: 'basic' },
  { he: 'אני רוצה לאכול', en: 'I want to eat', difficulty: 1, topic: 'basic' },
  { he: 'תוכל לחזור על זה', en: 'Can you repeat that', difficulty: 2, topic: 'basic' },
  { he: 'כן אני מבין', en: 'Yes, I understand', difficulty: 1, topic: 'basic' },
  { he: 'לא, תודה', en: 'No, thank you', difficulty: 1, topic: 'basic' },

  // ── Daily Routine ─────────────────────────────────────────────────────────
  { he: 'אני קם בשבע בבוקר', en: 'I wake up at seven in the morning', difficulty: 2, topic: 'daily' },
  { he: 'אני שותה קפה בבוקר', en: 'I drink coffee in the morning', difficulty: 2, topic: 'daily' },
  { he: 'הוא הולך לעבודה', en: 'He goes to work', difficulty: 1, topic: 'daily' },
  { he: 'היא לומדת באוניברסיטה', en: 'She studies at the university', difficulty: 2, topic: 'daily' },
  { he: 'הם אוכלים ארוחת ערב יחד', en: 'They eat dinner together', difficulty: 2, topic: 'daily' },
  { he: 'אני ישן מוקדם', en: 'I go to sleep early', difficulty: 2, topic: 'daily' },
  { he: 'אנחנו מטיילים בפארק', en: 'We are walking in the park', difficulty: 2, topic: 'daily' },
  { he: 'הילדים משחקים בחוץ', en: 'The children are playing outside', difficulty: 2, topic: 'daily' },

  // ── Food & Restaurants ────────────────────────────────────────────────────
  { he: 'אני אוהב פלאפל', en: 'I love falafel', difficulty: 1, topic: 'food' },
  { he: 'הוא אוכל סלט ישראלי', en: 'He is eating an Israeli salad', difficulty: 2, topic: 'food' },
  { he: 'תפריט בבקשה', en: 'Menu, please', difficulty: 1, topic: 'food' },
  { he: 'מה אתה ממליץ', en: 'What do you recommend', difficulty: 2, topic: 'food' },
  { he: 'אני רוצה להזמין פיצה', en: 'I would like to order pizza', difficulty: 2, topic: 'food' },
  { he: 'הקפה טעים מאוד', en: 'The coffee is very tasty', difficulty: 2, topic: 'food' },
  { he: 'כמה עולה הארוחה', en: 'How much does the meal cost', difficulty: 2, topic: 'food' },
  { he: 'החשבון בבקשה', en: 'The bill, please', difficulty: 2, topic: 'food' },

  // ── Shopping ──────────────────────────────────────────────────────────────
  { he: 'כמה זה עולה', en: 'How much does this cost', difficulty: 1, topic: 'shopping' },
  { he: 'יש לכם את זה בצבע אחר', en: 'Do you have this in another color', difficulty: 3, topic: 'shopping' },
  { he: 'אני רוצה לקנות מתנה', en: 'I want to buy a gift', difficulty: 2, topic: 'shopping' },
  { he: 'יש הנחה על זה', en: 'Is there a discount on this', difficulty: 2, topic: 'shopping' },
  { he: 'אני משלם בכרטיס', en: 'I am paying by card', difficulty: 2, topic: 'shopping' },
  { he: 'אפשר לקבל קבלה', en: 'Can I get a receipt', difficulty: 2, topic: 'shopping' },

  // ── Transportation & Directions ───────────────────────────────────────────
  { he: 'איפה התחנה', en: 'Where is the station', difficulty: 1, topic: 'transport' },
  { he: 'הרכבת יוצאת בשמונה', en: 'The train leaves at eight', difficulty: 2, topic: 'transport' },
  { he: 'לך ישר ואז פנה ימינה', en: 'Go straight then turn right', difficulty: 3, topic: 'transport' },
  { he: 'כמה זמן לוקח לנסוע לשם', en: 'How long does it take to get there', difficulty: 3, topic: 'transport' },
  { he: 'אני לוקח מונית', en: 'I am taking a taxi', difficulty: 2, topic: 'transport' },
  { he: 'השדה תעופה רחוק מכאן', en: 'The airport is far from here', difficulty: 3, topic: 'transport' },

  // ── Family ────────────────────────────────────────────────────────────────
  { he: 'יש לי אח ואחות', en: 'I have a brother and a sister', difficulty: 2, topic: 'family' },
  { he: 'הסבא שלי גר בחיפה', en: 'My grandfather lives in Haifa', difficulty: 2, topic: 'family' },
  { he: 'אמא שלי מבשלת טוב', en: 'My mother cooks well', difficulty: 2, topic: 'family' },
  { he: 'המשפחה שלי גדולה', en: 'My family is big', difficulty: 1, topic: 'family' },
  { he: 'הילדים שלנו ישנים', en: 'Our children are sleeping', difficulty: 2, topic: 'family' },
  { he: 'אבא שלי עובד בתל אביב', en: 'My father works in Tel Aviv', difficulty: 2, topic: 'family' },

  // ── Work & Study ─────────────────────────────────────────────────────────
  { he: 'אני עובד במשרד', en: 'I work in an office', difficulty: 2, topic: 'work' },
  { he: 'יש לנו פגישה בצהריים', en: 'We have a meeting at noon', difficulty: 2, topic: 'work' },
  { he: 'הפרויקט יגמר בשבוע הבא', en: 'The project will be finished next week', difficulty: 3, topic: 'work' },
  { he: 'הוא מורה בבית ספר', en: 'He is a teacher at a school', difficulty: 2, topic: 'work' },
  { he: 'אני מחפש עבודה', en: 'I am looking for work', difficulty: 2, topic: 'work' },
  { he: 'הבחינה הייתה קשה', en: 'The exam was difficult', difficulty: 2, topic: 'work' },

  // ── Weather & Environment ────────────────────────────────────────────────
  { he: 'היום חם מאוד', en: 'Today is very hot', difficulty: 1, topic: 'weather' },
  { he: 'מחר יהיה גשם', en: 'Tomorrow it will rain', difficulty: 2, topic: 'weather' },
  { he: 'השמים מעוננים', en: 'The sky is cloudy', difficulty: 2, topic: 'weather' },
  { he: 'בחורף קר בירושלים', en: 'In winter it is cold in Jerusalem', difficulty: 3, topic: 'weather' },
  { he: 'הים שקט היום', en: 'The sea is calm today', difficulty: 2, topic: 'weather' },

  // ── Health & Feelings ────────────────────────────────────────────────────
  { he: 'אני מרגיש טוב', en: 'I feel good', difficulty: 1, topic: 'health' },
  { he: 'יש לי כאב ראש', en: 'I have a headache', difficulty: 2, topic: 'health' },
  { he: 'הוא חולה ומנוח בבית', en: 'He is sick and resting at home', difficulty: 3, topic: 'health' },
  { he: 'צריך לקחת את התרופה', en: 'You need to take the medicine', difficulty: 3, topic: 'health' },
  { he: 'אני שמח לראות אותך', en: 'I am happy to see you', difficulty: 2, topic: 'health' },
  { he: 'היא מרגישה עצובה היום', en: 'She feels sad today', difficulty: 2, topic: 'health' },

  // ── Opinions & Preferences ────────────────────────────────────────────────
  { he: 'אני אוהב מוזיקה', en: 'I love music', difficulty: 1, topic: 'opinions' },
  { he: 'לדעתי זה נכון', en: 'In my opinion this is correct', difficulty: 3, topic: 'opinions' },
  { he: 'זה מאוד מעניין', en: 'This is very interesting', difficulty: 2, topic: 'opinions' },
  { he: 'אני מסכים איתך', en: 'I agree with you', difficulty: 2, topic: 'opinions' },
  { he: 'אני לא חושב שזה נכון', en: 'I do not think that is right', difficulty: 3, topic: 'opinions' },
  { he: 'הסרט היה מדהים', en: 'The movie was amazing', difficulty: 2, topic: 'opinions' },

  // ── Higher Difficulty ─────────────────────────────────────────────────────
  { he: 'אם תעבוד קשה תצליח', en: 'If you work hard you will succeed', difficulty: 4, topic: 'complex' },
  { he: 'חשוב ללמוד שפות חדשות', en: 'It is important to learn new languages', difficulty: 4, topic: 'complex' },
  { he: 'הוא לא ידע שהיא כבר הלכה', en: 'He did not know she had already left', difficulty: 4, topic: 'complex' },
  { he: 'למרות הכל הוא המשיך לנסות', en: 'Despite everything he kept trying', difficulty: 4, topic: 'complex' },
  { he: 'בדרך כלל אני קם מוקדם בבוקר', en: 'Usually I wake up early in the morning', difficulty: 3, topic: 'complex' },
  { he: 'היה לי יום ארוך ומתיש', en: 'I had a long and exhausting day', difficulty: 4, topic: 'complex' },
  { he: 'אנחנו מתכננים לנסוע לחוץ לארץ', en: 'We are planning to travel abroad', difficulty: 4, topic: 'complex' },
  { he: 'הוא ביקש ממנה לעזור לו', en: 'He asked her to help him', difficulty: 4, topic: 'complex' },

  // ── At the Doctor ─────────────────────────────────────────────────────────
  { he: 'אני רוצה לקבוע תור לרופא', en: 'I want to make an appointment with the doctor', difficulty: 3, topic: 'doctor' },
  { he: 'יש לי כאב בגב', en: 'I have a back pain', difficulty: 2, topic: 'doctor' },
  { he: 'מאז מתי אתה מרגיש כך', en: 'Since when have you been feeling this way', difficulty: 3, topic: 'doctor' },
  { he: 'הכאב חזק או חלש', en: 'Is the pain strong or weak', difficulty: 2, topic: 'doctor' },
  { he: 'אני צריך מרשם לתרופה', en: 'I need a prescription for medicine', difficulty: 3, topic: 'doctor' },
  { he: 'יש לי חום של שלושים ושמונה', en: 'I have a temperature of thirty-eight', difficulty: 3, topic: 'doctor' },
  { he: 'האם אני צריך ניתוח', en: 'Do I need surgery', difficulty: 3, topic: 'doctor' },
  { he: 'הוא אלרגי לפניצילין', en: 'He is allergic to penicillin', difficulty: 4, topic: 'doctor' },
  { he: 'קחי שתי כדורים פעמיים ביום', en: 'Take two pills twice a day', difficulty: 3, topic: 'doctor' },
  { he: 'הוא שוכב בבית החולים', en: 'He is lying in the hospital', difficulty: 3, topic: 'doctor' },

  // ── At the Airport & Travel ───────────────────────────────────────────────
  { he: 'איפה דלפק הצ׳ק אין', en: 'Where is the check-in counter', difficulty: 3, topic: 'airport' },
  { he: 'יש לי מזוודה אחת בלבד', en: 'I have only one suitcase', difficulty: 2, topic: 'airport' },
  { he: 'הטיסה שלי מתעכבת', en: 'My flight is delayed', difficulty: 3, topic: 'airport' },
  { he: 'מה מספר השער', en: 'What is the gate number', difficulty: 2, topic: 'airport' },
  { he: 'אני צריך לעבור ביקורת דרכון', en: 'I need to go through passport control', difficulty: 3, topic: 'airport' },
  { he: 'המזוודה שלי לא הגיעה', en: 'My suitcase did not arrive', difficulty: 3, topic: 'airport' },
  { he: 'יש לי כרטיס עלייה למטוס', en: 'I have a boarding pass', difficulty: 3, topic: 'airport' },
  { he: 'הטיסה יוצאת בשתיים עשרה וחצי', en: 'The flight departs at twelve thirty', difficulty: 3, topic: 'airport' },
  { he: 'אנחנו נוחתים בתל אביב', en: 'We are landing in Tel Aviv', difficulty: 2, topic: 'airport' },
  { he: 'אני יושב ליד החלון', en: 'I am sitting by the window', difficulty: 2, topic: 'airport' },

  // ── Making Plans & Invitations ────────────────────────────────────────────
  { he: 'האם אתה פנוי מחר בערב', en: 'Are you free tomorrow evening', difficulty: 2, topic: 'plans' },
  { he: 'בוא נצא לאכול ביחד', en: 'Let us go out to eat together', difficulty: 2, topic: 'plans' },
  { he: 'אני מזמין אותך לחגוג איתנו', en: 'I am inviting you to celebrate with us', difficulty: 3, topic: 'plans' },
  { he: 'מה אתה רוצה לעשות היום', en: 'What do you want to do today', difficulty: 1, topic: 'plans' },
  { he: 'נפגש בשש בכיכר', en: 'Let us meet at six in the square', difficulty: 2, topic: 'plans' },
  { he: 'אני לא יכול הערב יש לי תוכניות', en: 'I cannot tonight, I have plans', difficulty: 3, topic: 'plans' },
  { he: 'מה דעתך ללכת לקולנוע', en: 'What do you think about going to the cinema', difficulty: 3, topic: 'plans' },
  { he: 'בא לי לנוח הערב', en: 'I feel like resting tonight', difficulty: 2, topic: 'plans' },
  { he: 'יש לי כרטיסים להופעה', en: 'I have tickets to a show / concert', difficulty: 3, topic: 'plans' },
  { he: 'אני אאסוף אותך בשבע', en: 'I will pick you up at seven', difficulty: 3, topic: 'plans' },

  // ── On the Phone ──────────────────────────────────────────────────────────
  { he: 'אלו מי מדבר', en: 'Hello, who is speaking', difficulty: 2, topic: 'phone' },
  { he: 'האם אפשר לדבר עם יוסי', en: 'May I speak with Yossi', difficulty: 2, topic: 'phone' },
  { he: 'הוא אינו זמין כרגע', en: 'He is not available right now', difficulty: 3, topic: 'phone' },
  { he: 'השאר הודעה אחרי הצפצוף', en: 'Leave a message after the beep', difficulty: 3, topic: 'phone' },
  { he: 'אני אחזור אליך בהקדם', en: 'I will get back to you soon', difficulty: 3, topic: 'phone' },
  { he: 'הקו לא ברור', en: 'The line is not clear', difficulty: 3, topic: 'phone' },
  { he: 'תוכל לכתוב לי הודעה', en: 'Can you send me a message', difficulty: 2, topic: 'phone' },
  { he: 'הנייד שלי מת', en: 'My phone is dead (out of battery)', difficulty: 2, topic: 'phone' },
  { he: 'שלח לי את המיקום', en: 'Send me the location', difficulty: 2, topic: 'phone' },

  // ── At the Hotel ──────────────────────────────────────────────────────────
  { he: 'יש לכם חדר פנוי', en: 'Do you have a free room', difficulty: 2, topic: 'hotel' },
  { he: 'הזמנתי חדר על שם כהן', en: 'I reserved a room under the name Cohen', difficulty: 3, topic: 'hotel' },
  { he: 'מה שעת הצ׳ק אאוט', en: 'What is the checkout time', difficulty: 3, topic: 'hotel' },
  { he: 'האוכל כלול במחיר', en: 'Food is included in the price', difficulty: 3, topic: 'hotel' },
  { he: 'אני צריך עוד מגבות', en: 'I need more towels', difficulty: 2, topic: 'hotel' },
  { he: 'הייתי רוצה חדר בקומה גבוהה', en: 'I would like a room on a high floor', difficulty: 3, topic: 'hotel' },
  { he: 'יש בעיה עם המיזוג', en: 'There is a problem with the air conditioning', difficulty: 3, topic: 'hotel' },
  { he: 'האם יש חניה במלון', en: 'Is there parking at the hotel', difficulty: 3, topic: 'hotel' },

  // ── School & University ───────────────────────────────────────────────────
  { he: 'הסטודנטים מכינים מצגת', en: 'The students are preparing a presentation', difficulty: 3, topic: 'school' },
  { he: 'המרצה מסביר את החומר', en: 'The lecturer is explaining the material', difficulty: 3, topic: 'school' },
  { he: 'צריך להגיש את העבודה ביום חמישי', en: 'The assignment must be submitted on Thursday', difficulty: 3, topic: 'school' },
  { he: 'אני לומד לבחינה כל הלילה', en: 'I am studying for the exam all night', difficulty: 3, topic: 'school' },
  { he: 'אני לא הבנתי את השאלה', en: 'I did not understand the question', difficulty: 2, topic: 'school' },
  { he: 'המורה נתן שיעורי בית', en: 'The teacher gave homework', difficulty: 2, topic: 'school' },
  { he: 'כמה תלמידים יש בכיתה', en: 'How many students are in the class', difficulty: 2, topic: 'school' },
  { he: 'הספרייה פתוחה עד עשר בלילה', en: 'The library is open until ten at night', difficulty: 3, topic: 'school' },

  // ── Describing Things ─────────────────────────────────────────────────────
  { he: 'הספר מאוד מעניין', en: 'The book is very interesting', difficulty: 1, topic: 'describe' },
  { he: 'הדירה קטנה אבל נוחה', en: 'The apartment is small but comfortable', difficulty: 2, topic: 'describe' },
  { he: 'הנוף מכאן יפהפה', en: 'The view from here is beautiful', difficulty: 3, topic: 'describe' },
  { he: 'האוכל כאן טעים מאוד', en: 'The food here is very tasty', difficulty: 2, topic: 'describe' },
  { he: 'השיר הזה עצוב מאוד', en: 'This song is very sad', difficulty: 2, topic: 'describe' },
  { he: 'הכביש ארוך ומתפתל', en: 'The road is long and winding', difficulty: 3, topic: 'describe' },
  { he: 'המחיר יקר מדי', en: 'The price is too expensive', difficulty: 2, topic: 'describe' },
  { he: 'הבגד מאוד נוח ורך', en: 'The clothing is very comfortable and soft', difficulty: 3, topic: 'describe' },
  { he: 'הסרט הזה מותח', en: 'This movie is thrilling', difficulty: 2, topic: 'describe' },

  // ── Expressing Feelings ───────────────────────────────────────────────────
  { he: 'אני כל כך שמח שאתה כאן', en: 'I am so happy you are here', difficulty: 2, topic: 'feelings' },
  { he: 'אני מרגיש בודד', en: 'I feel lonely', difficulty: 2, topic: 'feelings' },
  { he: 'זה מרגש אותי מאוד', en: 'This moves me a lot', difficulty: 3, topic: 'feelings' },
  { he: 'אני מתגעגע לבית', en: 'I miss home', difficulty: 3, topic: 'feelings' },
  { he: 'אני מוטרד מהמצב', en: 'I am troubled by the situation', difficulty: 4, topic: 'feelings' },
  { he: 'הוא הפתיע אותי לחלוטין', en: 'He completely surprised me', difficulty: 3, topic: 'feelings' },
  { he: 'אני מפחד לטוס', en: 'I am afraid to fly', difficulty: 2, topic: 'feelings' },
  { he: 'אני גאה בך מאוד', en: 'I am very proud of you', difficulty: 2, topic: 'feelings' },

  // ── Advanced & Complex ────────────────────────────────────────────────────
  { he: 'עדיף לחשוב לפני שמדברים', en: 'It is better to think before speaking', difficulty: 4, topic: 'complex' },
  { he: 'ככל שתתרגל יותר כך תשתפר', en: 'The more you practice the more you will improve', difficulty: 5, topic: 'complex' },
  { he: 'לא ידעתי שהפגישה בוטלה', en: 'I did not know the meeting was cancelled', difficulty: 4, topic: 'complex' },
  { he: 'הוא המשיך ללכת למרות הגשם', en: 'He kept walking despite the rain', difficulty: 4, topic: 'complex' },
  { he: 'לפעמים קשה לדעת מה נכון', en: 'Sometimes it is hard to know what is right', difficulty: 4, topic: 'complex' },
  { he: 'היא הסבירה את הבעיה בפשטות', en: 'She explained the problem simply', difficulty: 4, topic: 'complex' },
  { he: 'אם היית בא מוקדם יותר היית רואה אותה', en: 'If you had come earlier you would have seen her', difficulty: 5, topic: 'complex' },
  { he: 'הם הגיעו לאחר שהכל נגמר', en: 'They arrived after everything was over', difficulty: 4, topic: 'complex' },
  { he: 'חשוב לדאוג לבריאות הנפשית', en: 'It is important to take care of mental health', difficulty: 4, topic: 'complex' },
  { he: 'הוא דיבר בשם כולם', en: 'He spoke on behalf of everyone', difficulty: 4, topic: 'complex' },
];
