import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type Locale,
  resolveLocale,
  SUPPORTED_LOCALES,
  translate,
  type TranslationKey,
  type TranslationParams,
} from './translations';

const STORAGE_KEY = 'exa-trainer-locale';

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ja';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (SUPPORTED_LOCALES.some((locale) => locale === saved)) return saved as Locale;
  return resolveLocale(window.navigator.language);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const t = useCallback((key: TranslationKey, params?: TranslationParams) => translate(locale, key, params), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translate(locale, 'documentTitle');
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo<I18nValue>(() => ({ locale, setLocale, t }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used within I18nProvider');
  return value;
}
