import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

const loadLocale = async (lang) => {
  const mod = await import(`../locales/${lang}.json`);
  return mod.default;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => localStorage.getItem('language') || 'en');
  const [t, setT] = useState({});

  useEffect(() => {
    loadLocale(language).then(setT).catch(() => setT({}));
  }, [language]);

  const setLanguage = async (lang) => {
    if (!['en', 'uz', 'ru'].includes(lang)) return;
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    try {
      api.patch('/users/me/language', { language: lang });
    } catch {}
  };

  const translate = (key) => t[key] ?? key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
};
