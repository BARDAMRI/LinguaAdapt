import Ionicons from '@expo/vector-icons/Ionicons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '../components/BrandMark';
import { IconBadge, tint, type IconName } from '../components/ui';
import { useAppTheme, usePreferences } from '../context/PreferencesContext';
import { nativeOf, type PairId } from '../content/types';
import { buildCourse } from '../course/build';
import { ensureCourseContent } from '../content/packs';
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
    void ensureCourseContent(p);
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

  /** Course choice: written in the learner's own language, so direction is per card. */
  const pairCard = (p: PairId, glyph: string, color: string, title: string, sub: string, rtl: boolean) => (
    <Pressable
      key={p}
      onPress={() => void choosePair(p)}
      testID={`onboarding_pair_${p}`}
      style={({ pressed }) => [
        styles.card,
        cardShadowStyle(theme),
        { flexDirection: rowDir(rtl), backgroundColor: c.surface, borderColor: c.border, transform: [{ scale: pressed ? 0.985 : 1 }] },
      ]}
    >
      <View style={[styles.glyphBox, { backgroundColor: tint(theme, color) }]}>
        <Text style={[styles.glyph, { color }]}>{glyph}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.cardSub, { color: c.textSecondary }, textStart(rtl)]}>{title}</Text>
        <Text style={[styles.cardTitle, { color: c.text }, textStart(rtl)]}>{sub}</Text>
      </View>
      <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={20} color={c.textTertiary} />
    </Pressable>
  );

  const levelCard = (icon: IconName, color: string, title: string, sub: string, onPress: () => void, testID: string, primary?: boolean) => (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.card,
        cardShadowStyle(theme),
        {
          flexDirection: rowDir(isRTL),
          backgroundColor: c.surface,
          borderColor: primary ? c.primary : c.border,
          borderWidth: primary ? 2 : StyleSheet.hairlineWidth,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <IconBadge icon={icon} color={color} size={48} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.cardTitle, { color: c.text }, textStart(isRTL)]}>{title}</Text>
        <Text style={[styles.cardSub, { color: c.textSecondary }, textStart(isRTL)]}>{sub}</Text>
      </View>
      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={c.textTertiary} />
    </Pressable>
  );

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.column}>
        <Animated.View entering={FadeInUp.duration(400)} style={styles.brand}>
          <BrandMark size={84} />
        </Animated.View>
        {!pair ? (
          <Animated.View entering={FadeInDown.duration(350)} style={styles.gap}>
            <View style={styles.titles}>
              <Text style={[styles.title, { color: c.text }]}>LinguaAdapt</Text>
              <Text style={[styles.subtitle, { color: c.textSecondary }]}>Learn a language from zero</Text>
              <Text style={[styles.subtitle, { color: c.textSecondary, writingDirection: 'rtl' }]}>ללמוד שפה מאפס</Text>
            </View>
            {pairCard('en-he', 'א', c.stage[0], t('onboarding.enHeTitle'), t('onboarding.enHeSub'), false)}
            {pairCard('he-en', 'A', c.stage[3], t('onboarding.heEnTitle'), t('onboarding.heEnSub'), true)}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(350)} style={styles.gap}>
            <Text style={[styles.title, { color: c.text }]}>{t('onboarding.levelTitle')}</Text>
            {levelCard('leaf', c.success, t('onboarding.fromZero'), t('onboarding.fromZeroSub'), () => start(false), 'onboarding_from_zero', true)}
            {levelCard('rocket', c.primary, t('onboarding.knowSome'), t('onboarding.knowSomeSub'), () => start(true), 'onboarding_know_some')}
            <View style={[styles.note, { backgroundColor: c.surfaceElevated, flexDirection: rowDir(isRTL) }]}>
              <Ionicons name="phone-portrait-outline" size={18} color={c.textSecondary} />
              <Text style={[styles.noteText, { color: c.textSecondary }, textStart(isRTL)]}>{t('onboarding.guestNote')}</Text>
            </View>
            <Pressable onPress={() => setPair(null)} hitSlop={8} style={styles.backBtn}>
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
  column: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 28 },
  brand: { alignItems: 'center' },
  gap: { gap: 14 },
  titles: { gap: 4, marginBottom: 14 },
  title: { fontSize: 30, lineHeight: 38, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 16, lineHeight: 22, textAlign: 'center' },
  card: { alignItems: 'center', gap: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 16 },
  glyphBox: { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 28, fontWeight: '800' },
  cardTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  cardSub: { fontSize: 14, lineHeight: 19, fontWeight: '500' },
  note: { alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, marginTop: 4 },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19 },
  backBtn: { alignSelf: 'center', paddingVertical: 6 },
  back: { textAlign: 'center', fontSize: 15, fontWeight: '700' },
});
