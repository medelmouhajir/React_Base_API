// src/pages/appointments/NewAppointmentPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Button,
    Autocomplete,
    Chip,
    Alert,
    CircularProgress,
    Snackbar,
    FormHelperText
} from '@mui/material';
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    Event as EventIcon,
    AccessTime as TimeIcon
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import useOnlineStatus from '../../hooks/useOnlineStatus';

// Services
import appointmentService from '../../services/appointmentService';
import clientService from '../../services/clientService';
import lawyerService from '../../services/lawyerService';
import caseService from '../../services/caseService';

const NewAppointmentPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isOnline = useOnlineStatus();

    // Extract any pre-selected values from location state (e.g., if coming from client or case page)
    const preSelectedClient = location.state?.clientId || null;
    const preSelectedCase = location.state?.caseId || null;

    // State for form data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(new Date().setHours(new Date().getHours() + 1)),
        location: '',
        isVirtual: false,
        meetingLink: '',
        isRemindClient: true,
        isRemindLawyer: true,
        clientId: preSelectedClient,
        lawyerId: '', // Initialize as empty string
        caseId: preSelectedCase,
        lawFirmId: user?.lawFirmId || 0,
        scheduledById: user?.id || 0,
        status: 'Scheduled', // Default status
        notes: ''
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [conflict, setConflict] = useState(false);

    // Reference data
    const [lawyers, setLawyers] = useState([]);
    const [clients, setClients] = useState([]);
    const [cases, setCases] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedCase, setSelectedCase] = useState(null);
    const [clientCases, setClientCases] = useState([]);

    // Validation state
    const [validationErrors, setValidationErrors] = useState({});

    // Fetch reference data
    useEffect(() => {
        const fetchReferenceData = async () => {
            try {
                setInitialLoading(true);

                // Create an array of promises for parallel fetching
                const fetchPromises = [
                    fetchLawyers(),
                    fetchClients()
                ];

                // Execute all promises in parallel
                await Promise.allSettled(fetchPromises);

                // If user is a lawyer, set their ID after lawyers are loaded
                if (user?.role === 'Lawyer' && lawyers.length > 0) {
                    const currentLawyer = lawyers.find(l => l.userId === user.id);
                    if (currentLawyer) {
                        setFormData(prev => ({
                            ...prev,
                            lawyerId: currentLawyer.lawyerId
                        }));
                    }
                }

                // If there's a pre-selected client, fetch their cases
                if (preSelectedClient) {
                    await fetchClientCases(preSelectedClient);

                    // Find and set the selected client
                    const client = clients.find(c => c.clientId === preSelectedClient);
                    if (client) {
                        setSelectedClient(client);
                    }
                }

                // If there's a pre-selected case, find and set it
                if (preSelectedCase) {
                    await fetchCases();
                    const selectedCase = cases.find(c => c.caseId === preSelectedCase);
                    if (selectedCase) {
                        setSelectedCase(selectedCase);
                    }
                }
            } catch (err) {
                console.error('Error fetching reference data:', err);
                setError(t('common.referenceDataError'));
            } finally {
                setInitialLoading(false);
            }
        };

        fetchReferenceData();
    }, [user, t, preSelectedClient, preSelectedCase, lawyers.length]);

    // Helper functions to fetch individual reference data types
    const fetchLawyers = async () => {
        try {
            if (!user?.lawFirmId) {
                console.warn('No lawFirmId available, skipping lawyer fetch');
                setLawyers([]);
                return;
            }

            const lawyersData = await lawyerService.getLawyersByFirm(user.lawFirmId);
            console.log(lawyersData);
            setLawyers(lawyersData || []);
        } catch (error) {
            console.error('Error fetching lawyers:', error);
            setLawyers([]);
        }
    };

    const fetchClients = async () => {
        try {
            const clientsData = await clientService.getClients();
            setClients(clientsData || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
            setClients([]);
        }
    };

    const fetchCases = async () => {
        try {
            const casesData = await caseService.getActiveCases();
            setCases(casesData || []);
        } catch (error) {
            console.error('Error fetching cases:', error);
            setCases([]);
        }
    };

    const fetchClientCases = async (clientId) => {
        try {
            const clientCasesData = await clientService.getClientCases(clientId);
            setClientCases(clientCasesData || []);
        } catch (error) {
            console.error('Error fetching client cases:', error);
            setClientCases([]);
        }
    };

    // Handle form field changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear validation errors when user types
        if (submitAttempted) {
            validateField(name, type === 'checkbox' ? checked : value);
        }

        // Check for appointment conflicts when lawyer or time changes
        if (name === 'lawyerId' || name === 'startTime' || name === 'endTime' || name === 'date') {
            checkAppointmentConflicts();
        }
    };

    // Handle date change
    const handleDateChange = (date) => {
        setFormData(prevData => ({
            ...prevData,
            date
        }));
        checkAppointmentConflicts();
    };

    // Handle time changes
    const handleStartTimeChange = (time) => {
        setFormData(prevData => ({
            ...prevData,
            startTime: time,
            // Automatically set end time to 1 hour after start time
            endTime: new Date(new Date(time).setHours(time.getHours() + 1))
        }));
        checkAppointmentConflicts();
    };

    const handleEndTimeChange = (time) => {
        setFormData(prevData => ({
            ...prevData,
            endTime: time
        }));
        checkAppointmentConflicts();
    };

    // Handle client selection
    const handleClientChange = (event, newValue) => {
        setSelectedClient(newValue);

        if (newValue) {
            setFormData(prevData => ({
                ...prevData,
                clientId: newValue.clientId
            }));

            // Fetch client's cases when client is selected
            fetchClientCases(newValue.clientId);
        } else {
            setFormData(prevData => ({
                ...prevData,
                clientId: null,
                caseId: null
            }));
            setClientCases([]);
            setSelectedCase(null);
        }

        if (submitAttempted) {
            validateField('clientId', newValue?.clientId);
        }
    };

    // Handle case selection
    const handleCaseChange = (event, newValue) => {
        setSelectedCase(newValue);

        setFormData(prevData => ({
            ...prevData,
            caseId: newValue?.caseId || null
        }));
    };

    // Check for appointment conflicts
    const checkAppointmentConflicts = async () => {
        if (!formData.lawyerId || !formData.date || !formData.startTime || !formData.endTime) {
            setConflict(false);
            return;
        }

        try {
            // Combine date and time into start and end datetime
            const startDate = new Date(formData.date);
            const endDate = new Date(formData.date);

            startDate.setHours(formData.startTime.getHours(), formData.startTime.getMinutes());
            endDate.setHours(formData.endTime.getHours(), formData.endTime.getMinutes());

            const isAvailable = await appointmentService.checkLawyerAvailability(
                formData.lawyerId,
                startDate.toISOString(),
                endDate.toISOString()
            );

            setConflict(!isAvailable);
        } catch (error) {
            console.error('Error checking availability:', error);
            // Don't set conflict if we can't check - we'll validate anyway on submission
        }
    };

    // Validate a single field
    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'title':
                if (!value || value.trim() === '') {
                    error = t('appointments.validation.titleRequired');
                }
                break;
            case 'clientId':
                if (!value) {
                    error = t('appointments.validation.clientRequired');
                }
                break;
            case 'lawyerId':
                if (!value) {
                    error = t('appointments.validation.lawyerRequired');
                }
                break;
            default:
                break;
        }

        setValidationErrors(prev => ({
            ...prev,
            [name]: error
        }));

        return !error;
    };

    // Validate all required fields
    const validateForm = () => {
        const fieldsToValidate = ['title', 'clientId', 'lawyerId'];
        let isValid = true;

        fieldsToValidate.forEach(field => {
            const fieldIsValid = validateField(field, formData[field]);
            isValid = isValid && fieldIsValid;
        });

        // Validate date and time logic
        const startDate = new Date(formData.date);
        const endDate = new Date(formData.date);

        startDate.setHours(formData.startTime.getHours(), formData.startTime.getMinutes());
        endDate.setHours(formData.endTime.getHours(), formData.endTime.getMinutes());

        if (startDate >= endDate) {
            setValidationErrors(prev => ({
                ...prev,
                endTime: t('appointments.validation.endTimeAfterStart')
            }));
            isValid = false;
        }

        if (startDate < new Date()) {
            setValidationErrors(prev => ({
                ...prev,
                date: t('appointments.validation.futureDateRequired')
            }));
            isValid = false;
        }

        // Validate there are no appointment conflicts
        if (conflict) {
            setValidationErrors(prev => ({
                ...prev,
                conflict: t('appointments.validation.timeConflict')
            }));
            isValid = false;
        }

        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear previous errors
        setError('');
        setSuccess('');
        setSubmitAttempted(true);

        // Debug information
        console.log('Form data before validation:', formData);

        // Validate form before submission
        if (!validateForm()) {
            console.warn('Form validation failed');
            setError(t('common.validationError'));
            return;
        }

        // Check if online before submission
        if (!isOnline) {
            console.warn('User is offline');
            setError(t('common.offlineError'));
            return;
        }

        setLoading(true);

        try {
            // Combine date and time into DateTime objects
            const startDate = new Date(formData.date);
            const endDate = new Date(formData.date);

            startDate.setHours(formData.startTime.getHours(), formData.startTime.getMinutes());
            endDate.setHours(formData.endTime.getHours(), formData.endTime.getMinutes());

            // Create a sanitized version of the form data
            const submissionData = {
                title: formData.title,
                description: formData.description,
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                location: formData.location,
                isVirtual: formData.isVirtual,
                meetingLink: formData.isVirtual ? formData.meetingLink : null,
                reminderSent: false,
                isRemindClient: formData.isRemindClient,
                isRemindLawyer: formData.isRemindLawyer,
                clientId: formData.clientId,
                lawyerId: formData.lawyerId,
                caseId: formData.caseId,
                lawFirmId: formData.lawFirmId,
                scheduledById: formData.scheduledById,
                status: 'Scheduled',
                notes: formData.notes,
                type : formData.type
            };

            console.log('Submitting appointment data:', submissionData);

            // Submit form data - call the service with our sanitized data
            const result = await appointmentService.createAppointment(submissionData);
            console.log('Appointment created successfully:', result);

            // Show success message
            setSuccess(t('appointments.createSuccess'));

            // Navigate to appointments list after a delay
            setTimeout(() => {
                navigate('/appointments');
            }, 2000);
        } catch (err) {
            console.error('Error creating appointment:', err);
            // Display the error message from the API if available
            setError(err.message || t('appointments.createError'));
        } finally {
            setLoading(false);
        }
    };

    // Get appointment type options
    const appointmentTypeOptions = [
        { value: 'Consultation', label: t('appointments.types.consultation') },
        { value: 'ClientMeeting', label: t('appointments.types.clientMeeting') },
        { value: 'CourtHearing', label: t('appointments.types.courtHearing') },
        { value: 'Deposition', label: t('appointments.types.deposition') },
        { value: 'Mediation', label: t('appointments.types.mediation') },
        { value: 'InternalMeeting', label: t('appointments.types.internalMeeting') },
        { value: 'PhoneCall', label: t('appointments.types.phoneCall') },
        { value: 'Other', label: t('appointments.types.other') }
    ];

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={t('appointments.newAppointment')}
                subtitle={t('appointments.newAppointmentSubtitle')}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('appointments.appointments'), link: '/appointments' },
                    { text: t('appointments.newAppointment') }
                ]}
            />

            <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
                {initialLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                        <CircularProgress sx={{ mb: 2 }} />
                        <Typography variant="body1">{t('common.loading')}</Typography>
                    </Box>
                ) : (
                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Basic Information */}
                            <Grid item xs={12}>
                                <Typography variant="h6" component="h2" gutterBottom>
                                    {t('appointments.basicInfo')}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    label={t('appointments.title')}
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    error={!!validationErrors.title}
                                    helperText={validationErrors.title}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('appointments.description')}
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    multiline
                                    rows={3}
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel id="appointment-type-label">{t('appointments.type')}</InputLabel>
                                    <Select
                                        labelId="appointment-type-label"
                                        name="type"
                                        value={formData.type || 'Consultation'}
                                        onChange={handleChange}
                                        label={t('appointments.type')}
                                    >
                                        {appointmentTypeOptions.map(option => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Date and Time */}
                            <Grid item xs={12}>
                                <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 2 }}>
                                    {t('appointments.dateAndTime')}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label={t('appointments.date')}
                                    type="date"
                                    value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
                                    onChange={(e) => {
                                        const date = new Date(e.target.value);
                                        handleDateChange(date);
                                    }}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    error={!!validationErrors.date}
                                    helperText={validationErrors.date}
                                    inputProps={{
                                        min: new Date().toISOString().split('T')[0]
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label={t('appointments.startTime')}
                                    type="time"
                                    value={formData.startTime ?
                                        `${formData.startTime.getHours().toString().padStart(2, '0')}:${formData.startTime.getMinutes().toString().padStart(2, '0')}` :
                                        ''}
                                    onChange={(e) => {
                                        const [hours, minutes] = e.target.value.split(':').map(Number);
                                        const newTime = new Date();
                                        newTime.setHours(hours, minutes, 0);
                                        handleStartTimeChange(newTime);
                                    }}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    error={!!validationErrors.startTime}
                                    helperText={validationErrors.startTime}
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label={t('appointments.endTime')}
                                    type="time"
                                    value={formData.endTime ?
                                        `${formData.endTime.getHours().toString().padStart(2, '0')}:${formData.endTime.getMinutes().toString().padStart(2, '0')}` :
                                        ''}
                                    onChange={(e) => {
                                        const [hours, minutes] = e.target.value.split(':').map(Number);
                                        const newTime = new Date();
                                        newTime.setHours(hours, minutes, 0);
                                        handleEndTimeChange(newTime);
                                    }}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    error={!!validationErrors.endTime}
                                    helperText={validationErrors.endTime}
                                />
                            </Grid>

                            {conflict && (
                                <Grid item xs={12}>
                                    <Alert severity="warning">
                                        {t('appointments.validation.timeConflict')}
                                    </Alert>
                                </Grid>
                            )}

                            {/* Location Information */}
                            <Grid item xs={12}>
                                <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 2 }}>
                                    {t('appointments.location')}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('appointments.locationName')}
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder={t('appointments.locationPlaceholder')}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isVirtual}
                                            onChange={handleChange}
                                            name="isVirtual"
                                            color="primary"
                                        />
                                    }
                                    label={t('appointments.virtualMeeting')}
                                />
                            </Grid>

                            {formData.isVirtual && (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label={t('appointments.meetingLink')}
                                        name="meetingLink"
                                        value={formData.meetingLink}
                                        onChange={handleChange}
                                        placeholder="https://meeting.example.com/xyz"
                                    />
                                </Grid>
                            )}

                            {/* People involved */}
                            <Grid item xs={12}>
                                <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 2 }}>
                                    {t('appointments.people')}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!validationErrors.lawyerId}>
                                    <InputLabel id="lawyer-select-label">{t('appointments.lawyer')}</InputLabel>
                                    <Select
                                        labelId="lawyer-select-label"
                                        name="lawyerId"
                                        value={formData.lawyerId === null ? '' : formData.lawyerId}
                                        onChange={handleChange}
                                        label={t('appointments.lawyer')}
                                        disabled={user?.role === 'Lawyer'}
                                        required
                                    >
                                        <MenuItem value="">{t('common.none')}</MenuItem>
                                        {lawyers && lawyers.length > 0 ? (
                                            lawyers.map(lawyer => (
                                                <MenuItem
                                                    key={lawyer.lawyerId || `lawyer-${Math.random()}`}
                                                    value={lawyer.lawyerId || ''}
                                                >
                                                    {`${lawyer.firstName || ''} ${lawyer.lastName || ''}`}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled value="">
                                                {t('common.noLawyersAvailable')}
                                            </MenuItem>
                                        )}
                                    </Select>
                                    {validationErrors.lawyerId && (
                                        <FormHelperText>{validationErrors.lawyerId}</FormHelperText>
                                    )}
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Autocomplete
                                    value={selectedClient}
                                    onChange={handleClientChange}
                                    options={clients || []}
                                    getOptionLabel={(option) =>
                                        option.companyName
                                            ? `${option.firstName || ''} ${option.lastName || ''} (${option.companyName})`
                                            : `${option.firstName || ''} ${option.lastName || ''}`
                                    }
                                    isOptionEqualToValue={(option, value) => option.clientId === value.clientId}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={t('appointments.client')}
                                            required
                                            error={!!validationErrors.clientId}
                                            helperText={validationErrors.clientId}
                                        />
                                    )}
                                    noOptionsText={t('common.noClientsAvailable')}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Autocomplete
                                    value={selectedCase}
                                    onChange={handleCaseChange}
                                    options={selectedClient ? clientCases : cases}
                                    getOptionLabel={(option) =>
                                        option.caseNumber
                                            ? `${option.caseNumber} - ${option.title || ''}`
                                            : option.title || ''
                                    }
                                    isOptionEqualToValue={(option, value) => option.caseId === value.caseId}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={t('appointments.relatedCase')}
                                        />
                                    )}
                                    noOptionsText={selectedClient ? t('cases.noClientCasesAvailable') : t('common.noCasesAvailable')}
                                />
                            </Grid>

                            {/* Reminders */}
                            <Grid item xs={12}>
                                <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 2 }}>
                                    {t('appointments.reminders')}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isRemindClient}
                                            onChange={handleChange}
                                            name="isRemindClient"
                                            color="primary"
                                        />
                                    }
                                    label={t('appointments.remindClient')}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isRemindLawyer}
                                            onChange={handleChange}
                                            name="isRemindLawyer"
                                            color="primary"
                                        />
                                    }
                                    label={t('appointments.remindLawyer')}
                                />
                            </Grid>

                            {/* Notes */}
                            <Grid item xs={12}>
                                <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 2 }}>
                                    {t('appointments.additionalNotes')}
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder={t('appointments.notesPlaceholder')}
                                />
                            </Grid>

                            {/* Error Message */}
                            {error && (
                                <Grid item xs={12}>
                                    <Alert severity="error">{error}</Alert>
                                </Grid>
                            )}

                            {/* Offline warning */}
                            {!isOnline && (
                                <Grid item xs={12}>
                                    <Alert severity="warning">
                                        {t('common.offlineWarning')}
                                    </Alert>
                                </Grid>
                            )}

                            {/* Action Buttons */}
                            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/appointments')}
                                    disabled={loading}
                                    startIcon={<CancelIcon />}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={loading || !isOnline || conflict}
                                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                                >
                                    {loading ? t('common.creating') : t('common.create')}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </Paper>

            {/* Snackbar for success message */}
            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSuccess('')}
                    severity="success"
                    sx={{ width: '100%' }}
                >
                    {success}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default NewAppointmentPage;