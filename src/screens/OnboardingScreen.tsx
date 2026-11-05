import { CommonActions, useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, usePreferences } from '../context/PreferencesContext';
import { nativeOf, type PairId } from '../content/types';
import { buildCourse } from '../course/build';
import type { AppNav } from '../navigation/types';
import { useProgress } from '../progress/ProgressContext';
import { isRTL, t } from '../services/i18n';
import { cardShadowStyle, rowDir, textStart } from '../utils/platformStyles';

export function OnboardingScreen() {
  const theme = useAppTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const { setAppLanguage } = usePreferences();
  const { setActivePair } = useProgress();
  const [pair, setPair] = useState<PairId | null>(null);

  const choosePair = async (p: PairId) => {
    // The UI speaks the learner's own language.
    await setAppLanguage(nativeOf(p), { remount: false });
    setActivePair(p);
    setPair(p);
  };

  const start = (knowSome: boolean) => {
    if (!pair) return;
    const routes: { name: 'Home' | 'Lesson'; params?: object }[] = [{ name: 'Home' }];
    if (knowSome) {
      // Test the letters: passing opens the reading stage.
      const reading = buildCourse(pair).stages[1];
      if (reading.units[0]) routes.push({ name: 'Lesson', params: { mode: 'checkpoint', unitId: reading.units[0].id } });
    }
    navigation.dispatch(CommonActions.reset({ index: routes.length - 1, routes }));
  };

  const card = (p: PairId, emoji: string, title: string, sub: string, rtl: boolean) => (
    <Pressable
      key={p}
      onPress={() => void choosePair(p)}
      testID={`onboarding_pair_${p}`}
      style={({ pressed }) => [
        styles.pairCard,
        cardShadowStyle(theme),
        { flexDirection: rowDir(rtl), backgroundColor: c.surface, borderColor: pair === p ? c.primary : c.border, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Text style={styles.pairEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.pairTitle, { color: c.text }, textStart(rtl)]}>{title}</Text>
        <Text style={[styles.pairSub, { color: c.primary }, textStart(rtl)]}>{sub}</Text>
      </View>
    </Pressable>
  );

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.column}>
        <Animated.Text entering={FadeInUp} style={styles.hero}>
          אב · ABC
        </Animated.Text>
        {!pair ? (
          <Animated.View entering={FadeInDown} style={styles.gap}>
            <Text style={[styles.title, { color: c.text }]}>LinguaAdapt</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Learn a language from zero · ללמוד שפה מאפס
            </Text>
            {card('en-he', '🇮🇱', t('onboarding.enHeTitle'), t('onboarding.enHeSub'), false)}
            {card('he-en', '🇬🇧', t('onboarding.heEnTitle'), t('onboarding.heEnSub'), true)}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown} style={styles.gap}>
            <Text style={[styles.title, { color: c.text }]}>{t('onboarding.levelTitle')}</Text>
            <Pressable
              onPress={() => start(false)}
              testID="onboarding_from_zero"
              style={[styles.levelCard, { backgroundColor: c.primary, flexDirection: rowDir(isRTL) }]}
            >
              <Text style={styles.levelEmoji}>🌱</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.levelTitle, { color: c.onPrimary }, textStart(isRTL)]}>{t('onboarding.fromZero')}</Text>
                <Text style={[styles.levelSub, { color: c.onPrimary }, textStart(isRTL)]}>{t('onboarding.fromZeroSub')}</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => start(true)}
              testID="onboarding_know_some"
              style={[styles.levelCard, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, flexDirection: rowDir(isRTL) }]}
            >
              <Text style={styles.levelEmoji}>🚀</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.levelTitle, { color: c.text }, textStart(isRTL)]}>{t('onboarding.knowSome')}</Text>
                <Text style={[styles.levelSub, { color: c.textSecondary }, textStart(isRTL)]}>{t('onboarding.knowSomeSub')}</Text>
              </View>
            </Pressable>
            <Text style={[styles.note, { color: c.textSecondary }]}>{t('onboarding.guestNote')}</Text>
            <Pressable onPress={() => setPair(null)} hitSlop={8}>
              <Text style={[styles.back, { color: c.primary }]}>{t('common.back')}</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, flexGrow: 1 },
  column: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 20 },
  gap: { gap: 16 },
  hero: { fontSize: 56, textAlign: 'center', fontWeight: '800', color: '#4f46e5' },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  pairCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 2, borderRadius: 20, padding: 18 },
  pairEmoji: { fontSize: 40 },
  pairTitle: { fontSize: 20, fontWeight: '800' },
  pairSub: { fontSize: 17, fontWeight: '700', marginTop: 2 },
  levelCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, padding: 18 },
  levelEmoji: { fontSize: 34 },
  levelTitle: { fontSize: 18, fontWeight: '800' },
  levelSub: { fontSize: 14, marginTop: 2, opacity: 0.9 },
  note: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  back: { textAlign: 'center', fontSize: 15, fontWeight: '700' },
});
