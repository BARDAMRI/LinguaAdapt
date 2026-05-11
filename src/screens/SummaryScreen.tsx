import { useCallback, useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppNav, AppStackParamList } from '../navigation/types';
import { isRTL, t } from '../services/i18n';
import { useAppTheme } from '../context/PreferencesContext';
import type { SkillKey } from '../services/profileService';
import {
  createShareCardDataUrl,
  formatShareBody,
  shareProgressText,
} from '../utils/shareProgress';
import { cardShadowStyle, textWritingDirection } from '../utils/platformStyles';

function categoryTitle(cat: string): string {
  switch (cat) {
    case 'alphabet':
      return t('profile.skillAlphabet');
    case 'vocabulary':
      return t('profile.skillVocabulary');
    case 'sentences':
      return t('profile.skillSentences');
    case 'mixed':
      return t('learning.practiceMixed');
    default:
      return cat;
  }
}

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

export function SummaryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const route = useRoute<RouteProp<AppStackParamList, 'Summary'>>();
  const theme = useAppTheme();
  const c = theme.colors;

  const p = route.params;
  const accuracyPct =
    p.total > 0 ? Math.round((p.correct / p.total) * 100) : 0;
  const catLabel = categoryTitle(p.category);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: c.background,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: insets.top + theme.spacing.md,
          paddingBottom: insets.bottom + theme.spacing.lg,
        },
        title: {
          ...theme.typography.title,
          fontSize: 26,
          color: c.text,
          marginBottom: theme.spacing.sm,
          textAlign: isRTL ? 'right' : 'left',
        },
        subtitle: {
          ...theme.typography.body,
          color: c.textSecondary,
          marginBottom: theme.spacing.xl,
          textAlign: isRTL ? 'right' : 'left',
        },
        statGrid: { gap: theme.spacing.md },
        statCard: {
          backgroundColor: c.surface,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: c.border,
          ...cardShadowStyle(theme),
        },
        statLabel: {
          fontSize: 14,
          fontWeight: '600',
          color: c.textSecondary,
          marginBottom: theme.spacing.xs,
          textAlign: isRTL ? 'right' : 'left',
        },
        statValue: {
          fontSize: 28,
          fontWeight: '800',
          color: c.primary,
          textAlign: isRTL ? 'right' : 'left',
        },
        levelUpWrap: {
          marginTop: theme.spacing.lg,
          padding: theme.spacing.lg,
          borderRadius: theme.radii.lg,
          backgroundColor: theme.isDark
            ? 'rgba(251,191,36,0.12)'
            : 'rgba(255,251,235,1)',
          borderWidth: 2,
          borderColor: c.secondary,
        },
        levelUpTitle: {
          fontSize: 22,
          fontWeight: '800',
          color: c.secondary,
          textAlign: 'center',
          marginBottom: theme.spacing.sm,
        },
        levelLine: {
          fontSize: 16,
          color: c.text,
          textAlign: isRTL ? 'right' : 'left',
          marginTop: theme.spacing.xs,
        },
        primaryBtn: {
          backgroundColor: c.primary,
          paddingVertical: theme.spacing.md,
          borderRadius: theme.radii.md,
          alignItems: 'center',
          marginTop: theme.spacing.xl,
        },
        primaryLabel: {
          ...theme.typography.button,
          color: c.onPrimary,
        },
        secondaryBtn: {
          marginTop: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          borderRadius: theme.radii.md,
          alignItems: 'center',
          borderWidth: 2,
          borderColor: c.primary,
          backgroundColor: c.surface,
        },
        secondaryLabel: {
          ...theme.typography.button,
          color: c.primary,
        },
      }),
    [theme, c, insets.top, insets.bottom],
  );

  const onDone = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      }),
    );
  }, [navigation]);

  const onShare = useCallback(async () => {
    const { usedSystemShare } = await shareProgressText({
      accuracyPct,
      streak: p.streak,
      totalPoints: p.totalPoints,
      newWordsLearned: p.newWordsLearned,
      categoryLabel: catLabel,
      title: t('summary.shareTitle'),
      bodyTemplate: t('summary.shareBody'),
    });

    if (Platform.OS === 'web' && !usedSystemShare) {
      const lines = [
        t('summary.shareTitle'),
        formatShareBody(t('summary.shareCardLine1'), {
          accuracy: accuracyPct,
          category: catLabel,
        }),
        formatShareBody(t('summary.shareCardLine2'), {
          streak: p.streak,
          points: p.totalPoints,
        }),
      ];
      const dataUrl = createShareCardDataUrl(lines, {
        bg: c.primary,
        accent: c.secondary,
        text: '#f8fafc',
      });
      if (dataUrl && typeof document !== 'undefined') {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'lingua-progress.png';
        a.click();
      }
    }
  }, [accuracyPct, catLabel, c.primary, c.secondary, p]);

  const levelLines = p.leveledUp.map((k) => ({
    key: k,
    label: skillLabel(k),
    before: p.skillsBefore[k] ?? 0,
    after: p.skillsAfter[k] ?? 0,
  }));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.root}
      bounces={false}
      testID="summary_scroll"
    >
      <Text style={[styles.title, textWritingDirection(isRTL)]} testID="summary_text_title">
        {t('summary.title')}
      </Text>
      <Text style={[styles.subtitle, textWritingDirection(isRTL)]} testID="summary_text_subtitle">
        {t('summary.subtitle', { category: catLabel })}
      </Text>

      <View style={styles.statGrid} testID="summary_grid_stats">
        <View style={styles.statCard} testID="summary_card_accuracy">
          <Text style={styles.statLabel}>{t('summary.accuracy')}</Text>
          <Text style={styles.statValue} testID="summary_value_accuracy">{accuracyPct}%</Text>
        </View>
        <View style={styles.statCard} testID="summary_card_new_words">
          <Text style={styles.statLabel}>{t('summary.newWords')}</Text>
          <Text style={styles.statValue} testID="summary_value_new_words">{p.newWordsLearned}</Text>
        </View>
        <View style={styles.statCard} testID="summary_card_points_earned">
          <Text style={styles.statLabel}>{t('summary.pointsEarned')}</Text>
          <Text style={styles.statValue} testID="summary_value_points_earned">+{p.pointsEarned}</Text>
        </View>
        <View style={styles.statCard} testID="summary_card_total_points">
          <Text style={styles.statLabel}>{t('summary.totalPoints')}</Text>
          <Text style={styles.statValue} testID="summary_value_total_points">{p.totalPoints}</Text>
        </View>
        <View style={styles.statCard} testID="summary_card_streak">
          <Text style={styles.statLabel}>{t('summary.streak')}</Text>
          <Text style={styles.statValue} testID="summary_value_streak">{p.streak}</Text>
        </View>
      </View>

      {levelLines.length > 0 ? (
        <Animated.View
          entering={ZoomIn.duration(500)}
          style={styles.levelUpWrap}
          testID="summary_wrap_level_up"
        >
          <Text style={styles.levelUpTitle} testID="summary_text_level_up">{t('summary.levelUp')}</Text>
          {levelLines.map((row) => (
            <Text key={row.key} style={styles.levelLine} testID={`summary_text_level_line_${row.key}`}>
              {t('summary.levelLine', {
                skill: row.label,
                before: row.before,
                after: row.after,
              })}
            </Text>
          ))}
        </Animated.View>
      ) : null}

      <Pressable style={styles.secondaryBtn} onPress={() => void onShare()} testID="summary_btn_share">
        <Text style={styles.secondaryLabel}>📤  {t('summary.share')}</Text>
      </Pressable>

      <Pressable style={styles.primaryBtn} onPress={onDone} testID="summary_btn_done">
        <Text style={styles.primaryLabel}>🏠  {t('summary.done')}</Text>
      </Pressable>

      {Platform.OS === 'web' ? (
        <Text
          style={{
            marginTop: theme.spacing.md,
            fontSize: 13,
            color: c.textSecondary,
            textAlign: 'center',
          }}
          testID="summary_text_web_hint"
        >
          {t('summary.shareWebHint')}
        </Text>
      ) : null}
    </ScrollView>
  );
}
