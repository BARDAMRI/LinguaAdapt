import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/PreferencesContext';
import type { AppNav } from '../navigation/types';
import {
  DEFAULT_SKILLS,
  type ProfileRow,
  type SkillKey,
  fetchProfile,
} from '../services/profileService';
import { isRTL, t } from '../services/i18n';
import type { AppTheme } from '../theme/theme';
import { layoutDirectionStyle } from '../utils/platformStyles';

const SKILL_ORDER: SkillKey[] = [
  'alphabet',
  'vocabulary',
  'sentences',
  'conversation',
];

function skillLabel(key: SkillKey): string {
  switch (key) {
    case 'alphabet':
      return t('profile.skillAlphabet');
    case 'vocabulary':
      return t('profile.skillVocabulary');
    case 'sentences':
      return t('profile.skillSentences');
    case 'conversation':
      return t('profile.skillConversation');
  }
}

const SKILL_ICONS: Record<string, string> = {
  alphabet: '🔤',
  vocabulary: '📖',
  sentences: '✍️',
  conversation: '💬',
};

function createProfileStyles(theme: AppTheme) {
  const c = theme.colors;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    toolbar: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
      gap: theme.spacing.sm,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnText: { fontSize: 17 },
    toolbarLink: { fontSize: 16, fontWeight: '600', color: c.primary },
    toolbarAction: { fontSize: 16, fontWeight: '600', color: c.secondary },
    toolbarMid: { flex: 1, alignItems: 'center' },
    toolbarRight: {
      flexDirection: 'row' as const,
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    logoutPress: { minWidth: 80, alignItems: 'center' },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: c.text,
      marginBottom: theme.spacing.md,
    },
    error: { color: c.danger, marginTop: theme.spacing.md },
    greeting: {
      fontSize: 15,
      color: c.textSecondary,
      marginBottom: theme.spacing.lg,
    },
    metricRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    metricCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: theme.radii.lg,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    metricLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: c.textSecondary,
      marginBottom: 6,
      textAlign: 'center',
    },
    metricValue: {
      fontSize: 32,
      fontWeight: '800',
      color: c.primary,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: c.textSecondary,
      marginBottom: 10,
      marginTop: 4,
    },
    skillCard: {
      backgroundColor: c.surface,
      borderRadius: theme.radii.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: theme.spacing.lg,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    skillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 10,
    },
    skillRowLast: { borderBottomWidth: 0 },
    skillIcon: { fontSize: 18, width: 28, textAlign: 'center' },
    skillName: { fontSize: 15, fontWeight: '600', color: c.text, flex: 1 },
    skillBadge: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: theme.radii.full,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.border,
    },
    skillLevel: {
      fontSize: 14,
      fontWeight: '700',
      color: c.primary,
    },
  });
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const appTheme = useAppTheme();
  const styles = useMemo(() => createProfileStyles(appTheme), [appTheme]);
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    const row = await fetchProfile(user.id);
    setProfile(row);
    if (!row) {
      setError(t('profile.loadError'));
    }
    setLoading(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onLogout() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  const displayName =
    profile?.display_name ?? user?.email?.split('@')[0] ?? '—';
  const skills = profile?.skills ?? DEFAULT_SKILLS;
  const c = appTheme.colors;

  return (
    <View style={[styles.root, layoutDirectionStyle(isRTL)]} testID="profile_root">
      <View
        style={[
          styles.toolbar,
          {
            paddingTop: insets.top + appTheme.spacing.sm,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
        testID="profile_toolbar"
      >
        {/* Home icon */}
        <Pressable
          style={styles.iconBtn}
          onPress={() => navigation.navigate('Welcome')}
          hitSlop={12}
          testID="profile_btn_home"
        >
          <Text style={styles.iconBtnText}>🏠</Text>
        </Pressable>

        <View style={styles.toolbarMid}>
          <Text
            style={[styles.toolbarLink, { fontSize: 17, fontWeight: '700', color: c.text }]}
            testID="profile_text_title"
          >
            {t('profile.title')}
          </Text>
        </View>

        {/* Settings + Logout icons */}
        <View style={[styles.toolbarRight, isRTL ? { flexDirection: 'row-reverse' } : {}]}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Settings')}
            hitSlop={12}
            testID="profile_btn_settings"
          >
            <Text style={styles.iconBtnText}>⚙️</Text>
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={onLogout}
            disabled={signingOut}
            hitSlop={12}
            testID="profile_btn_logout"
          >
            {signingOut ? (
              <ActivityIndicator size="small" color={c.primary} />
            ) : (
              <Text style={styles.iconBtnText}>↩</Text>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + appTheme.spacing.xl },
        ]}
        testID="profile_scroll"
      >
        {loading ? <ProfileSkeleton /> : null}

        {error && !loading ? (
          <Text style={[styles.error, { textAlign: isRTL ? 'right' : 'left' }]} testID="profile_text_error">
            {error}
          </Text>
        ) : null}

        {!loading && !error && profile ? (
          <>
            <Text style={[styles.greeting, { textAlign: isRTL ? 'right' : 'left' }]} testID="profile_text_greeting">
              {t('profile.greeting', { name: displayName })}
            </Text>

            <View style={[styles.metricRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} testID="profile_row_metrics">
              <View style={styles.metricCard} testID="profile_card_level">
                <Text style={styles.metricLabel}>{t('profile.overallLevel')}</Text>
                <Text style={styles.metricValue} testID="profile_value_level">{profile.current_level}</Text>
              </View>
              <View style={styles.metricCard} testID="profile_card_streak">
                <Text style={styles.metricLabel}>🔥 Streak</Text>
                <Text style={styles.metricValue} testID="profile_value_streak">{profile.practice_streak}</Text>
              </View>
              <View style={styles.metricCard} testID="profile_card_points">
                <Text style={styles.metricLabel}>⭐ Points</Text>
                <Text style={styles.metricValue} testID="profile_value_points">{profile.total_points}</Text>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]} testID="profile_label_skills">
              {t('profile.skillsTitle')}
            </Text>
            <View style={styles.skillCard} testID="profile_card_skills">
              {SKILL_ORDER.map((key, i) => (
                <View
                  key={key}
                  style={[
                    styles.skillRow,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    i === SKILL_ORDER.length - 1 && styles.skillRowLast,
                  ]}
                  testID={`profile_row_skill_${key}`}
                >
                  <Text style={styles.skillIcon}>{SKILL_ICONS[key]}</Text>
                  <Text style={[styles.skillName, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {skillLabel(key)}
                  </Text>
                  <View style={styles.skillBadge} testID={`profile_badge_skill_${key}`}>
                    <Text style={styles.skillLevel} testID={`profile_value_skill_${key}`}>{skills[key]}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
