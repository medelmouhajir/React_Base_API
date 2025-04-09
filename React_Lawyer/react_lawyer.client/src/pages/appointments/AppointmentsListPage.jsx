// src/pages/appointments/AppointmentsListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    Button,
    TextField,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    InputAdornment,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Grid,
    Tooltip,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Today as TodayIcon,
    DateRange as DateRangeIcon,
    Refresh as RefreshIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';
import { Clear as ClearIcon } from '@mui/icons-material';

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

const AppointmentsListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();

    // State
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalAppointments, setTotalAppointments] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Filters
    const [filterDate, setFilterDate] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Fetch appointments
    useEffect(() => {
        const fetchAppointments = async () => {
            if (!isOnline) {
                setLoading(false);
                setError(t('common.offlineMode'));
                return;
            }

            setLoading(true);
            setError('');

            try {
                let data;

                if (filterDate) {
                    // Fetch appointments for a specific date
                    data = await appointmentService.getAppointmentsByDate(filterDate);
                } else {
                    // Fetch all upcoming appointments
                    data = await appointmentService.getUpcomingAppointments();
                }

                // Apply status filter
                let filteredData = [...data];
                if (filterStatus !== 'All') {
                    filteredData = filteredData.filter(a => a.status === filterStatus);
                }

                // Sort by start time
                filteredData.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

                setTotalAppointments(filteredData.length);
                setAppointments(filteredData);
            } catch (err) {
                console.error('Error fetching appointments:', err);
                setError(t('appointments.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [user, filterDate, filterStatus, refreshTrigger, isOnline, t]);

    // Handle page change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Open delete confirmation dialog
    const handleOpenDeleteDialog = (appointment) => {
        setAppointmentToDelete(appointment);
        setDeleteDialogOpen(true);
    };

    // Close delete confirmation dialog
    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setAppointmentToDelete(null);
    };

    // Handle appointment deletion/cancellation
    const handleDeleteAppointment = async () => {
        if (!appointmentToDelete || !isOnline) return;

        setDeleteLoading(true);

        try {
            // Instead of deleting, update status to Cancelled
            await appointmentService.updateAppointmentStatus(appointmentToDelete.appointmentId, 'Cancelled');

            // Refresh appointments list
            setRefreshTrigger(prev => prev + 1);
            handleCloseDeleteDialog();
        } catch (err) {
            console.error('Error cancelling appointment:', err);
            setError(t('appointments.cancelError'));
        } finally {
            setDeleteLoading(false);
        }
    };

    // Calculate paged data
    const pagedAppointments = appointments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Format time
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Clear error message
    const handleClearError = () => {
        setError('');
    };

    // Today's appointments button click
    const handleTodayClick = () => {
        setFilterDate(new Date());
    };

    // Clear date filter
    const handleClearDateFilter = () => {
        setFilterDate(null);
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={t('appointments.appointments')}
                subtitle={t('appointments.upcomingAppointments', { count: totalAppointments })}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('appointments.appointments') }
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
                    onClose={handleClearError}
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
                    <Grid item xs={12} md={showFilters ? 12 : 6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Button
                                variant={filterDate && new Date(filterDate).toDateString() === new Date().toDateString() ? "contained" : "outlined"}
                                startIcon={<TodayIcon />}
                                onClick={handleTodayClick}
                                sx={{ mr: 2 }}
                                disabled={!isOnline}
                            >
                                {t('appointments.today')}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<FilterIcon />}
                                onClick={() => setShowFilters(!showFilters)}
                                sx={{ mr: 2 }}
                            >
                                {showFilters ? t('common.hideFilters') : t('common.showFilters')}
                            </Button>
                            <Button
                                size="small"
                                startIcon={<RefreshIcon />}
                                onClick={() => setRefreshTrigger(prev => prev + 1)}
                                disabled={!isOnline || loading}
                            >
                                {t('common.refresh')}
                            </Button>
                        </Box>
                    </Grid>

                    {showFilters && (
                        <>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label={t('appointments.filterByDate')}
                                    type="date"
                                    value={filterDate ? new Date(filterDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setFilterDate(e.target.value ? new Date(e.target.value) : null)}
                                    fullWidth
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={handleClearDateFilter}
                                                    size="small"
                                                    sx={{ visibility: filterDate ? 'visible' : 'hidden' }}
                                                >
                                                    <ClearIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel id="status-filter-label">{t('appointments.status')}</InputLabel>
                                    <Select
                                        labelId="status-filter-label"
                                        id="status-filter"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        label={t('appointments.status')}
                                    >
                                        <MenuItem value="All">{t('common.all')}</MenuItem>
                                        <MenuItem value="Scheduled">{t('appointments.status.scheduled')}</MenuItem>
                                        <MenuItem value="Confirmed">{t('appointments.status.confirmed')}</MenuItem>
                                        <MenuItem value="InProgress">{t('appointments.status.inProgress')}</MenuItem>
                                        <MenuItem value="Completed">{t('appointments.status.completed')}</MenuItem>
                                        <MenuItem value="Cancelled">{t('appointments.status.cancelled')}</MenuItem>
                                        <MenuItem value="Rescheduled">{t('appointments.status.rescheduled')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                {/* Additional filters can be added here */}
                            </Grid>
                        </>
                    )}
                </Grid>

            </Paper>

            {/* Appointments table */}
            <Paper>
                <TableContainer>
                    <Table aria-label="appointments table">
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('appointments.date')}</TableCell>
                                <TableCell>{t('appointments.time')}</TableCell>
                                <TableCell>{t('appointments.title')}</TableCell>
                                <TableCell>{t('appointments.client')}</TableCell>
                                <TableCell>{t('appointments.lawyer')}</TableCell>
                                <TableCell>{t('appointments.status')}</TableCell>
                                <TableCell align="right">{t('common.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" height={200}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : pagedAppointments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" height={100}>
                                        <Typography variant="body1" color="textSecondary">
                                            {filterDate
                                                ? t('appointments.noAppointmentsForDate', { date: formatDate(filterDate) })
                                                : t('appointments.noUpcomingAppointments')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pagedAppointments.map((appointment) => (
                                    <TableRow key={appointment.appointmentId} hover>
                                        <TableCell>{formatDate(appointment.startTime)}</TableCell>
                                        <TableCell>
                                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                fontWeight={appointment.isUrgent ? 'bold' : 'normal'}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {appointment.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {appointment.client
                                                ? `${appointment.client.firstName} ${appointment.client.lastName}`
                                                : t('common.notAvailable')}
                                        </TableCell>
                                        <TableCell>
                                            {appointment.lawyer && appointment.lawyer.user
                                                ? `${appointment.lawyer.user.firstName} ${appointment.lawyer.user.lastName}`
                                                : t('common.notAssigned')}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                color={STATUS_COLORS[appointment.status] || 'default'}
                                                size="small"
                                                label={t(`appointments.status.${appointment.status}`)}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title={t('common.view')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/appointments/${appointment.appointmentId}`)}
                                                >
                                                    <ViewIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('common.edit')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/appointments/${appointment.appointmentId}/edit`)}
                                                    disabled={!isOnline || appointment.status === 'Cancelled' || appointment.status === 'Completed'}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={appointment.status === 'Cancelled' ? t('appointments.alreadyCancelled') : t('appointments.cancel')}>
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleOpenDeleteDialog(appointment)}
                                                        disabled={!isOnline || appointment.status === 'Cancelled' || appointment.status === 'Completed'}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalAppointments}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage={t('common.rowsPerPage')}
                />
            </Paper>

            {/* Cancel Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
            >
                <DialogTitle>{t('appointments.cancelAppointment')}</DialogTitle>
                <DialogContent>
                    {appointmentToDelete && (
                        <Typography variant="body1">
                            {t('appointments.cancelConfirmation', {
                                title: appointmentToDelete.title || '',
                                date: formatDate(appointmentToDelete.startTime),
                                time: formatTime(appointmentToDelete.startTime)
                            })}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseDeleteDialog}
                        disabled={deleteLoading}
                    >
                        {t('common.back')}
                    </Button>
                    <Button
                        onClick={handleDeleteAppointment}
                        color="error"
                        variant="contained"
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
                    >
                        {deleteLoading ? t('common.canceling') : t('common.cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AppointmentsListPage;