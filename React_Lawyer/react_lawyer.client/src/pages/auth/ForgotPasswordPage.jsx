// src/pages/auth/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    Link,
    CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import authService from '../../services/authService';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const ForgotPasswordPage = () => {
    const { t } = useTranslation();
    const isOnline = useOnlineStatus();

    // Form state
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Form validation
    const [emailError, setEmailError] = useState('');

    // Handle email change
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        setEmailError('');
    };

    // Validate form
    const validateForm = () => {
        let isValid = true;

        // Email validation
        if (!email) {
            setEmailError(t('validation.emailRequired'));
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError(t('validation.invalidEmail'));
            isValid = false;
        }

        return isValid;
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
            await authService.requestPasswordReset(email);
            setSuccess(true);
        } catch (err) {
            setError(err.message || t('auth.forgotPasswordError'));
        } finally {
            setLoading(false);
        }
    };

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
                                {t('auth.resetLinkSent')}
                            </Alert>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                                {t('auth.checkEmailInstructions')}
                            </Typography>
                            <Button
                                component={RouterLink}
                                to="/login"
                                fullWidth
                                variant="contained"
                            >
                                {t('auth.backToLogin')}
                            </Button>
                        </Box>
                    ) : (
                        // Forgot password form
                        <form onSubmit={handleSubmit}>
                            <Typography component="h2" variant="h5" sx={{ mb: 3 }}>
                                {t('auth.forgotPassword')}
                            </Typography>

                            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                {t('auth.forgotPasswordInstructions')}
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
                                id="email"
                                label={t('auth.email')}
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={email}
                                onChange={handleEmailChange}
                                error={submitted && !!emailError}
                                helperText={submitted && emailError}
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
                                {loading ? t('common.sending') : t('auth.sendResetLink')}
                            </Button>

                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Link component={RouterLink} to="/login" variant="body2">
                                    {t('auth.rememberPassword')}
                                </Link>
                            </Box>
                        </form>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default ForgotPasswordPage;
