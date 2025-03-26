import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import your translation files
import enTranslation from './locales/en.json';
import arTranslation from './locales/ar.json';
import frTranslation from './locales/fr.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: enTranslation },
            ar: { translation: arTranslation },
            fr: { translation: frTranslation }
        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'ar', 'fr'],
        interpolation: {
            escapeValue: false // React already safes from XSS
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage']
        }
    });

export default i18n;