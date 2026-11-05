import { useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DisplayView, LangText, SpeakButton } from '../components/DisplayView';
import { ScreenHeader } from '../components/ScreenHeader';
import { Button, Card } from '../components/ui';
import { useAppTheme } from '../context/PreferencesContext';
import { ensureDictionary, type DictEntry } from '../content/packs';
import { getItem } from '../content/registry';
import type { Sentence, Word } from '../content/types';
import type { AppStackParamList } from '../navigation/types';
import { useProgress } from '../progress/ProgressContext';
import { isRTL, t } from '../services/i18n';
import { textStart } from '../utils/platformStyles';

export function WordDetailScreen() {
  const theme = useAppTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<AppStackParamList, 'WordDetail'>>();
  const { course, toggleMyWord, state } = useProgress();
  const [entry, setEntry] = useState<DictEntry | null>(() => {
    const it = getItem(params.wordId);
    return it?.kind === 'word' ? (it.data as DictEntry) : null;
  });

  useEffect(() => {
    // Course words may lack definitions and examples: take them from the dictionary.
    ensureDictionary()
      .then((d) => {
        const full = d.find((x) => x.id === params.wordId);
        if (full) setEntry((prev) => ({ ...full, ...(prev ?? {}), def: full.def, ex: full.ex }));
      })
      .catch(() => {});
  }, [params.wordId]);

  if (!entry) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <ScreenHeader title={t('dictionary.title')} />
      </View>
    );
  }

  const w: Word = entry;
  const saved = course.myWords.includes(w.id);
  const heText = w.heNiqqud || w.he;
  const examples = (entry.ex ?? [])
    .map((id) => getItem(id))
    .filter((x): x is { kind: 'sentence'; data: Sentence } => x?.kind === 'sentence')
    .map((x) => x.data);
  const rows: [string, string, 'he' | 'en'][] = [];
  if (w.pos) rows.push([t('dictionary.partOfSpeech'), t(`dictionary.pos.${w.pos}`), isRTL ? 'he' : 'en']);
  if (w.gender) rows.push([t('teach.genderLabel'), t(`teach.gender.${w.gender}`), isRTL ? 'he' : 'en']);
  if (w.plural) rows.push([t('teach.plural'), w.plural, 'he']);
  if (w.root) rows.push([t('teach.root'), w.root, 'he']);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title={w.he} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.column}>
          <Card style={styles.hero}>
            {w.emoji ? <Text style={styles.emoji}>{w.emoji}</Text> : null}
            <LangText display={{ text: heText, plain: w.he, lang: 'he', size: 'big' }} style={{ fontSize: 44, lineHeight: 64, color: c.primary }} />
            {w.translit && state.settings.showTranslit ? <Text style={[styles.translit, { color: c.textSecondary }]}>{w.translit}</Text> : null}
            <View style={styles.speakRow}>
              <SpeakButton speakable={{ text: heText, lang: 'he' }} size="lg" />
              <SpeakButton speakable={{ text: heText, lang: 'he' }} slow />
            </View>
            <View style={styles.speakRow}>
              <Text style={[styles.meaning, { color: c.text }]}>{w.en}</Text>
              {state.activePair === 'he-en' ? <SpeakButton speakable={{ text: w.en, lang: 'en' }} size="sm" /> : null}
            </View>
          </Card>

          {entry.def && entry.def.length > 0 ? (
            <Card style={{ gap: 6 }}>
              <Text style={[styles.label, { color: c.textSecondary }, textStart(isRTL)]}>{t('dictionary.meanings')}</Text>
              {entry.def.map((d, i) => (
                <Text key={`${i}-${d}`} style={[styles.def, { color: c.text }]}>
                  {i + 1}. {d}
                </Text>
              ))}
            </Card>
          ) : null}

          {rows.length > 0 ? (
            <Card style={{ gap: 10 }}>
              {rows.map(([label, value, lang]) => (
                <View key={label} style={{ gap: 2 }}>
                  <Text style={[styles.label, { color: c.textSecondary }, textStart(isRTL)]}>{label}</Text>
                  <LangText display={{ text: value, lang }} align={isRTL || lang === 'he' ? 'right' : 'left'} />
                </View>
              ))}
            </Card>
          ) : null}

          {examples.length > 0 ? (
            <Card style={{ gap: 12 }}>
              <Text style={[styles.label, { color: c.textSecondary }, textStart(isRTL)]}>{t('dictionary.examples')}</Text>
              {examples.map((s) => (
                <DisplayView
                  key={s.id}
                  align="right"
                  display={{ text: s.heNiqqud || s.he, plain: s.he, lang: 'he', note: s.en, noteLang: 'en', speak: { text: s.heNiqqud || s.he, lang: 'he' } }}
                />
              ))}
            </Card>
          ) : null}

          <Button
            label={saved ? t('dictionary.removeFromMyWords') : t('dictionary.addToMyWords')}
            icon={saved ? 'star' : 'star-outline'}
            variant={saved ? 'secondary' : 'primary'}
            onPress={() => toggleMyWord(w.id)}
            testID="word_btn_save"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16 },
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 14 },
  hero: { alignItems: 'center', gap: 6, paddingVertical: 20 },
  emoji: { fontSize: 52 },
  translit: { fontSize: 17, fontStyle: 'italic' },
  speakRow: { flexDirection: 'row', gap: 14, alignItems: 'center', marginVertical: 6 },
  meaning: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  label: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  def: { fontSize: 16, lineHeight: 23, textAlign: 'left', writingDirection: 'ltr' },
});
