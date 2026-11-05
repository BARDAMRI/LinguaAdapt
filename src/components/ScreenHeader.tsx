import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/PreferencesContext';
import { isRTL, t } from '../services/i18n';
import { rowDir } from '../utils/platformStyles';

/** Simple top bar with a back arrow that points the right way in RTL. */
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 6, backgroundColor: theme.colors.background, flexDirection: rowDir(isRTL) }]}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel={t('common.back')} testID="header_btn_back">
        <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={28} color={theme.colors.primary} />
      </Pressable>
      <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  right: { minWidth: 28, alignItems: 'center' },
});
