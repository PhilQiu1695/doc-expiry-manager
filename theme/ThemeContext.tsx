import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { type ColorSchemeName, useColorScheme } from 'react-native';

import { STORAGE_THEME } from '../constants/storageKeys';

import { darkColors, lightColors, type ThemeColors } from './colors';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedScheme: 'light' | 'dark';
  colors: ThemeColors;
  setPreference: (p: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveScheme(pref: ThemePreference, system: ColorSchemeName): 'light' | 'dark' {
  if (pref === 'system') return system === 'dark' ? 'dark' : 'light';
  return pref;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_THEME).then((raw) => {
      if (raw === 'light' || raw === 'dark' || raw === 'system') {
        setPreferenceState(raw);
      }
    });
  }, []);

  const setPreference = useCallback(async (p: ThemePreference) => {
    setPreferenceState(p);
    await AsyncStorage.setItem(STORAGE_THEME, p);
  }, []);

  const resolvedScheme = resolveScheme(preference, systemScheme ?? 'light');

  const colors = useMemo(
    () => (resolvedScheme === 'dark' ? darkColors : lightColors),
    [resolvedScheme],
  );

  const value = useMemo(
    (): ThemeContextValue => ({
      preference,
      resolvedScheme,
      colors,
      setPreference,
    }),
    [preference, resolvedScheme, colors, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
