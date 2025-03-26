// src/components/layout/Footer.jsx
import React from 'react';
import { Box, Typography, Link, Chip, useTheme } from '@mui/material';
import { Wifi as WifiIcon, WifiOff as WifiOffIcon } from '@mui/icons-material';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const Footer = () => {
    const theme = useTheme();
    const isOnline = useOnlineStatus();
    const currentYear = new Date().getFullYear();

    return (
        <Box
            component="footer"
            sx={{
                py: 1.5,
                px: 2,
                mt: 'auto',
                backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
                borderTop: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1
            }}
        >
            <Typography variant="body2" color="text.secondary">
                &copy; {currentYear} React Lawyer Management. All rights reserved.
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                    icon={isOnline ? <WifiIcon fontSize="small" /> : <WifiOffIcon fontSize="small" />}
                    label={isOnline ? "Online" : "Offline"}
                    size="small"
                    color={isOnline ? "success" : "error"}
                    variant="outlined"
                />

                <Typography variant="body2" color="text.secondary">
                    <Link href="/terms" color="inherit" sx={{ mx: 1 }}>
                        Terms
                    </Link>
                    •
                    <Link href="/privacy" color="inherit" sx={{ mx: 1 }}>
                        Privacy
                    </Link>
                    •
                    <Link href="/help" color="inherit" sx={{ mx: 1 }}>
                        Help
                    </Link>
                </Typography>
            </Box>
        </Box>
    );
};

export default Footer;