// src/pages/time-entries/NewTimeEntryPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    Button,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Divider,
    Alert,
    CircularProgress,
    InputAdornment
} from '@mui/material';
import {
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    AccessTime as AccessTimeIcon,
    Person as PersonIcon,
    Gavel as GavelIcon,
    Description as DescriptionIcon,
    AttachMoney as MoneyIcon
} from '@mui/icons-material';

// Components and Services
import PageHeader from '../../components/common/PageHeader';
import timeEntryService from '../../services/timeEntryService';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const NewTimeEntryPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();

    // Extract caseId from URL query params
    const query = new URLSearchParams(location.search);
    const caseIdFromUrl = query.get('caseId');

    // State
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Dropdown options
    const [lawyers, setLawyers] = useState([]);
    const [clients, setClients] = useState([]);
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        lawyerId: user?.role === 'Lawyer' ? user.roleId : '',
        clientId: '',
        caseId: caseIdFromUrl || '',
        activityDate: new Date().toISOString().split('T')[0],
        durationHours: '',
        durationMinutes: '',
        description: '',
        isBillable: true,
        hourlyRate: '',
        isBilled: false,
        invoiceId: null,
        lawFirmId: user?.lawFirmId || 0
    });

    // Load dropdown data on component mount
    useEffect(() => {
        const fetchData = async () => {
            if (!isOnline) {
                setError(t('common.offlineMode'));
                return;
            }

            setLoading(true);
            try {
                // Fetch lawyers, clients, and cases in parallel
                const [lawyersData, clientsData, casesData] = await Promise.all([
                    timeEntryService.getLawyers(),
                    timeEntryService.getClients(),
                    timeEntryService.getCases()
                ]);

                setLawyers(lawyersData);
                setClients(clientsData);
                setCases(casesData);

                // If caseId was provided in URL, set the client based on the case
                if (caseIdFromUrl) {
                    const selectedCase = casesData.find(c => c.caseId === parseInt(caseIdFromUrl));
                    if (selectedCase) {
                        setSelectedCase(selectedCase);
                        // Get first client from the case if available
                        if (selectedCase.case_Clients && selectedCase.case_Clients.length > 0) {
                            setFormData(prev => ({
                                ...prev,
                                clientId: selectedCase.case_Clients[0].clientId
                            }));
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(t('common.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [caseIdFromUrl, isOnline, t, user?.lawFirmId]);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle case selection change
    const handleCaseChange = (e) => {
        const caseId = e.target.value;
        setFormData(prev => ({ ...prev, caseId }));

        if (caseId) {
            const selectedCase = cases.find(c => c.caseId === parseInt(caseId));
            if (selectedCase) {
                setSelectedCase(selectedCase);
                // If case has clients, automatically select the first one
                if (selectedCase.case_Clients && selectedCase.case_Clients.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        caseId,
                        clientId: selectedCase.case_Clients[0].clientId
                    }));
                } else {
                    setFormData(prev => ({
                        ...prev,
                        caseId,
                        clientId: ''
                    }));
                }
            }
        } else {
            setSelectedCase(null);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isOnline) {
            setError(t('common.offlineError'));
            return;
        }

        // Validate required fields
        if (!formData.lawyerId || !formData.description || (!formData.durationHours && !formData.durationMinutes)) {
            setError(t('billing.timeEntries.validationError'));
            return;
        }

        const totalMinutes = (parseInt(formData.durationHours || 0) * 60) + parseInt(formData.durationMinutes || 0);
        if (totalMinutes <= 0) {
            setError(t('billing.timeEntries.durationError'));
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            // Prepare time entry data for API
            const timeEntryData = {
                lawyerId: parseInt(formData.lawyerId),
                clientId: formData.clientId ? parseInt(formData.clientId) : null,
                caseId: formData.caseId ? parseInt(formData.caseId) : null,
                durationMinutes: totalMinutes,
                description: formData.description,
                isBillable: formData.isBillable,
                hourlyRate: parseFloat(formData.hourlyRate || 0),
                isBilled: false,
                invoiceId: null,
                lawFirmId: user?.lawFirmId || 0,
                activityDate: new Date(formData.activityDate).toISOString()
            };

            await timeEntryService.createTimeEntry(timeEntryData);

            setSuccess(t('billing.timeEntries.createSuccess'));

            // Redirect after short delay
            setTimeout(() => {
                if (formData.caseId) {
                    navigate(`/cases/${formData.caseId}`);
                } else {
                    navigate('/billing/time-entries');
                }
            }, 1500);
        } catch (err) {
            console.error('Error creating time entry:', err);
            setError(t('billing.timeEntries.createError'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={t('billing.timeEntries.addTimeEntry')}
                subtitle={selectedCase ? t('billing.timeEntries.forCase', { case: selectedCase.title }) : t('billing.timeEntries.new')}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('billing.billing'), link: '/billing' },
                    { text: t('billing.timeEntries.title'), link: '/billing/time-entries' },
                    { text: t('billing.timeEntries.new') }
                ]}
                action={t('common.back')}
                actionIcon={<ArrowBackIcon />}
                onActionClick={() => navigate(-1)}
            />

            {/* Error and success messages */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {/* Offline warning */}
            {!isOnline && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {t('common.offlineWarning')}
                </Alert>
            )}

            {/* Main form */}
            <Paper sx={{ p: 3 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Date and Lawyer fields */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                type="date"
                                name="activityDate"
                                label={t('common.date')}
                                value={formData.activityDate}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AccessTimeIcon />
                                        </InputAdornment>
                                    )
                                }}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel id="lawyer-label">{t('cases.lawyer')}</InputLabel>
                                <Select
                                    labelId="lawyer-label"
                                    name="lawyerId"
                                    value={formData.lawyerId}
                                    onChange={handleChange}
                                    label={t('lawyers.lawyer')}
                                    disabled={user?.role === 'Lawyer' || loading}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <PersonIcon />
                                        </InputAdornment>
                                    }
                                >
                                    {loading ? (
                                        <MenuItem value="">
                                            <CircularProgress size={20} />
                                        </MenuItem>
                                    ) : (
                                        lawyers.map((lawyer) => (
                                            <MenuItem key={lawyer.lawyerId} value={lawyer.lawyerId}>
                                                {lawyer.user ? `${lawyer.user.firstName} ${lawyer.user.lastName}` : `ID: ${lawyer.lawyerId}`}
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Case and Client fields */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id="case-label">{t('cases.case')}</InputLabel>
                                <Select
                                    labelId="case-label"
                                    name="caseId"
                                    value={formData.caseId}
                                    onChange={handleCaseChange}
                                    label={t('cases.case')}
                                    disabled={loading || !!caseIdFromUrl}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <GavelIcon />
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value="">
                                        <em>{t('common.none')}</em>
                                    </MenuItem>
                                    {loading ? (
                                        <MenuItem value="" disabled>
                                            <CircularProgress size={20} />
                                        </MenuItem>
                                    ) : (
                                        cases.map((caseItem) => (
                                            <MenuItem key={caseItem.caseId} value={caseItem.caseId}>
                                                {caseItem.caseNumber ? `${caseItem.caseNumber}: ${caseItem.title}` : caseItem.title}
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id="client-label">{t('clients.client')}</InputLabel>
                                <Select
                                    labelId="client-label"
                                    name="clientId"
                                    value={formData.clientId}
                                    onChange={handleChange}
                                    label={t('clients.client')}
                                    disabled={loading}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <PersonIcon />
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value="">
                                        <em>{t('common.none')}</em>
                                    </MenuItem>
                                    {loading ? (
                                        <MenuItem value="" disabled>
                                            <CircularProgress size={20} />
                                        </MenuItem>
                                    ) : selectedCase && selectedCase.case_Clients ? (
                                        // If case is selected, show only clients associated with the case
                                        selectedCase.case_Clients.map((clientRelation) => (
                                            <MenuItem key={clientRelation.client.clientId} value={clientRelation.client.clientId}>
                                                {clientRelation.client.firstName} {clientRelation.client.lastName}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        // Otherwise show all clients
                                        clients.map((client) => (
                                            <MenuItem key={client.clientId} value={client.clientId}>
                                                {client.firstName} {client.lastName}
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Description field */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                multiline
                                rows={3}
                                name="description"
                                label={t('billing.timeEntries.description')}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder={t('billing.timeEntries.descriptionPlaceholder')}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <DescriptionIcon />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>

                        {/* Duration fields */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                {t('billing.timeEntries.duration')} *
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        name="durationHours"
                                        label={t('billing.hours')}
                                        value={formData.durationHours}
                                        onChange={handleChange}
                                        inputProps={{ min: 0 }}
                                        disabled={loading}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        name="durationMinutes"
                                        label={t('billing.minutes')}
                                        value={formData.durationMinutes}
                                        onChange={handleChange}
                                        inputProps={{ min: 0, max: 59 }}
                                        disabled={loading}
                                    />
                                </Grid>
                            </Grid>
                            <Typography variant="caption" color="textSecondary">
                                {t('billing.timeEntries.durationHelp')}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider />
                        </Grid>

                        {/* Billing fields */}
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.isBillable}
                                        onChange={handleChange}
                                        name="isBillable"
                                        disabled={loading}
                                    />
                                }
                                label={t('billing.timeEntries.isBillable')}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                name="hourlyRate"
                                label={t('billing.timeEntries.hourlyRate')}
                                value={formData.hourlyRate}
                                onChange={handleChange}
                                inputProps={{ min: 0, step: 0.01 }}
                                disabled={!formData.isBillable || loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <MoneyIcon />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>

                        {/* Submit buttons */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate(-1)}
                                    startIcon={<ArrowBackIcon />}
                                    disabled={submitting}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                                    disabled={submitting || !isOnline}
                                >
                                    {submitting ? t('common.saving') : t('common.save')}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
};

export default NewTimeEntryPage;