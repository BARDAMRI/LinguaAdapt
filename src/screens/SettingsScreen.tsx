import Ionicons from '@expo/vector-icons/Ionicons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import type { ReactNode } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useAppTheme, usePreferences } from '../context/PreferencesContext';
import { nativeOf, type PairId } from '../content/types';
import type { AppNav } from '../navigation/types';
import { useProgress } from '../progress/ProgressContext';
import { isRTL, t } from '../services/i18n';
import { rowDir, textStart } from '../utils/platformStyles';

function ask(title: string, body: string, ok: string, onOk: () => void, destructive = false) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${body}`)) onOk();
    return;
  }
  Alert.alert(title, body, [
    { text: t('common.cancel'), style: 'cancel' },
    { text: ok, style: destructive ? 'destructive' : 'default', onPress: onOk },
  ]);
}

export function SettingsScreen() {
  const theme = useAppTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const { isDark, setDarkMode, soundEnabled, setSoundEnabled, appLanguage, setAppLanguage } = usePreferences();
  const { state, updateSettings, setActivePair, resetProgress } = useProgress();
  const auth = useAuth();
  const s = state.settings;
  const pair = state.activePair ?? 'en-he';

  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.textSecondary }, textStart(isRTL)]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: c.surface, borderColor: c.border }]}>{children}</View>
    </View>
  );

  const Toggle = ({ label, hint, value, onChange, testID }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void; testID?: string }) => (
    <View style={[styles.row, { flexDirection: rowDir(isRTL), borderColor: c.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: c.text }, textStart(isRTL)]}>{label}</Text>
        {hint ? <Text style={[styles.rowHint, { color: c.textSecondary }, textStart(isRTL)]}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: c.primary, false: c.border }} testID={testID} />
    </View>
  );

  const Link = ({ label, hint, icon, onPress, danger, testID }: { label: string; hint?: string; icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void; danger?: boolean; testID?: string }) => (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { flexDirection: rowDir(isRTL), borderColor: c.border, opacity: pressed ? 0.7 : 1 }]} testID={testID}>
      <Ionicons name={icon} size={22} color={danger ? c.danger : c.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: danger ? c.danger : c.text }, textStart(isRTL)]}>{label}</Text>
        {hint ? <Text style={[styles.rowHint, { color: c.textSecondary }, textStart(isRTL)]}>{hint}</Text> : null}
      </View>
      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={c.textSecondary} />
    </Pressable>
  );

  const Segmented = <T extends string | number>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) => (
    <View style={[styles.row, { borderColor: c.border, flexDirection: 'column', alignItems: 'stretch' }]}>
      <Text style={[styles.rowLabel, { color: c.text }, textStart(isRTL)]}>{label}</Text>
      <View style={[styles.segment, { flexDirection: rowDir(isRTL) }]}>
        {options.map((o) => (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={[styles.segBtn, { borderColor: o.value === value ? c.primary : c.border, backgroundColor: o.value === value ? c.primarySoft : c.surface }]}
          >
            <Text style={[styles.segText, { color: o.value === value ? c.primary : c.text }]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const switchCourse = (next: PairId) => {
    if (next === pair) return;
    setActivePair(next);
    void setAppLanguage(nativeOf(next));
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title={t('settings.title')} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.column}>
          <Section title={t('settings.learning')}>
            <Segmented
              label={t('settings.course')}
              value={pair}
              onChange={switchCourse}
              options={[
                { value: 'en-he', label: 'English → עברית' },
                { value: 'he-en', label: 'עברית → English' },
              ]}
            />
            {pair === 'en-he' ? (
              <>
                <Toggle label={t('settings.niqqud')} hint={t('settings.niqqudHint')} value={s.showNiqqud} onChange={(v) => updateSettings({ showNiqqud: v })} testID="settings_toggle_niqqud" />
                <Toggle label={t('settings.translit')} hint={t('settings.translitHint')} value={s.showTranslit} onChange={(v) => updateSettings({ showTranslit: v })} />
              </>
            ) : null}
            <Toggle label={t('settings.autoplay')} value={s.autoPlayAudio} onChange={(v) => updateSettings({ autoPlayAudio: v })} />
            <Toggle label={t('settings.slowSpeech')} value={s.speechSpeed === 'slow'} onChange={(v) => updateSettings({ speechSpeed: v ? 'slow' : 'normal' })} />
            <Segmented
              label={t('settings.dailyGoal')}
              value={s.dailyGoalXp}
              onChange={(v) => updateSettings({ dailyGoalXp: v })}
              options={[10, 20, 30, 50].map((x) => ({ value: x, label: t('settings.dailyGoalValue', { xp: x }) }))}
            />
          </Section>

          <Section title={t('settings.app')}>
            <Segmented
              label={t('settings.appLanguage')}
              value={appLanguage === 'he' ? 'he' : 'en'}
              onChange={(v) => void setAppLanguage(v)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'he', label: 'עברית' },
              ]}
            />
            <Toggle label={t('settings.sound')} value={soundEnabled} onChange={setSoundEnabled} />
            <Toggle label={t('settings.dark')} value={isDark} onChange={setDarkMode} />
          </Section>

          {auth.available ? (
            <Section title={t('settings.account')}>
              {auth.user ? (
                <>
                  <View style={[styles.row, { borderColor: c.border }]}>
                    <Text style={[styles.rowHint, { color: c.textSecondary }, textStart(isRTL)]}>{t('settings.signedInAs', { email: auth.user.email ?? '' })}</Text>
                  </View>
                  <Link label={t('settings.signOut')} icon="log-out-outline" onPress={() => void auth.signOut()} />
                  <Link
                    label={t('settings.deleteAccount')}
                    icon="trash-outline"
                    danger
                    testID="settings_btn_delete_account"
                    onPress={() =>
                      ask(t('settings.deleteAccountTitle'), t('settings.deleteAccountBody'), t('settings.deleteAccount'), async () => {
                        const ok = await auth.deleteAccount();
                        if (!ok) Alert.alert(t('settings.deleteAccountError'));
                      }, true)
                    }
                  />
                </>
              ) : (
                <>
                  <View style={[styles.row, { borderColor: c.border }]}>
                    <Text style={[styles.rowHint, { color: c.textSecondary }, textStart(isRTL)]}>{t('settings.guest')}</Text>
                  </View>
                  <Link label={t('settings.signIn')} hint={t('settings.signInHint')} icon="person-circle-outline" onPress={() => navigation.navigate('Login')} testID="settings_btn_sign_in" />
                </>
              )}
            </Section>
          ) : null}

          <Section title={t('settings.about')}>
            <Link label={t('settings.credits')} icon="ribbon-outline" onPress={() => navigation.navigate('Credits')} testID="settings_btn_credits" />
            <Link label={t('settings.privacy')} icon="shield-checkmark-outline" onPress={() => navigation.navigate('Privacy')} />
            <Link
              label={t('settings.resetProgress')}
              icon="refresh-circle-outline"
              danger
              onPress={() =>
                ask(t('settings.resetTitle'), t('settings.resetBody'), t('settings.resetProgress'), () => {
                  resetProgress();
                  navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Onboarding' }] }));
                }, true)
              }
            />
            <View style={[styles.row, { borderColor: c.border }]}>
              <Text style={[styles.rowHint, { color: c.textSecondary }]}>{t('settings.version', { v: Constants.expoConfig?.version ?? '1.0.0' })}</Text>
            </View>
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16 },
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 18 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 4 },
  sectionBody: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  row: { alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  rowLabel: { fontSize: 16, fontWeight: '600' },
  rowHint: { fontSize: 13, marginTop: 2 },
  segment: { gap: 8, marginTop: 8, flexWrap: 'wrap' },
  segBtn: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  segText: { fontSize: 14, fontWeight: '700' },
});
