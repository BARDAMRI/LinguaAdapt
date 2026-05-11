import type { LetterData } from '../../types/learning';
import { HE_ALPHABET } from '../data/heAlphabetData';
import { EN_ALPHABET } from '../data/enAlphabetData';
import { AR_ALPHABET } from '../data/arAlphabetData';
import { ES_ALPHABET } from '../data/esAlphabetData';
import { FR_ALPHABET } from '../data/frAlphabetData';
import { RU_ALPHABET } from '../data/ruAlphabetData';
import { DE_ALPHABET } from '../data/deAlphabetData';

// Populated by remoteContentService after DB fetch
const _dbCache = new Map<string, LetterData[]>();

/** Called by remoteContentService once DB alphabet data is fetched. */
export function setRemoteAlphabet(lang: string, letters: LetterData[]): void {
  _dbCache.set(lang.trim().toLowerCase(), letters);
}

export function getAlphabetForLanguage(langCode: string): LetterData[] {
  const code = langCode.trim().toLowerCase();
  // Prefer DB data (may include new letters or new languages added without an app update)
  if (_dbCache.has(code)) return _dbCache.get(code)!;
  switch (code) {
    case 'he': return HE_ALPHABET;
    case 'en': return EN_ALPHABET;
    case 'ar': return AR_ALPHABET;
    case 'es': return ES_ALPHABET;
    case 'fr': return FR_ALPHABET;
    case 'ru': return RU_ALPHABET;
    case 'de': return DE_ALPHABET;
    default: return [];
  }
}

/**
 * Returns the letter's name in the given native language code.
 * Falls back to the Hebrew name (nameHe) for Hebrew, then the canonical English name.
 */
export function getLetterDisplayName(letter: LetterData, nativeCode: string): string {
  const code = nativeCode.trim().toLowerCase();
  if (letter.names?.[code]) return letter.names[code];
  if (code === 'he' && letter.nameHe) return letter.nameHe;
  return letter.name;
}

/**
 * BCP-47 language tag for TTS based on the letter's script language.
 */
export function getLetterSpeechLang(letter: LetterData): string {
  switch (letter.scriptLanguage) {
    case 'he': return 'he-IL';
    case 'ar': return 'ar-SA';
    case 'ru': return 'ru-RU';
    case 'es': return 'es-ES';
    case 'fr': return 'fr-FR';
    case 'de': return 'de-DE';
    case 'en':
    default:
      return 'en-US';
  }
}
