import { ChevronRight } from 'lucide-react-native';
import type { TFunction } from 'i18next';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from './CategoryIcon';
import { grid, space } from '../constants/spacing';
import type { Document } from '../types/document';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/colors';
import {
  daysRemaining,
  formatExpiryLabel,
  isUrgentWindow,
} from '../utils/dates';

type Props = {
  document: Document;
  isLast?: boolean;
  onPress: (document: Document) => void;
};

function badgeLabel(days: number, t: TFunction): string {
  if (days < 0) return t('daysBadge.expired');
  if (days === 0) return t('daysBadge.today');
  if (days === 1) return t('daysBadge.oneDay');
  return t('daysBadge.days', { count: days });
}

export function DocumentListItem({ document, isLast, onPress }: Props) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createItemStyles(colors), [colors]);

  const remaining = daysRemaining(document.expiryDate);
  const urgent = isUrgentWindow(remaining);
  const holderLine = document.holder.trim();
  const hasIssue = document.issueDate != null && document.issueDate.length > 0;
  const hasComments = document.comments.trim().length > 0;
  const showMeta = Boolean(holderLine || hasIssue);

  const locale = i18n.language === 'zh' ? 'zh-CN' : 'en-US';
  const expiryFormatted = formatExpiryLabel(document.expiryDate, locale);
  const expiresLine = t('listItem.expires', { date: expiryFormatted });

  const issueFormatted = hasIssue
    ? formatExpiryLabel(document.issueDate!, locale)
    : '';

  return (
    <View style={[styles.outer, !isLast && styles.outerBorder]}>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(document);
        }}
        accessibilityRole="button"
        style={({ pressed }) => [pressed && { opacity: 0.85 }]}
      >
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <CategoryIcon category={document.category} size={22} color={colors.iconMuted} />
          </View>
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={2}>
              {document.name}
            </Text>
            <Text style={styles.subtitle}>{expiresLine}</Text>
          </View>
          <View style={[styles.badge, urgent ? styles.badgeUrgent : styles.badgeNeutral]}>
            <Text style={[styles.badgeText, urgent ? styles.badgeTextUrgent : styles.badgeTextNeutral]}>
              {badgeLabel(remaining, t)}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.chevron} strokeWidth={2} />
        </View>

        {showMeta ? (
          <View style={styles.meta}>
            {holderLine ? (
              <Text style={styles.metaLine}>
                <Text style={styles.metaKey}>{t('listItem.holder')}</Text>
                {holderLine}
              </Text>
            ) : null}
            {hasIssue ? (
              <Text style={styles.metaLine}>
                <Text style={styles.metaKey}>{t('listItem.issued')}</Text>
                {issueFormatted}
              </Text>
            ) : null}
          </View>
        ) : null}

        {hasComments ? (
          <View style={styles.commentsBox}>
            <Text style={styles.commentsText} numberOfLines={5}>
              {document.comments.trim()}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

function createItemStyles(colors: ThemeColors) {
  return StyleSheet.create({
    outer: {
      backgroundColor: colors.card,
    },
    outerBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: space.u2,
      paddingHorizontal: space.u2,
      paddingBottom: space.half,
      minHeight: grid(7),
    },
    meta: {
      marginHorizontal: space.u2,
      marginBottom: space.u2,
      marginLeft: grid(7),
      paddingHorizontal: space.u2,
      paddingVertical: space.u2,
      backgroundColor: colors.metaBg,
      borderRadius: space.u1,
      gap: space.half,
    },
    metaLine: {
      fontSize: 14,
      lineHeight: 19,
      color: colors.text,
    },
    metaKey: {
      color: colors.textSecondary,
      fontWeight: '500',
    },
    commentsBox: {
      marginHorizontal: space.u2,
      marginBottom: space.u2,
      marginLeft: grid(7),
      paddingHorizontal: space.u2,
      paddingVertical: space.u2,
      backgroundColor: colors.metaBg,
      borderRadius: space.u1,
    },
    commentsText: {
      fontSize: 15,
      lineHeight: 20,
      color: colors.text,
    },
    iconWrap: {
      marginRight: space.u2,
      alignSelf: 'flex-start',
      marginTop: space.half,
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      letterSpacing: -0.41,
    },
    subtitle: {
      marginTop: space.half,
      fontSize: 15,
      fontWeight: '400',
      color: colors.textSecondary,
      letterSpacing: -0.24,
    },
    badge: {
      marginRight: space.u1,
      paddingHorizontal: space.u1,
      paddingVertical: space.half,
      borderRadius: space.u2,
      maxWidth: grid(15),
      alignSelf: 'flex-start',
      marginTop: space.half,
    },
    badgeNeutral: {
      backgroundColor: colors.badgeNeutralBg,
    },
    badgeUrgent: {
      backgroundColor: colors.badgeUrgentBg,
    },
    badgeText: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: -0.08,
    },
    badgeTextNeutral: {
      color: colors.badgeNeutralText,
    },
    badgeTextUrgent: {
      color: colors.badgeUrgentText,
    },
  });
}
