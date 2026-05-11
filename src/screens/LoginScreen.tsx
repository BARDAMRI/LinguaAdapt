import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthLayout } from '../components/AuthLayout';
import { LabeledInput } from '../components/LabeledInput';
import { useAuth } from '../context/AuthContext';
import type { AuthNav } from '../navigation/types';
import { isRTL, t } from '../services/i18n';
import { theme } from '../theme/theme';

export function LoginScreen() {
  const navigation = useNavigation<AuthNav>();
  const { signIn, authError, clearAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    clearAuthError();
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      {authError ? (
        <Text style={[styles.error, { textAlign: isRTL ? 'right' : 'left' }]} testID="login_text_error">
          {authError}
        </Text>
      ) : null}

      <LabeledInput
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        testID="login_input_email"
      />
      <LabeledInput
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="password"
        testID="login_input_password"
      />

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
          submitting && styles.disabled,
        ]}
        onPress={onSubmit}
        disabled={submitting}
        testID="login_btn_submit"
      >
        {submitting ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <Text style={styles.primaryButtonLabel}>{t('auth.logIn')}</Text>
        )}
      </Pressable>

      <View
        style={[
          styles.switchRow,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
        testID="login_row_switch"
      >
        <Text style={styles.switchText} testID="login_text_no_account">{t('auth.noAccount')}</Text>
        <Pressable
          onPress={() => {
            clearAuthError();
            navigation.navigate('Signup');
          }}
          hitSlop={8}
          testID="login_btn_signup"
        >
          <Text style={styles.linkAccent}>{t('auth.switchSignup')}</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  error: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  primaryButtonPressed: {
    backgroundColor: theme.colors.primaryMuted,
  },
  disabled: {
    opacity: 0.7,
  },
  primaryButtonLabel: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
  switchRow: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  switchText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  linkAccent: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
