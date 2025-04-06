// src/pages/appointments/AppointmentDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    Button,
    Grid,
    Chip,
    Divider,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip,
    Link
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Event as EventIcon,
    AccessTime as TimeIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
    Gavel as GavelIcon,
    Link as LinkIcon,
    Print as PrintIcon,
    Check as CheckIcon,
    Cancel as CancelIcon,
    Videocam as VideocamIcon,
    Note as NoteIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';

// Components and Services
import PageHeader from '../../components/common/PageHeader';
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';

// Appointment status color mapping
const STATUS_COLORS = {
    'Scheduled': 'primary',
    'Confirmed': 'success',
    'InProgress': 'info',
    'Completed': 'default',
    'Cancelled': 'error',
    'Rescheduled': 'warning'
};

const AppointmentDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();

    // State
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch appointment details
    useEffect(() => {
        const fetchAppointmentDetails = async () => {
            if (!isOnline) {
                setLoading(false);
                setError(t('common.offlineMode'));
                return;
            }

            try {
                const data = await appointmentService.getAppointmentById(id);
                setAppointment(data);
            } catch (err) {
                console.error('Error fetching appointment details:', err);
                setError(t('appointments.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchAppointmentDetails();
    }, [id, isOnline, t]);

    // Handle cancel appointment
    const handleCancelAppointment = async () => {
        if (!isOnline) {
            setError(t('common.offlineError'));
            return;
        }

        setActionLoading(true);
        try {
            await appointmentService.updateAppointmentStatus(id, 'Cancelled');

            // Update appointment state to reflect cancellation
            setAppointment(prev => ({
                ...prev,
                status: 'Cancelled'
            }));

            setCancelDialogOpen(false);
        } catch (err) {
            console.error('Error cancelling appointment:', err);
            setError(t('appointments.cancelError'));
        } finally {
            setActionLoading(false);
        }
    };

    // Handle status change
    const handleChangeStatus = async () => {
        if (!isOnline || !newStatus) {
            setError(t('common.offlineError'));
            return;
        }

        setActionLoading(true);
        try {
            await appointmentService.updateAppointmentStatus(id, newStatus);

            // Update appointment state to reflect new status
            setAppointment(prev => ({
                ...prev,
                status: newStatus
            }));

            setStatusDialogOpen(false);
        } catch (err) {
            console.error('Error updating appointment status:', err);
            setError(t('appointments.updateError'));
        } finally {
            setActionLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
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

    // Calculate duration in minutes
    const calculateDuration = (startTime, endTime) => {
        if (!startTime || !endTime) return 0;

        const start = new Date(startTime);
        const end = new Date(endTime);

        return Math.round((end - start) / (1000 * 60));
    };

    // Format duration in hours and minutes
    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours} ${t('common.hour', { count: hours })} ${mins > 0 ? `${mins} ${t('common.minute', { count: mins })}` : ''}`;
        }

        return `${mins} ${t('common.minute', { count: mins })}`;
    };

    // Render join meeting button if appointment is virtual
    const renderJoinMeetingButton = () => {
        if (!appointment.isVirtual || !appointment.meetingLink) return null;

        // Check if meeting is accessible (not cancelled and not too far in the past)
        const now = new Date();
        const meetingTime = new Date(appointment.startTime);
        const isPast = (now - meetingTime) > 1000 * 60 * 60 * 2; // 2 hours after start time

        if (appointment.status === 'Cancelled' || isPast) return null;

        return (
            <Button
                variant="contained"
                color="primary"
                startIcon={<VideocamIcon />}
                href={appointment.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mt: 2 }}
                disabled={appointment.status === 'Cancelled'}
            >
                {t('appointments.joinMeeting')}
            </Button>
        );
    };

    // Status options based on current status
    const getAvailableStatusOptions = () => {
        if (!appointment) return [];

        switch (appointment.status) {
            case 'Scheduled':
                return ['Confirmed', 'Cancelled', 'Rescheduled'];
            case 'Confirmed':
                return ['InProgress', 'Completed', 'Cancelled', 'Rescheduled'];
            case 'InProgress':
                return ['Completed', 'Cancelled'];
            case 'Rescheduled':
                return ['Scheduled', 'Confirmed', 'Cancelled'];
            default:
                return []; // No status changes for Completed or Cancelled
        }
    };

    // Check if user can edit the appointment
    const canEditAppointment = () => {
        if (!appointment || !user) return false;

        // Admins and the lawyer assigned to the appointment can edit it
        return (
            user.role === 'Admin' ||
            (user.role === 'Lawyer' && appointment.lawyerId === user.id) ||
            appointment.scheduledById === user.id
        );
    };

    // Check if appointment is past
    const isAppointmentPast = () => {
        if (!appointment) return false;

        const now = new Date();
        const endTime = new Date(appointment.endTime);

        return now > endTime;
    };

    // Render loading state
    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    // Render error state
    if (error && !appointment) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ mt: 4 }}>
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/appointments')}
                    >
                        {t('appointments.backToList')}
                    </Button>
                </Box>
            </Container>
        );
    }

    // Render not found state
    if (!appointment) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ mt: 4 }}>
                    <Alert severity="warning">
                        {t('appointments.notFound')}
                    </Alert>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/appointments')}
                        sx={{ mt: 2 }}
                    >
                        {t('appointments.backToList')}
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={appointment.title}
                subtitle={
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Chip
                            color={STATUS_COLORS[appointment.status] || 'default'}
                            label={t(`appointments.status.${appointment.status}`)}
                            size="medium"
                            sx={{ mr: 2 }}
                        />
                        <Chip
                            icon={<EventIcon />}
                            label={formatDate(appointment.startTime)}
                            variant="outlined"
                            size="medium"
                        />
                    </Box>
                }
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('appointments.appointments'), link: '/appointments' },
                    { text: appointment.title }
                ]}
            />

            {/* Error message */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Offline warning */}
            {!isOnline && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {t('common.offlineWarning')}
                </Alert>
            )}

            {/* Main content */}
            <Grid container spacing={3}>
                {/* Left column */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                            {t('appointments.details')}
                        </Typography>

                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                    <EventIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('appointments.date')}
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDate(appointment.startTime)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                    <TimeIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('appointments.time')}
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                            <Typography variant="body2" color="text.secondary">
                                                ({formatDuration(calculateDuration(appointment.startTime, appointment.endTime))})
                                            </Typography>
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                    <LocationIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('appointments.location')}
                                        </Typography>
                                        <Typography variant="body1">
                                            {appointment.isVirtual ?
                                                t('appointments.virtualMeeting') :
                                                (appointment.location || t('common.notSpecified'))}
                                        </Typography>
                                        {appointment.isVirtual && appointment.meetingLink && (
                                            <Link
                                                href={appointment.meetingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
                                            >
                                                <LinkIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                {t('appointments.joinViaLink')}
                                            </Link>
                                        )}
                                    </Box>
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                    <ScheduleIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {t('appointments.type')}
                                        </Typography>
                                        <Typography variant="body1">
                                            {t(`appointments.types.${appointment.type}`)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>

                            {appointment.description && (
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        {t('appointments.description')}
                                    </Typography>
                                    <Typography variant="body1" paragraph>
                                        {appointment.description}
                                    </Typography>
                                </Grid>
                            )}

                            {appointment.notes && (
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <NoteIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                {t('appointments.notes')}
                                            </Typography>
                                            <Typography variant="body1">
                                                {appointment.notes}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>

                        {/* Action buttons */}
                        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                            {appointment.isVirtual && appointment.meetingLink && renderJoinMeetingButton()}
                        </Box>
                    </Paper>

                    {/* Related case information if available */}
                    {appointment.caseId && (
                        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" component="h2" gutterBottom>
                                {t('appointments.relatedCase')}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                <GavelIcon color="primary" sx={{ mr: 2 }} />
                                <Box>
                                    <Typography variant="body1" fontWeight="medium">
                                        {appointment.case?.title || t('common.unavailable')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {appointment.case?.caseNumber || ''}
                                    </Typography>
                                </Box>
                            </Box>

                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => navigate(`/cases/${appointment.caseId}`)}
                                sx={{ mt: 2 }}
                            >
                                {t('appointments.viewCase')}
                            </Button>
                        </Paper>
                    )}
                </Grid>

                {/* Right column */}
                <Grid item xs={12} md={4}>
                    {/* People involved */}
                    <Card elevation={2} sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" component="h2" gutterBottom>
                                {t('appointments.people')}
                            </Typography>

                            {/* Client information */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    {t('appointments.client')}
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <PersonIcon color="primary" sx={{ mr: 2 }} />
                                    <Box>
                                        <Typography variant="body1">
                                            {appointment.client ?
                                                `${appointment.client.firstName} ${appointment.client.lastName}` :
                                                t('common.notSpecified')}
                                        </Typography>
                                        {appointment.client?.email && (
                                            <Typography variant="body2" color="text.secondary">
                                                {appointment.client.email}
                                            </Typography>
                                        )}
                                        {appointment.client?.phoneNumber && (
                                            <Typography variant="body2" color="text.secondary">
                                                {appointment.client.phoneNumber}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                {appointment.client && (
                                    <Button
                                        variant="text"
                                        size="small"
                                        onClick={() => navigate(`/clients/${appointment.clientId}`)}
                                        sx={{ mt: 1 }}
                                    >
                                        {t('appointments.viewClient')}
                                    </Button>
                                )}
                            </Box>

                            {/* Lawyer information */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    {t('appointments.lawyer')}
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <PersonIcon color="primary" sx={{ mr: 2 }} />
                                    <Box>
                                        <Typography variant="body1">
                                            {appointment.lawyer && appointment.lawyer.user ?
                                                `${appointment.lawyer.user.firstName} ${appointment.lawyer.user.lastName}` :
                                                t('common.notAssigned')}
                                        </Typography>
                                        {appointment.lawyer?.user?.email && (
                                            <Typography variant="body2" color="text.secondary">
                                                {appointment.lawyer.user.email}
                                            </Typography>
                                        )}
                                        {appointment.lawyer?.user?.phoneNumber && (
                                            <Typography variant="body2" color="text.secondary">
                                                {appointment.lawyer.user.phoneNumber}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Action cards */}
                    <Card elevation={2} sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" component="h2" gutterBottom>
                                {t('common.actions')}
                            </Typography>

                            <Grid container spacing={2}>
                                {/* Edit button */}
                                <Grid item xs={12}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<EditIcon />}
                                        onClick={() => navigate(`/appointments/${id}/edit`)}
                                        disabled={
                                            !isOnline ||
                                            appointment.status === 'Cancelled' ||
                                            appointment.status === 'Completed' ||
                                            isAppointmentPast() ||
                                            !canEditAppointment()
                                        }
                                    >
                                        {t('common.edit')}
                                    </Button>
                                </Grid>

                                {/* Change status button - if not cancelled/completed */}
                                {(['Cancelled', 'Completed'].indexOf(appointment.status) === -1) && canEditAppointment() && (
                                    <Grid item xs={12}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<CheckIcon />}
                                            onClick={() => setStatusDialogOpen(true)}
                                            disabled={!isOnline || getAvailableStatusOptions().length === 0}
                                        >
                                            {t('appointments.changeStatus')}
                                        </Button>
                                    </Grid>
                                )}

                                {/* Cancel appointment button - if not already cancelled/completed */}
                                {(['Cancelled', 'Completed'].indexOf(appointment.status) === -1) && canEditAppointment() && (
                                    <Grid item xs={12}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="error"
                                            startIcon={<CancelIcon />}
                                            onClick={() => setCancelDialogOpen(true)}
                                            disabled={!isOnline}
                                        >
                                            {t('appointments.cancel')}
                                        </Button>
                                    </Grid>
                                )}

                                {/* Print appointment button */}
                                <Grid item xs={12}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<PrintIcon />}
                                        onClick={() => window.print()}
                                    >
                                        {t('common.print')}
                                    </Button>
                                </Grid>

                                {/* Back to list */}
                                <Grid item xs={12}>
                                    <Button
                                        fullWidth
                                        variant="text"
                                        startIcon={<ArrowBackIcon />}
                                        onClick={() => navigate('/appointments')}
                                    >
                                        {t('appointments.backToList')}
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Meta information */}
                    <Card elevation={1} sx={{ mb: 3, bgcolor: 'background.default' }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                {t('common.additionalInfo')}
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {t('appointments.created')}:
                                </Typography>
                                <Typography variant="body2">
                                    {appointment.createdAt ? formatDate(appointment.createdAt) : t('common.unknown')}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {t('appointments.scheduledBy')}:
                                </Typography>
                                <Typography variant="body2">
                                    {appointment.scheduledBy ?
                                        `${appointment.scheduledBy.firstName} ${appointment.scheduledBy.lastName}` :
                                        t('common.unknown')}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">
                                    {t('appointments.id')}:
                                </Typography>
                                <Typography variant="body2" fontFamily="monospace">
                                    {appointment.appointmentId}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Cancel appointment dialog */}
            <Dialog
                open={cancelDialogOpen}
                onClose={() => setCancelDialogOpen(false)}
                aria-labelledby="cancel-dialog-title"
                aria-describedby="cancel-dialog-description"
            >
                <DialogTitle id="cancel-dialog-title">
                    {t('appointments.cancelAppointment')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="cancel-dialog-description">
                        {t('appointments.cancelConfirmation', {
                            title: appointment.title,
                            date: formatDate(appointment.startTime),
                            time: formatTime(appointment.startTime)
                        })}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setCancelDialogOpen(false)}
                        disabled={actionLoading}
                    >
                        {t('common.back')}
                    </Button>
                    <Button
                        onClick={handleCancelAppointment}
                        color="error"
                        variant="contained"
                        disabled={actionLoading}
                        startIcon={actionLoading ? <CircularProgress size={20} /> : null}
                    >
                        {actionLoading ? t('common.canceling') : t('common.cancel')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Change status dialog */}
            <Dialog
                open={statusDialogOpen}
                onClose={() => setStatusDialogOpen(false)}
                aria-labelledby="status-dialog-title"
            >
                <DialogTitle id="status-dialog-title">
                    {t('appointments.changeStatus')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText gutterBottom>
                        {t('appointments.currentStatus')}: <Chip
                            size="small"
                            color={STATUS_COLORS[appointment.status] || 'default'}
                            label={t(`appointments.status.${appointment.status}`)}
                        />
                    </DialogContentText>

                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                        {t('appointments.selectNewStatus')}:
                    </Typography>

                    <Grid container spacing={1}>
                        {getAvailableStatusOptions().map((status) => (
                            <Grid item key={status}>
                                <Chip
                                    clickable
                                    color={status === newStatus ? STATUS_COLORS[status] : 'default'}
                                    variant={status === newStatus ? 'filled' : 'outlined'}
                                    label={t(`appointments.status.${status}`)}
                                    onClick={() => setNewStatus(status)}
                                    sx={{ m: 0.5 }}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setStatusDialogOpen(false)}
                        disabled={actionLoading}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleChangeStatus}
                        color="primary"
                        variant="contained"
                        disabled={actionLoading || !newStatus}
                        startIcon={actionLoading ? <CircularProgress size={20} /> : null}
                    >
                        {actionLoading ? t('common.updating') : t('common.update')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AppointmentDetailsPage;