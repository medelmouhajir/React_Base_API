// src/hooks/useRtlDirection.js
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useRtlDirection = () => {
    const { i18n } = useTranslation();

    useEffect(() => {
        // Define language directions
        const directions = {
            'ar': 'rtl',
            'en': 'ltr',
            'fr': 'ltr'
        };

        // Set document direction based on current language
        const direction = directions[i18n.language] || 'ltr';
        document.documentElement.dir = direction;

        // Listen for language changes
        const handleLanguageChange = () => {
            const newDirection = directions[i18n.language] || 'ltr';
            document.documentElement.dir = newDirection;
        };

        i18n.on('languageChanged', handleLanguageChange);

        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, [i18n]);
};