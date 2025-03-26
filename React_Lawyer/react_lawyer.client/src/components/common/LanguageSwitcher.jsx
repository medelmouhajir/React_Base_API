// src/components/common/LanguageSwitcher.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    FormControl,
    Select,
    MenuItem,
    InputLabel,
    Box
} from '@mui/material';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (event) => {
        const language = event.target.value;
        i18n.changeLanguage(language);

        // For RTL support (Arabic)
        document.dir = language === 'ar' ? 'rtl' : 'ltr';
    };

    return (
        <Box sx={{ minWidth: 120 }}>
            <FormControl size="small">
                <InputLabel id="language-select-label">Language</InputLabel>
                <Select
                    labelId="language-select-label"
                    id="language-select"
                    value={i18n.language}
                    label="Language"
                    onChange={changeLanguage}
                >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="ar">العربية</MenuItem>
                    <MenuItem value="fr">Français</MenuItem>
                </Select>
            </FormControl>
        </Box>
    );
};

export default LanguageSwitcher;