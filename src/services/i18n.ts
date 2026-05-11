import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const translations = {
  en: {
    welcome: {
      title: 'Welcome to LinguaAdapt',
      subtitle: 'Learn languages your way — one adaptive experience across all your devices.',
      startLearning: 'Start Learning',
      practiceConversation: 'Practice conversation',
      reviewDue: 'Review due: %{count}',
      reviewDueZero: 'All caught up',
      streak: 'Daily streak',
      points: 'Total points',
      settings: 'Settings',
      course: 'Course',
    },
    auth: {
      loginTitle: 'Sign in',
      signupTitle: 'Create account',
      loginSubtitle: 'Welcome back — continue your journey.',
      signupSubtitle: 'Create an account to save progress and sync skills.',
      email: 'Email',
      password: 'Password',
      displayName: 'Display name',
      confirmPassword: 'Confirm password',
      logIn: 'Log in',
      signUp: 'Sign up',
      noAccount: 'No account yet?',
      hasAccount: 'Already have an account?',
      switchSignup: 'Create one',
      switchLogin: 'Sign in',
      mismatchedPassword: 'Passwords do not match.',
      emailConfirm: 'Check your inbox to confirm your email, then sign in.',
    },
    profile: {
      title: 'Your profile',
      greeting: 'Hello, %{name}',
      overallLevel: 'Overall level',
      skillsTitle: 'Skills',
      skillAlphabet: 'Alphabet',
      skillVocabulary: 'Vocabulary',
      skillSentences: 'Sentences',
      skillConversation: 'Conversation',
      loadError: 'Could not load profile.',
      logout: 'Log out',
      backToHome: 'Home',
    },
    learning: {
      placementTitle: 'Placement check',
      placementSubtitle: 'A short adaptive quiz sets your starting levels.',
      sessionTitle: 'Practice · %{category}',
      check: 'Check answer',
      next: 'Next',
      feedbackGood: 'Good job!',
      feedbackBad: 'Not quite.',
      correctWas: 'Correct answer: %{answer}',
      translatePlaceholder: 'Type your answer…',
      reorderHint: 'Tap words in the word bank to build your answer.',
      yourOrder: 'Your sentence:',
      saveError: 'Could not save your placement results. Try again.',
      retrySubmit: 'Try again',
      noExercisesForPair:
        'No exercises found for this language pair. Please check your course settings.',
      backToLanguages: 'Change language',
      skipPlacement: 'Skip and continue',
      sessionDone: 'Session complete',
      practiceAlphabet: 'Alphabet practice',
      practiceVocabulary: 'Vocabulary practice',
      practiceSentences: 'Sentence practice',
      practiceMixed: 'Mixed practice',
      tutorTitle: 'AI tutor',
      tutorSuggestion: 'Suggestion: %{text}',
      aiChecking: 'Checking with tutor…',
      sessionNoExercises:
        'No exercises found for this language combination. Try changing your course language in Settings.',
    },
    summary: {
      title: 'Session complete',
      subtitle: 'Nice work on %{category}.',
      accuracy: 'Accuracy',
      newWords: 'New words learned',
      pointsEarned: 'Points this session',
      totalPoints: 'Total points',
      streak: 'Daily streak',
      levelUp: 'Level up!',
      levelLine: '%{skill}: %{before} → %{after}',
      share: 'Share progress',
      done: 'Back to home',
      shareTitle: 'LinguaAdapt progress',
      shareBody:
        '%{accuracy}% correct · %{newWords} new words · %{points} total pts · %{streak}-day streak · %{category}',
      shareCardLine1: '%{accuracy}% • %{category}',
      shareCardLine2: 'Streak %{streak} · %{points} pts',
      shareWebHint:
        'If sharing is unavailable, your summary is copied and a PNG card downloads for social posts.',
    },
    settings: {
      title: 'Settings',
      back: 'Back',
      sound: 'Sound effects',
      soundHint: 'Short tones when answers are revealed',
      dark: 'Dark mode',
      darkHint: 'Easier on the eyes in low light',
      appLanguage: 'App language',
      appLanguageHint: 'The language the app is displayed in',
      courses: 'Learning courses',
      activeCourse: 'Active',
      addCourse: 'Add new course',
      switchCourse: 'Switch',
      deleteCourse: 'Remove',
      courseLabel: '%{native} → %{target}',
      noCourses: 'No courses configured',
      addCourseTitle: 'Add a new course',
      confirmDeleteCourse: 'Remove this course?',
      courseExistsTitle: 'Course already exists',
      courseExistsBody: 'You already have a course for this language pair.',
      languageApplied: 'Language updated',
      deleteAccount: 'Delete account',
      deleteAccountConfirmTitle: 'Delete your account?',
      deleteAccountConfirmBody: 'This permanently deletes your account and all progress. This cannot be undone.',
      deleteAccountError: 'Could not delete account. Try again.',
    },
    onboarding: {
      title: 'Welcome',
      subtitle:
        'Choose your languages. The first lesson set is for English speakers learning Hebrew; more pairs will follow.',
      nativeQuestion: 'What is your native language?',
      targetQuestion: 'What language do you want to learn?',
      continue: 'Continue',
      saving: 'Saving…',
      saveError: 'Could not save. Check your connection and try again.',
      languages: {
        he: 'Hebrew',
        en: 'English',
        ar: 'Arabic',
        es: 'Spanish',
        fr: 'French',
        ru: 'Russian',
        de: 'German',
      },
    },
    conversation: {
      title: 'Conversation',
      topicLine: 'Topic: %{topic}',
      hint: 'Short replies from the tutor. Ask anything about the scenario.',
      inputPlaceholder: 'Type a message…',
      send: 'Send',
      thinking: 'Tutor is thinking…',
      offlineBadge: 'Offline mode',
    },
  },
  he: {
    welcome: {
      title: 'ברוכים הבאים ל-LinguaAdapt',
      subtitle: 'למדו שפות בקצב שלכם — חוויה אחת שמותאמת אליכם בכל המכשירים.',
      startLearning: 'התחל ללמוד',
      practiceConversation: 'תרגול שיחה',
      reviewDue: 'חזרות מוכנות: %{count}',
      reviewDueZero: 'הכול עדכני',
      streak: 'רצף יומי',
      points: 'נקודות סה״כ',
      settings: 'הגדרות',
      course: 'קורס',
    },
    auth: {
      loginTitle: 'התחברות',
      signupTitle: 'יצירת חשבון',
      loginSubtitle: 'שמחים לראות אתכם שוב — המשיכו מהיכן שהפסקתם.',
      signupSubtitle: 'צרו חשבון כדי לשמור התקדמות ולסנכרן מיומנויות.',
      email: 'אימייל',
      password: 'סיסמה',
      displayName: 'שם תצוגה',
      confirmPassword: 'אימות סיסמה',
      logIn: 'התחבר',
      signUp: 'הרשמה',
      noAccount: 'אין לכם חשבון?',
      hasAccount: 'כבר יש לכם חשבון?',
      switchSignup: 'הרשמה',
      switchLogin: 'התחברות',
      mismatchedPassword: 'הסיסמאות אינן תואמות.',
      emailConfirm: 'בדקו את תיבת האימייל לאישור החשבון, ואז התחברו.',
    },
    profile: {
      title: 'הפרופיל שלכם',
      greeting: 'שלום, %{name}',
      overallLevel: 'רמה כללית',
      skillsTitle: 'מיומנויות',
      skillAlphabet: 'אלפבית',
      skillVocabulary: 'אוצר מילים',
      skillSentences: 'משפטים',
      skillConversation: 'שיחה',
      loadError: 'לא ניתן לטעון את הפרופיל.',
      logout: 'התנתקות',
      backToHome: 'בית',
    },
    learning: {
      placementTitle: 'בדיקת מיקום',
      placementSubtitle: 'שאלון קצר שמכוון את רמות ההתחלה שלכם.',
      sessionTitle: 'תרגול · %{category}',
      check: 'בדיקה',
      next: 'המשך',
      feedbackGood: 'כל הכבוד!',
      feedbackBad: 'לא בדיוק.',
      correctWas: 'התשובה הנכונה: %{answer}',
      translatePlaceholder: 'הקלידו את התשובה…',
      reorderHint: 'הקישו על מילים כדי לבנות את התשובה.',
      yourOrder: 'המשפט שלכם:',
      saveError: 'לא ניתן לשמור את תוצאות הבדיקה. נסו שוב.',
      retrySubmit: 'נסו שוב',
      noExercisesForPair:
        'לא נמצאו תרגילים לשילוב שפות זה. בדקו את הגדרות הקורס שלכם.',
      backToLanguages: 'שינוי שפה',
      skipPlacement: 'דלג והמשך',
      sessionDone: 'סיימתם את הסשן',
      practiceAlphabet: 'תרגול אלפבית',
      practiceVocabulary: 'תרגול אוצר מילים',
      practiceSentences: 'תרגול משפטים',
      practiceMixed: 'תרגול משולב',
      tutorTitle: 'מורה דיגיטלי',
      tutorSuggestion: 'הצעה: %{text}',
      aiChecking: 'בודקים מול המורה…',
      sessionNoExercises:
        'לא נמצאו תרגילים לשילוב זה. שנו את שפת הקורס בהגדרות.',
    },
    summary: {
      title: 'סיום סשן',
      subtitle: 'עבודה יפה ב־%{category}.',
      accuracy: 'דיוק',
      newWords: 'מילים חדשות',
      pointsEarned: 'נקודות בסשן',
      totalPoints: 'נקודות סה״כ',
      streak: 'רצף יומי',
      levelUp: 'עלית רמה!',
      levelLine: '%{skill}: %{before} → %{after}',
      share: 'שתף התקדמות',
      done: 'חזרה לבית',
      shareTitle: 'התקדמות ב-LinguaAdapt',
      shareBody:
        '%{accuracy}% נכון · %{newWords} מילים חדשות · %{points} נק׳ · רצף %{streak} ימים · %{category}',
      shareCardLine1: '%{accuracy}% • %{category}',
      shareCardLine2: 'רצף %{streak} · %{points} נק׳',
      shareWebHint:
        'אם השיתוף לא זמין, הטקסט מועתק וקובץ PNG יורד לפרסום.',
    },
    settings: {
      title: 'הגדרות',
      back: 'חזרה',
      sound: 'אפקטי קול',
      soundHint: 'צליל קצר כשחושפים תשובה',
      dark: 'מצב כהה',
      darkHint: 'נוח יותר באור עמום',
      appLanguage: 'שפת האפליקציה',
      appLanguageHint: 'השפה שבה האפליקציה מוצגת',
      courses: 'קורסי למידה',
      activeCourse: 'פעיל',
      addCourse: 'הוסף קורס חדש',
      switchCourse: 'עבור',
      deleteCourse: 'הסר',
      courseLabel: '%{native} → %{target}',
      noCourses: 'אין קורסים מוגדרים',
      addCourseTitle: 'הוסף קורס חדש',
      confirmDeleteCourse: 'להסיר קורס זה?',
      courseExistsTitle: 'הקורס כבר קיים',
      courseExistsBody: 'כבר יש לכם קורס לשילוב שפות זה.',
      languageApplied: 'השפה עודכנה',
      deleteAccount: 'מחיקת חשבון',
      deleteAccountConfirmTitle: 'למחוק את החשבון?',
      deleteAccountConfirmBody: 'פעולה זו מוחקת לצמיתות את החשבון וכל ההתקדמות שלכם. לא ניתן לבטל פעולה זו.',
      deleteAccountError: 'לא ניתן למחוק את החשבון. נסו שוב.',
    },
    onboarding: {
      title: 'ברוכים הבאים',
      subtitle:
        'בחרו שפות. סט השיעורים הראשון מיועד לדוברי אנגלית הלומדים עברית; בהמשך יתווספו שילובים נוספים.',
      nativeQuestion: 'מהי שפת האם שלכם?',
      targetQuestion: 'איזו שפה תרצו ללמוד?',
      continue: 'המשך',
      saving: 'שומרים…',
      saveError: 'לא ניתן לשמור. בדקו חיבור ונסו שוב.',
      languages: {
        he: 'עברית',
        en: 'אנגלית',
        ar: 'ערבית',
        es: 'ספרדית',
        fr: 'צרפתית',
        ru: 'רוסית',
        de: 'גרמנית',
      },
    },
    conversation: {
      title: 'שיחה',
      topicLine: 'נושא: %{topic}',
      hint: 'תשובות קצרות מהמורה. שאלו כל מה שקשור לתרחיש.',
      inputPlaceholder: 'כתבו הודעה…',
      send: 'שלחו',
      thinking: 'המורה חושב…',
      offlineBadge: 'מצב לא מחובר',
    },
  },
} as const;

const STORAGE_KEY_LANG = 'lingua_app_language';

const i18n = new I18n(translations);

function resolveDeviceLocale(): string {
  const tag = Localization.getLocales()[0]?.languageTag ?? 'en';
  if (tag.toLowerCase().startsWith('he')) return 'he';
  const short = tag.split('-')[0]?.toLowerCase() ?? 'en';
  return short in translations ? short : 'en';
}

function computeIsRTL(locale: string): boolean {
  return locale === 'he';
}

const deviceLocale = resolveDeviceLocale();
i18n.defaultLocale = 'en';
i18n.locale = deviceLocale;
i18n.enableFallback = true;

export let isRTL = computeIsRTL(deviceLocale);

I18nManager.allowRTL(true);
if (I18nManager.isRTL !== isRTL) {
  I18nManager.forceRTL(isRTL);
}

/** Apply a new locale at runtime. Call this before forcing a re-render. */
export function applyLocale(lang: string): void {
  const supported = lang in translations ? lang : 'en';
  i18n.locale = supported;
  isRTL = computeIsRTL(supported);
  I18nManager.allowRTL(true);
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
  }
}

/** Persist and apply locale from AsyncStorage at startup (call once before first render). */
export async function initLocaleFromStorage(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_LANG);
    if (saved && saved in translations) {
      applyLocale(saved);
    }
  } catch {
    // ignore
  }
}

export function t(key: string, options?: object): string {
  return i18n.t(key, options);
}

export { i18n };
