// src/pages/auth/RegisterPage.jsx
import React, { useState } from 'react';
import {
    Container,
    Box,
    Avatar,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Paper,
    Snackbar,
    Alert,
    Link as MuiLink,
    Grid,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    FormHelperText,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    PersonAddOutlined as PersonAddIcon,
    Visibility,
    VisibilityOff
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import authService from '../../services/authService';

const RegisterPage = () => {
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();
    const { login } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        role: 'Lawyer' // Default role
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // Validation state
    const [validationErrors, setValidationErrors] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        role: ''
    });

    // Update form data on input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear validation errors when user types
        if (submitAttempted) {
            validateField(name, value);
        }
    };

    // Validate a single field
    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'username':
                if (!value.trim()) {
                    error = 'Username is required';
                } else if (value.length < 4) {
                    error = 'Username must be at least 4 characters';
                }
                break;
            case 'email':
                if (!value.trim()) {
                    error = 'Email is required';
                } else if (!/\S+@\S+\.\S+/.test(value)) {
                    error = 'Please enter a valid email address';
                }
                break;
            case 'password':
                if (!value) {
                    error = 'Password is required';
                } else if (value.length < 6) {
                    error = 'Password must be at least 6 characters';
                }
                break;
            case 'confirmPassword':
                if (!value) {
                    error = 'Please confirm your password';
                } else if (value !== formData.password) {
                    error = 'Passwords do not match';
                }
                break;
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
            case 'phoneNumber':
                if (value && !/^\d{10,15}$/.test(value.replace(/\D/g, ''))) {
                    error = 'Please enter a valid phone number';
                }
                break;
            case 'role':
                if (!value) {
                    error = 'Role is required';
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
        const fields = ['username', 'email', 'password', 'confirmPassword', 'firstName', 'lastName', 'phoneNumber', 'role'];
        let isValid = true;

        fields.forEach(field => {
            const fieldIsValid = validateField(field, formData[field]);
            isValid = isValid && fieldIsValid;
        });

        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitAttempted(true);
        setError('');
        setSuccess('');

        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        // Check if online before attempting registration
        if (!isOnline) {
            setError('You are offline. Please check your internet connection and try again.');
            return;
        }

        setLoading(true);

        try {
            // Prepare user data for registration
            const userData = {
                username: formData.username,
                email: formData.email,
                passwordHash: formData.password, // Backend will hash this
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phoneNumber,
                role: formData.role,
                isActive: true
            };

            // Call registration API
            await authService.register(userData);

            setSuccess('Registration successful! Redirecting to login...');

            // Auto-login if needed or redirect to login
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Paper
                elevation={3}
                sx={{
                    mt: 8,
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: '#f9f9f9'
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    <PersonAddIcon />
                </Avatar>

                <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                    Create an Account
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                id="firstName"
                                label="First Name"
                                name="firstName"
                                autoComplete="given-name"
                                value={formData.firstName}
                                onChange={handleChange}
                                error={!!validationErrors.firstName}
                                helperText={validationErrors.firstName}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                id="lastName"
                                label="Last Name"
                                name="lastName"
                                autoComplete="family-name"
                                value={formData.lastName}
                                onChange={handleChange}
                                error={!!validationErrors.lastName}
                                helperText={validationErrors.lastName}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                autoComplete="username"
                                value={formData.username}
                                onChange={handleChange}
                                error={!!validationErrors.username}
                                helperText={validationErrors.username}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                value={formData.email}
                                onChange={handleChange}
                                error={!!validationErrors.email}
                                helperText={validationErrors.email}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="new-password"
                                value={formData.password}
                                onChange={handleChange}
                                error={!!validationErrors.password}
                                helperText={validationErrors.password}
                                disabled={loading}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                name="confirmPassword"
                                label="Confirm Password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                autoComplete="new-password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                error={!!validationErrors.confirmPassword}
                                helperText={validationErrors.confirmPassword}
                                disabled={loading}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                edge="end"
                                            >
                                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="phoneNumber"
                                label="Phone Number"
                                name="phoneNumber"
                                autoComplete="tel"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                error={!!validationErrors.phoneNumber}
                                helperText={validationErrors.phoneNumber}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth required error={!!validationErrors.role}>
                                <InputLabel id="role-label">Role</InputLabel>
                                <Select
                                    labelId="role-label"
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    label="Role"
                                    onChange={handleChange}
                                    disabled={loading}
                                >
                                    <MenuItem value="Lawyer">Lawyer</MenuItem>
                                    <MenuItem value="Secretary">Secretary</MenuItem>
                                </Select>
                                {validationErrors.role && <FormHelperText>{validationErrors.role}</FormHelperText>}
                            </FormControl>
                        </Grid>
                    </Grid>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="secondary"
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                        disabled={loading || !isOnline}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Register'}
                    </Button>

                    <Grid container justifyContent="flex-end">
                        <Grid item>
                            <MuiLink component={Link} to="/login" variant="body2">
                                Already have an account? Sign in
                            </MuiLink>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            {/* Success snackbar */}
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

            {/* Error snackbar */}
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
                <Box mt={2} textAlign="center">
                    <Alert severity="warning">
                        You are currently offline. Please check your internet connection to register.
                    </Alert>
                </Box>
            )}
        </Container>
    );
};

export default RegisterPage;