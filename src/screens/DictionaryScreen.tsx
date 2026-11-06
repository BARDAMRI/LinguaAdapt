import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LangText, SpeakButton } from '../components/DisplayView';
import { ScreenHeader } from '../components/ScreenHeader';
import { Button, IconBadge } from '../components/ui';
import { useAppTheme } from '../context/PreferencesContext';
import { ensureDictionary, usePackState, type DictEntry } from '../content/packs';
import { getItem } from '../content/registry';
import type { Word } from '../content/types';
import type { AppNav } from '../navigation/types';
import { useProgress } from '../progress/ProgressContext';
import { isRTL, t } from '../services/i18n';
import { hasHebrew, stripNiqqud, unfinal } from '../utils/hebrew';
import { cardShadowStyle, rowDir, textStart } from '../utils/platformStyles';

function normHe(s: string): string {
  return unfinal(stripNiqqud(s)).replace(/[\s־'׳"״]/g, '');
}

/** Search both ways: Hebrew by spelling (with or without niqqud), English by meaning. */
function search(dict: DictEntry[], q: string): DictEntry[] {
  const query = q.trim();
  if (!query) return [];
  const out: { e: DictEntry; score: number }[] = [];
  if (hasHebrew(query)) {
    const nq = normHe(query);
    for (const e of dict) {
      const h = normHe(e.he);
      let score = -1;
      if (h === nq) score = 0;
      else if (h.startsWith(nq)) score = 1;
      else if (h.includes(nq)) score = 3;
      if (score >= 0) out.push({ e, score });
    }
  } else {
    const nq = query.toLowerCase();
    const word = new RegExp(`(^|[^a-z])${nq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    for (const e of dict) {
      const en = e.en.toLowerCase().replace(/^to /, '');
      let score = -1;
      if (en === nq || en.split(/,\s*/).includes(nq)) score = 0;
      else if (en.startsWith(nq)) score = 1;
      else if (word.test(e.en)) score = 2;
      else if (e.def?.some((d) => word.test(d)) || e.enAlt?.some((d) => word.test(d))) score = 4;
      if (score >= 0) out.push({ e, score });
    }
  }
  out.sort((a, b) => a.score - b.score || (b.e.freq ?? 0) - (a.e.freq ?? 0) || a.e.he.length - b.e.he.length);
  return out.slice(0, 60).map((x) => x.e);
}

export function WordRow({ w, onPress }: { w: Word; onPress: () => void }) {
  const theme = useAppTheme();
  const c = theme.colors;
  const { state } = useProgress();
  return (
    <View style={[styles.row, cardShadowStyle(theme), { borderColor: c.border, backgroundColor: c.surface, flexDirection: rowDir(isRTL) }]}>
      <SpeakButton speakable={{ text: w.heNiqqud || w.he, lang: 'he' }} size="sm" />
      <Pressable onPress={onPress} accessibilityRole="button" testID={`word_row_${w.id}`} style={({ pressed }) => [styles.rowMain, { flexDirection: rowDir(isRTL), opacity: pressed ? 0.6 : 1 }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={[styles.rowTop, { flexDirection: rowDir(isRTL) }]}>
            <LangText display={{ text: w.heNiqqud || w.he, plain: w.he, lang: 'he', size: 'normal' }} align={isRTL ? 'right' : 'left'} style={{ fontWeight: '700' }} />
            {w.emoji ? <Text style={styles.emoji}>{w.emoji}</Text> : null}
          </View>
          {w.translit && state.settings.showTranslit ? (
            <Text style={[styles.translit, { color: c.textSecondary }, textStart(isRTL)]}>{w.translit}</Text>
          ) : null}
          <Text style={[styles.meaning, { color: c.textSecondary }]} numberOfLines={2}>
            {w.en}
          </Text>
        </View>
        <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={c.textTertiary} />
      </Pressable>
    </View>
  );
}

export function DictionaryScreen() {
  const theme = useAppTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const pack = usePackState();
  const { course } = useProgress();
  const [dict, setDict] = useState<DictEntry[] | null>(null);
  const [q, setQ] = useState('');

  const load = () => {
    ensureDictionary()
      .then(setDict)
      .catch(() => {});
  };
  useEffect(load, []);

  const results = useMemo(() => (dict ? search(dict, q) : []), [dict, q]);
  const myWords = course.myWords.map((id) => getItem(id)).filter((x) => x?.kind === 'word').map((x) => x!.data as Word);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title={t('dictionary.title')} />
      <View style={styles.column}>
        <View style={[styles.searchBox, cardShadowStyle(theme), { borderColor: c.border, backgroundColor: c.surface, flexDirection: rowDir(isRTL) }]}>
          <Ionicons name="search" size={20} color={c.textSecondary} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('dictionary.placeholder')}
            placeholderTextColor={c.textSecondary}
            autoCorrect={false}
            autoCapitalize="none"
            style={[styles.input, { color: c.text, textAlign: hasHebrew(q) || (!q && isRTL) ? 'right' : 'left' }]}
            testID="dictionary_input"
          />
          {q ? <Ionicons name="close-circle" size={20} color={c.textSecondary} onPress={() => setQ('')} /> : null}
        </View>
        {pack.dictionary === 'loading' && !dict ? (
          <View style={styles.center}>
            <ActivityIndicator color={c.primary} />
            <Text style={{ color: c.textSecondary }}>{t('dictionary.downloading')}</Text>
          </View>
        ) : pack.dictionary === 'error' && !dict ? (
          <View style={styles.center}>
            <IconBadge icon="cloud-offline-outline" color={c.textSecondary} size={48} round />
            <Text style={{ color: c.textSecondary, textAlign: 'center' }}>{t('dictionary.offline')}</Text>
            {__DEV__ && pack.error ? <Text style={{ color: c.danger, fontSize: 12 }}>{pack.error}</Text> : null}
            <Button label={t('common.retry')} onPress={load} />
          </View>
        ) : null}
      </View>
      {q.trim() ? (
        <FlatList
          data={results}
          keyExtractor={(e) => e.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          ListHeaderComponent={<Text style={[styles.count, { color: c.textSecondary }, textStart(isRTL)]}>{results.length ? t('dictionary.results', { count: results.length }) : t('dictionary.empty')}</Text>}
          renderItem={({ item }) => <WordRow w={item} onPress={() => navigation.navigate('WordDetail', { wordId: item.id })} />}
        />
      ) : (
        <FlatList
          data={myWords}
          keyExtractor={(e) => e.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          ListHeaderComponent={
            <View style={{ gap: 10, marginBottom: 6 }}>
              {dict ? <Text style={[styles.count, { color: c.textSecondary }, textStart(isRTL)]}>{t('dictionary.hint', { count: dict.length.toLocaleString() })}</Text> : null}
              <View style={[styles.sectionRow, { flexDirection: rowDir(isRTL) }]}>
                <Ionicons name="star" size={18} color={c.secondary} />
                <Text style={[styles.section, { color: c.text }, textStart(isRTL)]}>{t('dictionary.myWords')}</Text>
              </View>
              {myWords.length >= 3 ? (
                <Button
                  label={t('dictionary.practiceMyWords')}
                  icon="barbell"
                  onPress={() => navigation.navigate('Lesson', { mode: 'practice', itemIds: course.myWords, title: t('dictionary.myWords') })}
                />
              ) : (
                <Text style={[styles.count, { color: c.textSecondary }, textStart(isRTL)]}>{t('dictionary.noMyWords')}</Text>
              )}
            </View>
          }
          renderItem={({ item }) => <WordRow w={item} onPress={() => navigation.navigate('WordDetail', { wordId: item.id })} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 16, gap: 10 },
  searchBox: { alignItems: 'center', gap: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 17, paddingVertical: 13 },
  center: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  list: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 16, gap: 10, paddingTop: 12 },
  count: { fontSize: 13 },
  section: { fontSize: 17, fontWeight: '700' },
  sectionRow: { alignItems: 'center', gap: 8, marginTop: 4 },
  row: { alignItems: 'center', gap: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
  rowTop: { alignItems: 'center', gap: 8 },
  rowMain: { flex: 1, alignItems: 'center', gap: 10 },
  emoji: { fontSize: 20 },
  translit: { fontSize: 13, fontStyle: 'italic' },
  meaning: { fontSize: 15, textAlign: 'left', writingDirection: 'ltr', alignSelf: isRTL ? 'flex-end' : 'flex-start' },
});
