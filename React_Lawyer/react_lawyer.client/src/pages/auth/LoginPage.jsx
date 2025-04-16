// src/pages/auth/LoginPage.jsx
import React, { useState, useEffect } from 'react';
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
    IconButton,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    LockOutlined,
    Visibility,
    VisibilityOff,
    Login as LoginIcon
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../../theme/ThemeProvider';

const LoginPage = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const { mode } = useThemeMode();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

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
    const [rememberMe, setRememberMe] = useState(false);

    // Success message
    const [loginSuccess, setLoginSuccess] = useState(false);

    // Validation state
    const [validationErrors, setValidationErrors] = useState({
        username: '',
        password: ''
    });

    // Try to restore username from localStorage if remembered
    useEffect(() => {
        const rememberedUser = localStorage.getItem('rememberedUsername');
        if (rememberedUser) {
            setFormData(prev => ({ ...prev, username: rememberedUser }));
            setRememberMe(true);
        }
    }, []);

    // Update form data on input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear validation errors when user types
        if (submitAttempted) {
            validateField(name, value);
        }
    };

    // Toggle remember me
    const handleRememberMeChange = (e) => {
        setRememberMe(e.target.checked);
    };

    // Validate a single field
    const validateField = (name, value) => {
        let error = '';

        if (name === 'username') {
            if (!value.trim()) {
                error = t('validation.usernameRequired');
            }
        } else if (name === 'password') {
            if (!value) {
                error = t('validation.passwordRequired');
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
            setError(t('errors.offlineLogin'));
            return;
        }

        try {
            await login(formData.username, formData.password);

            // Handle remember me functionality
            if (rememberMe) {
                localStorage.setItem('rememberedUsername', formData.username);
            } else {
                localStorage.removeItem('rememberedUsername');
            }

            // Show success message briefly before redirecting
            setLoginSuccess(true);
            setTimeout(() => {
                navigate(from, { replace: true });
            }, 1000);
        } catch (err) {
            setError(err.message || t('errors.loginFailed'));
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <Container
            maxWidth="xs"
            sx={{
                mt: isMobile ? 4 : 8,
                mb: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 200px)',
                animation: 'fadeIn 0.5s ease-in-out',
                '@keyframes fadeIn': {
                    from: { opacity: 0, transform: 'translateY(20px)' },
                    to: { opacity: 1, transform: 'translateY(0)' }
                }
            }}>
            <Paper
                elevation={3}
                sx={{
                    p: isMobile ? 3 : 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: 2,
                    bgcolor: mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: mode === 'dark'
                        ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                        : '0 4px 20px rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                }}
            >
                <Avatar
                    sx={{
                        m: 1,
                        bgcolor: 'primary.main',
                        width: isMobile ? 40 : 56,
                        height: isMobile ? 40 : 56,
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    <LockOutlined />
                </Avatar>

                <Typography
                    component="h1"
                    variant={isMobile ? "h5" : "h4"}
                    sx={{
                        mb: 3,
                        fontWeight: 'bold',
                        color: 'primary.main'
                    }}
                >
                    {t('app.login')}
                </Typography>

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    noValidate
                    sx={{
                        mt: 1,
                        width: '100%'
                    }}
                    onKeyPress={handleKeyPress}
                >
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label={t('auth.username')}
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={formData.username}
                        onChange={handleChange}
                        error={!!validationErrors.username}
                        helperText={validationErrors.username}
                        disabled={loading}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                    borderColor: 'primary.main',
                                },
                            },
                        }}
                    />

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label={t('auth.password')}
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                        error={!!validationErrors.password}
                        helperText={validationErrors.password}
                        disabled={loading}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                    borderColor: 'primary.main',
                                },
                            },
                        }}
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

                    <Grid container alignItems="center" sx={{ mb: 2 }}>
                        <Grid item xs>
                            <MuiLink
                                component={Link}
                                to="/forgot-password"
                                variant="body2"
                                sx={{
                                    textDecoration: 'none',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                    }
                                }}
                            >
                                {t('auth.forgotPassword')}
                            </MuiLink>
                        </Grid>
                    </Grid>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{
                            mt: 1,
                            mb: 2,
                            py: 1.5,
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 10px rgba(0, 0, 0, 0.15)',
                            },
                        }}
                        disabled={loading || !isOnline}
                        startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                    >
                        {loading ? t('common.signingIn') : t('auth.signIn')}
                    </Button>

                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={12} sm={6}>
                            <MuiLink
                                component={Link}
                                to="/register"
                                variant="body2"
                                sx={{
                                    display: 'block',
                                    textAlign: isMobile ? 'center' : 'left',
                                    mb: isMobile ? 1 : 0,
                                    textDecoration: 'none',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                    }
                                }}
                            >
                                {t('auth.registerUser')}
                            </MuiLink>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MuiLink
                                component={Link}
                                to="/register-firm"
                                variant="body2"
                                sx={{
                                    display: 'block',
                                    textAlign: isMobile ? 'center' : 'right',
                                    textDecoration: 'none',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                    }
                                }}
                            >
                                {t('auth.registerFirm')}
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

            {/* Success snackbar */}
            <Snackbar
                open={loginSuccess}
                autoHideDuration={2000}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" sx={{ width: '100%' }}>
                    {t('auth.loginSuccess')}
                </Alert>
            </Snackbar>

            {/* Offline warning */}
            {!isOnline && (
                <Box mt={2} textAlign="center">
                    <Alert severity="warning">
                        {t('common.offlineWarning')}
                    </Alert>
                </Box>
            )}
        </Container>
    );
};

export default LoginPage;