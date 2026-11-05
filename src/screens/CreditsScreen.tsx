import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/ui';
import { useAppTheme } from '../context/PreferencesContext';
import { CREDITS, OWN_CONTENT_NOTE, PRIVACY_TEXT } from '../content/legal';
import { getUiLanguage, isRTL, t } from '../services/i18n';
import { textStart } from '../utils/platformStyles';

export function CreditsScreen() {
  const theme = useAppTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const lang = getUiLanguage();
  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title={t('credits.title')} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.column}>
          <Text style={[styles.intro, { color: c.text }, textStart(isRTL)]}>{t('credits.intro')}</Text>
          {CREDITS.map((cr) => (
            <Card key={cr.name} style={{ gap: 6 }}>
              <Text style={[styles.name, { color: c.text }, textStart(isRTL)]}>{cr.name}</Text>
              <Text style={[styles.body, { color: c.textSecondary }, textStart(isRTL)]}>{cr.what[lang]}</Text>
              <Pressable onPress={() => void Linking.openURL(cr.url)}>
                <Text style={[styles.link, { color: c.primary }, textStart(isRTL)]}>{cr.url}</Text>
              </Pressable>
              <Pressable onPress={() => void Linking.openURL(cr.licenseUrl)}>
                <Text style={[styles.link, { color: c.primary }, textStart(isRTL)]}>{cr.license}</Text>
              </Pressable>
            </Card>
          ))}
          <Card>
            <Text style={[styles.body, { color: c.textSecondary }, textStart(isRTL)]}>{OWN_CONTENT_NOTE[lang]}</Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

export function PrivacyScreen() {
  const theme = useAppTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const lang = getUiLanguage();
  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title={t('privacy.title')} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.column}>
          {PRIVACY_TEXT[lang].map((p) => (
            <Text key={p} style={[styles.body, { color: c.text }, textStart(isRTL)]}>
              {p}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16 },
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 14 },
  intro: { fontSize: 16, lineHeight: 24 },
  name: { fontSize: 17, fontWeight: '800' },
  body: { fontSize: 15, lineHeight: 22 },
  link: { fontSize: 14, fontWeight: '600' },
});
