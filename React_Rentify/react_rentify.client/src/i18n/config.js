// src/i18n/config.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

const resources = {
    en: {
        translation: en
    },
    fr: {
        translation: fr
    },
    ar: {
        translation: ar
    }
};

i18n
    // Detect user language
    .use(LanguageDetector)
    // Pass the i18n instance to react-i18next
    .use(initReactI18next)
    // Initialize i18next
    .init({
        resources,

        // Set French as the default language for first-time visitors
        lng: 'fr', // This sets the initial language

        // Language detection options
        detection: {
            // Order of language detection methods
            order: ['localStorage', 'navigator', 'htmlTag'],

            // Cache the language in localStorage
            caches: ['localStorage'],

            // Optional: exclude languages
            excludeCacheFor: ['cimode'],
        },

        // Fallback language (in case French resources are missing)
        fallbackLng: 'fr', // Changed from 'en' to 'fr'

        // Debug mode (set to false in production)
        debug: import.meta.env.DEV,

        // Interpolation options
        interpolation: {
            escapeValue: false, // React already escapes values
        },

        // Namespace options
        defaultNS: 'translation',

        // React options
        react: {
            // Set to true if you want to use Suspense
            useSuspense: false,
        },

        // Load missing keys
        saveMissing: import.meta.env.DEV,

        // Missing key handler (useful for development)
        missingKeyHandler: (lng, ns, key) => {
            if (import.meta.env.DEV) {
                //console.warn(`Missing translation key: ${key} for language: ${lng}`);
            }
        },
    });

export default i18n;