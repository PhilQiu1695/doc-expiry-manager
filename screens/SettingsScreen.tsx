import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { space } from '../constants/spacing';
import { persistLocale } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { useTheme, type ThemePreference } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const themeOptions: { value: ThemePreference; labelKey: string }[] = [
  { value: 'light', labelKey: 'settings.themeLight' },
  { value: 'dark', labelKey: 'settings.themeDark' },
  { value: 'system', labelKey: 'settings.themeSystem' },
];

const langOptions: { code: 'en' | 'zh'; labelKey: string }[] = [
  { code: 'en', labelKey: 'settings.langEnglish' },
  { code: 'zh', labelKey: 'settings.langChinese' },
];

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation();
  const { colors, preference: themePref, setPreference: setThemePref } = useTheme();

  const styles = useMemo(() => createSettingsStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
        >
          <ChevronLeft size={28} color={colors.tint} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
        <View style={styles.card}>
          {langOptions.map((opt, i) => (
            <View key={opt.code}>
              {i > 0 ? <View style={styles.hairline} /> : null}
              <TouchableOpacity
                style={styles.row}
                onPress={() => void persistLocale(opt.code)}
                accessibilityRole="button"
              >
                <Text style={styles.rowText}>{t(opt.labelKey)}</Text>
                {i18n.language === opt.code ? (
                  <Text style={styles.check}>✓</Text>
                ) : null}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t('settings.appearance')}</Text>
        <View style={styles.card}>
          {themeOptions.map((opt, i) => (
            <View key={opt.value}>
              {i > 0 ? <View style={styles.hairline} /> : null}
              <TouchableOpacity
                style={styles.row}
                onPress={() => void setThemePref(opt.value)}
                accessibilityRole="button"
              >
                <Text style={styles.rowText}>{t(opt.labelKey)}</Text>
                {themePref === opt.value ? <Text style={styles.check}>✓</Text> : null}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createSettingsStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: space.u1,
      paddingVertical: space.u1,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    backBtn: {
      padding: space.u1,
    },
    headerTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 44,
    },
    scroll: {
      paddingBottom: space.u5,
    },
    sectionLabel: {
      marginLeft: space.u3,
      marginTop: space.u3,
      marginBottom: space.u1,
      fontSize: 13,
      fontWeight: '400',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: -0.08,
    },
    card: {
      marginHorizontal: space.u2,
      backgroundColor: colors.card,
      borderRadius: space.u2,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: space.u2,
      paddingHorizontal: space.u2,
    },
    rowText: {
      fontSize: 17,
      color: colors.text,
    },
    check: {
      fontSize: 18,
      color: colors.tint,
      fontWeight: '600',
    },
    hairline: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: space.u2,
    },
  });
}
