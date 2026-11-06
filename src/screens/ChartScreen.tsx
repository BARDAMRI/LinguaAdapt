import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppTheme } from '../context/PreferencesContext';
import { ENGLISH_LETTERS } from '../content/en/letters';
import { PHONICS_PATTERNS } from '../content/en/phonics';
import { HEBREW_FINAL_LETTERS, HEBREW_LETTERS } from '../content/he/letters';
import { NIQQUD_SIGNS, buildSyllable } from '../content/he/niqqud';
import { useProgress } from '../progress/ProgressContext';
import { t } from '../services/i18n';
import { speak, type SpeechLang } from '../services/tts';
import { tapHaptic } from '../utils/exerciseFeedback';
import { cardShadowStyle } from '../utils/platformStyles';
import { SegmentedControl } from '../components/ui';

type Cell = { key: string; big: string; small: string; say: string; lang: SpeechLang };

/** Reference chart of every letter, final form, vowel sign or spelling pattern. */
export function ChartScreen() {
  const theme = useAppTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const { state } = useProgress();
  const pair = state.activePair ?? 'en-he';
  const tabs =
    pair === 'en-he'
      ? (['letters', 'finals', 'vowels'] as const)
      : (['letters', 'patterns'] as const);
  const [tab, setTab] = useState<string>(tabs[0]);

  let cells: Cell[] = [];
  if (pair === 'en-he') {
    if (tab === 'letters') cells = HEBREW_LETTERS.map((l) => ({ key: l.id, big: l.char, small: `${l.nameEn} · ${l.soundShort}`, say: l.nameHe, lang: 'he' }));
    if (tab === 'finals') cells = HEBREW_FINAL_LETTERS.map((f) => ({ key: f.id, big: `${f.baseChar} ${f.char}`, small: f.nameEn, say: f.nameHe, lang: 'he' }));
    if (tab === 'vowels') cells = NIQQUD_SIGNS.map((s) => ({ key: s.id, big: s.key === 'chataf' ? 'אֲ' : buildSyllable('מ', s), small: `${s.nameEn} · ${s.sound || '—'}`, say: s.syllables[0], lang: 'he' }));
  } else {
    if (tab === 'letters') cells = ENGLISH_LETTERS.map((l) => ({ key: l.id, big: `${l.upper}${l.lower}`, small: l.nameHe, say: l.upper, lang: 'en' }));
    if (tab === 'patterns') cells = PHONICS_PATTERNS.map((p) => ({ key: p.id, big: p.pattern, small: `${p.words[0].en} · ${p.soundHe}`, say: p.words[0].en, lang: 'en' }));
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title={t('chart.title')} />
      <View style={styles.tabs}>
        <SegmentedControl options={tabs.map((k) => ({ value: k as string, label: t(`chart.${k}`), testID: `chart_tab_${k}` }))} value={tab} onChange={setTab} />
      </View>
      <Text style={[styles.hint, { color: c.textSecondary }]}>{t('chart.tapToHear')}</Text>
      <ScrollView contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 24, flexDirection: pair === 'en-he' && tab !== 'vowels' ? 'row-reverse' : 'row' }]}>
        {cells.map((cell) => (
          <Pressable
            key={cell.key}
            onPress={() => {
              tapHaptic();
              void speak(cell.say, cell.lang);
            }}
            style={({ pressed }) => [styles.cell, cardShadowStyle(theme), { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <Text style={[styles.big, { color: c.primary }]}>{cell.big}</Text>
            <Text style={[styles.small, { color: c.textSecondary }]} numberOfLines={2}>{cell.small}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { paddingHorizontal: 16, paddingBottom: 10, width: '100%', maxWidth: 520, alignSelf: 'center' },
  hint: { textAlign: 'center', fontSize: 13, marginBottom: 12 },
  grid: { flexWrap: 'wrap', gap: 12, paddingTop: 2, justifyContent: 'center', paddingHorizontal: 12, maxWidth: 700, alignSelf: 'center' },
  cell: { width: 100, minHeight: 110, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 6 },
  big: { fontSize: 40, lineHeight: 56, fontWeight: '600' },
  small: { fontSize: 11, textAlign: 'center', fontWeight: '600' },
});
