import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../context/PreferencesContext';
import { cardShadowStyle } from '../utils/platformStyles';

/** The app mark: Hebrew alef and Latin A on the brand square (matches the app icon). */
export function BrandMark({ size = 88 }: { size?: number }) {
  const theme = useAppTheme();
  const glyph = Math.round(size * 0.42);
  return (
    <View
      style={[
        styles.box,
        cardShadowStyle(theme, true),
        { width: size, height: size, borderRadius: Math.round(size * 0.27), backgroundColor: theme.colors.primary },
      ]}
      accessibilityLabel="LinguaAdapt"
    >
      <View style={[styles.glow, { width: size * 0.9, height: size * 0.9, borderRadius: size, top: -size * 0.35, right: -size * 0.3 }]} />
      <View style={styles.row}>
        <Text style={[styles.glyph, { fontSize: glyph, lineHeight: glyph * 1.25 }]}>א</Text>
        <Text style={[styles.glyph, styles.latin, { fontSize: glyph, lineHeight: glyph * 1.25 }]}>A</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glow: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.12)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  glyph: { color: '#FFFFFF', fontWeight: '800' },
  latin: { color: 'rgba(255,255,255,0.78)' },
});
