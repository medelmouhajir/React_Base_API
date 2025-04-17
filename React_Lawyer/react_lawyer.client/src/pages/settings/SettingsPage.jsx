import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    Switch,
    FormGroup,
    FormControlLabel,
    Typography,
    Divider,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Alert,
    Snackbar,
    CircularProgress
} from '@mui/material';
import {
    DarkMode as DarkModeIcon,
    Notifications as NotificationsIcon,
    Security as SecurityIcon,
    Language as LanguageIcon,
    Backup as BackupIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { useThemeMode } from '../../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import userService from '../../services/userService';
import { useAuth } from '../../features/auth/AuthContext';

const SettingsPage = () => {
    const { mode, toggleMode } = useThemeMode();
    const { t } = useTranslation();
    const { currentUser } = useAuth();

    const [loading, setLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState(null);

    // Settings state
    const [settings, setSettings] = useState({
        // App preferences
        language: i18n.language || 'en',
        autoSave: true,

        // Notifications
        emailNotifications: true,
        appointmentReminders: true,
        caseUpdates: true,

        // Privacy
        shareUsageData: false,
        storeDocumentsLocally: true,

        // Security
        twoFactorAuth: false,
        sessionTimeout: 30
    });

    // Load user settings from API
    useEffect(() => {
        const loadUserSettings = async () => {
            if (!currentUser) return;

            setLoading(true);
            try {
                // Fetch user profile which contains settings
                const userProfile = await userService.getUserProfile(currentUser.id);

                // If we have settings data, update the state
                if (userProfile && userProfile.settings) {
                    setSettings(prevSettings => ({
                        ...prevSettings,
                        ...userProfile.settings,
                        language: userProfile.settings.language || i18n.language || 'en'
                    }));
                }
            } catch (error) {
                console.error('Error loading user settings:', error);
                setSaveError(t('settings.errors.loadFailed'));
            } finally {
                setLoading(false);
            }
        };

        loadUserSettings();
    }, [currentUser, t]);

    // Handle setting changes
    const handleChange = (event) => {
        const { name, value, checked } = event.target;
        setSettings({
            ...settings,
            [name]: event.target.type === 'checkbox' ? checked : value
        });
    };

    // Handle language change
    const handleLanguageChange = (event) => {
        const newLanguage = event.target.value;
        setSettings({
            ...settings,
            language: newLanguage
        });

        // Change the application language
        i18n.changeLanguage(newLanguage);
    };

    // Close success message
    const handleCloseSuccess = () => {
        setSaveSuccess(false);
    };

    // Close error message
    const handleCloseError = () => {
        setSaveError(null);
    };

    // Save settings
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSaveError(null);

        try {
            if (currentUser) {
                // Prepare settings data for API
                const settingsData = {
                    settings: {
                        ...settings
                    }
                };

                // Update user profile with new settings
                await userService.updateUserProfile(currentUser.id, settingsData);

                // Update notification preferences separately if needed
                await userService.updateNotificationPreferences(currentUser.id, {
                    emailNotifications: settings.emailNotifications,
                    appointmentReminders: settings.appointmentReminders,
                    caseUpdates: settings.caseUpdates
                });

                // Show success message
                setSaveSuccess(true);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setSaveError(t('settings.errors.saveFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageHeader
                title={t('settings.title')}
                subtitle={t('settings.subtitle')}
                breadcrumbs={[
                    { text: t('dashboard.title'), link: '/' },
                    { text: t('settings.title') }
                ]}
            />

            <form onSubmit={handleSubmit}>
                {/* App Preferences */}
                <Card sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <LanguageIcon sx={{ mr: 1 }} />
                        {t('settings.appPreferences.title')}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id="language-label">{t('settings.appPreferences.language')}</InputLabel>
                                <Select
                                    labelId="language-label"
                                    id="language"
                                    name="language"
                                    value={settings.language}
                                    label={t('settings.appPreferences.language')}
                                    onChange={handleLanguageChange}
                                >
                                    <MenuItem value="en">English</MenuItem>
                                    <MenuItem value="fr">Français</MenuItem>
                                    <MenuItem value="ar">العربية</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={mode === 'dark'}
                                        onChange={toggleMode}
                                        name="darkMode"
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <DarkModeIcon sx={{ mr: 1 }} />
                                        <Typography>{t('settings.appPreferences.darkMode')}</Typography>
                                    </Box>
                                }
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.autoSave}
                                        onChange={handleChange}
                                        name="autoSave"
                                    />
                                }
                                label={t('settings.appPreferences.autoSave')}
                            />
                        </Grid>
                    </Grid>
                </Card>

                {/* Notifications */}
                <Card sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <NotificationsIcon sx={{ mr: 1 }} />
                        {t('settings.notifications.title')}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.emailNotifications}
                                    onChange={handleChange}
                                    name="emailNotifications"
                                />
                            }
                            label={t('settings.notifications.emailNotifications')}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.appointmentReminders}
                                    onChange={handleChange}
                                    name="appointmentReminders"
                                />
                            }
                            label={t('settings.notifications.appointmentReminders')}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.caseUpdates}
                                    onChange={handleChange}
                                    name="caseUpdates"
                                />
                            }
                            label={t('settings.notifications.caseUpdates')}
                        />
                    </FormGroup>
                </Card>

                {/* Data & Privacy */}
                <Card sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <BackupIcon sx={{ mr: 1 }} />
                        {t('settings.dataPrivacy.title')}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.shareUsageData}
                                    onChange={handleChange}
                                    name="shareUsageData"
                                />
                            }
                            label={t('settings.dataPrivacy.shareUsageData')}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.storeDocumentsLocally}
                                    onChange={handleChange}
                                    name="storeDocumentsLocally"
                                />
                            }
                            label={t('settings.dataPrivacy.storeDocumentsLocally')}
                        />
                    </FormGroup>

                    <Box sx={{ mt: 2 }}>
                        <Button variant="outlined" color="primary" sx={{ mr: 2 }}>
                            {t('settings.dataPrivacy.exportData')}
                        </Button>
                        <Button variant="outlined" color="error">
                            {t('settings.dataPrivacy.deleteAccount')}
                        </Button>
                    </Box>
                </Card>

                {/* Security Settings */}
                <Card sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <SecurityIcon sx={{ mr: 1 }} />
                        {t('settings.security.title')}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.twoFactorAuth}
                                        onChange={handleChange}
                                        name="twoFactorAuth"
                                    />
                                }
                                label={t('settings.security.twoFactorAuth')}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id="timeout-label">{t('settings.security.sessionTimeout')}</InputLabel>
                                <Select
                                    labelId="timeout-label"
                                    id="sessionTimeout"
                                    name="sessionTimeout"
                                    value={settings.sessionTimeout}
                                    label={t('settings.security.sessionTimeout')}
                                    onChange={handleChange}
                                >
                                    <MenuItem value={15}>{t('settings.security.timeoutOptions.15min')}</MenuItem>
                                    <MenuItem value={30}>{t('settings.security.timeoutOptions.30min')}</MenuItem>
                                    <MenuItem value={60}>{t('settings.security.timeoutOptions.60min')}</MenuItem>
                                    <MenuItem value={120}>{t('settings.security.timeoutOptions.120min')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Button variant="outlined">
                                {t('settings.security.changePassword')}
                            </Button>
                        </Grid>
                    </Grid>
                </Card>

                {/* Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        disabled={loading}
                    >
                        {t('settings.saveButton')}
                    </Button>
                </Box>

                <Alert severity="info" sx={{ mb: 3 }}>
                    {t('settings.note')}
                </Alert>
            </form>

            {/* Success Snackbar */}
            <Snackbar
                open={saveSuccess}
                autoHideDuration={6000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
                    {t('settings.successMessage')}
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar
                open={!!saveError}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                    {saveError}
                </Alert>
            </Snackbar>
        </>
    );
};

export default SettingsPage;