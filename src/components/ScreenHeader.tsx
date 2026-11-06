import { useNavigation } from '@react-navigation/native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/PreferencesContext';
import { isRTL, t } from '../services/i18n';
import { goBackOrHome } from '../navigation/goBack';
import { rowDir } from '../utils/platformStyles';
import { IconButton } from './ui';

/** Top bar: back button (pointing the right way in RTL), centred title, optional action. */
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 6, backgroundColor: theme.colors.background, flexDirection: rowDir(isRTL) }]}>
      <IconButton
        icon={isRTL ? 'chevron-forward' : 'chevron-back'}
        size={22}
        variant="surface"
        onPress={() => goBackOrHome(navigation)}
        label={t('common.back')}
        testID="header_btn_back"
      />
      <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, gap: 10 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  right: { width: 40, alignItems: 'center' },
});
