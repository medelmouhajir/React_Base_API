// src/pages/clients/NewClientPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    TextField,
    Button,
    Grid,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Alert,
    Snackbar,
    Paper,
    Divider,
    CircularProgress,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    Person as PersonIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import clientService from '../../services/clientService';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { useTranslation } from 'react-i18next';

const NewClientPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isMediumScreen = useMediaQuery(theme.breakpoints.down('md'));

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        address: '',
        type: 'Individual',
        companyName: '',
        taxId: '',
        idNumber: '',
        notes: '',
        lawFirmId: user?.lawFirmId || 0
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // Validation state
    const [validationErrors, setValidationErrors] = useState({
        firstName: '',
        lastName: '',
        email: ''
    });

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));

        // Clear validation errors when user types
        if (submitAttempted) {
            validateField(name, value);
        }
    };

    // Validate a single field
    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'firstName':
                if (!value.trim()) {
                    error = t('validation.firstNameRequired');
                }
                break;
            case 'lastName':
                if (!value.trim()) {
                    error = t('validation.lastNameRequired');
                }
                break;
            case 'email':
                if (value && !/\S+@\S+\.\S+/.test(value)) {
                    error = t('validation.invalidEmail');
                }
                break;
            default:
                break;
        }

        setValidationErrors(prev => ({ ...prev, [name]: error }));
        return !error;
    };

    // Validate all fields before submission
    const validateForm = () => {
        const requiredFields = ['firstName', 'lastName'];
        let isValid = true;

        // Validate required fields
        requiredFields.forEach(field => {
            const fieldIsValid = validateField(field, formData[field]);
            isValid = isValid && fieldIsValid;
        });

        // Validate email if provided
        if (formData.email) {
            const emailIsValid = validateField('email', formData.email);
            isValid = isValid && emailIsValid;
        }

        // For corporate clients, companyName is required
        if (formData.type === 'Corporate' && !formData.companyName.trim()) {
            setValidationErrors(prev => ({
                ...prev,
                companyName: t('validation.companyNameRequired')
            }));
            isValid = false;
        }

        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitAttempted(true);
        setError('');

        // Check if online
        if (!isOnline) {
            setError(t('common.offlineAddClientError'));
            return;
        }

        // Validate form
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Prepare client data
            const clientData = {
                ...formData,
                // Convert enum strings to actual enum values based on Client.cs
                type: formData.type === 'Individual' ? 0 :
                    formData.type === 'Corporate' ? 1 :
                        formData.type === 'Government' ? 2 : 3, // NonProfit
                isActive: true
            };

            // Submit the client data
            const response = await clientService.createClient(clientData);

            setSuccess(true);

            // Wait a moment before redirecting
            setTimeout(() => {
                navigate('/clients/' + response.clientId);
            }, 1500);
        } catch (error) {
            setError(error.message || t('clients.createFailure'));
        } finally {
            setLoading(false);
        }
    };

    // Handle cancel (go back)
    const handleCancel = () => {
        navigate('/clients');
    };

    return (
        <>
            <PageHeader
                title={t('clients.newClient')}
                subtitle={t('clients.newClientSubtitle')}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('clients.clients'), link: '/clients' },
                    { text: t('clients.new') }
                ]}
            />

            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1 }} />
                        {t('clients.clientInformation')}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {/* Client Type Selection */}
                    <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                        <FormLabel component="legend">{t('clients.clientType')}</FormLabel>
                        <RadioGroup
                            row={!isMobile}
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                        >
                            <FormControlLabel
                                value="Individual"
                                control={<Radio />}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <PersonIcon sx={{ mr: 0.5 }} />
                                        {t('clients.individual')}
                                    </Box>
                                }
                            />
                            <FormControlLabel
                                value="Corporate"
                                control={<Radio />}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <BusinessIcon sx={{ mr: 0.5 }} />
                                        {t('clients.corporate')}
                                    </Box>
                                }
                            />
                            <FormControlLabel
                                value="Government"
                                control={<Radio />}
                                label={t('clients.government')}
                            />
                            <FormControlLabel
                                value="NonProfit"
                                control={<Radio />}
                                label={t('clients.nonProfit')}
                            />
                        </RadioGroup>
                    </FormControl>

                    <Grid container spacing={isMobile ? 2 : 3}>
                        {/* Personal Information */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                id="firstName"
                                name="firstName"
                                label={t('clients.firstName')}
                                value={formData.firstName}
                                onChange={handleChange}
                                error={!!validationErrors.firstName}
                                helperText={validationErrors.firstName}
                                margin="normal"
                                autoFocus
                                size={isMobile ? "small" : "medium"}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                id="lastName"
                                name="lastName"
                                label={t('clients.lastName')}
                                value={formData.lastName}
                                onChange={handleChange}
                                error={!!validationErrors.lastName}
                                helperText={validationErrors.lastName}
                                margin="normal"
                                size={isMobile ? "small" : "medium"}
                            />
                        </Grid>

                        {/* Contact Information */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="email"
                                name="email"
                                label={t('clients.email')}
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                error={!!validationErrors.email}
                                helperText={validationErrors.email}
                                margin="normal"
                                size={isMobile ? "small" : "medium"}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="phoneNumber"
                                name="phoneNumber"
                                label={t('clients.phoneNumber')}
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                margin="normal"
                                size={isMobile ? "small" : "medium"}
                            />
                        </Grid>

                        {/* Corporate Information (shown only for Corporate client type) */}
                        {formData.type === 'Corporate' && (
                            <>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        id="companyName"
                                        name="companyName"
                                        label={t('clients.companyName')}
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        error={!!validationErrors.companyName}
                                        helperText={validationErrors.companyName}
                                        margin="normal"
                                        size={isMobile ? "small" : "medium"}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        id="taxId"
                                        name="taxId"
                                        label={t('clients.taxId')}
                                        value={formData.taxId}
                                        onChange={handleChange}
                                        margin="normal"
                                        size={isMobile ? "small" : "medium"}
                                    />
                                </Grid>
                            </>
                        )}

                        {/* Address */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="address"
                                name="address"
                                label={t('clients.address')}
                                value={formData.address}
                                onChange={handleChange}
                                margin="normal"
                                multiline
                                rows={2}
                                size={isMobile ? "small" : "medium"}
                            />
                        </Grid>

                        {/* ID Number - for individuals */}
                        {formData.type === 'Individual' && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    id="idNumber"
                                    name="idNumber"
                                    label={t('clients.idNumber')}
                                    value={formData.idNumber}
                                    onChange={handleChange}
                                    margin="normal"
                                    size={isMobile ? "small" : "medium"}
                                />
                            </Grid>
                        )}

                        {/* Notes */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="notes"
                                name="notes"
                                label={t('clients.notes')}
                                value={formData.notes}
                                onChange={handleChange}
                                margin="normal"
                                multiline
                                rows={isMobile ? 3 : 4}
                                size={isMobile ? "small" : "medium"}
                            />
                        </Grid>
                    </Grid>

                    {/* Error message */}
                    {error && (
                        <Alert severity="error" sx={{ mt: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Offline warning */}
                    {!isOnline && (
                        <Alert severity="warning" sx={{ mt: 3 }}>
                            {t('common.offlineWarning')}
                        </Alert>
                    )}

                    {/* Form actions */}
                    <Box sx={{
                        mt: 4,
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: isMobile ? 'center' : 'flex-end',
                        gap: 2
                    }}>
                        <Button
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={handleCancel}
                            disabled={loading}
                            fullWidth={isMobile}
                            size={isMobile ? "small" : "medium"}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
                            disabled={loading || !isOnline}
                            fullWidth={isMobile}
                            size={isMobile ? "small" : "medium"}
                        >
                            {loading ? t('common.saving') : t('clients.saveClient')}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Success message snackbar */}
            <Snackbar
                open={success}
                autoHideDuration={6000}
                onClose={() => setSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" sx={{ width: '100%' }}>
                    {t('clients.createSuccess')}
                </Alert>
            </Snackbar>
        </>
    );
};

export default NewClientPage;