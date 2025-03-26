// src/components/layout/ThemeToggle.jsx
import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon } from '@mui/icons-material';
import { useThemeMode } from '../../theme/ThemeProvider';

const ThemeToggle = () => {
    const theme = useTheme();
    const { mode, toggleMode } = useThemeMode();

    return (
        <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            <IconButton onClick={toggleMode} color="inherit" aria-label="toggle theme">
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
        </Tooltip>
    );
};

export default ThemeToggle;