// src/components/dashboard/DashboardCard.jsx
import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    IconButton,
    Tooltip,
    useTheme
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

const DashboardCard = ({
    title,
    value,
    icon,
    color = 'primary',
    onClick,
    subtitle,
    trend,
    trendLabel
}) => {
    const theme = useTheme();

    // Determine color for trend indicator
    const getTrendColor = () => {
        if (!trend) return 'inherit';
        return trend > 0 ? theme.palette.success.main : trend < 0 ? theme.palette.error.main : 'inherit';
    };

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                },
                borderTop: `4px solid ${theme.palette[color].main}`,
            }}
        >
            <CardContent sx={{ padding: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {title}
                    </Typography>
                    <Box
                        sx={{
                            backgroundColor: theme.palette[color].light,
                            color: theme.palette[color].contrastText,
                            borderRadius: '50%',
                            width: 40,
                            height: 40,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        {icon}
                    </Box>
                </Box>

                <Typography variant="h4" component="div" fontWeight="bold">
                    {value}
                </Typography>

                {subtitle && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {subtitle}
                    </Typography>
                )}

                {trend !== undefined && (
                    <Box sx={{ mt: 'auto', pt: 2, display: 'flex', alignItems: 'center' }}>
                        <Typography
                            variant="body2"
                            sx={{
                                color: getTrendColor(),
                                fontWeight: 'medium',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {trend > 0 ? '↑' : trend < 0 ? '↓' : '•'} {Math.abs(trend)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {trendLabel || 'vs. last month'}
                        </Typography>
                    </Box>
                )}

                {onClick && (
                    <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title={`View all ${title.toLowerCase()}`}>
                            <IconButton
                                size="small"
                                color={color}
                                onClick={onClick}
                                aria-label={`View all ${title.toLowerCase()}`}
                            >
                                <ArrowForwardIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default DashboardCard;