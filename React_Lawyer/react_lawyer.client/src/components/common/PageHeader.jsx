// src/components/common/PageHeader.jsx
import React from 'react';
import { Box, Typography, Button, Breadcrumbs, Link, Paper, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

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

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                mb: 3,
                backgroundColor: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                borderBottom: `1px solid ${theme.palette.divider}`
            }}
        >
            {breadcrumbs.length > 0 && (
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
                            >
                                {crumb.text}
                            </Link>
                        ) : (
                            <Typography key={index} color="text.primary">
                                {crumb.text}
                            </Typography>
                        )
                    ))}
                </Breadcrumbs>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h4" component="h1" fontWeight="bold">
                        {title}
                    </Typography>

                    {subtitle && (
                        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
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