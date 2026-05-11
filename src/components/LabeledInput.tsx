import { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { isRTL } from '../services/i18n';
import { theme } from '../theme/theme';

type LabeledInputProps = {
  label: string;
} & TextInputProps;

export function LabeledInput({ label, style, testID, ...rest }: LabeledInputProps) {
  const inputAlign = useMemo(() => {
    if (rest.keyboardType === 'email-address' || rest.autoCapitalize === 'none') {
      return 'left';
    }
    return isRTL ? 'right' : 'left';
  }, [rest.keyboardType, rest.autoCapitalize]);

  return (
    <View style={styles.wrap} testID={testID ? `${testID}_wrap` : undefined}>
      <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]} testID={testID ? `${testID}_label` : undefined}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={theme.colors.textSecondary}
        style={[
          styles.input,
          { textAlign: inputAlign, writingDirection: inputAlign === 'right' ? 'rtl' : 'ltr' },
          style,
        ]}
        testID={testID}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: 17,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
});
