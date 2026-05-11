import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/PreferencesContext';
import {
  ONBOARDING_LANGUAGE_CODES,
  type OnboardingLanguageCode,
} from '../constants/onboardingLanguages';
import type { AppNav } from '../navigation/types';
import { rootNavigationRef } from '../navigation/rootNavigationRef';
import { updateOnboardingLanguages } from '../services/profileService';
import { isRTL, t } from '../services/i18n';
import type { AppTheme } from '../theme/theme';
import { cardShadowStyle, layoutDirectionStyle, textWritingDirection } from '../utils/platformStyles';

function langLabel(code: OnboardingLanguageCode): string {
  return t(`onboarding.languages.${code}`);
}

function createStyles(theme: AppTheme) {
  const c = theme.colors;
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: c.background },
    inner: { paddingHorizontal: theme.spacing.lg },
    card: {
      backgroundColor: c.surface,
      borderRadius: theme.radii.lg,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: theme.spacing.lg,
    },
    title: {
      ...theme.typography.title,
      fontSize: 26,
      color: c.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      ...theme.typography.body,
      color: c.textSecondary,
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginBottom: theme.spacing.md,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    chip: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radii.md,
      borderWidth: 2,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipSelected: {
      borderColor: c.primary,
      backgroundColor: theme.isDark
        ? 'rgba(96,165,250,0.14)'
        : 'rgba(239,246,255,1)',
    },
    chipLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
    },
    primaryBtn: {
      backgroundColor: c.primary,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radii.md,
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    primaryBtnPressed: { opacity: 0.9 },
    primaryBtnDisabled: { opacity: 0.55 },
    primaryLabel: {
      ...theme.typography.button,
      color: c.onPrimary,
    },
  });
}

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const { user } = useAuth();
  const appTheme = useAppTheme();
  const styles = useMemo(() => createStyles(appTheme), [appTheme]);
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [nativeLang, setNativeLang] = useState<OnboardingLanguageCode | null>(null);
  const [targetLang, setTargetLang] = useState<OnboardingLanguageCode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const continueInFlightRef = useRef(false);

  const onContinue = useCallback(async () => {
    if (!user?.id || !nativeLang || !targetLang || continueInFlightRef.current) return;
    continueInFlightRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const { error: err } = await updateOnboardingLanguages(
        user.id,
        nativeLang,
        targetLang,
      );
      if (err) {
        setError(t('onboarding.saveError'));
        return;
      }
      const resetPlacement = CommonActions.reset({
        index: 0,
        routes: [{ name: 'PlacementTest' }],
      });
      const runNav = () => {
        if (rootNavigationRef.isReady()) {
          rootNavigationRef.dispatch(resetPlacement);
        } else {
          navigation.dispatch(resetPlacement);
        }
      };
      setTimeout(runNav, 0);
    } finally {
      continueInFlightRef.current = false;
      setSubmitting(false);
    }
  }, [nativeLang, navigation, targetLang, user?.id]);

  return (
    <ScrollView
      style={[styles.scroll, layoutDirectionStyle(isRTL)]}
      contentContainerStyle={[
        styles.inner,
        {
          paddingTop: insets.top + appTheme.spacing.xl,
          paddingBottom: insets.bottom + appTheme.spacing.xl,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      bounces={false}
      testID="onboarding_scroll"
    >
      <View
        style={[
          styles.card,
          cardShadowStyle(appTheme),
          { maxWidth: isWide ? 520 : '100%', alignSelf: 'center', width: '100%' },
        ]}
        testID="onboarding_card"
      >
        <Text
          style={[
            styles.title,
            { textAlign: isRTL ? 'right' : 'left' },
            textWritingDirection(isRTL),
          ]}
          testID="onboarding_text_title"
        >
          {t('onboarding.title')}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { textAlign: isRTL ? 'right' : 'left' },
            textWritingDirection(isRTL),
          ]}
          testID="onboarding_text_subtitle"
        >
          {t('onboarding.subtitle')}
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            { textAlign: isRTL ? 'right' : 'left' },
            textWritingDirection(isRTL),
          ]}
          testID="onboarding_text_native_question"
        >
          {t('onboarding.nativeQuestion')}
        </Text>
        <View
          style={[
            styles.chipRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
          testID="onboarding_row_native_chips"
        >
          {ONBOARDING_LANGUAGE_CODES.map((code) => (
            <Pressable
              key={`n-${code}`}
              onPress={() => { setNativeLang(code); if (targetLang === code) setTargetLang(null); }}
              style={[
                styles.chip,
                nativeLang === code && styles.chipSelected,
              ]}
              testID={`onboarding_chip_native_${code}`}
            >
              <Text style={styles.chipLabel}>{langLabel(code)}</Text>
            </Pressable>
          ))}
        </View>

        <Text
          style={[
            styles.sectionTitle,
            { marginTop: appTheme.spacing.xl, textAlign: isRTL ? 'right' : 'left' },
            textWritingDirection(isRTL),
          ]}
          testID="onboarding_text_target_question"
        >
          {t('onboarding.targetQuestion')}
        </Text>
        <View
          style={[
            styles.chipRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
          testID="onboarding_row_target_chips"
        >
          {ONBOARDING_LANGUAGE_CODES.filter((code) => code !== nativeLang).map((code) => (
            <Pressable
              key={`t-${code}`}
              onPress={() => setTargetLang(code)}
              style={[
                styles.chip,
                targetLang === code && styles.chipSelected,
              ]}
              testID={`onboarding_chip_target_${code}`}
            >
              <Text style={styles.chipLabel}>{langLabel(code)}</Text>
            </Pressable>
          ))}
        </View>

        {error ? (
          <Text
            style={{
              color: appTheme.colors.danger,
              marginTop: appTheme.spacing.md,
              textAlign: isRTL ? 'right' : 'left',
            }}
            testID="onboarding_text_error"
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
            (submitting || !nativeLang || !targetLang) && styles.primaryBtnDisabled,
          ]}
          onPress={() => void onContinue()}
          disabled={submitting || !nativeLang || !targetLang}
          testID="onboarding_btn_continue"
        >
          {submitting ? (
            <ActivityIndicator color={appTheme.colors.onPrimary} />
          ) : (
            <Text style={styles.primaryLabel}>{t('onboarding.continue')}</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
