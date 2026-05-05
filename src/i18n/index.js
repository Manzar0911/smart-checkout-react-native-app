import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import en from './en.json';
import hi from './hi.json';

const i18n = new I18n({ en, hi });

// Set defaults
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Detect device language, fallback to English
const deviceLocale = getLocales()?.[0]?.languageCode || 'en';
i18n.locale = deviceLocale === 'hi' ? 'hi' : 'en';

const LANGUAGE_KEY = 'app_language';

/**
 * Load saved language preference from AsyncStorage.
 * Should be called once at app startup.
 */
export const loadSavedLanguage = async () => {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
      i18n.locale = savedLang;
      return savedLang;
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
  return i18n.locale;
};

/**
 * Set the active language and persist to AsyncStorage.
 * @param {'en' | 'hi'} lang
 */
export const setLanguage = async (lang) => {
  try {
    i18n.locale = lang;
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

/**
 * Get the current locale code.
 * @returns {'en' | 'hi'}
 */
export const getCurrentLanguage = () => i18n.locale;

/**
 * Translate a key. Supports interpolation via second argument.
 * Usage: t('cannot_remove_stock', { qty: 5, stock: 3 })
 * @param {string} key
 * @param {object} [options]
 * @returns {string}
 */
export const t = (key, options) => i18n.t(key, options);

export default i18n;
