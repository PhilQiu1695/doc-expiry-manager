import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Plus, Search, Settings, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { DocumentList } from '../components/DocumentList';
import { space } from '../constants/spacing';
import { useDocumentsContext } from '../context/DocumentsContext';
import type { RootStackParamList } from '../navigation/types';
import { scheduleTestNotification } from '../lib/expiryReminder';
import type { Document } from '../types/document';
import { documentMatchesSearch } from '../utils/documentSearch';
import { toIsoDateString } from '../utils/dates';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/colors';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { documents, isReady, addDocument, removeDocument } = useDocumentsContext();
  const [searchQuery, setSearchQuery] = useState('');

  const styles = useMemo(() => createHomeStyles(colors), [colors]);

  const filtered = useMemo(
    () => documents.filter((d) => documentMatchesSearch(d, searchQuery)),
    [documents, searchQuery],
  );

  const noSearchResults =
    documents.length > 0 && filtered.length === 0 && searchQuery.trim().length > 0;

  const openNew = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('DocumentEditor');
  };

  const openEdit = (doc: Document) => {
    navigation.navigate('DocumentEditor', { documentId: doc.id });
  };

  const openSettings = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Settings');
  };

  const addSampleSoon = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const soon = new Date();
    soon.setDate(soon.getDate() + 14);
    const iso = soon.toISOString().slice(0, 10);
    void addDocument({
      category: 'passport',
      name: t('samples.passportName'),
      holder: 'Mom',
      issueDate: null,
      expiryDate: iso,
      comments: t('samples.passportComment'),
    });
  };

  const addSampleLater = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const later = new Date();
    later.setDate(later.getDate() + 120);
    const iso = later.toISOString().slice(0, 10);
    const issued = new Date();
    issued.setFullYear(issued.getFullYear() - 2);
    void addDocument({
      category: 'insurance',
      name: t('samples.insuranceName'),
      holder: 'Mom',
      issueDate: toIsoDateString(issued),
      expiryDate: iso,
      comments: '',
    });
  };

  const tryTestNotification = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await scheduleTestNotification();
    if (!ok) {
      Alert.alert(t('home.notificationsOffTitle'), t('home.notificationsOffMessage'));
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>{t('home.title')}</Text>
        <TouchableOpacity
          onPress={openSettings}
          style={styles.iconBtn}
          accessibilityLabel={t('settings.title')}
          hitSlop={12}
        >
          <Settings size={24} color={colors.tint} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={openNew}
          style={styles.iconBtn}
          accessibilityLabel={t('home.addButtonA11y')}
          hitSlop={12}
        >
          <Plus size={26} color={colors.tint} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
      {!isReady ? (
        <Text style={styles.loading}>{t('common.loading')}</Text>
      ) : (
        <>
          <View style={styles.searchWrap}>
            <Search size={20} color={colors.iconMuted} strokeWidth={2} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('home.searchPlaceholder')}
              placeholderTextColor={colors.placeholder}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="never"
              accessibilityLabel={t('home.searchPlaceholder')}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={10}
                accessibilityLabel={t('common.cancel')}
              >
                <X size={20} color={colors.iconMuted} strokeWidth={2} />
              </TouchableOpacity>
            ) : null}
          </View>
          <DocumentList
            documents={filtered}
            onDocumentPress={openEdit}
            onDocumentDelete={(doc) => void removeDocument(doc.id)}
            emptyTitle={noSearchResults ? t('list.emptyNoMatches') : undefined}
            emptySubtitle={noSearchResults ? t('list.emptyNoMatchesHint') : undefined}
            ListFooterComponent={
              <View style={styles.demo}>
                <Text style={styles.demoLabel}>{t('home.trySamples')}</Text>
                <View style={styles.demoRow}>
                  <TouchableOpacity style={styles.btn} onPress={addSampleSoon}>
                    <Text style={styles.btnText}>{t('home.under30Days')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btn} onPress={addSampleLater}>
                    <Text style={styles.btnText}>{t('home.days120')}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.demoLabel}>{t('home.notificationsSection')}</Text>
                <TouchableOpacity style={[styles.btn, styles.btnWide]} onPress={tryTestNotification}>
                  <Text style={styles.btnText}>{t('home.testAlert')}</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

function createHomeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingLeft: space.u3,
      paddingRight: space.u1,
      paddingTop: space.u1,
      paddingBottom: space.half,
      gap: space.half,
    },
    pageTitle: {
      fontSize: 34,
      fontWeight: '700',
      letterSpacing: 0.37,
      color: colors.text,
      flex: 1,
    },
    iconBtn: {
      padding: space.u1,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: space.u2,
      marginBottom: space.u1,
      paddingHorizontal: space.u2,
      paddingVertical: space.u2,
      backgroundColor: colors.searchBg,
      borderRadius: space.u2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    searchIcon: {
      marginRight: space.u1,
    },
    searchInput: {
      flex: 1,
      fontSize: 17,
      color: colors.text,
      paddingVertical: 0,
      minHeight: 22,
    },
    loading: {
      paddingHorizontal: space.u3,
      paddingTop: space.u3,
      fontSize: 17,
      color: colors.textSecondary,
    },
    demo: {
      marginTop: space.u3,
      paddingHorizontal: space.u3,
      gap: space.u2,
    },
    demoLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    demoRow: {
      flexDirection: 'row',
      gap: space.u2,
    },
    btnWide: {
      alignSelf: 'stretch',
    },
    btn: {
      flex: 1,
      backgroundColor: colors.card,
      paddingVertical: space.u2,
      borderRadius: space.u2,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    btnText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.tint,
    },
  });
}
