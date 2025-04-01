// src/components/common/PageHeader.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Breadcrumbs, Link, Paper, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { useThemeMode } from '../../theme/ThemeProvider';

const PageHeader = ({
    title,
    subtitle,
    breadcrumbs = [],
    action,
    actionText,
    actionIcon,
    actionVariant = 'contained',
    actionColor = 'primary',
    onActionClick,
    children
}) => {
    const theme = useTheme();
    const { isMobile, isTablet } = useThemeMode();
    const { t } = useTranslation();

    return (
        <Paper
            elevation={0}
            sx={{
                p: isMobile ? 2 : 3,
                mb: 3,
                backgroundColor: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                borderBottom: `1px solid ${theme.palette.divider}`
            }}
        >
            {breadcrumbs.length > 0 && !isMobile && (
                <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" />}
                    aria-label="breadcrumb"
                    sx={{ mb: 2 }}
                >
                    {breadcrumbs.map((crumb, index) => (
                        crumb.link ? (
                            <Link
                                key={index}
                                component={RouterLink}
                                to={crumb.link}
                                underline="hover"
                                color="inherit"
                                sx={{ fontSize: isTablet ? '0.75rem' : '0.875rem' }}
                            >
                                {crumb.text}
                            </Link>
                        ) : (
                            <Typography
                                key={index}
                                color="text.primary"
                                sx={{ fontSize: isTablet ? '0.75rem' : '0.875rem' }}
                            >
                                {crumb.text}
                            </Typography>
                        )
                    ))}
                </Breadcrumbs>
            )}

            <Box sx={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'flex-start',
                gap: isMobile ? 2 : 0
            }}>
                <Box>
                    <Typography
                        variant={isMobile ? "h5" : "h4"}
                        component="h1"
                        fontWeight="bold"
                    >
                        {title}
                    </Typography>

                    {subtitle && (
                        <Typography
                            variant={isMobile ? "body1" : "subtitle1"}
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                        >
                            {subtitle}
                        </Typography>
                    )}
                </Box>

                {action && (
                    <Button
                        variant={actionVariant}
                        color={actionColor}
                        startIcon={actionIcon}
                        onClick={onActionClick}
                        size={isMobile ? "small" : "medium"}
                        sx={isMobile ? { alignSelf: 'flex-start' } : {}}
                    >
                        {actionText}
                    </Button>
                )}
            </Box>

            {children && (
                <Box sx={{ mt: 2 }}>
                    {children}
                </Box>
            )}
        </Paper>
    );
};

export default PageHeader;