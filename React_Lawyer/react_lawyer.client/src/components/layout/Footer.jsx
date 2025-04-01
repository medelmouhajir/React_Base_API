// src/components/layout/Footer.jsx
import React from 'react';
import { Box, Typography, Link, Divider, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Footer = ({ isMobile }) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <Box
            component="footer"
            sx={{
                mt: 'auto',
                py: isMobile ? 1.5 : 2,
                px: isMobile ? 1 : 2,
                borderTop: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.mode === 'light'
                    ? 'rgba(248, 249, 250, 0.8)'
                    : 'rgba(33, 33, 33, 0.8)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'center' : 'center',
                gap: isMobile ? 1 : 0,
            }}
        >
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    textAlign: isMobile ? 'center' : 'left'
                }}
            >
                &copy; {currentYear} {t('footer.copyright', 'All rights reserved')}
            </Typography>

            {!isMobile && <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />}

            <Box
                sx={{
                    display: 'flex',
                    gap: 2,
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}
            >
                <Link
                    href="#"
                    color="inherit"
                    underline="hover"
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                >
                    {t('footer.terms', 'Terms of Service')}
                </Link>
                <Link
                    href="#"
                    color="inherit"
                    underline="hover"
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                >
                    {t('footer.privacy', 'Privacy Policy')}
                </Link>
                <Link
                    href="#"
                    color="inherit"
                    underline="hover"
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                >
                    {t('footer.help', 'Help Center')}
                </Link>
            </Box>

            {!isMobile && (
                <>
                    <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.75rem' }}
                    >
                        v1.0.0
                    </Typography>
                </>
            )}
        </Box>
    );
};

export default Footer;