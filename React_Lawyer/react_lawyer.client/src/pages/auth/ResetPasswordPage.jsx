
// src/pages/auth/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    Link,
    CircularProgress,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import authService from '../../services/authService';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isOnline = useOnlineStatus();

    // Form state
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(true);
    const [validating, setValidating] = useState(true);

    // Form validation
    const [validationErrors, setValidationErrors] = useState({
        password: '',
        confirmPassword: ''
    });

    // Validate token on load
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setTokenValid(false);
                setValidating(false);
                return;
            }

            try {
                // Call validateResetToken method from authService
                const valid = await authService.validateResetToken(token);
                setTokenValid(valid);
            } catch (err) {
                setTokenValid(false);
                setError(err.message || t('auth.invalidOrExpiredToken'));
            } finally {
                setValidating(false);
            }
        };

        validateToken();
    }, [token, t]);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear validation errors when user types
        if (submitted) {
            validateField(name, value);
        }
    };

    // Toggle password visibility
    const handleTogglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    // Validate a field
    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'password':
                if (!value) {
                    error = t('validation.passwordRequired');
                } else if (value.length < 8) {
                    error = t('validation.passwordLength');
                }
                // If password changes, also validate confirm password
                if (formData.confirmPassword && value !== formData.confirmPassword) {
                    setValidationErrors(prev => ({
                        ...prev,
                        confirmPassword: t('validation.passwordsDoNotMatch')
                    }));
                }
                break;
            case 'confirmPassword':
                if (!value) {
                    error = t('validation.confirmPasswordRequired');
                } else if (value !== formData.password) {
                    error = t('validation.passwordsDoNotMatch');
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

    // Validate the entire form
    const validateForm = () => {
        const passwordValid = validateField('password', formData.password);
        const confirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);

        return passwordValid && confirmPasswordValid;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        setSubmitted(true);
        setError('');

        // Check if online
        if (!isOnline) {
            setError(t('common.offlineError'));
            return;
        }

        // Validate form
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Call resetPassword method from authService
            await authService.resetPassword(token, formData.password);
            setSuccess(true);

            // Redirect to login after a delay
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.message || t('auth.resetPasswordError'));
        } finally {
            setLoading(false);
        }
    };

    // If validating token, show loading
    if (validating) {
        return (
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>{t('common.validating')}</Typography>
                </Box>
            </Container>
        );
    }

    // If token is invalid, show error
    if (!tokenValid) {
        return (
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            width: '100%',
                            borderRadius: 2,
                        }}
                    >
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {t('auth.invalidOrExpiredToken')}
                        </Alert>
                        <Typography variant="body1" sx={{ mb: 3 }}>
                            {t('auth.requestNewResetLink')}
                        </Typography>
                        <Button
                            component={RouterLink}
                            to="/forgot-password"
                            fullWidth
                            variant="contained"
                        >
                            {t('auth.forgotPassword')}
                        </Button>
                    </Paper>
                </Box>
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Logo or app name */}
                <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
                    {t('app.name')}
                </Typography>

                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        width: '100%',
                        borderRadius: 2,
                    }}
                >
                    {success ? (
                        // Success message
                        <Box>
                            <Alert severity="success" sx={{ mb: 3 }}>
                                {t('auth.passwordResetSuccess')}
                            </Alert>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                                {t('auth.redirectingToLogin')}
                            </Typography>
                            <CircularProgress size={24} sx={{ display: 'block', mx: 'auto' }} />
                        </Box>
                    ) : (
                        // Reset password form
                        <form onSubmit={handleSubmit}>
                            <Typography component="h2" variant="h5" sx={{ mb: 3 }}>
                                {t('auth.resetPassword')}
                            </Typography>

                            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                {t('auth.enterNewPassword')}
                            </Typography>

                            {error && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {error}
                                </Alert>
                            )}

                            {!isOnline && (
                                <Alert severity="warning" sx={{ mb: 3 }}>
                                    {t('common.offlineWarning')}
                                </Alert>
                            )}

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label={t('auth.newPassword')}
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="new-password"
                                value={formData.password}
                                onChange={handleChange}
                                error={submitted && !!validationErrors.password}
                                helperText={submitted && validationErrors.password}
                                disabled={loading}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleTogglePasswordVisibility}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="confirmPassword"
                                label={t('auth.confirmPassword')}
                                type={showPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                autoComplete="new-password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                error={submitted && !!validationErrors.confirmPassword}
                                helperText={submitted && validationErrors.confirmPassword}
                                disabled={loading}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                disabled={loading || !isOnline}
                                startIcon={loading ? <CircularProgress size={20} /> : null}
                            >
                                {loading ? t('common.resetting') : t('auth.resetPassword')}
                            </Button>

                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Link component={RouterLink} to="/login" variant="body2">
                                    {t('auth.backToLogin')}
                                </Link>
                            </Box>
                        </form>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default ResetPasswordPage;