import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { useAppTheme } from '../context/PreferencesContext';
import type { Display, Speakable } from '../engine/types';
import { useProgress } from '../progress/ProgressContext';
import { speak } from '../services/tts';
import { stripNiqqud } from '../utils/hebrew';

const SIZES = {
  glyph: { fontSize: 88, lineHeight: 120 },
  big: { fontSize: 32, lineHeight: 48 },
  normal: { fontSize: 19, lineHeight: 28 },
  small: { fontSize: 15, lineHeight: 22 },
} as const;

/** Text in Hebrew or English, honouring the niqqud setting and writing direction. */
export function LangText({
  display,
  style,
  align = 'center',
  numberOfLines,
}: {
  display: Display;
  style?: StyleProp<TextStyle>;
  align?: 'center' | 'left' | 'right';
  numberOfLines?: number;
}) {
  const theme = useAppTheme();
  const { state } = useProgress();
  const isHe = display.lang === 'he';
  const text = isHe && !state.settings.showNiqqud && !display.keepNiqqud ? (display.plain ?? stripNiqqud(display.text)) : display.text;
  const size = SIZES[display.size ?? 'normal'];
  // Vowel signs sit below the letters: give Hebrew a little more room.
  const lineHeight = isHe ? Math.round(size.lineHeight * 1.12) : size.lineHeight;
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontSize: size.fontSize,
          lineHeight,
          color: theme.colors.text,
          fontWeight: display.size === 'glyph' ? '600' : '500',
          textAlign: align,
          writingDirection: isHe ? 'rtl' : 'ltr',
        },
        style,
      ]}
    >
      {text}
    </Text>
  );
}

export function SpeakButton({
  speakable,
  size = 'md',
  slow,
  label,
}: {
  speakable: Speakable;
  size?: 'sm' | 'md' | 'lg';
  slow?: boolean;
  label?: string;
}) {
  const theme = useAppTheme();
  const dim = size === 'lg' ? 64 : size === 'md' ? 44 : 34;
  return (
    <Pressable
      onPress={() => void speak(speakable.text, speakable.lang, { slow })}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label ?? 'Play audio'}
      style={({ pressed }) => [
        styles.speakBtn,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: size === 'lg' ? theme.colors.primary : theme.colors.primarySoft,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Ionicons
        name={slow ? 'hourglass-outline' : 'volume-high'}
        size={size === 'lg' ? 30 : size === 'md' ? 22 : 17}
        color={size === 'lg' ? theme.colors.onPrimary : theme.colors.primary}
      />
    </Pressable>
  );
}

/** Plays `speakable` once when it changes, if autoplay is on. */
export function useAutoplay(speakable: Speakable | undefined | null): void {
  const { state } = useProgress();
  const auto = state.settings.autoPlayAudio;
  const text = speakable?.text;
  const lang = speakable?.lang;
  useEffect(() => {
    if (!auto || !text || !lang) return;
    const timer = setTimeout(() => void speak(text, lang), 250);
    return () => clearTimeout(timer);
  }, [auto, text, lang]);
}

/** A prompt or answer: emoji, text, transliteration, note and speaker. */
export function DisplayView({
  display,
  align = 'center',
  showSpeaker = true,
}: {
  display: Display;
  align?: 'center' | 'left' | 'right';
  showSpeaker?: boolean;
}) {
  const theme = useAppTheme();
  const { state } = useProgress();
  const alignItems = align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end';
  return (
    <View style={{ alignItems, gap: 2 }}>
      {display.emoji ? <Text style={styles.emoji}>{display.emoji}</Text> : null}
      <View style={[styles.textRow, { justifyContent: alignItems }]}>
        <View style={{ flexShrink: 1 }}>
          <LangText display={display} align={align} />
        </View>
        {showSpeaker && display.speak ? <SpeakButton speakable={display.speak} size="sm" /> : null}
      </View>
      {display.translit && state.settings.showTranslit ? (
        <Text style={[styles.translit, { color: theme.colors.textSecondary, textAlign: align }]}>{display.translit}</Text>
      ) : null}
      {display.note ? (
        <LangText
          display={{ text: display.note, lang: display.noteLang ?? 'en', size: 'small' }}
          align={align}
          style={{ color: theme.colors.textSecondary }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  speakBtn: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 44, lineHeight: 56 },
  textRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  translit: { fontSize: 15, fontStyle: 'italic' },
});
