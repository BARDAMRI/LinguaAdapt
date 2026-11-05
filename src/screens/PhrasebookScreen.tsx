import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LangText, SpeakButton } from '../components/DisplayView';
import { ScreenHeader } from '../components/ScreenHeader';
import { Button, Card } from '../components/ui';
import { useAppTheme } from '../context/PreferencesContext';
import { ensurePhrases } from '../content/packs';
import type { AppNav } from '../navigation/types';
import { useProgress } from '../progress/ProgressContext';
import { getUiLanguage, isRTL, t } from '../services/i18n';
import { rowDir, textStart } from '../utils/platformStyles';

/** Everyday phrases by situation, with audio and a practice button per situation. */
export function PhrasebookScreen() {
  const theme = useAppTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const { state } = useProgress();
  const { situations, phrases } = useMemo(() => ensurePhrases(), []);
  const [open, setOpen] = useState<string>(situations[0]?.key ?? '');
  const ui = getUiLanguage();
  const learnerSpeaksHebrew = state.activePair === 'he-en';

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title={t('phrasebook.title')} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.column}>
          <Text style={[styles.sub, { color: c.textSecondary }, textStart(isRTL)]}>{t('phrasebook.subtitle')}</Text>
          {situations.map((s) => {
            const list = phrases.filter((p) => p.situation === s.key);
            const expanded = open === s.key;
            return (
              <Card key={s.key} style={{ gap: 10, padding: 0, overflow: 'hidden' }}>
                <Pressable onPress={() => setOpen(expanded ? '' : s.key)} style={[styles.head, { flexDirection: rowDir(isRTL) }]} testID={`phrasebook_${s.key}`}>
                  <Text style={styles.emoji}>{s.emoji}</Text>
                  <Text style={[styles.title, { color: c.text }, textStart(isRTL)]}>{ui === 'he' ? s.he : s.en}</Text>
                  <Text style={[styles.count, { color: c.textSecondary }]}>{list.length}</Text>
                </Pressable>
                {expanded ? (
                  <View style={styles.body}>
                    {list.map((p) => {
                      const note = ui === 'he' ? p.noteHe || p.noteEn : p.noteEn;
                      return (
                        <View key={p.id} style={[styles.phrase, { borderColor: c.border, flexDirection: rowDir(isRTL) }]}>
                          <SpeakButton speakable={{ text: p.heNiqqud || p.he, lang: 'he' }} size="sm" />
                          <View style={{ flex: 1, gap: 2 }}>
                            <LangText display={{ text: p.heNiqqud || p.he, plain: p.he, lang: 'he' }} align="right" style={{ fontWeight: '700' }} />
                            {state.settings.showTranslit || learnerSpeaksHebrew ? (
                              <Text style={[styles.translit, { color: c.textSecondary }]}>{p.translit}</Text>
                            ) : null}
                            <View style={[styles.enRow, { flexDirection: rowDir(isRTL) }]}>
                              <Text style={[styles.en, { color: c.text }]}>{p.en}</Text>
                              {learnerSpeaksHebrew ? <SpeakButton speakable={{ text: p.en, lang: 'en' }} size="sm" /> : null}
                            </View>
                            {note ? <Text style={[styles.note, { color: c.textSecondary }, textStart(ui === 'he' && Boolean(p.noteHe))]}>💡 {note}</Text> : null}
                          </View>
                        </View>
                      );
                    })}
                    <Button
                      label={t('phrasebook.practice')}
                      icon="barbell"
                      onPress={() => navigation.navigate('Lesson', { mode: 'practice', itemIds: list.map((p) => p.id), title: ui === 'he' ? s.he : s.en })}
                    />
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16 },
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 12 },
  sub: { fontSize: 14 },
  head: { alignItems: 'center', gap: 12, padding: 14 },
  emoji: { fontSize: 26 },
  title: { flex: 1, fontSize: 17, fontWeight: '800' },
  count: { fontSize: 14, fontWeight: '700' },
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  phrase: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 10, alignItems: 'flex-start' },
  translit: { fontSize: 14, fontStyle: 'italic', textAlign: 'right' },
  enRow: { alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  en: { fontSize: 15, flexShrink: 1, textAlign: 'right' },
  note: { fontSize: 13 },
});
