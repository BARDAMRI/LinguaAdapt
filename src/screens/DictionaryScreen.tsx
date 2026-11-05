import { StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppTheme } from '../context/PreferencesContext';
import { t } from '../services/i18n';

export function DictionaryScreen() {
  const theme = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={t('home.dictionary')} />
      <Text style={[styles.soon, { color: theme.colors.textSecondary }]}>{t('home.comingSoon')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  soon: { textAlign: 'center', marginTop: 40, fontSize: 16 },
});
