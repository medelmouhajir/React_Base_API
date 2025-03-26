// src/pages/LoginPage.jsx
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
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    LockOutlined,
    Visibility,
    VisibilityOff
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const LoginPage = () => {
    const { login, loading, error: authError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isOnline = useOnlineStatus();

    // Redirect target after successful login
    const from = location.state?.from || '/';

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    // UI state
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // Validation state
    const [validationErrors, setValidationErrors] = useState({
        username: '',
        password: ''
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

        if (name === 'username') {
            if (!value.trim()) {
                error = 'Username is required';
            }
        } else if (name === 'password') {
            if (!value) {
                error = 'Password is required';
            }
        }

        setValidationErrors(prev => ({ ...prev, [name]: error }));
        return !error;
    };

    // Validate all fields
    const validateForm = () => {
        const usernameValid = validateField('username', formData.username);
        const passwordValid = validateField('password', formData.password);

        return usernameValid && passwordValid;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitAttempted(true);
        setError('');

        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        // Check if online before attempting login
        if (!isOnline) {
            setError('You are offline. Please check your internet connection and try again.');
            return;
        }

        try {
            await login(formData.username, formData.password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials and try again.');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
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
                <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                    <LockOutlined />
                </Avatar>

                <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                    Sign in to Law Office Management
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={formData.username}
                        onChange={handleChange}
                        error={!!validationErrors.username}
                        helperText={validationErrors.username}
                        disabled={loading}
                    />

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="current-password"
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

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                        disabled={loading || !isOnline}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Sign In'}
                    </Button>

                    <Grid container>
                        <Grid item xs>
                            <MuiLink component={Link} to="/forgot-password" variant="body2">
                                Forgot password?
                            </MuiLink>
                        </Grid>
                        <Grid item>
                            <MuiLink component={Link} to="/register" variant="body2" sx={{ mr: 2 }}>
                                {"Register as a user"}
                            </MuiLink>
                            <MuiLink component={Link} to="/register-firm" variant="body2">
                                {"Register your law firm"}
                            </MuiLink>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            {/* Error snackbar */}
            <Snackbar
                open={!!error || !!authError}
                autoHideDuration={6000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setError('')}
                    severity="error"
                    sx={{ width: '100%' }}
                >
                    {error || authError}
                </Alert>
            </Snackbar>

            {/* Offline warning */}
            {!isOnline && (
                <Box mt={2} textAlign="center">
                    <Alert severity="warning">
                        You are currently offline. Please check your internet connection to log in.
                    </Alert>
                </Box>
            )}
        </Container>
    );
};

export default LoginPage;