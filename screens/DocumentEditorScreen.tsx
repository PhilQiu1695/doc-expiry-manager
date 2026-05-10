import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryIcon } from '../components/CategoryIcon';
import { DOCUMENT_CATEGORY_IDS } from '../constants/documentCategories';
import { grid, space } from '../constants/spacing';
import { useDocumentsContext } from '../context/DocumentsContext';
import type { RootStackParamList } from '../navigation/types';
import type { Document, DocumentCategoryId } from '../types/document';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/colors';
import { parseLocalDate, toIsoDateString } from '../utils/dates';

type Props = NativeStackScreenProps<RootStackParamList, 'DocumentEditor'>;

export function DocumentEditorScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(() => createEditorStyles(colors), [colors]);
  const pickerTheme = resolvedScheme === 'dark' ? 'dark' : 'light';
  const dateLocale = i18n.language === 'zh' ? 'zh-CN' : 'en-US';

  const documentId = route.params?.documentId;
  const { documents, isReady, addDocument, updateDocument, removeDocument } = useDocumentsContext();

  const initial = useMemo<Document | null>(
    () => (documentId ? documents.find((d) => d.id === documentId) ?? null : null),
    [documentId, documents],
  );

  const isEdit = initial != null;

  const [name, setName] = useState('');
  const [holder, setHolder] = useState('');
  const [expiryIso, setExpiryIso] = useState(() => toIsoDateString(new Date()));
  const [expiryPicker, setExpiryPicker] = useState(() => new Date());
  const [issueIso, setIssueIso] = useState<string | null>(null);
  const [issuePicker, setIssuePicker] = useState(() => new Date());
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showIssuePicker, setShowIssuePicker] = useState(false);
  const [comments, setComments] = useState('');
  const [category, setCategory] = useState<DocumentCategoryId>('other');
  const [saving, setSaving] = useState(false);

  /** When the open document disappears from state (deleted here or elsewhere), close this screen once. */
  useEffect(() => {
    if (!isReady || !documentId) return;
    if (!documents.some((d) => d.id === documentId)) {
      navigation.goBack();
    }
  }, [isReady, documentId, documents, navigation]);

  useEffect(() => {
    if (documentId && !isReady) return;
    setShowExpiryPicker(false);
    setShowIssuePicker(false);
    if (initial) {
      setCategory(initial.category);
      setName(initial.name);
      setHolder(initial.holder);
      setComments(initial.comments);
      setExpiryIso(initial.expiryDate);
      setExpiryPicker(parseLocalDate(initial.expiryDate));
      if (initial.issueDate) {
        setIssueIso(initial.issueDate);
        setIssuePicker(parseLocalDate(initial.issueDate));
      } else {
        setIssueIso(null);
        setIssuePicker(new Date());
      }
    } else {
      setCategory('other');
      setName('');
      setHolder('');
      setComments('');
      const today = new Date();
      setExpiryPicker(today);
      setExpiryIso(toIsoDateString(today));
      setIssueIso(null);
      setIssuePicker(new Date());
    }
  }, [initial, documentId, isReady]);

  const onClose = () => navigation.goBack();

  const onExpiryChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowExpiryPicker(false);
    if (selected) {
      setExpiryPicker(selected);
      setExpiryIso(toIsoDateString(selected));
    }
  };

  const onIssueChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowIssuePicker(false);
    if (selected) {
      setIssuePicker(selected);
      setIssueIso(toIsoDateString(selected));
    }
  };

  const openIssuePicker = () => {
    setShowExpiryPicker(false);
    setIssuePicker(issueIso ? parseLocalDate(issueIso) : new Date());
    setShowIssuePicker(true);
  };

  const openExpiryPicker = () => {
    setShowIssuePicker(false);
    setShowExpiryPicker(true);
  };

  const clearIssueDate = () => {
    setIssueIso(null);
    setShowIssuePicker(false);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert(t('editor.nameRequiredTitle'), t('editor.nameRequiredMessage'));
      return;
    }
    setSaving(true);
    try {
      if (initial) {
        await updateDocument({
          id: initial.id,
          category,
          name: trimmedName,
          holder: holder.trim(),
          issueDate: issueIso,
          expiryDate: expiryIso,
          comments: comments.trim(),
        });
      } else {
        await addDocument({
          category,
          name: trimmedName,
          holder: holder.trim(),
          issueDate: issueIso,
          expiryDate: expiryIso,
          comments: comments.trim(),
        });
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!initial) return;
    Alert.alert(t('editor.deleteConfirmTitle'), t('editor.deleteConfirmMessage', { name: initial.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void removeDocument(initial.id);
        },
      },
    ]);
  };

  if (documentId && !isReady) {
    return (
      <SafeAreaView style={[styles.safe, styles.loadingWrap]} edges={['top', 'left', 'right', 'bottom']}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={styles.headerBtn}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? t('editor.editTitle') : t('editor.newTitle')}</Text>
          <TouchableOpacity
            onPress={() => void handleSave()}
            disabled={saving}
            hitSlop={12}
            accessibilityRole="button"
          >
            <Text style={[styles.headerBtnPrimary, saving && styles.disabled]}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>{t('editor.category')}</Text>
            {DOCUMENT_CATEGORY_IDS.map((catId, i) => (
              <Fragment key={catId}>
                {i > 0 ? <View style={styles.hairline} /> : null}
                <TouchableOpacity
                  style={styles.categoryRow}
                  onPress={() => setCategory(catId)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === catId }}
                  accessibilityLabel={t(`categories.${catId}`)}
                >
                  <View style={styles.categoryIconWrap}>
                    <CategoryIcon category={catId} size={22} color={colors.iconMuted} />
                  </View>
                  <Text style={styles.categoryLabel}>{t(`categories.${catId}`)}</Text>
                  {category === catId ? (
                    <Text style={styles.categoryCheck} accessibilityElementsHidden>
                      ✓
                    </Text>
                  ) : (
                    <View style={styles.categoryCheckSpacer} />
                  )}
                </TouchableOpacity>
              </Fragment>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>{t('editor.nameType')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('editor.namePlaceholder')}
              placeholderTextColor={colors.placeholder}
              style={styles.input}
              autoCapitalize="sentences"
            />

            <View style={styles.hairline} />

            <Text style={styles.fieldLabel}>{t('editor.holder')}</Text>
            <TextInput
              value={holder}
              onChangeText={setHolder}
              placeholder={t('editor.holderPlaceholder')}
              placeholderTextColor={colors.placeholder}
              style={styles.input}
              autoCapitalize="words"
            />

            <View style={styles.hairline} />

            <Text style={styles.fieldLabel}>{t('editor.issueOptional')}</Text>
            <View style={styles.issueRow}>
              <TouchableOpacity
                style={styles.rowBtn}
                onPress={openIssuePicker}
                accessibilityRole="button"
              >
                <Text style={[styles.rowBtnText, !issueIso && styles.muted]}>
                  {issueIso
                    ? parseLocalDate(issueIso).toLocaleDateString(dateLocale, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : t('editor.notSet')}
                </Text>
                <Text style={styles.rowChevron}>›</Text>
              </TouchableOpacity>
              {issueIso ? (
                <TouchableOpacity onPress={clearIssueDate} hitSlop={10}>
                  <Text style={styles.clearLink}>{t('editor.clear')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {showIssuePicker ? (
              <DateTimePicker
                value={issuePicker}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onIssueChange}
                themeVariant={pickerTheme}
              />
            ) : null}

            <View style={styles.hairline} />

            <Text style={styles.fieldLabel}>{t('editor.expiryDate')}</Text>
            <TouchableOpacity style={styles.rowBtn} onPress={openExpiryPicker} accessibilityRole="button">
              <Text style={styles.rowBtnText}>
                {parseLocalDate(expiryIso).toLocaleDateString(dateLocale, {
                  weekday: 'short',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>

            {showExpiryPicker ? (
              <DateTimePicker
                value={expiryPicker}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onExpiryChange}
                themeVariant={pickerTheme}
              />
            ) : null}
          </View>

          <Text style={styles.sectionLabel}>{t('editor.comments')}</Text>
          <View style={styles.card}>
            <TextInput
              value={comments}
              onChangeText={setComments}
              placeholder={t('editor.commentsPlaceholder')}
              placeholderTextColor={colors.placeholder}
              style={styles.commentsInput}
              multiline
              textAlignVertical="top"
            />
          </View>

          {isEdit ? (
            <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
              <Text style={styles.deleteText}>{t('editor.deleteDoc')}</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createEditorStyles(colors: ThemeColors) {
  return StyleSheet.create({
    loadingWrap: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 17,
      color: colors.textSecondary,
    },
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space.u2,
      paddingVertical: space.u2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
      backgroundColor: colors.background,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
    },
    headerBtn: {
      fontSize: 17,
      color: colors.tint,
    },
    headerBtnPrimary: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.tint,
    },
    disabled: {
      opacity: 0.5,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: space.u2,
      paddingBottom: space.u5,
      gap: space.u2,
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
      paddingHorizontal: space.u2,
      paddingVertical: space.u2,
    },
    fieldLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: space.u1,
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: space.u1,
      minHeight: grid(5),
    },
    categoryIconWrap: {
      width: grid(5),
      alignItems: 'center',
    },
    categoryLabel: {
      flex: 1,
      fontSize: 17,
      color: colors.text,
    },
    categoryCheck: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.tint,
      width: grid(3),
      textAlign: 'right',
    },
    categoryCheckSpacer: {
      width: grid(3),
    },
    input: {
      fontSize: 17,
      color: colors.text,
      paddingVertical: 4,
      minHeight: 36,
    },
    hairline: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginVertical: space.u2,
    },
    rowBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
      minHeight: 36,
      flex: 1,
    },
    rowBtnText: {
      flex: 1,
      fontSize: 17,
      color: colors.text,
    },
    muted: {
      color: colors.placeholder,
    },
    rowChevron: {
      fontSize: 20,
      color: colors.chevron,
      fontWeight: '300',
    },
    issueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.u2,
    },
    clearLink: {
      fontSize: 17,
      color: colors.destructive,
    },
    commentsInput: {
      fontSize: 17,
      color: colors.text,
      minHeight: grid(15),
      paddingTop: space.u1,
      paddingBottom: space.u1,
    },
    deleteBtn: {
      marginTop: space.u4,
      marginHorizontal: space.u2,
      alignItems: 'center',
      paddingVertical: space.u2,
    },
    deleteText: {
      fontSize: 17,
      fontWeight: '400',
      color: colors.destructive,
    },
  });
}
