import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    CardHeader,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    CircularProgress,
    Button
} from '@mui/material';
import {
    Gavel as GavelIcon,
    People as PeopleIcon,
    Event as EventIcon,
    Description as DescriptionIcon,
    AttachMoney as MoneyIcon,
    Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';

const DashboardPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeCases: 0,
        clients: 0,
        appointments: 0,
        invoices: 0,
        upcomingEvents: []
    });

    useEffect(() => {
        // Simulate API call to fetch dashboard data
        const fetchDashboardData = async () => {
            try {
                // In a real app, you would fetch this data from your API
                // const response = await fetch('/api/dashboard', {
                //   headers: { Authorization: `Bearer ${user.token}` }
                // });
                // const data = await response.json();

                // Dummy data for demonstration
                const dummyData = {
                    activeCases: 12,
                    clients: 45,
                    appointments: 8,
                    invoices: 15,
                    upcomingEvents: [
                        { id: 1, title: 'Client Meeting - Jane Smith', type: 'appointment', date: '2025-03-25 10:00 AM' },
                        { id: 2, title: 'Court Hearing - Johnson Case', type: 'case', date: '2025-03-26 09:30 AM' },
                        { id: 3, title: 'Document Review Deadline', type: 'task', date: '2025-03-27 05:00 PM' }
                    ]
                };

                setStats(dummyData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom component="h1">
                Welcome, {user?.name || 'User'}
            </Typography>

            <Grid container spacing={3}>
                {/* Summary Statistics */}
                <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <GavelIcon sx={{ fontSize: 40 }} />
                            <Typography variant="h4">{stats.activeCases}</Typography>
                            <Typography variant="body1">Active Cases</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <PeopleIcon sx={{ fontSize: 40 }} />
                            <Typography variant="h4">{stats.clients}</Typography>
                            <Typography variant="body1">Clients</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <EventIcon sx={{ fontSize: 40 }} />
                            <Typography variant="h4">{stats.appointments}</Typography>
                            <Typography variant="body1">Upcoming Appointments</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <MoneyIcon sx={{ fontSize: 40 }} />
                            <Typography variant="h4">{stats.invoices}</Typography>
                            <Typography variant="body1">Pending Invoices</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Upcoming Events/Calendar */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" component="h2">
                                Upcoming Events
                            </Typography>
                            <Button size="small" color="primary">
                                View All
                            </Button>
                        </Box>

                        <List>
                            {stats.upcomingEvents.map((event, index) => (
                                <React.Fragment key={event.id}>
                                    {index > 0 && <Divider component="li" />}
                                    <ListItem>
                                        <ListItemAvatar>
                                            <Avatar sx={{
                                                bgcolor: event.type === 'appointment' ? 'success.main' :
                                                    event.type === 'case' ? 'primary.main' : 'warning.main'
                                            }}>
                                                {event.type === 'appointment' ? <EventIcon /> :
                                                    event.type === 'case' ? <GavelIcon /> : <DescriptionIcon />}
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
                    </Paper>
                </Grid>

                {/* Recent Notifications */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" component="h2">
                                Recent Notifications
                            </Typography>
                            <Button size="small" color="primary">
                                See All
                            </Button>
                        </Box>

                        <List>
                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'info.main' }}>
                                        <NotificationsIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary="New document uploaded in Smith v. Jones case"
                                    secondary="Today, 10:30 AM"
                                />
                            </ListItem>

                            <Divider component="li" />

                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'info.main' }}>
                                        <NotificationsIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary="Client meeting reminder: Johnson consultation"
                                    secondary="Tomorrow, 2:00 PM"
                                />
                            </ListItem>

                            <Divider component="li" />

                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'info.main' }}>
                                        <NotificationsIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary="Invoice #1234 has been paid"
                                    secondary="Yesterday, 4:45 PM"
                                />
                            </ListItem>
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default DashboardPage;