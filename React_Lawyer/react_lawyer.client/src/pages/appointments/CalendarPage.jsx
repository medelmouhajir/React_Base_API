// src/pages/appointments/CalendarPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    Button,
    IconButton,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
    CircularProgress,
    Alert,
    useTheme,
    Chip,
    Popover,
    Card,
    CardContent,
    CardActions,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    ViewList as ViewListIcon,
    Refresh as RefreshIcon,
    Today as TodayIcon,
    FilterList as FilterIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Event as EventIcon,
    AccessTime as TimeIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
    Gavel as GavelIcon
} from '@mui/icons-material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Components and Services
import PageHeader from '../../components/common/PageHeader';
import appointmentService from '../../services/appointmentService';
import caseService from '../../services/caseService';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { useThemeMode } from '../../theme/ThemeProvider';

// Initialize localizer for the calendar
const localizer = momentLocalizer(moment);

// Custom Event Component
const EventComponent = ({ event }) => {
    return (
        <Tooltip title={event.title}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    height: '100%',
                    fontSize: '0.85rem'
                }}
            >
                {event.type === 'appointment' && <EventIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />}
                {event.type === 'caseEvent' && <GavelIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />}
                <Typography variant="inherit" noWrap>
                    {event.title}
                </Typography>
            </Box>
        </Tooltip>
    );
};

// Custom Toolbar Component
const CustomToolbar = ({ date, onView, onNavigate, views, view, t, onRefresh, isLoading }) => {
    const theme = useTheme();

    return (
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2, px: 1 }}>
            <Grid item>
                <Button
                    variant="outlined"
                    onClick={() => onNavigate('TODAY')}
                    startIcon={<TodayIcon />}
                >
                    {t('calendar.today')}
                </Button>
            </Grid>
            <Grid item>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => onNavigate('PREV')}>
                        <ChevronLeftIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ mx: 1, minWidth: 150, textAlign: 'center' }}>
                        {view === 'month' && moment(date).format('MMMM YYYY')}
                        {view === 'week' && `${moment(date).startOf('week').format('MMM D')} - ${moment(date).endOf('week').format('MMM D, YYYY')}`}
                        {view === 'day' && moment(date).format('dddd, MMMM D, YYYY')}
                        {view === 'agenda' && `${moment(date).format('MMM D')} - ${moment(date).add(30, 'days').format('MMM D, YYYY')}`}
                    </Typography>
                    <IconButton onClick={() => onNavigate('NEXT')}>
                        <ChevronRightIcon />
                    </IconButton>
                </Box>
            </Grid>
            <Grid item xs sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{
                    display: 'flex',
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden'
                }}>
                    {views.map(viewOption => (
                        <Button
                            key={viewOption}
                            onClick={() => onView(viewOption)}
                            sx={{
                                px: 2,
                                py: 1,
                                borderRadius: 0,
                                backgroundColor: view === viewOption ?
                                    theme.palette.primary.main : 'transparent',
                                color: view === viewOption ?
                                    theme.palette.primary.contrastText : theme.palette.text.primary,
                                '&:hover': {
                                    backgroundColor: view === viewOption ?
                                        theme.palette.primary.dark : theme.palette.action.hover,
                                }
                            }}
                        >
                            {t(`calendar.views.${viewOption}`)}
                        </Button>
                    ))}
                </Box>
            </Grid>
            <Grid item>
                <Button
                    variant="outlined"
                    onClick={onRefresh}
                    startIcon={isLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
                    disabled={isLoading}
                >
                    {t('common.refresh')}
                </Button>
            </Grid>
        </Grid>
    );
};

const CalendarPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const { isMobile } = useThemeMode();

    // State
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [view, setView] = useState(isMobile ? 'day' : 'month');
    const [date, setDate] = useState(new Date());

    // Event filter state
    const [filters, setFilters] = useState({
        appointments: true,
        caseEvents: true
    });

    // Event popover state
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const openPopover = Boolean(anchorEl);

    // Set locale for moment based on i18n language
    useEffect(() => {
        moment.locale(i18n.language);
    }, [i18n.language]);

    // Fetch events data
    useEffect(() => {
        const fetchEvents = async () => {
            if (!isOnline) {
                setLoading(false);
                setError(t('common.offlineMode'));
                return;
            }

            setLoading(true);
            setError('');

            try {
                // Fetch appointments
                const appointments = await appointmentService.getAppointments();

                // Fetch case events
                const caseEvents = [];
                if (user?.lawFirmId) {
                    // If we have multiple cases, we could fetch events for each
                    // For now, just fetching the first 10 active cases as an example
                    const cases = await caseService.getCases();
                    const activeCases = cases.filter(c => c.status !== 3 && c.status !== 4).slice(0, 10);

                    for (const caseItem of activeCases) {
                        try {
                            const events = await caseService.getCaseEvents(caseItem.caseId);
                            if (events && Array.isArray(events)) {
                                caseEvents.push(...events.map(event => ({
                                    ...event,
                                    case: caseItem
                                })));
                            }
                        } catch (err) {
                            console.error(`Error fetching events for case ${caseItem.caseId}:`, err);
                        }
                    }
                }

                // Transform appointments to calendar events
                const appointmentEvents = appointments.map(appointment => ({
                    id: `appointment-${appointment.appointmentId}`,
                    title: appointment.title,
                    start: new Date(appointment.startTime),
                    end: new Date(appointment.endTime),
                    type: 'appointment',
                    resource: appointment,
                    status: appointment.status
                }));

                // Transform case events to calendar events
                const caseEventItems = caseEvents.map(event => ({
                    id: `case-event-${event.caseEventId}`,
                    title: event.title || event.description,
                    start: new Date(event.date),
                    end: new Date(new Date(event.date).setHours(new Date(event.date).getHours() + 1)), // Default 1-hour duration
                    type: 'caseEvent',
                    resource: event,
                    caseId: event.caseId
                }));

                // Combined and filtered events
                let allEvents = [];
                if (filters.appointments) allEvents = [...allEvents, ...appointmentEvents];
                if (filters.caseEvents) allEvents = [...allEvents, ...caseEventItems];

                setEvents(allEvents);
            } catch (err) {
                console.error('Error fetching calendar events:', err);
                setError(t('calendar.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [user, filters, refreshTrigger, isOnline, t]);

    // Handle event click
    const handleEventClick = (event, e) => {
        setSelectedEvent(event);
        setAnchorEl(e.currentTarget);
    };

    // Close popover
    const handleClosePopover = () => {
        setAnchorEl(null);
    };

    // Navigate to event detail
    const handleViewEventDetails = () => {
        if (!selectedEvent) return;

        if (selectedEvent.type === 'appointment') {
            navigate(`/appointments/${selectedEvent.resource.appointmentId}`);
        } else if (selectedEvent.type === 'caseEvent') {
            navigate(`/cases/${selectedEvent.caseId}`);
        }

        handleClosePopover();
    };

    // Handle adding a new event
    const handleAddEvent = (slotInfo) => {
        // For appointments, navigate to new appointment page with pre-filled date/time
        const startTime = moment(slotInfo.start).format('YYYY-MM-DDTHH:mm');
        const endTime = moment(slotInfo.end).format('YYYY-MM-DDTHH:mm');

        navigate(`/appointments/new?startTime=${startTime}&endTime=${endTime}`);
    };

    // Handle filter changes
    const handleFilterChange = (type, value) => {
        setFilters(prev => ({
            ...prev,
            [type]: value
        }));
    };

    // Customize the look of events based on their type and status
    const eventPropGetter = (event) => {
        let style = {
            backgroundColor: theme.palette.primary.main,
            borderColor: theme.palette.primary.dark,
        };

        if (event.type === 'appointment') {
            switch (event.status) {
                case 'Cancelled':
                    style.backgroundColor = theme.palette.error.light;
                    style.borderColor = theme.palette.error.main;
                    style.opacity = 0.6;
                    break;
                case 'Completed':
                    style.backgroundColor = theme.palette.success.main;
                    style.borderColor = theme.palette.success.dark;
                    break;
                case 'Confirmed':
                    style.backgroundColor = theme.palette.primary.dark;
                    style.borderColor = theme.palette.primary.dark;
                    break;
                default:
                    break;
            }
        } else if (event.type === 'caseEvent') {
            style.backgroundColor = theme.palette.secondary.main;
            style.borderColor = theme.palette.secondary.dark;
        }

        return { style };
    };

    // Format messages for the calendar
    const messages = useMemo(() => ({
        allDay: t('calendar.allDay'),
        previous: t('calendar.previous'),
        next: t('calendar.next'),
        today: t('calendar.today'),
        month: t('calendar.views.month'),
        week: t('calendar.views.week'),
        day: t('calendar.views.day'),
        agenda: t('calendar.views.agenda'),
        date: t('calendar.date'),
        time: t('calendar.time'),
        event: t('calendar.event'),
        noEventsInRange: t('calendar.noEvents'),
    }), [t]);

    // Define available views
    const views = useMemo(() => (
        isMobile ? ['day', 'agenda'] : ['month', 'week', 'day', 'agenda']
    ), [isMobile]);

    // Format time
    const formatTime = (date) => {
        return moment(date).format('LT');
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={t('calendar.title')}
                subtitle={t('calendar.subtitle')}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('appointments.appointments'), link: '/appointments' },
                    { text: t('calendar.title') }
                ]}
                action={t('appointments.newAppointment')}
                actionIcon={<AddIcon />}
                onActionClick={() => navigate('/appointments/new')}
            />

            {/* Error message */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    onClose={() => setError('')}
                >
                    {error}
                </Alert>
            )}

            {/* Offline warning */}
            {!isOnline && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {t('common.offlineWarning')}
                </Alert>
            )}

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6} sm="auto">
                        <Typography variant="body1" fontWeight="medium">
                            {t('calendar.filters')}:
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm="auto">
                        <Chip
                            icon={<EventIcon />}
                            label={t('appointments.appointments')}
                            clickable
                            color={filters.appointments ? "primary" : "default"}
                            onClick={() => handleFilterChange('appointments', !filters.appointments)}
                            variant={filters.appointments ? "filled" : "outlined"}
                        />
                    </Grid>
                    <Grid item xs={6} sm="auto">
                        <Chip
                            icon={<GavelIcon />}
                            label={t('cases.events.events')}
                            clickable
                            color={filters.caseEvents ? "secondary" : "default"}
                            onClick={() => handleFilterChange('caseEvents', !filters.caseEvents)}
                            variant={filters.caseEvents ? "filled" : "outlined"}
                        />
                    </Grid>
                    <Grid item xs={6} sm="auto" sx={{ ml: 'auto' }}>
                        <Button
                            variant="outlined"
                            startIcon={<ViewListIcon />}
                            onClick={() => navigate('/appointments')}
                        >
                            {t('calendar.listView')}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Calendar */}
            <Paper sx={{ mb: 3, overflow: 'hidden' }}>
                <Box sx={{
                    height: isMobile ? 'calc(100vh - 320px)' : 700,
                    pt: 2,
                    '.rbc-calendar': {
                        fontFamily: theme.typography.fontFamily
                    },
                    '.rbc-header': {
                        padding: 1,
                        fontWeight: theme.typography.fontWeightMedium,
                        color: theme.palette.text.secondary
                    },
                    '.rbc-today': {
                        backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(25, 118, 210, 0.05)'
                    },
                    '.rbc-off-range-bg': {
                        backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(0,0,0,0.2)'
                            : 'rgba(0,0,0,0.03)'
                    },
                    '.rbc-event': {
                        borderRadius: 1,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                    }
                }}>
                    {loading && (
                        <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1
                        }}>
                            <CircularProgress />
                        </Box>
                    )}
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        view={view}
                        views={views}
                        date={date}
                        onView={(newView) => setView(newView)}
                        onNavigate={(newDate) => setDate(newDate)}
                        style={{ height: '100%', opacity: loading ? 0.5 : 1 }}
                        eventPropGetter={eventPropGetter}
                        components={{
                            event: EventComponent,
                            toolbar: (props) => (
                                <CustomToolbar
                                    {...props}
                                    t={t}
                                    onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                                    isLoading={loading}
                                />
                            )
                        }}
                        onSelectEvent={handleEventClick}
                        onSelectSlot={handleAddEvent}
                        selectable={isOnline}
                        messages={messages}
                        formats={{ timeGutterFormat: 'LT' }}
                    />
                </Box>
            </Paper>

            {/* Event Popover */}
            <Popover
                open={openPopover}
                anchorEl={anchorEl}
                onClose={handleClosePopover}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                {selectedEvent && (
                    <Card sx={{ minWidth: 300, maxWidth: 400 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {selectedEvent.type === 'appointment' && <EventIcon color="primary" sx={{ mr: 1 }} />}
                                {selectedEvent.type === 'caseEvent' && <GavelIcon color="secondary" sx={{ mr: 1 }} />}
                                <Typography variant="h6" component="div">
                                    {selectedEvent.title}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 1 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                    {moment(selectedEvent.start).format('LLLL')}
                                    {!moment(selectedEvent.start).isSame(selectedEvent.end, 'day') && (
                                        ` - ${moment(selectedEvent.end).format('LLLL')}`
                                    )}
                                    {moment(selectedEvent.start).isSame(selectedEvent.end, 'day') && (
                                        ` - ${formatTime(selectedEvent.end)}`
                                    )}
                                </Typography>
                            </Box>

                            {selectedEvent.type === 'appointment' && selectedEvent.resource && (
                                <>
                                    {selectedEvent.resource.location && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                                {selectedEvent.resource.isVirtual
                                                    ? t('appointments.virtualMeeting')
                                                    : selectedEvent.resource.location}
                                            </Typography>
                                        </Box>
                                    )}

                                    {selectedEvent.resource.lawyer && selectedEvent.resource.lawyer.user && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                                {selectedEvent.resource.lawyer.user.firstName} {selectedEvent.resource.lawyer.user.lastName}
                                            </Typography>
                                        </Box>
                                    )}

                                    <Chip
                                        size="small"
                                        label={t(`appointments.status.${selectedEvent.resource.status}`)}
                                        color={selectedEvent.resource.status === 'Cancelled' ? 'error' :
                                            selectedEvent.resource.status === 'Completed' ? 'success' : 'primary'}
                                        sx={{ mt: 1 }}
                                    />
                                </>
                            )}

                            {selectedEvent.type === 'caseEvent' && selectedEvent.resource && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <GavelIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="body2">
                                        {selectedEvent.resource.case?.title || t('cases.case')}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                        <CardActions>
                            <Button size="small" onClick={handleViewEventDetails}>
                                {t('common.viewDetails')}
                            </Button>
                            <Button size="small" onClick={handleClosePopover}>
                                {t('common.close')}
                            </Button>
                        </CardActions>
                    </Card>
                )}
            </Popover>
        </Container>
    );
};

export default CalendarPage;