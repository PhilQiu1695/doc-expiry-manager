import * as Notifications from 'expo-notifications';
import {
  SchedulableTriggerInputTypes,
  type DateTriggerInput,
  type NotificationContentInput,
  type TimeIntervalTriggerInput,
} from 'expo-notifications';
import { Platform } from 'react-native';

import i18n from '../i18n';
import type { Document } from '../types/document';
import { parseLocalDate } from '../utils/dates';

export const EXPIRY_REMINDER_ANDROID_CHANNEL_ID = 'expiry-reminders';

/** Single reminder ~30 days before expiry (09:00 local). */
export const EARLY_REMINDER_OFFSET_DAYS = [30] as const;

/**
 * Daily reminders at 09:00 local on each day from 7 days before expiry through expiry day.
 * (Offsets are “days before expiry” on that calendar morning.)
 */
export const FINAL_WEEK_OFFSET_DAYS = [7, 6, 5, 4, 3, 2, 1, 0] as const;

function earlyReminderIdentifier(documentId: string): string {
  return `expiry-reminder-30d-${documentId}`;
}

function finalWeekReminderIdentifier(documentId: string, offsetDays: number): string {
  return `expiry-reminder-final-${offsetDays}d-${documentId}`;
}

/** Legacy id from older builds (single “one week” ping); cancel so it doesn’t duplicate. */
function legacySevenDayIdentifier(documentId: string): string {
  return `expiry-reminder-7d-${documentId}`;
}

/**
 * 09:00 local on the calendar day that is `daysBeforeExpiry` days before the expiry date.
 */
export function getReminderDateAtNineAm(expiryIso: string, daysBeforeExpiry: number): Date {
  const expiry = parseLocalDate(expiryIso);
  expiry.setHours(9, 0, 0, 0);
  const reminder = new Date(expiry);
  reminder.setDate(reminder.getDate() - daysBeforeExpiry);
  return reminder;
}

function buildNotificationBody(doc: Document): string {
  const locale = i18n.language === 'zh' ? 'zh-CN' : undefined;
  const dateStr = parseLocalDate(doc.expiryDate).toLocaleDateString(locale);
  const holder = doc.holder.trim();
  if (holder) {
    return i18n.t('notifications.bodyWithHolder', {
      name: doc.name,
      holder,
      date: dateStr,
    });
  }
  return i18n.t('notifications.bodyNoHolder', { name: doc.name, date: dateStr });
}

function titleForFinalWeekOffset(offsetDays: number): string {
  if (offsetDays === 0) return i18n.t('notifications.titleWeekToday');
  if (offsetDays === 1) return i18n.t('notifications.titleWeekTomorrow');
  return i18n.t('notifications.titleWeekDays', { count: offsetDays });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(EXPIRY_REMINDER_ANDROID_CHANNEL_ID, {
    name: 'Expiry reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF3B30',
  });
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

/**
 * Schedules local notifications:
 * - ~30 days before expiry (09:00 local)
 * - Every day at 09:00 during the final week (7…0 days before expiry, including expiry morning)
 *
 * Offsets in the past are skipped. No-ops on web.
 */
export async function scheduleExpiryReminder(doc: Document): Promise<void> {
  if (Platform.OS === 'web') return;

  await ensureAndroidChannel();

  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  await cancelExpiryReminder(doc.id);

  const now = new Date().getTime();
  const body = buildNotificationBody(doc);

  for (const offsetDays of EARLY_REMINDER_OFFSET_DAYS) {
    const reminderDate = getReminderDateAtNineAm(doc.expiryDate, offsetDays);
    if (reminderDate.getTime() <= now) continue;

    const content: NotificationContentInput = {
      title: i18n.t('notifications.title30'),
      body,
      sound: true,
      data: { documentId: doc.id, reminderOffsetDays: offsetDays, kind: 'early' },
    };

    const trigger: DateTriggerInput = {
      type: SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
      ...(Platform.OS === 'android' ? { channelId: EXPIRY_REMINDER_ANDROID_CHANNEL_ID } : {}),
    };

    await Notifications.scheduleNotificationAsync({
      identifier: earlyReminderIdentifier(doc.id),
      content,
      trigger,
    });
  }

  for (const offsetDays of FINAL_WEEK_OFFSET_DAYS) {
    const reminderDate = getReminderDateAtNineAm(doc.expiryDate, offsetDays);
    if (reminderDate.getTime() <= now) continue;

    const content: NotificationContentInput = {
      title: titleForFinalWeekOffset(offsetDays),
      body,
      sound: true,
      data: { documentId: doc.id, reminderOffsetDays: offsetDays, kind: 'final-week' },
    };

    const trigger: DateTriggerInput = {
      type: SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
      ...(Platform.OS === 'android' ? { channelId: EXPIRY_REMINDER_ANDROID_CHANNEL_ID } : {}),
    };

    await Notifications.scheduleNotificationAsync({
      identifier: finalWeekReminderIdentifier(doc.id, offsetDays),
      content,
      trigger,
    });
  }
}

/** Cancels early + final-week reminders for a document (and legacy 7-day id). */
export async function cancelExpiryReminder(documentId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.cancelScheduledNotificationAsync(legacySevenDayIdentifier(documentId)).catch(
    () => {},
  );
  await Notifications.cancelScheduledNotificationAsync(earlyReminderIdentifier(documentId)).catch(
    () => {},
  );

  for (const offsetDays of FINAL_WEEK_OFFSET_DAYS) {
    await Notifications.cancelScheduledNotificationAsync(
      finalWeekReminderIdentifier(documentId, offsetDays),
    ).catch(() => {});
  }
}

/**
 * Fires a **local** notification in a few seconds so you can confirm alerts / Notification Center.
 * Returns `true` if scheduled. No-ops on web or without permission.
 */
export async function scheduleTestNotification(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  await ensureAndroidChannel();
  const granted = await ensureNotificationPermissions();
  if (!granted) return false;

  const trigger: TimeIntervalTriggerInput = {
    type: SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: 5,
    repeats: false,
    ...(Platform.OS === 'android' ? { channelId: EXPIRY_REMINDER_ANDROID_CHANNEL_ID } : {}),
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('notifications.testTitle'),
      body: i18n.t('notifications.testBody'),
      sound: true,
    },
    trigger,
  });

  return true;
}
