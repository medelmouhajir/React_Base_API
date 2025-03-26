import React, { useState } from 'react';
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
    Alert
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

const SettingsPage = () => {
    const { mode, toggleMode } = useThemeMode();

    // Mock state for settings
    const [settings, setSettings] = useState({
        // App preferences
        language: 'en',
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

    // Handle setting changes
    const handleChange = (event) => {
        const { name, value, checked } = event.target;
        setSettings({
            ...settings,
            [name]: event.target.type === 'checkbox' ? checked : value
        });
    };

    // Mock submit function
    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app, this would save settings to the server
        console.log('Settings saved:', settings);
        // Show success message
    };

    return (
        <>
            <PageHeader
                title="Settings"
                subtitle="Customize your application preferences"
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Settings' }
                ]}
            />

            <form onSubmit={handleSubmit}>
                {/* App Preferences */}
                <Card sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <LanguageIcon sx={{ mr: 1 }} />
                        Application Preferences
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id="language-label">Language</InputLabel>
                                <Select
                                    labelId="language-label"
                                    id="language"
                                    name="language"
                                    value={settings.language}
                                    label="Language"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="en">English</MenuItem>
                                    <MenuItem value="es">Spanish</MenuItem>
                                    <MenuItem value="fr">French</MenuItem>
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
                                        <Typography>Dark Mode</Typography>
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
                                label="Auto-save documents while editing"
                            />
                        </Grid>
                    </Grid>
                </Card>

                {/* Notifications */}
                <Card sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <NotificationsIcon sx={{ mr: 1 }} />
                        Notifications
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
                            label="Email notifications"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.appointmentReminders}
                                    onChange={handleChange}
                                    name="appointmentReminders"
                                />
                            }
                            label="Appointment reminders"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.caseUpdates}
                                    onChange={handleChange}
                                    name="caseUpdates"
                                />
                            }
                            label="Case status updates"
                        />
                    </FormGroup>
                </Card>

                {/* Data & Privacy */}
                <Card sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <BackupIcon sx={{ mr: 1 }} />
                        Data & Privacy
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
                            label="Share anonymous usage data to improve the application"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.storeDocumentsLocally}
                                    onChange={handleChange}
                                    name="storeDocumentsLocally"
                                />
                            }
                            label="Store documents locally for offline access"
                        />
                    </FormGroup>

                    <Box sx={{ mt: 2 }}>
                        <Button variant="outlined" color="primary" sx={{ mr: 2 }}>
                            Export My Data
                        </Button>
                        <Button variant="outlined" color="error">
                            Delete Account
                        </Button>
                    </Box>
                </Card>

                {/* Security Settings */}
                <Card sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <SecurityIcon sx={{ mr: 1 }} />
                        Security
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
                                label="Enable two-factor authentication"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id="timeout-label">Session Timeout (minutes)</InputLabel>
                                <Select
                                    labelId="timeout-label"
                                    id="sessionTimeout"
                                    name="sessionTimeout"
                                    value={settings.sessionTimeout}
                                    label="Session Timeout (minutes)"
                                    onChange={handleChange}
                                >
                                    <MenuItem value={15}>15 minutes</MenuItem>
                                    <MenuItem value={30}>30 minutes</MenuItem>
                                    <MenuItem value={60}>60 minutes</MenuItem>
                                    <MenuItem value={120}>2 hours</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Button variant="outlined">
                                Change Password
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
                        startIcon={<SaveIcon />}
                    >
                        Save Settings
                    </Button>
                </Box>

                <Alert severity="info" sx={{ mb: 3 }}>
                    This is a mock-up page. In a real application, these settings would be saved to your account.
                </Alert>
            </form>
        </>
    );
};

export default SettingsPage;