// src/pages/dashboard/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    CardHeader,
    CardActions,
    Button,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemAvatar,
    Avatar,
    Chip,
    IconButton,
    CircularProgress,
    Alert,
    useTheme
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Gavel as CasesIcon,
    Person as ClientsIcon,
    CalendarToday as AppointmentsIcon,
    Receipt as BillingIcon,
    Description as DocumentsIcon,
    Today as TodayIcon,
    Notifications as NotificationsIcon,
    TimeToLeave as TimeIcon,
    Business as BusinessIcon,
    MonetizationOn as MoneyIcon,
    MoreVert as MoreIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
    Check as CheckIcon,
    AccessTime as ClockIcon,
    Event as EventIcon
} from '@mui/icons-material';

// Components
import PageHeader from '../../components/common/PageHeader';

// Services
import caseService from '../../services/caseService';
import clientService from '../../services/clientService';
import appointmentService from '../../services/appointmentService';
import invoiceService from '../../services/invoiceService';

// Hooks
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { useThemeMode } from '../../theme/ThemeProvider';

// Chart Component (if available)
// import SummaryChart from '../../components/dashboard/SummaryChart';

const HomePage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const theme = useTheme();
    const { isMobile } = useThemeMode();

    // State for dashboard data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        caseCount: 0,
        clientCount: 0,
        appointmentCount: 0,
        overdueInvoices: 0
    });
    const [recentCases, setRecentCases] = useState([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!isOnline) {
                setLoading(false);
                setError(t('common.offlineMode'));
                return;
            }

            setLoading(true);
            setError('');

            try {
                // Fetch cases
                const casesData = await caseService.getCases();
                setRecentCases(casesData.slice(0, 5)); // Get 5 most recent cases

                // Fetch upcoming appointments
                const appointmentsData = await appointmentService.getUpcomingAppointments();
                setUpcomingAppointments(appointmentsData.slice(0, 5)); // Get 5 upcoming appointments

                // Fetch stats
                const clientsData = await clientService.getClients();
                const overdueInvoicesData = await invoiceService.getOverdueInvoices();

                // Update stats
                setStats({
                    caseCount: casesData.length,
                    clientCount: clientsData.length,
                    appointmentCount: appointmentsData.length,
                    overdueInvoices: overdueInvoicesData.length
                });
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(t('dashboard.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [refreshTrigger, isOnline, t]);

    // Format date
    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (e) {
            console.error('Date formatting error:', e);
            return dateString;
        }
    };

    // Format time
    const formatTime = (dateString) => {
        try {
            return new Date(dateString).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.error('Time formatting error:', e);
            return dateString;
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // Get case status color
    const getCaseStatusColor = (status) => {
        switch (status) {
            case 0: return 'info';      // Intake
            case 1: return 'success';   // Active
            case 2: return 'warning';   // Pending
            case 3: return 'default';   // Closed
            case 4: return 'default';   // Archived
            default: return 'default';
        }
    };

    // Get case status label
    const getCaseStatusLabel = (status) => {
        switch (status) {
            case 0: return t('cases.status.intake');
            case 1: return t('cases.status.active');
            case 2: return t('cases.status.pending');
            case 3: return t('cases.status.closed');
            case 4: return t('cases.status.archived');
            default: return t('common.unknown');
        }
    };

    // Get appointment status color
    const getAppointmentStatusColor = (status) => {
        const statusMap = {
            'Scheduled': 'primary',
            'Confirmed': 'success',
            'InProgress': 'info',
            'Completed': 'default',
            'Cancelled': 'error',
            'Rescheduled': 'warning'
        };
        return statusMap[status] || 'default';
    };

    return (
        <Container maxWidth="xl">
            <PageHeader
                title={t('dashboard.welcomeMessage', { name: user?.name || '' })}
                subtitle={t('dashboard.subtitle')}
                breadcrumbs={[
                    { text: t('app.dashboard') }
                ]}
            />

            {/* Error message */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Offline warning */}
            {!isOnline && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {t('common.offlineWarning')}
                </Alert>
            )}

            {/* Loading indicator */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && (
                <>
                    {/* Quick Stats Section */}
                    <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4 }}>
                        {/* Case Count */}
                        <Grid item xs={6} sm={6} md={3}>
                            <Card sx={{
                                bgcolor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
                                color: 'primary.contrastText'
                            }}>
                                <CardContent sx={{ p: isMobile ? 1.5 : 2, textAlign: 'center' }}>
                                    <CasesIcon sx={{ fontSize: isMobile ? 32 : 40, mb: isMobile ? 0.5 : 1 }} />
                                    <Typography variant={isMobile ? "h5" : "h4"} component="div" fontWeight="bold">
                                        {stats.caseCount}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        {t('dashboard.totalCases')}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'center', p: isMobile ? 1 : 2 }}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => navigate('/cases')}
                                        sx={{
                                            bgcolor: theme.palette.primary.main,
                                            '&:hover': {
                                                bgcolor: theme.palette.primary.dark
                                            }
                                        }}
                                    >
                                        {t('dashboard.viewAll')}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>

                        {/* Client Count */}
                        <Grid item xs={6} sm={6} md={3}>
                            <Card sx={{
                                bgcolor: theme.palette.mode === 'dark' ? 'secondary.dark' : 'secondary.light',
                                color: 'secondary.contrastText'
                            }}>
                                <CardContent sx={{ p: isMobile ? 1.5 : 2, textAlign: 'center' }}>
                                    <ClientsIcon sx={{ fontSize: isMobile ? 32 : 40, mb: isMobile ? 0.5 : 1 }} />
                                    <Typography variant={isMobile ? "h5" : "h4"} component="div" fontWeight="bold">
                                        {stats.clientCount}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        {t('dashboard.totalClients')}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'center', p: isMobile ? 1 : 2 }}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => navigate('/clients')}
                                        sx={{
                                            bgcolor: theme.palette.secondary.main,
                                            '&:hover': {
                                                bgcolor: theme.palette.secondary.dark
                                            }
                                        }}
                                    >
                                        {t('dashboard.viewAll')}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>

                        {/* Appointment Count */}
                        <Grid item xs={6} sm={6} md={3}>
                            <Card sx={{
                                bgcolor: theme.palette.mode === 'dark' ? 'info.dark' : 'info.light',
                                color: 'info.contrastText'
                            }}>
                                <CardContent sx={{ p: isMobile ? 1.5 : 2, textAlign: 'center' }}>
                                    <AppointmentsIcon sx={{ fontSize: isMobile ? 32 : 40, mb: isMobile ? 0.5 : 1 }} />
                                    <Typography variant={isMobile ? "h5" : "h4"} component="div" fontWeight="bold">
                                        {stats.appointmentCount}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        {t('dashboard.upcomingAppointments')}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'center', p: isMobile ? 1 : 2 }}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => navigate('/appointments')}
                                        sx={{
                                            bgcolor: theme.palette.info.main,
                                            '&:hover': {
                                                bgcolor: theme.palette.info.dark
                                            }
                                        }}
                                    >
                                        {t('dashboard.viewAll')}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>

                        {/* Overdue Invoices */}
                        <Grid item xs={6} sm={6} md={3}>
                            <Card sx={{
                                bgcolor: theme.palette.mode === 'dark' ? 'error.dark' : 'error.light',
                                color: 'error.contrastText'
                            }}>
                                <CardContent sx={{ p: isMobile ? 1.5 : 2, textAlign: 'center' }}>
                                    <BillingIcon sx={{ fontSize: isMobile ? 32 : 40, mb: isMobile ? 0.5 : 1 }} />
                                    <Typography variant={isMobile ? "h5" : "h4"} component="div" fontWeight="bold">
                                        {stats.overdueInvoices}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        {t('dashboard.overdueInvoices')}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'center', p: isMobile ? 1 : 2 }}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => navigate('/billing/invoices')}
                                        sx={{
                                            bgcolor: theme.palette.error.main,
                                            '&:hover': {
                                                bgcolor: theme.palette.error.dark
                                            }
                                        }}
                                    >
                                        {t('dashboard.viewAll')}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Main Dashboard Content */}
                    <Grid container spacing={isMobile ? 2 : 3}>
                        {/* Left Column */}
                        <Grid item xs={12} md={8}>
                            {/* Today's Appointments */}
                            <Paper sx={{ p: isMobile ? 1.5 : 2, mb: isMobile ? 2 : 3 }}>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: 'space-between',
                                    alignItems: isMobile ? 'flex-start' : 'center',
                                    mb: 2
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 1 : 0 }}>
                                        <TodayIcon color="primary" sx={{ mr: 1 }} />
                                        <Typography variant="h6" component="h2">
                                            {t('dashboard.todaysAppointments')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', width: isMobile ? '100%' : 'auto' }}>
                                        <IconButton size="small" onClick={handleRefresh}>
                                            <RefreshIcon fontSize="small" />
                                        </IconButton>
                                        <Button
                                            size="small"
                                            startIcon={<AddIcon />}
                                            onClick={() => navigate('/appointments/new')}
                                            sx={{ ml: 1, flexGrow: isMobile ? 1 : 0 }}
                                        >
                                            {t('appointments.new')}
                                        </Button>
                                    </Box>
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                {upcomingAppointments.length === 0 ? (
                                    <Box sx={{ py: 2, textAlign: 'center' }}>
                                        <Typography variant="body1" color="textSecondary">
                                            {t('dashboard.noAppointmentsToday')}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <List sx={{ width: '100%' }}>
                                        {upcomingAppointments.map((appointment) => (
                                            <React.Fragment key={appointment.appointmentId}>
                                                <ListItem
                                                    alignItems="flex-start"
                                                    secondaryAction={
                                                        <IconButton
                                                            edge="end"
                                                            onClick={() => navigate(`/appointments/${appointment.appointmentId}`)}
                                                        >
                                                            <MoreIcon />
                                                        </IconButton>
                                                    }
                                                    sx={{ px: 1 }}
                                                >
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                                            <EventIcon />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Typography variant="subtitle1" component="span" fontWeight="medium">
                                                                    {appointment.title}
                                                                </Typography>
                                                                <Chip
                                                                    size="small"
                                                                    label={appointment.status}
                                                                    color={getAppointmentStatusColor(appointment.status)}
                                                                    sx={{ ml: 1 }}
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                                    <ClockIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
                                                                    <Typography variant="body2" color="text.secondary" component="span">
                                                                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                                                    </Typography>
                                                                </Box>
                                                                <Box component="span" sx={{
                                                                    display: 'block',
                                                                    color: theme.palette.text.secondary,
                                                                    fontSize: '0.875rem'
                                                                }}>
                                                                    {appointment.client && `${appointment.client.firstName} ${appointment.client.lastName}`}
                                                                    {appointment.isVirtual && ` • ${t('appointments.virtual')}`}
                                                                </Box>
                                                            </>
                                                        }
                                                    />
                                                </ListItem>
                                                <Divider variant="inset" component="li" />
                                            </React.Fragment>
                                        ))}
                                    </List>
                                )}

                                <Box sx={{ mt: 2, textAlign: 'right' }}>
                                    <Button
                                        size="small"
                                        onClick={() => navigate('/appointments')}
                                    >
                                        {t('dashboard.viewAllAppointments')}
                                    </Button>
                                </Box>
                            </Paper>

                            {/* Recent Cases */}
                            <Paper sx={{ p: isMobile ? 1.5 : 2, mb: isMobile ? 2 : 3 }}>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: 'space-between',
                                    alignItems: isMobile ? 'flex-start' : 'center',
                                    mb: 2
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 1 : 0 }}>
                                        <CasesIcon color="primary" sx={{ mr: 1 }} />
                                        <Typography variant="h6" component="h2">
                                            {t('dashboard.recentCases')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ width: isMobile ? '100%' : 'auto' }}>
                                        <Button
                                            size="small"
                                            startIcon={<AddIcon />}
                                            onClick={() => navigate('/cases/new')}
                                            sx={{ width: isMobile ? '100%' : 'auto' }}
                                        >
                                            {t('cases.new')}
                                        </Button>
                                    </Box>
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                {recentCases.length === 0 ? (
                                    <Box sx={{ py: 2, textAlign: 'center' }}>
                                        <Typography variant="body1" color="textSecondary">
                                            {t('dashboard.noCasesFound')}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <List sx={{ width: '100%' }}>
                                        {recentCases.map((caseItem) => (
                                            <React.Fragment key={caseItem.caseId}>
                                                <ListItem
                                                    alignItems="flex-start"
                                                    button
                                                    onClick={() => navigate(`/cases/${caseItem.caseId}`)}
                                                    sx={{ px: 1 }}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <Typography variant="subtitle1" component="span" fontWeight="medium">
                                                                    {caseItem.title}
                                                                </Typography>
                                                                <Chip
                                                                    size="small"
                                                                    label={getCaseStatusLabel(caseItem.status)}
                                                                    color={getCaseStatusColor(caseItem.status)}
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <>
                                                                <Typography component="span" variant="body2" color="text.secondary">
                                                                    {caseItem.caseNumber} • {formatDate(caseItem.openDate)}
                                                                </Typography>
                                                                {caseItem.description && (
                                                                    <Box
                                                                        component="span"
                                                                        sx={{
                                                                            display: 'block',
                                                                            mt: 0.5,
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            color: theme.palette.text.secondary,
                                                                            fontSize: '0.875rem',
                                                                            WebkitLineClamp: 1,
                                                                            WebkitBoxOrient: 'vertical',
                                                                        }}
                                                                    >
                                                                        {caseItem.description}
                                                                    </Box>
                                                                )}
                                                            </>
                                                        }
                                                    />
                                                </ListItem>
                                                <Divider component="li" />
                                            </React.Fragment>
                                        ))}
                                    </List>
                                )}

                                <Box sx={{ mt: 2, textAlign: 'right' }}>
                                    <Button
                                        size="small"
                                        onClick={() => navigate('/cases')}
                                    >
                                        {t('dashboard.viewAllCases')}
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Right Column */}
                        <Grid item xs={12} md={4}>
                            {/* Quick Actions */}
                            <Paper sx={{ p: isMobile ? 1.5 : 2, mb: isMobile ? 2 : 3 }}>
                                <Typography variant="h6" component="h2" gutterBottom>
                                    {t('dashboard.quickActions')}
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={isMobile ? 1 : 2}>
                                    <Grid item xs={6}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            fullWidth
                                            startIcon={<CasesIcon />}
                                            onClick={() => navigate('/cases/new')}
                                            sx={{
                                                justifyContent: 'flex-start',
                                                py: isMobile ? 1 : 1.5,
                                                px: isMobile ? 1 : 2,
                                                fontSize: isMobile ? '0.75rem' : '0.875rem'
                                            }}
                                        >
                                            {t('cases.new')}
                                        </Button>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            fullWidth
                                            startIcon={<ClientsIcon />}
                                            onClick={() => navigate('/clients/new')}
                                            sx={{
                                                justifyContent: 'flex-start',
                                                py: isMobile ? 1 : 1.5,
                                                px: isMobile ? 1 : 2,
                                                fontSize: isMobile ? '0.75rem' : '0.875rem'
                                            }}
                                        >
                                            {t('clients.new')}
                                        </Button>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            fullWidth
                                            startIcon={<AppointmentsIcon />}
                                            onClick={() => navigate('/appointments/new')}
                                            sx={{
                                                justifyContent: 'flex-start',
                                                py: isMobile ? 1 : 1.5,
                                                px: isMobile ? 1 : 2,
                                                fontSize: isMobile ? '0.75rem' : '0.875rem'
                                            }}
                                        >
                                            {t('appointments.new')}
                                        </Button>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            fullWidth
                                            startIcon={<BillingIcon />}
                                            onClick={() => navigate('/billing/invoices/new')}
                                            sx={{
                                                justifyContent: 'flex-start',
                                                py: isMobile ? 1 : 1.5,
                                                px: isMobile ? 1 : 2,
                                                fontSize: isMobile ? '0.75rem' : '0.875rem'
                                            }}
                                        >
                                            {t('billing.newInvoice')}
                                        </Button>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            fullWidth
                                            startIcon={<DocumentsIcon />}
                                            onClick={() => navigate('/documents/smarteditor')}
                                            sx={{
                                                justifyContent: 'flex-start',
                                                py: isMobile ? 1 : 1.5,
                                                px: isMobile ? 1 : 2,
                                                fontSize: isMobile ? '0.75rem' : '0.875rem'
                                            }}
                                        >
                                            {t('documents.new')}
                                        </Button>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            fullWidth
                                            startIcon={<TimeIcon />}
                                            onClick={() => navigate('/billing/time-entries/new')}
                                            sx={{
                                                justifyContent: 'flex-start',
                                                py: isMobile ? 1 : 1.5,
                                                px: isMobile ? 1 : 2,
                                                fontSize: isMobile ? '0.75rem' : '0.875rem'
                                            }}
                                        >
                                            {t('billing.newTimeEntry')}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* User Stats */}
                            <Paper sx={{ p: isMobile ? 1.5 : 2, mb: isMobile ? 2 : 3 }}>
                                <Typography variant="h6" component="h2" gutterBottom>
                                    {t('dashboard.yourStats')}
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <List sx={{ width: '100%', p: 0 }}>
                                    <ListItem>
                                        <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                                            <Avatar sx={{
                                                bgcolor: theme.palette.primary.main,
                                                width: isMobile ? 32 : 40,
                                                height: isMobile ? 32 : 40
                                            }}>
                                                <CasesIcon sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }} />
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant={isMobile ? "body2" : "body1"}>
                                                    {t('dashboard.activeCases')}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="body2" component="span">
                                                    {stats.caseCount}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>

                                    <ListItem>
                                        <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                                            <Avatar sx={{
                                                bgcolor: theme.palette.secondary.main,
                                                width: isMobile ? 32 : 40,
                                                height: isMobile ? 32 : 40
                                            }}>
                                                <AppointmentsIcon sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }} />
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant={isMobile ? "body2" : "body1"}>
                                                    {t('dashboard.appointmentsThisWeek')}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="body2" component="span">
                                                    5 {/* Replace with actual data */}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>

                                    <ListItem>
                                        <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                                            <Avatar sx={{
                                                bgcolor: theme.palette.success.main,
                                                width: isMobile ? 32 : 40,
                                                height: isMobile ? 32 : 40
                                            }}>
                                                <TimeIcon sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }} />
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant={isMobile ? "body2" : "body1"}>
                                                    {t('dashboard.hoursThisWeek')}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="body2" component="span">
                                                    24.5 {/* Replace with actual data */}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>

                                    <ListItem>
                                        <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                                            <Avatar sx={{
                                                bgcolor: theme.palette.error.main,
                                                width: isMobile ? 32 : 40,
                                                height: isMobile ? 32 : 40
                                            }}>
                                                <MoneyIcon sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }} />
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant={isMobile ? "body2" : "body1"}>
                                                    {t('dashboard.pendingInvoices')}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="body2" component="span">
                                                    ${(5820).toLocaleString()} {/* Replace with actual data */}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                </List>
                            </Paper>

                        </Grid>
                    </Grid>
                </>
            )}
        </Container>
    );
};

export default HomePage;