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
import type { AppNav } from '../navigation/types';
import { isRTL, t } from '../services/i18n';
import { theme } from '../theme/theme';

export function SignupScreen() {
  const navigation = useNavigation<AppNav>();
  const { signUp, authError, clearAuthError } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit() {
    clearAuthError();
    setLocalError(null);
    setNotice(null);
    if (password !== confirm) {
      setLocalError(t('auth.mismatchedPassword'));
      return;
    }
    setSubmitting(true);
    try {
      const result = await signUp(email.trim(), password, displayName.trim());
      if (result.needsEmailConfirmation) {
        setNotice(t('auth.emailConfirm'));
      } else if (result.ok) {
        navigation.popToTop();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const message = localError || authError;

  return (
    <AuthLayout title={t('auth.signupTitle')} subtitle={t('auth.signupSubtitle')}>
      {message ? (
        <Text style={[styles.error, { textAlign: isRTL ? 'right' : 'left' }]} testID="signup_text_error">
          {message}
        </Text>
      ) : null}
      {notice ? (
        <Text style={[styles.notice, { textAlign: isRTL ? 'right' : 'left' }]} testID="signup_text_notice">
          {notice}
        </Text>
      ) : null}

      <LabeledInput
        label={t('auth.displayName')}
        value={displayName}
        onChangeText={setDisplayName}
        autoCorrect
        textContentType="name"
        testID="signup_input_name"
      />
      <LabeledInput
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        testID="signup_input_email"
      />
      <LabeledInput
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="newPassword"
        testID="signup_input_password"
      />
      <LabeledInput
        label={t('auth.confirmPassword')}
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        textContentType="newPassword"
        testID="signup_input_confirm"
      />

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
          submitting && styles.disabled,
        ]}
        onPress={onSubmit}
        disabled={submitting}
        testID="signup_btn_submit"
      >
        {submitting ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <Text style={styles.primaryButtonLabel}>{t('auth.signUp')}</Text>
        )}
      </Pressable>

      <View
        style={[
          styles.switchRow,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
        testID="signup_row_switch"
      >
        <Text style={styles.switchText} testID="signup_text_has_account">{t('auth.hasAccount')}</Text>
        <Pressable
          onPress={() => {
            clearAuthError();
            navigation.replace('Login');
          }}
          hitSlop={8}
          testID="signup_btn_login"
        >
          <Text style={styles.linkAccent}>{t('auth.switchLogin')}</Text>
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
  notice: {
    color: theme.colors.primary,
    fontSize: 14,
    marginBottom: theme.spacing.md,
    fontWeight: '500',
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