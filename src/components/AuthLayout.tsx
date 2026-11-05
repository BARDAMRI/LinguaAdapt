import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isRTL } from '../services/i18n';
import { theme } from '../theme/theme';
import {
  cardShadowStyle,
  textWritingDirection,
} from '../utils/platformStyles';

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 768;
  const contentMaxWidth = isWide
    ? Math.min(480, width * 0.45)
    : width - theme.spacing.lg * 2;
  const horizontalPad = isWide ? theme.spacing.xl : theme.spacing.lg;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          paddingHorizontal: horizontalPad,
          minHeight: height - insets.top - insets.bottom,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      bounces={false}
      testID="auth_scroll"
    >
      <View style={[styles.centerColumn, isWide && styles.centerColumnWide]}>
        <View
          style={[
            styles.card,
            { maxWidth: contentMaxWidth, width: '100%' },
            cardShadowStyle(theme),
          ]}
          testID="auth_card"
        >
          <View style={styles.heroAccent} testID="auth_accent" />
          <Text
            style={[
              styles.title,
              { textAlign: isRTL ? 'right' : 'left' },
              textWritingDirection(isRTL),
            ]}
            testID="auth_text_title"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                { textAlign: isRTL ? 'right' : 'left' },
                textWritingDirection(isRTL),
              ]}
              testID="auth_text_subtitle"
            >
              {subtitle}
            </Text>
          ) : null}
          {children}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centerColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  centerColumnWide: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  heroAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: theme.colors.primary,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
});
