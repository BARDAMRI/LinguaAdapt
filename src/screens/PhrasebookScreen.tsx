import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LangText, SpeakButton } from '../components/DisplayView';
import { ScreenHeader } from '../components/ScreenHeader';
import { Button, Card, IconBadge, type IconName } from '../components/ui';
import { useAppTheme } from '../context/PreferencesContext';
import { ensurePhrases } from '../content/packs';
import type { AppNav } from '../navigation/types';
import { useProgress } from '../progress/ProgressContext';
import { getUiLanguage, isRTL, t } from '../services/i18n';
import { rowDir, textStart } from '../utils/platformStyles';

const SITUATION_ICON: Record<string, IconName> = {
  greetings: 'hand-left',
  introductions: 'people',
  courtesy: 'heart',
  learning: 'school',
  cafe: 'cafe',
  shopping: 'bag-handle',
  directions: 'compass',
  transport: 'bus',
  hotel: 'bed',
  health: 'medkit',
  emergency: 'alert-circle',
  phone: 'call',
  time: 'time',
  'small talk': 'chatbubbles',
  feelings: 'happy',
  home: 'home',
  work: 'briefcase',
};

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
          {situations.map((s, i) => {
            const list = phrases.filter((p) => p.situation === s.key);
            const expanded = open === s.key;
            return (
              <Card key={s.key} style={{ gap: 10, padding: 0, overflow: 'hidden' }}>
                <Pressable onPress={() => setOpen(expanded ? '' : s.key)} style={[styles.head, { flexDirection: rowDir(isRTL) }]} testID={`phrasebook_${s.key}`}>
                  <IconBadge icon={SITUATION_ICON[s.key] ?? 'chatbox-ellipses'} color={c.stage[i % 4]} />
                  <Text style={[styles.title, { color: c.text }, textStart(isRTL)]}>{ui === 'he' ? s.he : s.en}</Text>
                  <View style={[styles.countPill, { backgroundColor: c.surfaceElevated }]}>
                    <Text style={[styles.count, { color: c.textSecondary }]}>{list.length}</Text>
                  </View>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.textTertiary} />
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
                            {note ? (
                              <View style={[styles.noteRow, { flexDirection: rowDir(ui === 'he' && Boolean(p.noteHe)) }]}>
                                <Ionicons name="bulb-outline" size={14} color={c.secondary} style={{ marginTop: 2 }} />
                                <Text style={[styles.note, { color: c.textSecondary }, textStart(ui === 'he' && Boolean(p.noteHe))]}>{note}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                    <Button
                      label={t('phrasebook.practice')}
                      variant="secondary"
                      size="md"
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
  title: { flex: 1, fontSize: 17, fontWeight: '700' },
  countPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  count: { fontSize: 13, fontWeight: '700' },
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  phrase: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, paddingBottom: 4, gap: 12, alignItems: 'flex-start' },
  translit: { fontSize: 14, fontStyle: 'italic', textAlign: 'right' },
  enRow: { alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  en: { fontSize: 15, flexShrink: 1, textAlign: 'right' },
  noteRow: { gap: 6, alignItems: 'flex-start' },
  note: { fontSize: 13, lineHeight: 18, flexShrink: 1 },
});
