import { FileStack } from 'lucide-react-native';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { grid, space } from '../constants/spacing';
import type { Document } from '../types/document';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/colors';

import { DocumentListItem } from './DocumentListItem';

type Props = {
  documents: Document[];
  onDocumentPress: (document: Document) => void;
  /** When set, rows can be swiped to delete (after confirmation). */
  onDocumentDelete?: (document: Document) => void | Promise<void>;
  emptyTitle?: string;
  emptySubtitle?: string;
  ListHeaderComponent?: ReactElement | null;
  ListFooterComponent?: ReactElement | null;
};

export function DocumentList({
  documents,
  onDocumentPress,
  onDocumentDelete,
  emptyTitle,
  emptySubtitle,
  ListHeaderComponent,
  ListFooterComponent,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createListStyles(colors), [colors]);

  const renderItem: ListRenderItem<Document> = useCallback(
    ({ item, index }) => {
      const isLast = index === documents.length - 1;
      if (onDocumentDelete) {
        return (
          <DocumentSwipeRow
            document={item}
            isLast={isLast}
            onPress={onDocumentPress}
            onDeleteConfirmed={onDocumentDelete}
            colors={colors}
            styles={styles}
          />
        );
      }
      return (
        <DocumentListItem document={item} isLast={isLast} onPress={onDocumentPress} />
      );
    },
    [colors, documents.length, onDocumentDelete, onDocumentPress, styles],
  );

  if (documents.length === 0) {
    const title = emptyTitle ?? t('list.emptyNoDocs');
    const subtitle = emptySubtitle ?? t('list.emptyNoDocsHint');
    return (
      <View style={styles.emptyWrap}>
        {ListHeaderComponent}
        <View style={styles.emptyCard}>
          <FileStack size={space.u5} color={colors.placeholder} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>{title}</Text>
          <Text style={styles.emptySubtitle}>{subtitle}</Text>
        </View>
        {ListFooterComponent}
      </View>
    );
  }

  return (
    <FlatList
      data={documents}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={styles.listContent}
      style={styles.list}
    />
  );
}

type SwipeStyles = ReturnType<typeof createListStyles>;

function DocumentSwipeRow({
  document,
  isLast,
  onPress,
  onDeleteConfirmed,
  colors,
  styles,
}: {
  document: Document;
  isLast: boolean;
  onPress: (document: Document) => void;
  onDeleteConfirmed: (document: Document) => void | Promise<void>;
  colors: ThemeColors;
  styles: SwipeStyles;
}) {
  const { t } = useTranslation();
  const swipeRef = useRef<Swipeable>(null);

  const confirmDelete = () => {
    Alert.alert(
      t('editor.deleteConfirmTitle'),
      t('editor.deleteConfirmMessage', { name: document.name }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => swipeRef.current?.close(),
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            swipeRef.current?.close();
            void Promise.resolve(onDeleteConfirmed(document)).then(() => {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            });
          },
        },
      ],
    );
  };

  const renderRightActions = () => (
    <View style={styles.rightActionWrap} accessibilityElementsHidden>
      <TouchableOpacity
        style={[styles.rightActionBtn, { backgroundColor: colors.destructive }]}
        onPress={confirmDelete}
        accessibilityRole="button"
        accessibilityLabel={t('list.swipeDeleteA11y')}
      >
        <Text style={styles.rightActionText}>{t('common.delete')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      friction={2}
      overshootRight={false}
      onSwipeableWillOpen={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <DocumentListItem document={document} isLast={isLast} onPress={onPress} />
    </Swipeable>
  );
}

function createListStyles(colors: ThemeColors) {
  return StyleSheet.create({
    list: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingTop: space.u1,
      paddingBottom: space.u4,
      paddingHorizontal: space.u2,
    },
    emptyWrap: {
      flex: 1,
      backgroundColor: colors.background,
    },
    emptyCard: {
      marginHorizontal: space.u2,
      marginTop: space.u2,
      paddingVertical: space.u5,
      paddingHorizontal: space.u3,
      borderRadius: space.u1 + space.half,
      backgroundColor: colors.card,
      alignItems: 'center',
      gap: space.u1,
    },
    emptyTitle: {
      marginTop: space.u1,
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    emptySubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    rightActionWrap: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    rightActionBtn: {
      justifyContent: 'center',
      width: grid(11),
      alignSelf: 'stretch',
      paddingHorizontal: space.u2,
    },
    rightActionText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
}
