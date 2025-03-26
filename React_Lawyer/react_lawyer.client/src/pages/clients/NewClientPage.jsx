// src/pages/clients/NewClientPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    Grid,
    TextField,
    Button,
    FormControlLabel,
    Switch,
    Divider,
    Typography,
    CircularProgress,
    Alert,
    Snackbar,
    FormControl,
    FormHelperText
} from '@mui/material';
import {
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    Person as PersonIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
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
        companyName: '',
        isIndividual: true,
        address: '',
        city: '',
        state: '',
        zipCode: '',
        notes: '',
        isActive: true
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // Handle form changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear validation error when field is edited
        if (submitAttempted && validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form fields
    const validateForm = () => {
        const errors = {};
        let isValid = true;

        // Required fields for individuals
        if (formData.isIndividual) {
            if (!formData.firstName.trim()) {
                errors.firstName = 'First name is required';
                isValid = false;
            }
            if (!formData.lastName.trim()) {
                errors.lastName = 'Last name is required';
                isValid = false;
            }
        } else {
            // Required fields for businesses
            if (!formData.companyName.trim()) {
                errors.companyName = 'Company name is required';
                isValid = false;
            }
        }

        // Email validation
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
            isValid = false;
        }

        // Phone validation (simple check)
        if (formData.phoneNumber && !/^[0-9+\-\s()]{10,15}$/.test(formData.phoneNumber)) {
            errors.phoneNumber = 'Please enter a valid phone number';
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitAttempted(true);

        if (!validateForm()) {
            return;
        }

        if (!isOnline) {
            setError('You are offline. Please check your connection and try again.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Add lawFirmId from current user
            const clientData = {
                ...formData,
                lawFirmId: user?.lawFirmId
            };

            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(clientData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create client');
            }

            setSuccess(true);

            // Redirect to client list after 2 seconds
            setTimeout(() => {
                navigate('/clients');
            }, 2000);

        } catch (err) {
            console.error('Error creating client:', err);
            setError(err.message || 'An error occurred while creating the client');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Add New Client"
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Clients', link: '/clients' },
                    { text: 'New Client' }
                ]}
            />

            <form onSubmit={handleSubmit}>
                <Card sx={{ mt: 3, p: 3 }}>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isIndividual}
                                    onChange={handleChange}
                                    name="isIndividual"
                                    color="primary"
                                />
                            }
                            label=""
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                            {formData.isIndividual ? (
                                <>
                                    <PersonIcon color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="subtitle1">Individual Client</Typography>
                                </>
                            ) : (
                                <>
                                    <BusinessIcon color="secondary" sx={{ mr: 1 }} />
                                    <Typography variant="subtitle1">Business Client</Typography>
                                </>
                            )}
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        {formData.isIndividual ? (
                            // Individual client fields
                            <>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="First Name"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        error={!!validationErrors.firstName}
                                        helperText={validationErrors.firstName}
                                        disabled={loading}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Last Name"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        error={!!validationErrors.lastName}
                                        helperText={validationErrors.lastName}
                                        disabled={loading}
                                    />
                                </Grid>
                            </>
                        ) : (
                            // Business client fields
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Company Name"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    error={!!validationErrors.companyName}
                                    helperText={validationErrors.companyName}
                                    disabled={loading}
                                />
                            </Grid>
                        )}

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email Address"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                error={!!validationErrors.email}
                                helperText={validationErrors.email}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                error={!!validationErrors.phoneNumber}
                                helperText={validationErrors.phoneNumber}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ mt: 2, mb: 2 }}>
                                Address Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Street Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="City"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="State/Province"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="Zip/Postal Code"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                multiline
                                rows={4}
                                disabled={loading}
                            />
                        </Grid>
                    </Grid>

                    {error && (
                        <Alert severity="error" sx={{ mt: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate('/clients')}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                            disabled={loading || !isOnline}
                        >
                            {loading ? 'Saving...' : 'Save Client'}
                        </Button>
                    </Box>
                </Card>
            </form>

            <Snackbar
                open={success}
                autoHideDuration={6000}
                onClose={() => setSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccess(false)} severity="success">
                    Client created successfully!
                </Alert>
            </Snackbar>
        </>
    );
};

export default NewClientPage;