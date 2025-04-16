// src/pages/reports/ReportsPage.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../../theme/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    CardActionArea,
    Breadcrumbs,
    Link,
    Paper,
    InputBase,
    IconButton,
    Tabs,
    Tab,
    Box,
    Divider,
    Chip,
    useMediaQuery
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import PieChartIcon from '@mui/icons-material/PieChart';
import PeopleIcon from '@mui/icons-material/People';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import EventIcon from '@mui/icons-material/Event';
import StarIcon from '@mui/icons-material/Star';

// Page layout components
import PageHeader from '../../components/common/PageHeader';

const ReportsPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isMobile, isTablet } = useThemeMode();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentTab, setCurrentTab] = useState(0);
    const isSmallScreen = useMediaQuery('(max-width:600px)');

    // Define report categories
    const categories = [
        { id: 'all', label: t('reports.categories.all') },
        { id: 'financial', label: t('reports.categories.financial') },
        { id: 'cases', label: t('reports.categories.cases') },
        { id: 'clients', label: t('reports.categories.clients') },
        { id: 'performance', label: t('reports.categories.performance') },
    ];

    // Define available reports
    const reports = [
        {
            id: 'revenue-overview',
            title: t('reports.revenue.title'),
            description: t('reports.revenue.description'),
            icon: <BarChartIcon fontSize="large" />,
            category: 'financial',
            featured: true,
            path: '/reports/financial/revenue'
        },
        {
            id: 'case-status',
            title: t('reports.caseStatus.title'),
            description: t('reports.caseStatus.description'),
            icon: <TimelineIcon fontSize="large" />,
            category: 'cases',
            featured: true,
            path: '/reports/cases/status'
        },
        {
            id: 'client-acquisition',
            title: t('reports.clientAcquisition.title'),
            description: t('reports.clientAcquisition.description'),
            icon: <PeopleIcon fontSize="large" />,
            category: 'clients',
            featured: false,
            path: '/reports/clients/acquisition'
        },
        {
            id: 'billing-summary',
            title: t('reports.billingSummary.title'),
            description: t('reports.billingSummary.description'),
            icon: <AttachMoneyIcon fontSize="large" />,
            category: 'financial',
            featured: true,
            path: '/reports/financial/billing'
        },
        {
            id: 'case-types',
            title: t('reports.caseTypes.title'),
            description: t('reports.caseTypes.description'),
            icon: <PieChartIcon fontSize="large" />,
            category: 'cases',
            featured: false,
            path: '/reports/cases/types'
        },
        {
            id: 'time-tracking',
            title: t('reports.timeTracking.title'),
            description: t('reports.timeTracking.description'),
            icon: <EventIcon fontSize="large" />,
            category: 'performance',
            featured: false,
            path: '/reports/performance/time'
        },
        {
            id: 'document-analytics',
            title: t('reports.documentAnalytics.title'),
            description: t('reports.documentAnalytics.description'),
            icon: <DescriptionIcon fontSize="large" />,
            category: 'performance',
            featured: false,
            path: '/reports/performance/documents'
        },
        {
            id: 'lawyer-performance',
            title: t('reports.lawyerPerformance.title'),
            description: t('reports.lawyerPerformance.description'),
            icon: <BusinessCenterIcon fontSize="large" />,
            category: 'performance',
            featured: true,
            path: '/reports/performance/lawyers'
        }
    ];

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    // Filter reports based on search and current tab
    const filteredReports = reports.filter(report => {
        const matchesSearch = !searchTerm ||
            report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = currentTab === 0 || // 'All' tab
            report.category === categories[currentTab].id;

        return matchesSearch && matchesCategory;
    });

    // Get featured reports
    const featuredReports = reports.filter(report => report.featured);

    // Handle report card click
    const handleReportClick = (path) => {
        // Navigation will be implemented when specific report pages are created
        console.log(`Navigating to: ${path}`);
        // Uncomment when specific routes are added
        // navigate(path);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
            <PageHeader
                title={t('reports.pageTitle')}
                description={t('reports.pageDescription')}
                icon={<BarChartIcon fontSize="large" />}
            />

            {/* Breadcrumbs */}
            <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" />}
                aria-label="breadcrumb"
                sx={{ mb: 3 }}
            >
                <Link color="inherit" onClick={() => navigate('/')}>
                    {t('common.dashboard')}
                </Link>
                <Typography color="text.primary">{t('reports.pageTitle')}</Typography>
            </Breadcrumbs>

            {/* Search Bar */}
            <Paper
                component="form"
                sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', mb: 4, maxWidth: isMobile ? '100%' : 500 }}
            >
                <InputBase
                    sx={{ ml: 1, flex: 1 }}
                    placeholder={t('reports.searchPlaceholder')}
                    inputProps={{ 'aria-label': t('reports.searchAriaLabel') }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
                    <SearchIcon />
                </IconButton>
            </Paper>

            {/* Category Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                <Tabs
                    value={currentTab}
                    onChange={handleTabChange}
                    variant={isSmallScreen ? "scrollable" : "standard"}
                    scrollButtons={isSmallScreen ? "auto" : false}
                    aria-label="report categories"
                >
                    {categories.map((category, index) => (
                        <Tab key={category.id} label={category.label} id={`report-tab-${index}`} />
                    ))}
                </Tabs>
            </Box>

            {/* Featured Reports Section (only when showing all reports) */}
            {currentTab === 0 && searchTerm === '' && (
                <>
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="h5"
                            component="h2"
                            sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                        >
                            <StarIcon sx={{ mr: 1, color: 'primary.main' }} />
                            {t('reports.featuredReports')}
                        </Typography>
                        <Grid container spacing={3}>
                            {featuredReports.map(report => (
                                <Grid item xs={12} sm={6} md={4} key={report.id}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            transition: 'transform 0.3s, box-shadow 0.3s',
                                            '&:hover': {
                                                transform: 'translateY(-5px)',
                                                boxShadow: 6
                                            }
                                        }}
                                    >
                                        <CardActionArea
                                            onClick={() => handleReportClick(report.path)}
                                            sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                                        >
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    bgcolor: 'primary.main',
                                                    color: 'primary.contrastText',
                                                    p: 2,
                                                    display: 'flex',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {report.icon}
                                            </Box>
                                            <CardContent sx={{ flexGrow: 1, width: '100%' }}>
                                                <Typography gutterBottom variant="h6" component="div">
                                                    {report.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {report.description}
                                                </Typography>
                                                <Chip
                                                    label={categories.find(cat => cat.id === report.category)?.label || report.category}
                                                    size="small"
                                                    sx={{ mt: 2 }}
                                                />
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                    <Divider sx={{ my: 4 }} />
                </>
            )}

            {/* All Reports Section */}
            <Box>
                <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
                    {currentTab === 0
                        ? t('reports.allReports')
                        : t('reports.categoryReports', { category: categories[currentTab].label })}
                </Typography>

                {filteredReports.length > 0 ? (
                    <Grid container spacing={3}>
                        {filteredReports.map(report => (
                            <Grid item xs={12} sm={6} md={4} key={report.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-3px)',
                                            boxShadow: 3
                                        }
                                    }}
                                >
                                    <CardActionArea
                                        onClick={() => handleReportClick(report.path)}
                                        sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                p: 2,
                                                color: 'primary.main'
                                            }}
                                        >
                                            {report.icon}
                                        </Box>
                                        <CardContent>
                                            <Typography gutterBottom variant="h6" component="div">
                                                {report.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {report.description}
                                            </Typography>
                                            <Chip
                                                label={categories.find(cat => cat.id === report.category)?.label || report.category}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography>
                            {t('reports.noReportsFound')}
                        </Typography>
                    </Paper>
                )}
            </Box>
        </Container>
    );
};

export default ReportsPage;