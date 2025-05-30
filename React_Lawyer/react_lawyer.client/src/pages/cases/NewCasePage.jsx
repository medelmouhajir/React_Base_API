// src/pages/cases/NewCasePage.jsx
import React, { useState, useEffect } from 'react';
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
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import useOnlineStatus from '../../hooks/useOnlineStatus';

// Services
import caseService from '../../services/caseService';
import clientService from '../../services/clientService';
import lawyerService from '../../services/lawyerService';
import juridictionService from '../../services/juridictionService';

const NewCasePage = () => {

    const caseTypeMap = {
        // Map string values to CaseType enum values
        'Civil': 0,
        'Criminal': 1,
        'Family': 2,
        'Immigration': 3,
        'Corporate': 4,
        'RealEstate': 5,
        'Bankruptcy': 6,
        'IntellectualProperty': 7,
        'Tax': 8,
        'Other': 9
    };
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();

    // State for form data
    const [formData, setFormData] = useState({
        caseNumber: '',
        lawFirmId: user?.lawFirmId || 0,
        lawyerId: user?.role === 'Lawyer' ? user.roleId : null,
        title: '',
        description: '',
        type: 'Civil', // Default case type
        courtCaseNumber: '',
        opposingParty: '',
        opposingCounsel: '',
        nextHearingDate: '',
        juridictionId: 0,
        notes: '',
        isUrgent: false,
        parentCaseId: null,
        clientIds: [],
        createdById: user?.id || 0
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // Reference data
    const [lawyers, setLawyers] = useState([]);
    const [clients, setClients] = useState([]);
    const [juridictions, setJuridictions] = useState([]);
    const [parentCases, setParentCases] = useState([]);
    const [selectedClients, setSelectedClients] = useState([]);

    // Validation state
    const [validationErrors, setValidationErrors] = useState({});

    // Fetch reference data
    useEffect(() => {
        const fetchReferenceData = async () => {
            try {
                setInitialLoading(true);

                // Create an array of promises for parallel fetching
                const fetchPromises = [
                    // Default to empty arrays if fetch fails
                    fetchLawyers(),
                    fetchClients(),
                    fetchJuridictions(),
                    fetchCases()
                ];

                // Execute all promises in parallel
                await Promise.allSettled(fetchPromises);
            } catch (err) {
                console.error('Error fetching reference data:', err);
                setError(t('common.referenceDataError'));
            } finally {
                setInitialLoading(false);
            }
        };

        fetchReferenceData();
    }, [user, t]);

    // Helper functions to fetch individual reference data types
    const fetchLawyers = async () => {
        try {
            // Check if lawFirmId exists before making the API call
            if (!user?.lawFirmId) {
                console.warn('No lawFirmId available, skipping lawyer fetch');
                setLawyers([]);
                return;
            }

            const lawyersData = await lawyerService.getLawyersByFirm(user.lawFirmId);
            console.log('Lawyers data fetched:', lawyersData);
            setLawyers(lawyersData || []);
        } catch (error) {
            console.error('Error fetching lawyers:', error);
            setLawyers([]); // Set empty array on error to allow the form to render
        }
    };

    const fetchClients = async () => {
        try {
            const clientsData = await clientService.getClients();
            console.log('Clients data fetched:', clientsData.length);
            setClients(clientsData || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
            setClients([]); // Set empty array on error
        }
    };

    const fetchJuridictions = async () => {
        try {
            const juridictionsData = await juridictionService.getJuridictions();
            console.log('Juridictions data fetched:', juridictionsData.length);
            setJuridictions(juridictionsData || []);
        } catch (error) {
            console.error('Error fetching Juridictions:', error);
            setJuridictions([]);
        }
    };

    const fetchCases = async () => {
        try {
            const casesData = await caseService.getActiveCases();
            console.log('Cases data fetched:', casesData.length);
            setParentCases(casesData || []);
        } catch (error) {
            console.error('Error fetching cases:', error);
            setParentCases([]); // Set empty array on error
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
    };

    // Handle client selection
    const handleClientChange = (event, newValue) => {
        setSelectedClients(newValue || []);

        const clientIds = (newValue || []).map(client => client.clientId);
        setFormData(prevData => ({
            ...prevData,
            clientIds
        }));

        if (submitAttempted) {
            validateField('clientIds', clientIds);
        }
    };

    // Validate a single field
    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'title':
                if (!value || value.trim() === '') {
                    error = t('cases.validation.titleRequired');
                }
                break;
            case 'description':
                if (!value || value.trim() === '') {
                    error = t('cases.validation.descriptionRequired');
                }
                break;
            case 'clientIds':
                if (!value || value.length === 0) {
                    error = t('cases.validation.clientRequired');
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
        const fieldsToValidate = ['title', 'description', 'clientIds'];
        let isValid = true;

        fieldsToValidate.forEach(field => {
            const value = field === 'clientIds' ? formData.clientIds : formData[field];
            const fieldIsValid = validateField(field, value);
            isValid = isValid && fieldIsValid;
        });

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
        console.log('Form data before validation:', JSON.stringify(formData, null, 2));
        console.log('Selected clients:', selectedClients);

        // Manually check if clients are selected
        if (!formData.clientIds || formData.clientIds.length === 0) {
            console.warn('No clients selected');
            setValidationErrors(prev => ({
                ...prev,
                clientIds: t('cases.validation.clientRequired')
            }));
            setError(t('common.validationError'));
            return;
        }

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
            // Create a sanitized version of the form data
            const submissionData = {
                ...formData,
                // Convert string type to numeric enum value for backend
                type: formData.type,
                // Ensure clientIds is an array
                clientIds: Array.isArray(formData.clientIds) ? formData.clientIds : [],
                // Convert empty strings to null for optional fields
                parentCaseId: formData.parentCaseId || null,
                lawyerId: formData.lawyerId || null,
                // Ensure we have proper values for required fields
                lawFirmId: formData.lawFirmId || user?.lawFirmId || 0,
                createdById: formData.createdById || user?.id || 0
            };

            console.log('Submitting sanitized case data:', submissionData);

            // Submit form data - call the service with our sanitized data
            const result = await caseService.createCase(submissionData);
            console.log('Case created successfully:', result);

            // Show success message
            setSuccess(t('cases.createSuccess'));

            // Navigate to cases list after a delay
            setTimeout(() => {
                navigate('/cases');
            }, 2000);
        } catch (err) {
            console.error('Error creating case:', err);
            // Display the error message from the API if available
            setError(err.message || t('cases.createError'));
        } finally {
            setLoading(false);
        }
    };

    // Get case type options based on backend enum
    const caseTypeOptions = [
        { value: 'CivilLaw', label: t('cases.types.CivilLaw'), enumValue: 0 },
        { value: 'CriminalLaw', label: t('cases.types.CriminalLaw'), enumValue: 1 },
        { value: 'FamilyLaw', label: t('cases.types.FamilyLaw'), enumValue: 2 },
        { value: 'Immigration', label: t('cases.types.Immigration'), enumValue: 3 },
        { value: 'CommercialLaw', label: t('cases.types.CommercialLaw'), enumValue: 4 },
        { value: 'AdministrativeLaw', label: t('cases.types.AdministrativeLaw'), enumValue: 5 },
        { value: 'RealEstate', label: t('cases.types.RealEstate'), enumValue: 6 },
        { value: 'LaborLaw', label: t('cases.types.LaborLaw'), enumValue: 7 },
        { value: 'IntellectualProperty', label: t('cases.types.IntellectualProperty'), enumValue: 8 },
        { value: 'Other', label: t('cases.types.Other'), enumValue: 9 }
    ];

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={t('cases.newCase')}
                subtitle={t('cases.newCaseSubtitle')}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('cases.cases'), link: '/cases' },
                    { text: t('cases.newCase') }
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
                                    {t('cases.basicInfo')}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('cases.caseNumber')}
                                    name="caseNumber"
                                    value={formData.caseNumber}
                                    onChange={handleChange}
                                    placeholder={t('cases.caseNumberPlaceholder')}
                                    helperText={t('cases.caseNumberHelp')}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="lawyer-select-label">{t('cases.assignedLawyer')}</InputLabel>
                                    <Select
                                        labelId="lawyer-select-label"
                                        name="lawyerId"
                                        value={formData.lawyerId || ''}
                                        onChange={handleChange}
                                        label={t('cases.assignedLawyer')}
                                        disabled={user?.role === 'Lawyer'}
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
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    label={t('cases.title')}
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    error={!!validationErrors.title}
                                    helperText={validationErrors.title}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    label={t('cases.description')}
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    multiline
                                    rows={4}
                                    error={!!validationErrors.description}
                                    helperText={validationErrors.description}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="case-type-label">{t('cases.type')}</InputLabel>
                                    <Select
                                        labelId="case-type-label"
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        label={t('cases.type')}
                                    >
                                        {caseTypeOptions.map(option => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isUrgent}
                                            onChange={handleChange}
                                            name="isUrgent"
                                            color="error"
                                        />
                                    }
                                    label={t('cases.urgent')}
                                />
                            </Grid>


                                <Grid item xs={12}>
                                    {/* Hidden input field to store the clientIds value for form validation */}
                                    <input
                                        type="hidden"
                                        name="clientIds"
                                        value={formData.clientIds.join(',')}
                                        required={false}
                                    />

                                    <Autocomplete
                                        multiple
                                        value={selectedClients}
                                        onChange={handleClientChange}
                                        options={clients || []}
                                        getOptionLabel={(option) =>
                                            option.companyName
                                                ? `${option.firstName || ''} ${option.lastName || ''} (${option.companyName})`
                                                : `${option.firstName || ''} ${option.lastName || ''}`
                                        }
                                        isOptionEqualToValue={(option, value) => option.clientId === value.clientId}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip
                                                    key={option.clientId || `client-${index}`}
                                                    label={option.companyName
                                                        ? `${option.firstName || ''} ${option.lastName || ''} (${option.companyName})`
                                                        : `${option.firstName || ''} ${option.lastName || ''}`}
                                                    {...getTagProps({ index })}
                                                />
                                            ))
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label={t('cases.clients')}
                                                placeholder={selectedClients.length > 0 ? t('cases.selectMoreClients') : t('cases.selectClients')}
                                                error={!!validationErrors.clientIds}
                                                helperText={validationErrors.clientIds}
                                                // Remove the required attribute to prevent browser validation
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                            />
                                        )}
                                        noOptionsText={t('common.noClientsAvailable')}
                                    />
                                </Grid>

                            {/* Court Information */}
                            <Grid item xs={12} sx={{ mt: 2 }}>
                                <Typography variant="h6" component="h2" gutterBottom>
                                    {t('cases.courtInfo')}
                                </Typography>
                            </Grid>

                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel id="juridictions-label">{t('cases.juridiction')}</InputLabel>
                                        <Select
                                            labelId="juridictions-label"
                                            name="juridictionId"
                                            onChange={handleChange}
                                            value={formData.juridictionId || ''}
                                            label={t('cases.juridiction')}
                                        >
                                            <MenuItem value="">{t('common.none')}</MenuItem>
                                            {juridictions && juridictions.length > 0 ? (
                                                juridictions.map(pJuridiction => (
                                                    <MenuItem key={pJuridiction.id || `case-${Math.random()}`} value={pJuridiction.id || ''}>
                                                        {pJuridiction.name ? `${pJuridiction.name}` : pJuridiction.name || ''}
                                                    </MenuItem>
                                                ))
                                            ) : (
                                                <MenuItem disabled value="">
                                                    {t('common.noJuridictionsAvailable')}
                                                </MenuItem>
                                            )}
                                        </Select>
                                    </FormControl>
                                </Grid>


                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('cases.courtCaseNumber')}
                                    name="courtCaseNumber"
                                    value={formData.courtCaseNumber}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('cases.opposingParty')}
                                    name="opposingParty"
                                    value={formData.opposingParty}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('cases.opposingCounsel')}
                                    name="opposingCounsel"
                                    value={formData.opposingCounsel}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('cases.nextHearingDate')}
                                    name="nextHearingDate"
                                    type="datetime-local"
                                    value={formData.nextHearingDate}
                                    onChange={handleChange}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="parent-case-label">{t('cases.parentCase')}</InputLabel>
                                    <Select
                                        labelId="parent-case-label"
                                        name="parentCaseId"
                                        value={formData.parentCaseId || ''}
                                        onChange={handleChange}
                                        label={t('cases.parentCase')}
                                    >
                                        <MenuItem value="">{t('common.none')}</MenuItem>
                                        {parentCases && parentCases.length > 0 ? (
                                            parentCases.map(pCase => (
                                                <MenuItem key={pCase.caseId || `case-${Math.random()}`} value={pCase.caseId || ''}>
                                                    {pCase.caseNumber ? `${pCase.caseNumber} - ${pCase.title || ''}` : pCase.title || ''}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled value="">
                                                {t('common.noCasesAvailable')}
                                            </MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('cases.notes')}
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    multiline
                                    rows={3}
                                />
                            </Grid>

                            {/* Action Buttons */}
                            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/cases')}
                                    disabled={loading}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={loading || !isOnline}
                                    startIcon={loading ? <CircularProgress size={20} /> : null}
                                >
                                    {loading ? t('common.creating') : t('common.create')}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </Paper>

            {/* Snackbar for success/error messages */}
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

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setError('')}
                    severity="error"
                    sx={{ width: '100%' }}
                >
                    {error}
                </Alert>
            </Snackbar>

            {/* Offline warning */}
            {!isOnline && (
                <Box mt={2}>
                    <Alert severity="warning">
                        {t('common.offlineWarning')}
                    </Alert>
                </Box>
            )}
        </Container>
    );
};

export default NewCasePage;