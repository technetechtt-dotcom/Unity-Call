import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  enTranslations,
  zuTranslations,
  afTranslations,
  xhTranslations } from
'./translations';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    zu: { translation: zuTranslations },
    af: { translation: afTranslations },
    xh: { translation: xhTranslations }
  },
  lng: 'en', // Default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false // React already safes from xss
  }
});

export default i18n;