import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { STORAGE_LOCALE } from '../constants/storageKeys';
import en from '../locales/en';
import zh from '../locales/zh';

const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en';
const initialLng = deviceLang.startsWith('zh') ? 'zh' : 'en';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: initialLng,
  fallbackLng: 'en',
  compatibilityJSON: 'v4',
  interpolation: {
    escapeValue: false,
  },
});

export async function loadStoredLocale(): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_LOCALE);
  if (raw === 'en' || raw === 'zh') {
    await i18n.changeLanguage(raw);
  }
}

export async function persistLocale(code: 'en' | 'zh'): Promise<void> {
  await AsyncStorage.setItem(STORAGE_LOCALE, code);
  await i18n.changeLanguage(code);
}

export default i18n;
