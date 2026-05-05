import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadSavedLanguage, setLanguage as setI18nLanguage, getCurrentLanguage, t as translate } from '../i18n';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getCurrentLanguage());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const savedLang = await loadSavedLanguage();
      setLanguageState(savedLang);
      setIsReady(true);
    };
    init();
  }, []);

  const changeLanguage = useCallback(async (lang) => {
    await setI18nLanguage(lang);
    setLanguageState(lang);
  }, []);

  // Memoized translation function that depends on current language
  // This ensures components re-render when language changes
  const t = useCallback((key, options) => {
    return translate(key, options);
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        t,
        isLanguageReady: isReady,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
