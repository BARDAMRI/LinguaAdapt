import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WelcomeCardSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/PreferencesContext';
import type { AppNav } from '../navigation/types';
import { fetchDashboardStats } from '../services/learningService';
import type { ProfileRow } from '../services/profileService';
import { isRTL, t } from '../services/i18n';
import type { AppTheme } from '../theme/theme';
import {
  cardShadowStyle,
  layoutDirectionStyle,
  textWritingDirection,
} from '../utils/platformStyles';
import type { OnboardingLanguageCode } from '../constants/onboardingLanguages';

function langShortName(code: string): string {
  return t(`onboarding.languages.${code as OnboardingLanguageCode}`) ?? code.toUpperCase();
}

function PracticeChip({
  label,
  onPress,
  accent,
  icon,
  styles,
  rtl,
  testID,
}: {
  label: string;
  onPress: () => void;
  accent: 'primary' | 'secondary';
  icon: string;
  styles: ReturnType<typeof createWelcomeStyles>;
  rtl: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        accent === 'primary' ? styles.practiceChip : styles.practiceChipSecondary,
        pressed &&
          (accent === 'primary'
            ? styles.practiceChipPressed
            : styles.practiceChipSecondaryPressed),
      ]}
      onPress={onPress}
      testID={testID}
    >
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text
        style={[
          accent === 'primary'
            ? styles.practiceChipLabel
            : styles.practiceChipLabelSecondary,
          textWritingDirection(rtl),
        ]}
      >
        {label}
      </Text>
      <Text style={{ fontSize: 14, opacity: 0.4 }}>{rtl ? '‹' : '›'}</Text>
    </Pressable>
  );
}

function createWelcomeStyles(theme: AppTheme) {
  const c = theme.colors;
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: c.background },
    scrollContent: { flexGrow: 1, justifyContent: 'center' },
    centerColumn: { flex: 1, justifyContent: 'center', alignItems: 'stretch' },
    centerColumnWide: { alignItems: 'center' },
    card: {
      backgroundColor: c.surface,
      borderRadius: theme.radii.xl,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 24,
      elevation: 6,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      margin: theme.spacing.xs,
      gap: theme.spacing.sm,
    },
    topBarRtl: { flexDirection: 'row-reverse' as const, gap: theme.spacing.sm, margin: theme.spacing.xs, },
    reviewBadge: {
      
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: theme.radii.full,
      backgroundColor: theme.isDark ? 'rgba(251,113,133,0.15)' : 'rgba(255,237,237,1)',
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: theme.isDark ? 'rgba(251,113,133,0.3)' : 'rgba(255,205,205,1)',
    },
    reviewBadgeMuted: {
      backgroundColor: theme.isDark ? 'rgba(52,211,153,0.12)' : 'rgba(236,253,245,1)',
      borderColor: theme.isDark ? 'rgba(52,211,153,0.25)' : 'rgba(167,243,208,1)',
    },
    reviewBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.isDark ? '#fda4af' : '#be123c',
      lineHeight: 0
    },
    reviewBadgeTextMuted: {
      color: theme.isDark ? '#34d399' : '#065f46',
    },
    settingsBtn: {
      width: 25,
      height: 25,
      borderRadius: 18,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingsBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: c.primary,
    },
    courseBadge: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: theme.radii.full,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    courseBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: c.primary,
    },
    dashRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    dashRowRtl: {
      flexDirection: 'row-reverse' as const,
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    dashCard: {
      flex: 1,
      backgroundColor: c.surfaceElevated,
      borderRadius: theme.radii.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    dashLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 4,
      textAlign: 'center',
    },
    dashValue: {
      fontSize: 28,
      fontWeight: '800',
      color: c.primary,
      textAlign: 'center',
    },
    heroAccent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: c.primary,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: c.text,
      marginBottom: theme.spacing.sm,
      lineHeight: 32,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textSecondary,
      marginBottom: theme.spacing.xl,
    },
    button: {
      backgroundColor: c.primary,
      paddingVertical: 16,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radii.md,
      alignItems: 'center',
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 4,
    },
    buttonPressed: { opacity: 0.88 },
    buttonLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: c.onPrimary,
      letterSpacing: 0.3,
    },
    practiceRow: {
      marginTop: theme.spacing.md,
      gap: 8,
      width: '100%',
    },
    practiceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 13,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radii.md,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surfaceElevated,
    },
    practiceChipPressed: {
      borderColor: c.primary,
      backgroundColor: theme.isDark
        ? 'rgba(129,140,248,0.1)'
        : 'rgba(238,237,255,1)',
    },
    practiceChipSecondary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 13,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radii.md,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surfaceElevated,
    },
    practiceChipSecondaryPressed: {
      borderColor: c.secondary,
      backgroundColor: theme.isDark
        ? 'rgba(251,191,36,0.1)'
        : 'rgba(255,251,235,1)',
    },
    practiceChipLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
      flex: 1,
    },
    practiceChipLabelSecondary: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
      flex: 1,
    },
  });
}

export function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const { user } = useAuth();
  const appTheme = useAppTheme();
  const styles = useMemo(() => createWelcomeStyles(appTheme), [appTheme]);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [dueReviews, setDueReviews] = useState(0);
  const [dashLoading, setDashLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) {
        setDashLoading(false);
        return;
      }
      setDashLoading(true);
      void fetchDashboardStats(user.id).then(({ profile: p, dueReviews: d }) => {
        setProfile(p);
        setDueReviews(d);
        setDashLoading(false);
      });
    }, [user?.id]),
  );

  const showConversation = (profile?.skills.conversation ?? 0) > 1;

  const layout = useMemo(() => {
    const isWide = width >= 768;
    const contentMaxWidth = isWide
      ? Math.min(560, width * 0.55)
      : width - appTheme.spacing.lg * 2;
    const horizontalPad = isWide ? appTheme.spacing.xl : appTheme.spacing.lg;
    return { isWide, contentMaxWidth, horizontalPad };
  }, [width, appTheme.spacing.lg, appTheme.spacing.xl]);

  const rowDir = isRTL ? styles.topBarRtl : styles.topBar;
  const dashDir = isRTL ? styles.dashRowRtl : styles.dashRow;

  return (
    <ScrollView
      style={[styles.scroll, layoutDirectionStyle(isRTL)]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: insets.top + appTheme.spacing.xl,
          paddingBottom: insets.bottom + appTheme.spacing.xl,
          paddingHorizontal: layout.horizontalPad,
          minHeight: height - insets.top - insets.bottom,
        },
      ]}
      bounces={false}
      testID="welcome_scroll"
    >
      <View
        style={[
          styles.centerColumn,
          layout.isWide && styles.centerColumnWide,
        ]}
      >
        {dashLoading ? (
          <View style={{ maxWidth: layout.contentMaxWidth, width: '100%' }}>
            <WelcomeCardSkeleton />
          </View>
        ) : (
          <View
            style={[
              styles.card,
              { maxWidth: layout.contentMaxWidth, width: '100%' },
              cardShadowStyle(appTheme),
            ]}
            testID="welcome_card"
          >
            <View style={styles.heroAccent} testID="welcome_accent" />

            <View style={rowDir} testID='welcome_row'>
              <View
                style={[
                  styles.reviewBadge,
                  dueReviews === 0 && styles.reviewBadgeMuted,
                ]}
                testID="welcome_badge_review"
              >
                <Text
                  style={[
                    styles.reviewBadgeText,
                    dueReviews === 0 && styles.reviewBadgeTextMuted,
                    textWritingDirection(isRTL),
                  ]}
                  testID="welcome_text_review"
                >
                  {dueReviews > 0
                    ? t('welcome.reviewDue', { count: dueReviews })
                    : t('welcome.reviewDueZero')}
                </Text>
              </View>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, alignItems: 'center' }} testID='wrlcome_btn_container'>
                {profile?.native_language && profile?.target_language ? (
                  <Pressable
                    style={styles.courseBadge}
                    onPress={() => navigation.navigate('Settings')}
                    hitSlop={8}
                    testID="welcome_btn_course"
                  >
                    <Text style={[styles.courseBadgeText, textWritingDirection(isRTL)]}>
                      {langShortName(profile.native_language)} → {langShortName(profile.target_language)}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.settingsBtn}
                  onPress={() => navigation.navigate('Settings')}
                  hitSlop={10}
                  testID="welcome_btn_settings"
                >
                  <Text style={styles.settingsBtnText}>⚙️</Text>
                </Pressable>
              </View>
            </View>

            <View style={dashDir} testID="welcome_row_dash">
              <View style={styles.dashCard} testID="welcome_card_streak">
                <Text style={styles.dashLabel} testID="welcome_text_streak_label">
                  {t('welcome.streak')}
                </Text>
                <Text style={styles.dashValue} testID="welcome_text_streak_value">
                  {profile?.practice_streak ?? 0}
                </Text>
              </View>
              <View style={styles.dashCard} testID="welcome_card_points">
                <Text style={styles.dashLabel} testID="welcome_text_points_label">
                  {t('welcome.points')}
                </Text>
                <Text style={styles.dashValue} testID="welcome_text_points_value">
                  {profile?.total_points ?? 0}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.title,
                { textAlign: isRTL ? 'right' : 'left' },
                textWritingDirection(isRTL),
              ]}
              testID="welcome_text_title"
            >
              {t('welcome.title')}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { textAlign: isRTL ? 'right' : 'left' },
                textWritingDirection(isRTL),
              ]}
              testID="welcome_text_subtitle"
            >
              {t('welcome.subtitle')}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => navigation.navigate('LearningSession', { category: 'mixed' })}
              testID="welcome_btn_start"
            >
              <Text
                style={[styles.buttonLabel, textWritingDirection(isRTL)]}
              >
                {t('welcome.startLearning')}
              </Text>
            </Pressable>

            <View style={styles.practiceRow} testID="welcome_row_practice">
              <PracticeChip
                styles={styles}
                rtl={isRTL}
                icon="🔤"
                label={t('learning.practiceAlphabet')}
                accent="primary"
                testID="welcome_chip_alphabet"
                onPress={() => navigation.navigate('AlphabetOverview')}
              />
              <PracticeChip
                styles={styles}
                rtl={isRTL}
                icon="📖"
                label={t('learning.practiceVocabulary')}
                accent="primary"
                testID="welcome_chip_vocabulary"
                onPress={() =>
                  navigation.navigate('LearningSession', {
                    category: 'vocabulary',
                  })
                }
              />
              <PracticeChip
                styles={styles}
                rtl={isRTL}
                icon="✍️"
                label={t('learning.practiceSentences')}
                accent="primary"
                testID="welcome_chip_sentences"
                onPress={() =>
                  navigation.navigate('LearningSession', {
                    category: 'sentences',
                  })
                }
              />
              {showConversation ? (
                <PracticeChip
                  styles={styles}
                  rtl={isRTL}
                  icon="💬"
                  accent="secondary"
                  label={t('welcome.practiceConversation')}
                  testID="welcome_chip_conversation"
                  onPress={() =>
                    navigation.navigate('Conversation', {
                      topic: 'At the Airport',
                    })
                  }
                />
              ) : null}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
