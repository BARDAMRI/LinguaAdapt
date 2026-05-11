import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import {
  ONBOARDING_LANGUAGE_CODES,
  type OnboardingLanguageCode,
} from '../constants/onboardingLanguages';
import type { AppNav } from '../navigation/types';
import { isRTL, t } from '../services/i18n';
import {
  fetchProfile,
  addCourse,
  switchCourse,
  deletePausedCourse,
  deleteActiveCourse,
  deleteAccount,
  type ProfileRow,
  type StoredCourse,
} from '../services/profileService';

const SUPPORTED_UI_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'he', label: 'עברית' },
] as const;

function langName(code: string): string {
  const key = code as OnboardingLanguageCode;
  return t(`onboarding.languages.${key}`) ?? code.toUpperCase();
}

/** Alert.alert callbacks are unreliable on web — use window.confirm instead. */
function confirmDestructive(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    if (window.confirm(text)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: t('auth.switchLogin'), style: 'cancel' },
      { text: t('settings.deleteCourse'), style: 'destructive', onPress: onConfirm },
    ]);
  }
}

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const { user, signOut } = useAuth();
  const {
    theme,
    isDark,
    setDarkMode,
    soundEnabled,
    setSoundEnabled,
    appLanguage,
    setAppLanguage,
  } = usePreferences();
  const c = theme.colors;

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [courseOp, setCourseOp] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [addTarget, setAddTarget] = useState<OnboardingLanguageCode>('he');
  const [addingCourse, setAddingCourse] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      setLoadingProfile(true);
      void fetchProfile(user.id).then((p) => {
        setProfile(p);
        setLoadingProfile(false);
      });
    }, [user?.id]),
  );

  const styles = useMemo(() => makeStyles(theme, insets), [theme, insets]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Welcome');
    }
  }, [navigation]);

  const handleSwitchCourse = useCallback(
    async (idx: number) => {
      if (!user?.id) return;
      setCourseOp(`switch-${idx}`);
      const { error } = await switchCourse(user.id, idx);
      setCourseOp(null);
      if (error) { Alert.alert('Error', error); return; }
      const updated = await fetchProfile(user.id);
      setProfile(updated);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: (updated?.current_level ?? 0) === 0 ? 'PlacementTest' : 'Welcome' }],
        }),
      );
    },
    [navigation, user?.id],
  );

  const handleDeleteActiveCourse = useCallback(() => {
    if (!user?.id) return;
    confirmDestructive(t('settings.confirmDeleteCourse'), '', async () => {
      setCourseOp('delete-active');
      const { error, hasNewActive } = await deleteActiveCourse(user.id!);
      setCourseOp(null);
      if (error) { Alert.alert('Error', error); return; }
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: hasNewActive ? 'Welcome' : 'Onboarding' }],
        }),
      );
    });
  }, [navigation, user?.id]);

  const handleDeleteCourse = useCallback(
    (idx: number) => {
      if (!user?.id) return;
      confirmDestructive(t('settings.confirmDeleteCourse'), '', async () => {
        setCourseOp(`delete-${idx}`);
        const { error } = await deletePausedCourse(user.id!, idx);
        setCourseOp(null);
        if (error) { Alert.alert('Error', error); return; }
        const updated = await fetchProfile(user.id!);
        setProfile(updated);
      });
    },
    [user?.id],
  );

  const handleAddCourse = useCallback(async () => {
    if (!user?.id) return;
    const nativeLang = (profile?.native_language ?? appLanguage) as OnboardingLanguageCode;
    if (nativeLang === addTarget) {
      Alert.alert('Please choose a different target language');
      return;
    }
    setAddingCourse(true);
    const { error } = await addCourse(user.id, nativeLang, addTarget);
    setAddingCourse(false);
    if (error === 'course_exists') {
      Alert.alert(t('settings.courseExistsTitle'), t('settings.courseExistsBody'));
      return;
    }
    if (error) { Alert.alert('Error', error); return; }
    setShowAddForm(false);
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'PlacementTest' }] }),
    );
  }, [addTarget, appLanguage, navigation, profile?.native_language, user?.id]);

  const handleDeleteAccount = useCallback(() => {
    confirmDestructive(
      t('settings.deleteAccountConfirmTitle'),
      t('settings.deleteAccountConfirmBody'),
      async () => {
        setDeletingAccount(true);
        const { error } = await deleteAccount(user?.id ?? '');
        if (error) {
          setDeletingAccount(false);
          Alert.alert('Error', t('settings.deleteAccountError'));
          return;
        }
        await signOut();
        setDeletingAccount(false);
      },
    );
  }, [signOut]);

  const activeCourse: StoredCourse | null = profile
    ? {
        native: profile.native_language ?? 'en',
        target: profile.target_language ?? 'he',
        skills: profile.skills,
        currentLevel: profile.current_level,
      }
    : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="settings_root">
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header} testID="settings_header">
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={16} testID="settings_btn_back">
          <Text style={[styles.backArrow, { color: c.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]} testID="settings_text_title">
          {t('settings.title')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + theme.spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        testID="settings_scroll"
      >
        {/* ── Preferences ──────────────────────────────────── */}
        <Text style={styles.sectionLabel} testID="settings_label_preferences">Preferences</Text>
        <View style={styles.card} testID="settings_card_preferences">
          <View style={styles.row} testID="settings_row_sound">
            <View style={styles.rowLeft}>
              <Text style={styles.rowText}>🔔</Text>
              <View>
                <Text style={[styles.rowLabel, { color: c.text }]}>{t('settings.sound')}</Text>
                <Text style={[styles.rowHint, { color: c.textSecondary }]}>{t('settings.soundHint')}</Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={c.surface}
              testID="settings_toggle_sound"
            />
          </View>
          <View style={[styles.row, styles.rowNoBorder]} testID="settings_row_dark">
            <View style={styles.rowLeft}>
              <Text style={styles.rowText}>🌙</Text>
              <View>
                <Text style={[styles.rowLabel, { color: c.text }]}>{t('settings.dark')}</Text>
                <Text style={[styles.rowHint, { color: c.textSecondary }]}>{t('settings.darkHint')}</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={setDarkMode}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={c.surface}
              testID="settings_toggle_dark"
            />
          </View>
        </View>

        {/* ── App Language ─────────────────────────────────── */}
        <Text style={styles.sectionLabel} testID="settings_label_language">{t('settings.appLanguage')}</Text>
        <View style={styles.card} testID="settings_card_language">
          <Text style={[styles.cardHint, { color: c.textSecondary }]}>
            {t('settings.appLanguageHint')}
          </Text>
          <View style={styles.chipRow} testID="settings_row_language_chips">
            {SUPPORTED_UI_LANGUAGES.map(({ code, label }) => {
              const active = appLanguage === code;
              return (
                <Pressable
                  key={code}
                  onPress={() => void (appLanguage !== code && setAppLanguage(code))}
                  style={[
                    styles.chip,
                    active
                      ? { backgroundColor: c.primary, borderColor: c.primary }
                      : { backgroundColor: c.surfaceElevated, borderColor: c.border },
                  ]}
                  testID={`settings_chip_lang_${code}`}
                >
                  <Text style={[styles.chipLabel, { color: active ? c.onPrimary : c.textSecondary }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Learning Courses ─────────────────────────────── */}
        <Text style={styles.sectionLabel} testID="settings_label_courses">{t('settings.courses')}</Text>

        {loadingProfile ? (
          <ActivityIndicator color={c.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.card} testID="settings_card_courses">
            {/* Active course */}
            {activeCourse ? (
              <View style={[styles.courseRow, { backgroundColor: c.surfaceElevated }, styles.rowNoBorder]} testID="settings_course_active">
                <View style={styles.courseRowInner}>
                  <View style={styles.courseInfo}>
                    <Text style={[styles.courseName, { color: c.text }]} testID="settings_text_active_course_name">
                      {langName(activeCourse.native)} → {langName(activeCourse.target)}
                    </Text>
                    <Text style={[styles.courseLevel, { color: c.textSecondary }]} testID="settings_text_active_course_level">
                      Level {activeCourse.currentLevel}
                    </Text>
                  </View>
                  <View style={styles.courseActions}>
                    <View style={[styles.activePill, { backgroundColor: c.primary }]} testID="settings_badge_active_course">
                      <Text style={[styles.activePillText, { color: c.onPrimary }]}>
                        {t('settings.activeCourse')}
                      </Text>
                    </View>
                    <Pressable
                      style={[styles.actionBtn, { borderColor: c.danger }]}
                      onPress={handleDeleteActiveCourse}
                      disabled={courseOp !== null}
                      testID="settings_btn_delete_active"
                    >
                      {courseOp === 'delete-active' ? (
                        <ActivityIndicator size="small" color={c.danger} />
                      ) : (
                        <Text style={[styles.actionBtnText, { color: c.danger }]}>
                          {t('settings.deleteCourse')}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Divider */}
            {(profile?.other_courses ?? []).length > 0 && activeCourse ? (
              <View style={[styles.divider, { backgroundColor: c.border }]} />
            ) : null}

            {/* Paused courses */}
            {(profile?.other_courses ?? []).map((course, idx) => (
              <View key={`${course.native}-${course.target}-${idx}`} testID={`settings_course_paused_${idx}`}>
                <View style={styles.courseRow}>
                  <View style={styles.courseRowInner}>
                    <View style={styles.courseInfo}>
                      <Text style={[styles.courseName, { color: c.text }]}>
                        {langName(course.native)} → {langName(course.target)}
                      </Text>
                      <Text style={[styles.courseLevel, { color: c.textSecondary }]}>
                        Level {course.currentLevel}
                      </Text>
                    </View>
                    <View style={styles.courseActions}>
                      <Pressable
                        style={[styles.actionBtn, { borderColor: c.primary }]}
                        onPress={() => void handleSwitchCourse(idx)}
                        disabled={courseOp !== null}
                        testID={`settings_btn_switch_${idx}`}
                      >
                        {courseOp === `switch-${idx}` ? (
                          <ActivityIndicator size="small" color={c.primary} />
                        ) : (
                          <Text style={[styles.actionBtnText, { color: c.primary }]}>
                            {t('settings.switchCourse')}
                          </Text>
                        )}
                      </Pressable>
                      <Pressable
                        style={[styles.actionBtn, { borderColor: c.danger }]}
                        onPress={() => handleDeleteCourse(idx)}
                        disabled={courseOp !== null}
                        testID={`settings_btn_delete_${idx}`}
                      >
                        {courseOp === `delete-${idx}` ? (
                          <ActivityIndicator size="small" color={c.danger} />
                        ) : (
                          <Text style={[styles.actionBtnText, { color: c.danger }]}>
                            {t('settings.deleteCourse')}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                </View>
                {idx < (profile?.other_courses ?? []).length - 1 && (
                  <View style={[styles.divider, { backgroundColor: c.border }]} />
                )}
              </View>
            ))}

            {/* Add course button */}
            {!showAddForm ? (
              <>
                {((profile?.other_courses ?? []).length > 0 || activeCourse) && (
                  <View style={[styles.divider, { backgroundColor: c.border }]} />
                )}
                <Pressable
                  style={styles.addBtn}
                  onPress={() => setShowAddForm(true)}
                  testID="settings_btn_add_course"
                >
                  <Text style={[styles.addBtnIcon, { color: c.primary }]}>＋</Text>
                  <Text style={[styles.addBtnLabel, { color: c.primary }]}>
                    {t('settings.addCourse')}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={[styles.divider, { backgroundColor: c.border }]} />
                <View style={styles.addForm} testID="settings_form_add_course">
                  <Text style={[styles.addFormTitle, { color: c.text }]}>
                    {t('settings.addCourseTitle')}
                  </Text>
                  <Text style={[styles.addFormHint, { color: c.textSecondary }]}>
                    {t('onboarding.targetQuestion')}
                  </Text>
                  <View style={styles.chipRow} testID="settings_row_add_course_chips">
                    {ONBOARDING_LANGUAGE_CODES
                      .filter((code) => code !== ((profile?.native_language ?? appLanguage) as OnboardingLanguageCode))
                      .map((code) => {
                        const active = addTarget === code;
                        return (
                          <Pressable
                            key={code}
                            onPress={() => setAddTarget(code)}
                            style={[
                              styles.chip,
                              active
                                ? { backgroundColor: c.primary, borderColor: c.primary }
                                : { backgroundColor: c.surfaceElevated, borderColor: c.border },
                            ]}
                            testID={`settings_chip_target_${code}`}
                          >
                            <Text style={[styles.chipLabel, { color: active ? c.onPrimary : c.textSecondary }]}>
                              {langName(code)}
                            </Text>
                          </Pressable>
                        );
                      })}
                  </View>
                  <View style={styles.addFormActions}>
                    <Pressable
                      style={[styles.cancelBtn, { borderColor: c.border }]}
                      onPress={() => setShowAddForm(false)}
                      testID="settings_btn_cancel_add"
                    >
                      <Text style={[styles.cancelBtnText, { color: c.textSecondary }]}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.saveBtn,
                        { backgroundColor: addingCourse ? c.primaryMuted : c.primary },
                      ]}
                      onPress={() => void handleAddCourse()}
                      disabled={addingCourse}
                      testID="settings_btn_save_add"
                    >
                      {addingCourse ? (
                        <ActivityIndicator color={c.onPrimary} size="small" />
                      ) : (
                        <Text style={[styles.saveBtnText, { color: c.onPrimary }]}>
                          {t('onboarding.continue')}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </View>
        )}
        {/* ── Danger zone ──────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: c.danger }]} testID="settings_label_danger">
          {t('settings.deleteAccount')}
        </Text>
        <View style={[styles.card, { borderColor: c.danger }]} testID="settings_card_danger">
          <Pressable
            style={[styles.dangerBtn, deletingAccount && styles.dangerBtnDisabled]}
            onPress={handleDeleteAccount}
            disabled={deletingAccount}
            testID="settings_btn_delete_account"
          >
            {deletingAccount ? (
              <ActivityIndicator color={c.danger} size="small" />
            ) : (
              <Text style={[styles.dangerBtnText, { color: c.danger }]}>
                {t('settings.deleteAccount')}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(
  theme: ReturnType<typeof import('../context/PreferencesContext').useAppTheme>,
  insets: { bottom: number; top: number },
) {
  const c = theme.colors;
  const rtl = isRTL;
  const dir = rtl ? ('row-reverse' as const) : ('row' as const);

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },

    // Header
    header: {
      flexDirection: dir,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    backBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backArrow: {
      fontSize: 34,
      fontWeight: '300',
      lineHeight: 38,
      marginTop: -4,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.2,
      textAlign: 'center',
    },

    // Body
    body: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      gap: 0,
    },

    // Section label
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: c.textSecondary,
      marginTop: theme.spacing.lg,
      marginBottom: 8,
      marginHorizontal: 4,
      textAlign: rtl ? 'right' : 'left',
    },

    // Card
    card: {
      backgroundColor: c.surface,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 10,
      elevation: 2,
    },

    // Toggle rows
    row: {
      flexDirection: dir,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: theme.spacing.sm,
    },
    rowNoBorder: { borderBottomWidth: 0 },
    rowLeft: {
      flexDirection: dir,
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    rowText: { fontSize: 20 },
    rowLabel: { fontSize: 16, fontWeight: '600' },
    rowHint: { fontSize: 13, marginTop: 1 },

    // Card hint
    cardHint: {
      fontSize: 13,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: 4,
      textAlign: rtl ? 'right' : 'left',
    },

    // Chips
    chipRow: {
      flexDirection: dir,
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: theme.radii.full,
      borderWidth: 1.5,
    },
    chipLabel: {
      fontSize: 14,
      fontWeight: '600',
    },

    // Divider
    divider: { height: 1 },

    // Courses
    courseRow: {
      paddingVertical: 14,
      paddingHorizontal: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    courseRowInner: {
      flexDirection: dir,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    courseInfo: { flex: 1 },
    courseName: {
      fontSize: 15,
      fontWeight: '600',
      textAlign: rtl ? 'right' : 'left',
    },
    courseLevel: {
      fontSize: 12,
      marginTop: 2,
      textAlign: rtl ? 'right' : 'left',
    },
    activePill: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: theme.radii.full,
    },
    activePillText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    courseActions: {
      flexDirection: dir,
      gap: 6,
    },
    actionBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      minWidth: 56,
      alignItems: 'center',
    },
    actionBtnText: {
      fontSize: 12,
      fontWeight: '600',
    },

    // Add course button
    addBtn: {
      flexDirection: dir,
      alignItems: 'center',
      gap: 6,
      paddingVertical: 14,
      paddingHorizontal: theme.spacing.lg,
      justifyContent: rtl ? 'flex-end' : 'flex-start',
    },
    addBtnIcon: { fontSize: 18, fontWeight: '700', lineHeight: 20 },
    addBtnLabel: { fontSize: 15, fontWeight: '600' },

    // Add form
    addForm: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      gap: 4,
    },
    addFormTitle: {
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: rtl ? 'right' : 'left',
    },
    addFormHint: {
      fontSize: 13,
      marginBottom: 4,
      textAlign: rtl ? 'right' : 'left',
    },
    addFormActions: {
      flexDirection: dir,
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    cancelBtn: {
      borderWidth: 1,
      borderRadius: theme.radii.md,
      paddingVertical: 12,
      paddingHorizontal: theme.spacing.lg,
      alignItems: 'center',
    },
    cancelBtnText: { fontSize: 15, fontWeight: '600' },
    saveBtn: {
      flex: 1,
      borderRadius: theme.radii.md,
      paddingVertical: 12,
      alignItems: 'center',
    },
    saveBtnText: { fontSize: 15, fontWeight: '700' },

    // Danger zone
    dangerBtn: {
      paddingVertical: 14,
      paddingHorizontal: theme.spacing.lg,
      alignItems: 'center',
    },
    dangerBtnDisabled: { opacity: 0.5 },
    dangerBtnText: {
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
