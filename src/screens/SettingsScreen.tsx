import Ionicons from '@expo/vector-icons/Ionicons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import type { ReactNode } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { IconBadge, SegmentedControl, type IconName } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAppTheme, usePreferences } from '../context/PreferencesContext';
import { nativeOf, type PairId } from '../content/types';
import type { AppNav } from '../navigation/types';
import { useProgress } from '../progress/ProgressContext';
import { isRTL, t } from '../services/i18n';
import { cardShadowStyle, rowDir, textStart } from '../utils/platformStyles';

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
      <View style={[styles.sectionBody, cardShadowStyle(theme), { backgroundColor: c.surface, borderColor: c.border }]}>{children}</View>
    </View>
  );

  const Toggle = ({ label, hint, value, onChange, testID, icon, color }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void; testID?: string; icon: IconName; color: string }) => (
    <View style={[styles.row, { flexDirection: rowDir(isRTL), borderColor: c.divider }]}>
      <IconBadge icon={icon} color={color} size={32} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: c.text }, textStart(isRTL)]}>{label}</Text>
        {hint ? <Text style={[styles.rowHint, { color: c.textSecondary }, textStart(isRTL)]}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: c.success, false: c.border }} testID={testID} />
    </View>
  );

  const Link = ({ label, hint, icon, color, onPress, danger, testID }: { label: string; hint?: string; icon: IconName; color?: string; onPress: () => void; danger?: boolean; testID?: string }) => (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { flexDirection: rowDir(isRTL), borderColor: c.divider, opacity: pressed ? 0.6 : 1 }]} testID={testID}>
      <IconBadge icon={icon} color={danger ? c.danger : (color ?? c.primary)} size={32} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: danger ? c.danger : c.text }, textStart(isRTL)]}>{label}</Text>
        {hint ? <Text style={[styles.rowHint, { color: c.textSecondary }, textStart(isRTL)]}>{hint}</Text> : null}
      </View>
      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={c.textTertiary} />
    </Pressable>
  );

  const Segmented = <T extends string | number>({ label, options, value, onChange, icon, color }: { label: string; options: { value: T; label: string; testID?: string }[]; value: T; onChange: (v: T) => void; icon: IconName; color: string }) => (
    <View style={[styles.row, { borderColor: c.divider, flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
      <View style={[styles.segHead, { flexDirection: rowDir(isRTL) }]}>
        <IconBadge icon={icon} color={color} size={32} />
        <Text style={[styles.rowLabel, { color: c.text, flex: 1 }, textStart(isRTL)]}>{label}</Text>
      </View>
      <SegmentedControl options={options} value={value} onChange={onChange} />
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
              icon="school"
              color={c.stage[0]}
              label={t('settings.course')}
              value={pair}
              onChange={switchCourse}
              options={[
                { value: 'en-he', label: 'Learn Hebrew', testID: 'settings_course_en-he' },
                { value: 'he-en', label: 'ללמוד אנגלית', testID: 'settings_course_he-en' },
              ]}
            />
            {pair === 'en-he' ? (
              <>
                <Toggle icon="text" color={c.stage[1]} label={t('settings.niqqud')} hint={t('settings.niqqudHint')} value={s.showNiqqud} onChange={(v) => updateSettings({ showNiqqud: v })} testID="settings_toggle_niqqud" />
                <Toggle icon="language" color={c.stage[2]} label={t('settings.translit')} hint={t('settings.translitHint')} value={s.showTranslit} onChange={(v) => updateSettings({ showTranslit: v })} />
              </>
            ) : null}
            <Toggle icon="volume-high" color={c.primary} label={t('settings.autoplay')} value={s.autoPlayAudio} onChange={(v) => updateSettings({ autoPlayAudio: v })} />
            <Toggle icon="speedometer" color={c.stage[1]} label={t('settings.slowSpeech')} value={s.speechSpeed === 'slow'} onChange={(v) => updateSettings({ speechSpeed: v ? 'slow' : 'normal' })} />
            <Segmented
              icon="flag"
              color={c.secondary}
              label={t('settings.dailyGoal')}
              value={s.dailyGoalXp}
              onChange={(v) => updateSettings({ dailyGoalXp: v })}
              options={[10, 20, 30, 50].map((x) => ({ value: x, label: t('settings.dailyGoalValue', { xp: x }) }))}
            />
          </Section>

          <Section title={t('settings.app')}>
            <Segmented
              icon="globe"
              color={c.stage[2]}
              label={t('settings.appLanguage')}
              value={appLanguage === 'he' ? 'he' : 'en'}
              onChange={(v) => void setAppLanguage(v)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'he', label: 'עברית' },
              ]}
            />
            <Toggle icon="musical-notes" color={c.stage[3]} label={t('settings.sound')} value={soundEnabled} onChange={setSoundEnabled} />
            <Toggle icon="moon" color={c.primary} label={t('settings.dark')} value={isDark} onChange={setDarkMode} />
          </Section>

          {auth.available ? (
            <Section title={t('settings.account')}>
              {auth.user ? (
                <>
                  <View style={[styles.row, styles.first, { borderColor: c.divider, flexDirection: rowDir(isRTL) }]}>
                    <Text style={[styles.rowHint, { color: c.textSecondary, flex: 1 }, textStart(isRTL)]}>{t('settings.signedInAs', { email: auth.user.email ?? '' })}</Text>
                  </View>
                  <Link label={t('settings.signOut')} icon="log-out" onPress={() => void auth.signOut()} />
                  <Link
                    label={t('settings.deleteAccount')}
                    icon="trash"
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
                  <View style={[styles.row, styles.first, { borderColor: c.divider, flexDirection: rowDir(isRTL) }]}>
                    <Text style={[styles.rowHint, { color: c.textSecondary, flex: 1 }, textStart(isRTL)]}>{t('settings.guest')}</Text>
                  </View>
                  <Link label={t('settings.signIn')} hint={t('settings.signInHint')} icon="person-circle" onPress={() => navigation.navigate('Login')} testID="settings_btn_sign_in" />
                </>
              )}
            </Section>
          ) : null}

          <Section title={t('settings.about')}>
            <Link label={t('settings.credits')} icon="ribbon" color={c.secondary} onPress={() => navigation.navigate('Credits')} testID="settings_btn_credits" />
            <Link label={t('settings.privacy')} icon="shield-checkmark" color={c.success} testID="settings_btn_privacy" onPress={() => navigation.navigate('Privacy')} />
            <Link
              label={t('settings.resetProgress')}
              icon="refresh"
              danger
              testID="settings_btn_reset"
              onPress={() =>
                ask(t('settings.resetTitle'), t('settings.resetBody'), t('settings.resetProgress'), () => {
                  resetProgress();
                  navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Onboarding' }] }));
                }, true)
              }
            />
            <View style={[styles.row, { borderColor: c.divider, justifyContent: 'center' }]}>
              <Text style={[styles.rowHint, { color: c.textTertiary }]}>{t('settings.version', { v: Constants.expoConfig?.version ?? '1.0.0' })}</Text>
            </View>
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 4 },
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 22 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: 6 },
  sectionBody: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, overflow: 'hidden' },
  row: { alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  first: { borderTopWidth: 0 },
  segHead: { alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 16, fontWeight: '500' },
  rowHint: { fontSize: 13, lineHeight: 18, marginTop: 2 },
});
