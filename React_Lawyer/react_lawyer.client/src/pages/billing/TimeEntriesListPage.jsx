// src/pages/billing/TimeEntriesListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    TextField,
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
    DialogActions,
    DialogContentText,
    Drawer,
    Divider,
    Tab,
    Tabs,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    Clear as ClearIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    Gavel as GavelIcon,
    AttachMoney as MoneyIcon,
    Receipt as ReceiptIcon,
    AccessTime as AccessTimeIcon,
    Description as DescriptionIcon,
    CalendarToday as CalendarIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    PlayArrow as PlayArrowIcon,
    Stop as StopIcon
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import timeEntryService from '../../services/timeEntryService';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const TimeEntriesListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();

    // State
    const [timeEntries, setTimeEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalTimeEntries, setTotalTimeEntries] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Filters
    const [filterText, setFilterText] = useState('');
    const [filterLawyer, setFilterLawyer] = useState('');
    const [filterClient, setFilterClient] = useState('');
    const [filterCase, setFilterCase] = useState('');
    const [filterBillable, setFilterBillable] = useState('all');
    const [filterDateRange, setFilterDateRange] = useState({
        startDate: null,
        endDate: null
    });
    const [showFilters, setShowFilters] = useState(false);

    // Form data for new/edit time entry
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
    const [formData, setFormData] = useState({
        timeEntryId: 0,
        lawyerId: user?.role === 'Lawyer' ? user.id : '',
        clientId: '',
        caseId: '',
        activityDate: new Date(),
        durationMinutes: 0,
        description: '',
        isBillable: true,
        hourlyRate: 0,
        isBilled: false,
        invoiceId: null,
        lawFirmId: user?.lawFirmId || 0
    });

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [timeEntryToDelete, setTimeEntryToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Dropdown options
    const [lawyers, setLawyers] = useState([]);
    const [clients, setClients] = useState([]);
    const [cases, setCases] = useState([]);
    const [activeCases, setActiveCases] = useState([]);

    // Tab state
    const [tabValue, setTabValue] = useState(0);

    // Time tracking state
    const [activeTimer, setActiveTimer] = useState(null);
    const [timerDescription, setTimerDescription] = useState('');
    const [timerCase, setTimerCase] = useState('');
    const [timerClient, setTimerClient] = useState('');
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [timerInterval, setTimerInterval] = useState(null);

    // Fetch data when component mounts
    useEffect(() => {
        const fetchTimeEntries = async () => {
            if (!isOnline) {
                setLoading(false);
                setError(t('common.offlineMode'));
                return;
            }

            setLoading(true);
            setError('');

            try {
                let data;

                // Get time entries based on user role and filters
                if (user?.lawFirmId) {
                    data = await timeEntryService.getTimeEntriesByFirm(user.lawFirmId);
                } else if (user?.role === 'Lawyer') {
                    data = await timeEntryService.getTimeEntriesByLawyer(user.id);
                } else {
                    data = await timeEntryService.getTimeEntries();
                }

                // Apply filters
                let filteredData = [...data];

                // Filter by text (description)
                if (filterText) {
                    const searchTerm = filterText.toLowerCase();
                    filteredData = filteredData.filter(entry =>
                        entry.description.toLowerCase().includes(searchTerm) ||
                        (entry.case && entry.case.title.toLowerCase().includes(searchTerm)) ||
                        (entry.client &&
                            (entry.client.firstName + ' ' + entry.client.lastName).toLowerCase().includes(searchTerm))
                    );
                }

                // Filter by lawyer
                if (filterLawyer) {
                    filteredData = filteredData.filter(entry => entry.lawyerId === parseInt(filterLawyer));
                }

                // Filter by client
                if (filterClient) {
                    filteredData = filteredData.filter(entry => entry.clientId === parseInt(filterClient));
                }

                // Filter by case
                if (filterCase) {
                    filteredData = filteredData.filter(entry => entry.caseId === parseInt(filterCase));
                }

                // Filter by billable status
                if (filterBillable !== 'all') {
                    const isBillable = filterBillable === 'billable';
                    filteredData = filteredData.filter(entry => entry.isBillable === isBillable);
                }

                // Filter by date range
                if (filterDateRange.startDate) {
                    const startDate = new Date(filterDateRange.startDate);
                    startDate.setHours(0, 0, 0, 0);
                    filteredData = filteredData.filter(entry => new Date(entry.activityDate) >= startDate);
                }

                if (filterDateRange.endDate) {
                    const endDate = new Date(filterDateRange.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    filteredData = filteredData.filter(entry => new Date(entry.activityDate) <= endDate);
                }

                // Filter by tab (All, Unbilled, Billed)
                if (tabValue === 1) { // Unbilled
                    filteredData = filteredData.filter(entry => entry.isBillable && !entry.isBilled);
                } else if (tabValue === 2) { // Billed
                    filteredData = filteredData.filter(entry => entry.isBillable && entry.isBilled);
                }

                // Sort by activity date (most recent first)
                filteredData.sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));

                setTotalTimeEntries(filteredData.length);
                setTimeEntries(filteredData);
            } catch (err) {
                console.error('Error fetching time entries:', err);
                setError(t('billing.timeEntries.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        const fetchDropdownData = async () => {
            try {
                // Fetch lawyers, clients, and cases for dropdowns
                const [lawyersData, clientsData, casesData] = await Promise.all([
                    timeEntryService.getLawyers(),
                    timeEntryService.getClients(),
                    timeEntryService.getCases()
                ]);

                setLawyers(lawyersData);
                setClients(clientsData);
                setCases(casesData);

                // Filter active cases for timer dropdown
                const activeCasesData = casesData.filter(c => c.status === 1 || c.status === 2); // Active or Pending
                setActiveCases(activeCasesData);
            } catch (err) {
                console.error('Error fetching dropdown data:', err);
            }
        };

        fetchTimeEntries();
        fetchDropdownData();
    }, [
        user,
        filterText,
        filterLawyer,
        filterClient,
        filterCase,
        filterBillable,
        filterDateRange,
        tabValue,
        refreshTrigger,
        isOnline,
        t
    ]);

    // Handle page change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handle search text change
    const handleSearchChange = (event) => {
        setFilterText(event.target.value);
        setPage(0);
    };

    // Clear search
    const handleClearSearch = () => {
        setFilterText('');
    };

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setPage(0);
    };

    // Open form drawer
    const handleOpenForm = (mode, timeEntry = null) => {
        if (mode === 'edit' && timeEntry) {
            setFormData({
                timeEntryId: timeEntry.timeEntryId,
                lawyerId: timeEntry.lawyerId,
                clientId: timeEntry.clientId,
                caseId: timeEntry.caseId,
                activityDate: new Date(timeEntry.activityDate),
                durationMinutes: timeEntry.durationMinutes,
                description: timeEntry.description,
                isBillable: timeEntry.isBillable,
                hourlyRate: timeEntry.hourlyRate,
                isBilled: timeEntry.isBilled,
                invoiceId: timeEntry.invoiceId,
                lawFirmId: timeEntry.lawFirmId || user?.lawFirmId || 0
            });
        } else {
            console.log(user);
            // Reset form for new entry
            setFormData({
                timeEntryId: 0,
                lawyerId: user?.role === 'Lawyer' ? user.roleId : '',
                clientId: '',
                caseId: '',
                activityDate: new Date(),
                durationMinutes: 0,
                description: '',
                isBillable: true,
                hourlyRate: 0,
                isBilled: false,
                invoiceId: null,
                lawFirmId: user?.lawFirmId || 0
            });
        }

        setFormMode(mode);
        setFormOpen(true);
    };

    // Close form drawer
    const handleCloseForm = () => {
        setFormOpen(false);
    };

    // Handle form input changes
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle date change
    const handleDateChange = (date) => {
        setFormData(prev => ({
            ...prev,
            activityDate: date
        }));
    };

    // Handle form submission
    const handleSubmitForm = async (e) => {
        e.preventDefault();

        if (!isOnline) {
            setError(t('common.offlineError'));
            return;
        }

        try {
            // Validate form
            if (!formData.lawyerId || !formData.description || formData.durationMinutes <= 0) {
                setError(t('billing.timeEntries.validationError'));
                return;
            }

            // Format data for API
            const timeEntryData = {
                ...formData,
                lawyerId: parseInt(formData.lawyerId),
                clientId: formData.clientId ? parseInt(formData.clientId) : null,
                caseId: formData.caseId ? parseInt(formData.caseId) : null,
                durationMinutes: parseInt(formData.durationMinutes),
                hourlyRate: parseFloat(formData.hourlyRate),
                activityDate: formData.activityDate.toISOString()
            };

            if (formMode === 'add') {
                await timeEntryService.createTimeEntry(timeEntryData);
            } else {
                await timeEntryService.updateTimeEntry(formData.timeEntryId, timeEntryData);
            }

            // Refresh time entries list
            setRefreshTrigger(prev => prev + 1);
            handleCloseForm();
        } catch (err) {
            console.error('Error saving time entry:', err);
            setError(formMode === 'add'
                ? t('billing.timeEntries.createError')
                : t('billing.timeEntries.updateError'));
        }
    };

    // Open delete confirmation dialog
    const handleOpenDeleteDialog = (timeEntry) => {
        setTimeEntryToDelete(timeEntry);
        setDeleteDialogOpen(true);
    };

    // Close delete confirmation dialog
    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setTimeEntryToDelete(null);
    };

    // Handle time entry deletion
    const handleDeleteTimeEntry = async () => {
        if (!timeEntryToDelete || !isOnline) return;

        setDeleteLoading(true);

        try {
            await timeEntryService.deleteTimeEntry(timeEntryToDelete.timeEntryId);

            // Refresh time entries list
            setRefreshTrigger(prev => prev + 1);
            handleCloseDeleteDialog();
        } catch (err) {
            console.error('Error deleting time entry:', err);
            setError(t('billing.timeEntries.deleteError'));
        } finally {
            setDeleteLoading(false);
        }
    };

    // Start timer
    const handleStartTimer = () => {
        if (activeTimer) return;

        if (!timerDescription) {
            setError(t('billing.timeEntries.timerDescriptionRequired'));
            return;
        }

        const interval = setInterval(() => {
            setTimerSeconds(prev => prev + 1);
        }, 1000);

        setActiveTimer({
            startTime: new Date(),
            description: timerDescription,
            caseId: timerCase || null,
            clientId: timerClient || null
        });

        setTimerInterval(interval);
    };

    // Stop timer and save time entry
    const handleStopTimer = async () => {
        if (!activeTimer) return;

        clearInterval(timerInterval);
        const endTime = new Date();
        const durationMs = endTime - new Date(activeTimer.startTime);
        const durationMinutes = Math.max(1, Math.round(durationMs / 60000)); // Minimum 1 minute

        try {
            if (isOnline) {
                // Create time entry
                const timeEntryData = {
                    lawyerId: user?.role === 'Lawyer' ? user.roleId : null,
                    clientId: activeTimer.clientId,
                    caseId: activeTimer.caseId,
                    activityDate: activeTimer.startTime.toISOString(),
                    durationMinutes: durationMinutes,
                    description: activeTimer.description,
                    isBillable: true,
                    hourlyRate: 0, // Default, can be updated later
                    isBilled: false,
                    invoiceId: null,
                    lawFirmId: user?.lawFirmId || 0
                };

                await timeEntryService.createTimeEntry(timeEntryData);

                // Refresh time entries list
                setRefreshTrigger(prev => prev + 1);
            } else {
                // If offline, show warning but don't prevent stopping timer
                setError(t('common.offlineWarning'));
            }
        } catch (err) {
            console.error('Error saving timer entry:', err);
            setError(t('billing.timeEntries.timerSaveError'));
        } finally {
            // Reset timer
            setActiveTimer(null);
            setTimerSeconds(0);
            setTimerDescription('');
            setTimerCase('');
            setTimerClient('');
            setTimerInterval(null);
        }
    };

    // Cancel timer without saving
    const handleCancelTimer = () => {
        if (!activeTimer) return;

        clearInterval(timerInterval);
        setActiveTimer(null);
        setTimerSeconds(0);
        setTimerDescription('');
        setTimerCase('');
        setTimerClient('');
        setTimerInterval(null);
    };

    // Format time for display (HH:MM:SS)
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Format duration in hours and minutes
    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Format currency
    const formatCurrency = (amount) => {
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    };

    // Calculate paged data
    const pagedTimeEntries = timeEntries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Calculate total hours and amount
    const totalHours = timeEntries.reduce((total, entry) => total + entry.durationMinutes / 60, 0);
    const totalAmount = timeEntries.reduce((total, entry) => {
        if (entry.isBillable) {
            return total + ((entry.durationMinutes / 60) * entry.hourlyRate);
        }
        return total;
    }, 0);

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={t('billing.timeEntries.title')}
                subtitle={t('billing.timeEntries.subtitle')}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('billing.billing'), link: '/billing' },
                    { text: t('billing.timeEntries.title') }
                ]}
                action={t('billing.timeEntries.addTimeEntry')}
                actionIcon={<AddIcon />}
                onActionClick={() => handleOpenForm('add')}
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

            {/* Time Tracker */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    <AccessTimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {t('billing.timeEntries.timeTracker')}
                </Typography>

                <Grid container spacing={2} alignItems="center">
                    {!activeTimer ? (
                        // Timer not active - show start form
                        <>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label={t('billing.timeEntries.description')}
                                    value={timerDescription}
                                    onChange={(e) => setTimerDescription(e.target.value)}
                                    required
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <DescriptionIcon />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="timer-client-label">{t('clients.client')}</InputLabel>
                                    <Select
                                        labelId="timer-client-label"
                                        value={timerClient}
                                        onChange={(e) => setTimerClient(e.target.value)}
                                        label={t('clients.client')}
                                    >
                                        <MenuItem value="">
                                            <em>{t('common.none')}</em>
                                        </MenuItem>
                                        {clients.map((client) => (
                                            <MenuItem key={client.clientId} value={client.clientId}>
                                                {client.firstName} {client.lastName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="timer-case-label">{t('cases.case')}</InputLabel>
                                    <Select
                                        labelId="timer-case-label"
                                        value={timerCase}
                                        onChange={(e) => setTimerCase(e.target.value)}
                                        label={t('cases.case')}
                                    >
                                        <MenuItem value="">
                                            <em>{t('common.none')}</em>
                                        </MenuItem>
                                        {activeCases.map((caseItem) => (
                                            <MenuItem key={caseItem.caseId} value={caseItem.caseId}>
                                                {caseItem.title}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={2}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    startIcon={<PlayArrowIcon />}
                                    onClick={handleStartTimer}
                                    disabled={!timerDescription}
                                >
                                    {t('billing.timeEntries.startTimer')}
                                </Button>
                            </Grid>
                        </>
                    ) : (
                        // Timer active - show timer display
                        <>
                            <Grid item xs={12} md={5}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 1 }}>
                                        {activeTimer.description}
                                    </Typography>
                                    {activeTimer.caseId && (
                                        <Chip
                                            size="small"
                                            icon={<GavelIcon />}
                                            label={cases.find(c => c.caseId === parseInt(activeTimer.caseId))?.title || ''}
                                            sx={{ mr: 1 }}
                                        />
                                    )}
                                    {activeTimer.clientId && (
                                        <Chip
                                            size="small"
                                            icon={<PersonIcon />}
                                            label={
                                                (() => {
                                                    const client = clients.find(c => c.clientId === parseInt(activeTimer.clientId));
                                                    return client ? `${client.firstName} ${client.lastName}` : '';
                                                })()
                                            }
                                        />
                                    )}
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <Typography variant="h4" sx={{ fontFamily: 'monospace', textAlign: 'center' }}>
                                    {formatTime(timerSeconds)}
                                </Typography>
                            </Grid>

                            <Grid item xs={6} md={2}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="success"
                                    startIcon={<StopIcon />}
                                    onClick={handleStopTimer}
                                >
                                    {t('billing.timeEntries.stopAndSave')}
                                </Button>
                            </Grid>

                            <Grid item xs={6} md={2}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="error"
                                    startIcon={<CancelIcon />}
                                    onClick={handleCancelTimer}
                                >
                                    {t('common.cancel')}
                                </Button>
                            </Grid>
                        </>
                    )}
                </Grid>
            </Paper>

            {/* Tabs and filters */}
            <Paper sx={{ mb: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="time entries tabs"
                    >
                        <Tab label={t('common.all')} />
                        <Tab label={t('billing.timeEntries.unbilled')} />
                        <Tab label={t('billing.timeEntries.billed')} />
                    </Tabs>
                </Box>

                <Box sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                placeholder={t('billing.timeEntries.searchPlaceholder')}
                                value={filterText}
                                onChange={handleSearchChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                    endAdornment: filterText && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="clear search"
                                                onClick={handleClearSearch}
                                                edge="end"
                                                size="small"
                                            >
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <Button
                                variant="outlined"
                                startIcon={<FilterIcon />}
                                onClick={() => setShowFilters(!showFilters)}
                                fullWidth
                            >
                                {showFilters ? t('common.hideFilters') : t('common.showFilters')}
                            </Button>
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={() => setRefreshTrigger(prev => prev + 1)}
                                disabled={!isOnline || loading}
                                fullWidth
                            >
                                {t('common.refresh')}
                            </Button>
                        </Grid>

                        {showFilters && (
                            <>
                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel id="lawyer-filter-label">{t('cases.lawyer')}</InputLabel>
                                        <Select
                                            labelId="lawyer-filter-label"
                                            value={filterLawyer}
                                            onChange={(e) => setFilterLawyer(e.target.value)}
                                            label={t('cases.lawyer')}
                                        >
                                            <MenuItem value="">
                                                <em>{t('common.all')}</em>
                                            </MenuItem>
                                            {lawyers.map((lawyer) => (
                                                <MenuItem key={lawyer.lawyerId} value={lawyer.lawyerId}>
                                                    {lawyer.user ? `${lawyer.user.firstName} ${lawyer.user.lastName}` : `ID: ${lawyer.lawyerId}`}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel id="client-filter-label">{t('clients.client')}</InputLabel>
                                        <Select
                                            labelId="client-filter-label"
                                            value={filterClient}
                                            onChange={(e) => setFilterClient(e.target.value)}
                                            label={t('clients.client')}
                                        >
                                            <MenuItem value="">
                                                <em>{t('common.all')}</em>
                                            </MenuItem>
                                            {clients.map((client) => (
                                                <MenuItem key={client.clientId} value={client.clientId}>
                                                    {client.firstName} {client.lastName}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel id="case-filter-label">{t('cases.case')}</InputLabel>
                                        <Select
                                            labelId="case-filter-label"
                                            value={filterCase}
                                            onChange={(e) => setFilterCase(e.target.value)}
                                            label={t('cases.case')}
                                        >
                                            <MenuItem value="">
                                                <em>{t('common.all')}</em>
                                            </MenuItem>
                                            {cases.map((caseItem) => (
                                                <MenuItem key={caseItem.caseId} value={caseItem.caseId}>
                                                    {caseItem.title}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel id="billable-filter-label">{t('billing.timeEntries.billable')}</InputLabel>
                                        <Select
                                            labelId="billable-filter-label"
                                            value={filterBillable}
                                            onChange={(e) => setFilterBillable(e.target.value)}
                                            label={t('billing.timeEntries.billable')}
                                        >
                                            <MenuItem value="all">
                                                <em>{t('common.all')}</em>
                                            </MenuItem>
                                            <MenuItem value="billable">{t('common.yes')}</MenuItem>
                                            <MenuItem value="nonbillable">{t('common.no')}</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </>
                        )}
                    </Grid>
                </Box>
            </Paper>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%', backgroundColor: 'primary.light', color: 'white' }}>
                        <Typography variant="h6" gutterBottom>
                            {t('billing.timeEntries.totalEntries')}
                        </Typography>
                        <Typography variant="h3">
                            {totalTimeEntries}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%', backgroundColor: 'secondary.light', color: 'white' }}>
                        <Typography variant="h6" gutterBottom>
                            {t('billing.timeEntries.totalHours')}
                        </Typography>
                        <Typography variant="h3">
                            {totalHours.toFixed(2)}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%', backgroundColor: 'success.light', color: 'white' }}>
                        <Typography variant="h6" gutterBottom>
                            {t('billing.timeEntries.totalAmount')}
                        </Typography>
                        <Typography variant="h3">
                            {formatCurrency(totalAmount)}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Time Entries Table */}
            <Paper>
                <TableContainer>
                    <Table aria-label="time entries table">
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('common.date')}</TableCell>
                                <TableCell>{t('cases.lawyer')}</TableCell>
                                <TableCell>{t('billing.timeEntries.description')}</TableCell>
                                <TableCell>{t('clients.client')}</TableCell>
                                <TableCell>{t('cases.case')}</TableCell>
                                <TableCell align="right">{t('billing.timeEntries.duration')}</TableCell>
                                <TableCell align="right">{t('billing.timeEntries.rate')}</TableCell>
                                <TableCell align="right">{t('billing.timeEntries.amount')}</TableCell>
                                <TableCell>{t('common.status')}</TableCell>
                                <TableCell align="right">{t('common.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : pagedTimeEntries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                                        <Typography variant="body1" color="textSecondary">
                                            {t('billing.timeEntries.noEntriesFound')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pagedTimeEntries.map((entry) => {
                                    const amount = (entry.durationMinutes / 60) * entry.hourlyRate;
                                    return (
                                        <TableRow key={entry.timeEntryId} hover>
                                            <TableCell>
                                                {formatDate(entry.activityDate)}
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const lawyer = lawyers.find(l => l.lawyerId === entry.lawyerId);
                                                    return lawyer
                                                        ? `${lawyer.firstName} ${lawyer.lastName}`
                                                        : t('common.unavailable');
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={entry.description}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            maxWidth: 200,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}
                                                    >
                                                        {entry.description}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                {entry.clientId ? (() => {
                                                    const client = clients.find(c => c.clientId === entry.clientId);
                                                    return client
                                                        ? `${client.firstName} ${client.lastName}`
                                                        : t('common.unavailable');
                                                })() : t('common.none')}
                                            </TableCell>
                                            <TableCell>
                                                {entry.caseId ? (() => {
                                                    const caseItem = cases.find(c => c.caseId === entry.caseId);
                                                    return caseItem ? caseItem.title : t('common.unavailable');
                                                })() : t('common.none')}
                                            </TableCell>
                                            <TableCell align="right">
                                                {formatDuration(entry.durationMinutes)}
                                            </TableCell>
                                            <TableCell align="right">
                                                {formatCurrency(entry.hourlyRate)}
                                            </TableCell>
                                            <TableCell align="right">
                                                {entry.isBillable ? formatCurrency(amount) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Chip
                                                        size="small"
                                                        color={entry.isBillable ? 'primary' : 'default'}
                                                        label={entry.isBillable
                                                            ? t('billing.timeEntries.billable')
                                                            : t('billing.timeEntries.nonBillable')}
                                                    />
                                                    {entry.isBillable && (
                                                        <Chip
                                                            size="small"
                                                            color={entry.isBilled ? 'success' : 'warning'}
                                                            label={entry.isBilled
                                                                ? t('billing.timeEntries.billed')
                                                                : t('billing.timeEntries.unbilled')}
                                                        />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                {!entry.isBilled && (
                                                    <>
                                                        <Tooltip title={t('common.edit')}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpenForm('edit', entry)}
                                                                disabled={!isOnline}
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title={t('common.delete')}>
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleOpenDeleteDialog(entry)}
                                                                disabled={!isOnline}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                                {entry.isBilled && entry.invoiceId && (
                                                    <Tooltip title={t('billing.viewInvoice')}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigate(`/billing/invoices/${entry.invoiceId}`)}
                                                        >
                                                            <ReceiptIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalTimeEntries}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage={t('common.rowsPerPage')}
                />
            </Paper>

            {/* Time Entry Form Drawer */}
            <Drawer
                anchor="right"
                open={formOpen}
                onClose={handleCloseForm}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: { xs: '100%', sm: 400 },
                        p: 3
                    }
                }}
            >
                <Typography variant="h6" gutterBottom>
                    {formMode === 'add'
                        ? t('billing.timeEntries.addTimeEntry')
                        : t('billing.timeEntries.editTimeEntry')}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Box component="form" onSubmit={handleSubmitForm}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                type="date"
                                name="activityDate"
                                label={t('common.date')}
                                value={formData.activityDate instanceof Date ? formData.activityDate.toISOString().split('T')[0] : ''}
                                onChange={handleFormChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel id="lawyer-label">{t('lawyers.lawyer')}</InputLabel>
                                <Select
                                    labelId="lawyer-label"
                                    name="lawyerId"
                                    value={formData.lawyerId}
                                    onChange={handleFormChange}
                                    label={t('lawyers.lawyer')}
                                    disabled={user?.role === 'Lawyer'}
                                >
                                    {lawyers.map((lawyer) => (
                                        <MenuItem key={lawyer.lawyerId} value={lawyer.lawyerId}>
                                            {lawyer.user ? `${lawyer.user.firstName} ${lawyer.user.lastName}` : `ID: ${lawyer.lawyerId}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel id="client-label">{t('clients.client')}</InputLabel>
                                <Select
                                    labelId="client-label"
                                    name="clientId"
                                    value={formData.clientId}
                                    onChange={handleFormChange}
                                    label={t('clients.client')}
                                >
                                    <MenuItem value="">
                                        <em>{t('common.none')}</em>
                                    </MenuItem>
                                    {clients.map((client) => (
                                        <MenuItem key={client.clientId} value={client.clientId}>
                                            {client.firstName} {client.lastName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel id="case-label">{t('cases.case')}</InputLabel>
                                <Select
                                    labelId="case-label"
                                    name="caseId"
                                    value={formData.caseId}
                                    onChange={handleFormChange}
                                    label={t('cases.case')}
                                >
                                    <MenuItem value="">
                                        <em>{t('common.none')}</em>
                                    </MenuItem>
                                    {cases.map((caseItem) => (
                                        <MenuItem key={caseItem.caseId} value={caseItem.caseId}>
                                            {caseItem.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                multiline
                                rows={3}
                                name="description"
                                label={t('billing.timeEntries.description')}
                                value={formData.description}
                                onChange={handleFormChange}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                required
                                type="number"
                                name="durationMinutes"
                                label={t('billing.timeEntries.durationMinutes')}
                                value={formData.durationMinutes}
                                onChange={handleFormChange}
                                inputProps={{ min: 1 }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                name="hourlyRate"
                                label={t('billing.timeEntries.hourlyRate')}
                                value={formData.hourlyRate}
                                onChange={handleFormChange}
                                inputProps={{ min: 0, step: 0.01 }}
                                disabled={!formData.isBillable}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.isBillable}
                                        onChange={handleFormChange}
                                        name="isBillable"
                                    />
                                }
                                label={t('billing.timeEntries.isBillable')}
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    onClick={handleCloseForm}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                    startIcon={<SaveIcon />}
                                    disabled={!isOnline}
                                >
                                    {t('common.save')}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Drawer>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">
                    {t('billing.timeEntries.deleteTimeEntry')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        {t('billing.timeEntries.deleteConfirmation')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseDeleteDialog}
                        disabled={deleteLoading}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleDeleteTimeEntry}
                        color="error"
                        variant="contained"
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
                    >
                        {deleteLoading ? t('common.deleting') : t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default TimeEntriesListPage;