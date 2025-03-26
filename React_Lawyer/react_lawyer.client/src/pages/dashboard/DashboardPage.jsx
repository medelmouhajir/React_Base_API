// src/pages/dashboard/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    CircularProgress,
    Button,
    Tab,
    Tabs,
    Card,
    CardHeader,
    CardContent,
    useTheme
} from '@mui/material';
import {
    Gavel as GavelIcon,
    People as PeopleIcon,
    Event as EventIcon,
    Description as DocumentsIcon,
    AttachMoney as MoneyIcon,
    Notifications as NotificationsIcon,
    Receipt as ReceiptIcon,
    Schedule as ScheduleIcon,
    Add as AddIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import DashboardCard from '../../pages/dashboard/DashboardCard';

// Custom TabPanel component
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`dashboard-tabpanel-${index}`}
            aria-labelledby={`dashboard-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeCases: 0,
        pendingCases: 0,
        totalClients: 0,
        upcomingAppointments: 0,
        pendingInvoices: 0,
        recentDocuments: 0,
        eventsToday: []
    });

    const [tabValue, setTabValue] = useState(0);

    // Simulated API call to fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            // In a real app, this would be an API call
            setTimeout(() => {
                setStats({
                    activeCases: 12,
                    pendingCases: 3,
                    totalClients: 45,
                    newClientsThisMonth: 5,
                    upcomingAppointments: 8,
                    pendingInvoices: 15,
                    pendingAmount: '$24,750',
                    recentDocuments: 7,
                    eventsToday: [
                        { id: 1, title: 'Client Meeting - Jane Smith', type: 'appointment', time: '10:00 AM', location: 'Office' },
                        { id: 2, title: 'Court Hearing - Johnson Case', type: 'case', time: '1:30 PM', location: 'City Court' },
                        { id: 3, title: 'Document Review Deadline', type: 'task', time: '5:00 PM' }
                    ],
                    upcomingEvents: [
                        { id: 4, title: 'Status Conference - Williams Case', type: 'case', date: 'Tomorrow, 9:00 AM' },
                        { id: 5, title: 'Client Intake - New Corporate Client', type: 'appointment', date: 'Wed, 11:00 AM' }
                    ],
                    recentActivities: [
                        { id: 1, description: 'Invoice #1234 generated for Smith case', time: '1 hour ago', user: 'You' },
                        { id: 2, description: 'Document "Settlement Agreement" uploaded to Johnson case', time: '3 hours ago', user: 'Sarah' },
                        { id: 3, description: 'New appointment scheduled with client Jane Doe', time: 'Yesterday', user: 'Michael' }
                    ]
                });
                setLoading(false);
            }, 1000);
        };

        fetchDashboardData();
    }, []);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleCardClick = (path) => {
        navigate(path);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 120px)' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Welcome, {user?.name || 'User'}
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/cases/new')}
                >
                    New Case
                </Button>
            </Box>

            {/* Dashboard Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <DashboardCard
                        title="Active Cases"
                        value={stats.activeCases}
                        icon={<GavelIcon />}
                        color="primary"
                        subtitle={`${stats.pendingCases} pending intake`}
                        trend={8}
                        onClick={() => handleCardClick('/cases')}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <DashboardCard
                        title="Clients"
                        value={stats.totalClients}
                        icon={<PeopleIcon />}
                        color="secondary"
                        subtitle={`${stats.newClientsThisMonth} new this month`}
                        trend={12}
                        onClick={() => handleCardClick('/clients')}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <DashboardCard
                        title="Appointments"
                        value={stats.upcomingAppointments}
                        icon={<EventIcon />}
                        color="success"
                        subtitle="Upcoming appointments"
                        trend={-5}
                        trendLabel="vs. last week"
                        onClick={() => handleCardClick('/appointments')}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <DashboardCard
                        title="Pending Invoices"
                        value={stats.pendingInvoices}
                        icon={<MoneyIcon />}
                        color="warning"
                        subtitle={stats.pendingAmount}
                        trend={15}
                        onClick={() => handleCardClick('/billing')}
                    />
                </Grid>
            </Grid>

            {/* Today's Schedule Section */}
            <Paper sx={{ p: 0, mb: 4 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
                        <Tab label="Today's Schedule" icon={<ScheduleIcon />} iconPosition="start" />
                        <Tab label="Recent Activities" icon={<NotificationsIcon />} iconPosition="start" />
                        <Tab label="Recent Documents" icon={<DocumentsIcon />} iconPosition="start" />
                    </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                    <List>
                        {stats.eventsToday.length > 0 ? (
                            stats.eventsToday.map((event, index) => (
                                <React.Fragment key={event.id}>
                                    {index > 0 && <Divider component="li" />}
                                    <ListItem sx={{ py: 1.5 }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{
                                                bgcolor: event.type === 'appointment' ? theme.palette.success.main :
                                                    event.type === 'case' ? theme.palette.primary.main : theme.palette.warning.main
                                            }}>
                                                {event.type === 'appointment' ? <EventIcon /> :
                                                    event.type === 'case' ? <GavelIcon /> : <DocumentsIcon />}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={event.title}
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2">
                                                        {event.time}
                                                    </Typography>
                                                    {event.location && (
                                                        <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                                                            • {event.location}
                                                        </Typography>
                                                    )}
                                                </>
                                            }
                                        />
                                    </ListItem>
                                </React.Fragment>
                            ))
                        ) : (
                            <ListItem>
                                <ListItemText primary="No events scheduled for today" />
                            </ListItem>
                        )}
                    </List>

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>
                        <Button
                            size="small"
                            onClick={() => navigate('/appointments')}
                            endIcon={<ArrowForwardIcon />}
                        >
                            View Calendar
                        </Button>
                    </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <List>
                        {stats.recentActivities.map((activity, index) => (
                            <React.Fragment key={activity.id}>
                                {index > 0 && <Divider component="li" />}
                                <ListItem sx={{ py: 1.5 }}>
                                    <ListItemText
                                        primary={activity.description}
                                        secondary={
                                            <>
                                                <Typography component="span" variant="body2" color="text.secondary">
                                                    {activity.time}
                                                </Typography>
                                                <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                                                    • By: {activity.user}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                            </React.Fragment>
                        ))}
                    </List>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <Typography variant="body1">
                        {stats.recentDocuments} new documents have been added recently.
                    </Typography>
                    <Button
                        sx={{ mt: 2 }}
                        variant="outlined"
                        onClick={() => navigate('/documents')}
                    >
                        View Documents
                    </Button>
                </TabPanel>
            </Paper>

            {/* Bottom Cards Section */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Upcoming Events"
                            titleTypographyProps={{ variant: 'h6' }}
                            action={
                                <Button size="small" onClick={() => navigate('/appointments')}>View All</Button>
                            }
                        />
                        <CardContent sx={{ pt: 0 }}>
                            <List>
                                {stats.upcomingEvents.map((event, index) => (
                                    <React.Fragment key={event.id}>
                                        {index > 0 && <Divider component="li" />}
                                        <ListItem sx={{ py: 1.5 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{
                                                    bgcolor: event.type === 'appointment' ? theme.palette.success.main : theme.palette.primary.main
                                                }}>
                                                    {event.type === 'appointment' ? <EventIcon /> : <GavelIcon />}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={event.title}
                                                secondary={event.date}
                                            />
                                        </ListItem>
                                    </React.Fragment>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Recent Invoices"
                            titleTypographyProps={{ variant: 'h6' }}
                            action={
                                <Button size="small" onClick={() => navigate('/billing')}>View All</Button>
                            }
                        />
                        <CardContent sx={{ pt: 0 }}>
                            <List>
                                <ListItem>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                                            <ReceiptIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary="Invoice #1234 - Smith Case"
                                        secondary="$3,500.00 • Due in 15 days"
                                    />
                                </ListItem>
                                <Divider component="li" />
                                <ListItem>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                                            <ReceiptIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary="Invoice #1233 - Johnson Case"
                                        secondary="$2,750.00 • Overdue by 3 days"
                                    />
                                </ListItem>
                                <Divider component="li" />
                                <ListItem>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                                            <ReceiptIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary="Invoice #1232 - Williams Case"
                                        secondary="$1,200.00 • Paid on Mar 15, 2025"
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default DashboardPage;