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
    CircularProgress
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

const NewClientPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();

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
                    error = 'First name is required';
                }
                break;
            case 'lastName':
                if (!value.trim()) {
                    error = 'Last name is required';
                }
                break;
            case 'email':
                if (value && !/\S+@\S+\.\S+/.test(value)) {
                    error = 'Please enter a valid email address';
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
                companyName: 'Company name is required for corporate clients'
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
            setError('You are offline. Please connect to the internet to add a new client.');
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
            setError(error.message || 'Failed to create client. Please try again.');
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
                title="Add New Client"
                subtitle="Create a new client record"
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Clients', link: '/clients' },
                    { text: 'New Client' }
                ]}
            />

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1 }} />
                        Client Information
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {/* Client Type Selection */}
                    <FormControl component="fieldset" sx={{ mb: 3 }}>
                        <FormLabel component="legend">Client Type</FormLabel>
                        <RadioGroup
                            row
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
                                        Individual
                                    </Box>
                                }
                            />
                            <FormControlLabel
                                value="Corporate"
                                control={<Radio />}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <BusinessIcon sx={{ mr: 0.5 }} />
                                        Corporate
                                    </Box>
                                }
                            />
                            <FormControlLabel value="Government" control={<Radio />} label="Government" />
                            <FormControlLabel value="NonProfit" control={<Radio />} label="Non-Profit" />
                        </RadioGroup>
                    </FormControl>

                    <Grid container spacing={3}>
                        {/* Personal Information */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                required
                                fullWidth
                                id="firstName"
                                name="firstName"
                                label="First Name"
                                value={formData.firstName}
                                onChange={handleChange}
                                error={!!validationErrors.firstName}
                                helperText={validationErrors.firstName}
                                margin="normal"
                                autoFocus
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                required
                                fullWidth
                                id="lastName"
                                name="lastName"
                                label="Last Name"
                                value={formData.lastName}
                                onChange={handleChange}
                                error={!!validationErrors.lastName}
                                helperText={validationErrors.lastName}
                                margin="normal"
                            />
                        </Grid>

                        {/* Contact Information */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="email"
                                name="email"
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                error={!!validationErrors.email}
                                helperText={validationErrors.email}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="phoneNumber"
                                name="phoneNumber"
                                label="Phone Number"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                margin="normal"
                            />
                        </Grid>

                        {/* Corporate Information (shown only for Corporate client type) */}
                        {formData.type === 'Corporate' && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        id="companyName"
                                        name="companyName"
                                        label="Company Name"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        error={!!validationErrors.companyName}
                                        helperText={validationErrors.companyName}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        id="taxId"
                                        name="taxId"
                                        label="Tax ID / VAT Number"
                                        value={formData.taxId}
                                        onChange={handleChange}
                                        margin="normal"
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
                                label="Address"
                                value={formData.address}
                                onChange={handleChange}
                                margin="normal"
                                multiline
                                rows={2}
                            />
                        </Grid>

                        {/* ID Number - for individuals */}
                        {formData.type === 'Individual' && (
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    id="idNumber"
                                    name="idNumber"
                                    label="ID / Passport Number"
                                    value={formData.idNumber}
                                    onChange={handleChange}
                                    margin="normal"
                                />
                            </Grid>
                        )}

                        {/* Notes */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="notes"
                                name="notes"
                                label="Notes"
                                value={formData.notes}
                                onChange={handleChange}
                                margin="normal"
                                multiline
                                rows={4}
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
                            You are currently offline. You need to be online to add a new client.
                        </Alert>
                    )}

                    {/* Form actions */}
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
                            disabled={loading || !isOnline}
                        >
                            {loading ? 'Saving...' : 'Save Client'}
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
                    Client created successfully! Redirecting...
                </Alert>
            </Snackbar>
        </>
    );
};

export default NewClientPage;