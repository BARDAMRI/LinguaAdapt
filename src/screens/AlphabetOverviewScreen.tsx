import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/PreferencesContext';
import type { AppNav } from '../navigation/types';
import { fetchProfile } from '../services/profileService';
import { getAlphabetForLanguage, getLetterDisplayName } from '../services/alphabetService';
import { isRTL, t } from '../services/i18n';
import type { LetterData } from '../../types/learning';
import type { AppTheme } from '../theme/theme';

function makeStyles(theme: AppTheme, insets: { top: number; bottom: number }) {
  const c = theme.colors;
  const rtl = isRTL;

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: rtl ? 'row-reverse' : 'row',
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
      color: c.primary,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: c.text,
      letterSpacing: 0.2,
      textAlign: 'center',
      flex: 1,
    },
    practiceAllBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: theme.radii.full,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    practiceAllLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: c.onPrimary,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.lg,
      paddingBottom: insets.bottom + theme.spacing.xl,
    },
    hint: {
      fontSize: 13,
      color: c.textSecondary,
      textAlign: rtl ? 'right' : 'left',
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
    },
    grid: {
      flexDirection: rtl ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    letterTile: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: 10,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 6,
      elevation: 1,
    },
    letterTilePressed: {
      borderColor: c.primary,
      backgroundColor: theme.isDark ? 'rgba(129,140,248,0.12)' : 'rgba(238,237,255,1)',
    },
    letterChar: {
      fontWeight: '700',
      color: c.primary,
      textAlign: 'center',
    },
    letterName: {
      fontWeight: '500',
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
    emptyText: {
      fontSize: 15,
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: 40,
      paddingHorizontal: 24,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

export function AlphabetOverviewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const { user } = useAuth();
  const appTheme = useAppTheme();
  const { width } = useWindowDimensions();

  const [nativeLang, setNativeLang] = useState<string>('en');
  const [targetLang, setTargetLang] = useState<string>('he');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) { setLoading(false); return; }
      void fetchProfile(user.id).then((p) => {
        setNativeLang(p?.native_language ?? 'en');
        setTargetLang(p?.target_language ?? 'he');
        setLoading(false);
      });
    }, [user?.id]),
  );

  const alphabet = useMemo(() => getAlphabetForLanguage(targetLang), [targetLang]);

  // Tile size: ~4 per row on phone, more on tablet
  const tileSize = useMemo(() => {
    const cols = width >= 600 ? 6 : 4;
    const spacing = 10;
    const padding = 16 * 2;
    return Math.floor((width - padding - spacing * (cols - 1)) / cols);
  }, [width]);

  const styles = useMemo(() => makeStyles(appTheme, insets), [appTheme, insets]);

  const langLabel = useMemo(() => {
    const key = `onboarding.languages.${targetLang}` as const;
    return t(key as string) || targetLang.toUpperCase();
  }, [targetLang]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Welcome');
    }
  }, [navigation]);

  const handlePracticeAll = useCallback(() => {
    navigation.navigate('LearningSession', { category: 'alphabet' });
  }, [navigation]);

  const handleLetterPress = useCallback(
    (letter: LetterData) => {
      navigation.navigate('LearningSession', {
        category: 'alphabet',
        letterChar: letter.char,
      });
    },
    [navigation],
  );

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={appTheme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="alphabet_overview_root">
      {/* Header */}
      <View style={styles.header} testID="alphabet_overview_header">
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={16} testID="alphabet_overview_btn_back">
          <Text style={styles.backArrow}>{isRTL ? '›' : '‹'}</Text>
        </Pressable>
        <Text style={styles.headerTitle} testID="alphabet_overview_title">
          {langLabel} {t('profile.skillAlphabet')}
        </Text>
        <Pressable
          style={styles.practiceAllBtn}
          onPress={handlePracticeAll}
          testID="alphabet_overview_btn_practice_all"
        >
          <Text style={styles.practiceAllLabel}>{t('learning.practiceAlphabet')}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="alphabet_overview_scroll"
      >
        <Text style={styles.hint} testID="alphabet_overview_hint">
          {isRTL
            ? 'הקישו על אות לתרגול'
            : 'Tap a letter to practice it'}
        </Text>

        {alphabet.length === 0 ? (
          <Text style={styles.emptyText} testID="alphabet_overview_empty">
            {t('learning.sessionNoExercises')}
          </Text>
        ) : (
          <View style={styles.grid} testID="alphabet_overview_grid">
            {alphabet.map((letter) => {
              const displayName = getLetterDisplayName(letter, nativeLang);
              const fontSize = tileSize > 80 ? 40 : 32;
              const nameSize = tileSize > 80 ? 11 : 10;

              return (
                <Pressable
                  key={letter.char}
                  style={({ pressed }) => [
                    styles.letterTile,
                    { width: tileSize, minHeight: tileSize },
                    pressed && styles.letterTilePressed,
                  ]}
                  onPress={() => handleLetterPress(letter)}
                  testID={`alphabet_tile_${letter.char}`}
                >
                  <Text style={[styles.letterChar, { fontSize }]}>
                    {letter.char}
                  </Text>
                  <Text
                    style={[styles.letterName, { fontSize: nameSize }]}
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
