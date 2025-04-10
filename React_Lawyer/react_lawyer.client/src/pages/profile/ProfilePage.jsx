// src/pages/profile/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Avatar,
    Divider,
    Alert,
    Snackbar,
    CircularProgress,
    Card,
    CardContent,
    Tabs,
    Tab,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    Person as PersonIcon,
    Save as SaveIcon,
    Edit as EditIcon,
    AccountCircle as AccountCircleIcon,
    VpnKey as VpnKeyIcon,
    Notifications as NotificationsIcon
} from '@mui/icons-material';

// Components and services
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import authService from '../../services/authService';
import userService from '../../services/userService';

// Tab panel component for tabbed interface
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`profile-tabpanel-${index}`}
            aria-labelledby={`profile-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const ProfilePage = () => {
    const { t } = useTranslation();
    const { user, updateUser } = useAuth();
    const isOnline = useOnlineStatus();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Tab state
    const [tabValue, setTabValue] = useState(0);

    // Profile form state
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        username: '',
        position: '',
        biography: '',
        title: '',
        barNumber: '',
        specializations: ''
    });

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Notification preferences state
    const [notificationPreferences, setNotificationPreferences] = useState({
        emailNotifications: true,
        appNotifications: true,
        remindersBefore: 30 // minutes
    });

    // UI state
    const [loading, setLoading] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Validation state
    const [errors, setErrors] = useState({});

    // Load user profile data on component mount
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!isOnline || !user?.id) {
                setLoading(false);
                return;
            }

            try {
                let userData = await userService.getUserProfile(user.id);


                // Initialize form with user data
                setProfile({
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email || '',
                    phoneNumber: userData.phoneNumber || '',
                    username: userData.username || '',
                    position: userData.position || '',
                    biography: userData.biography || '',
                    title: userData.title || '',
                    barNumber: userData.barNumber || '',
                    specializations: userData.specializations || ''
                });

                // Load notification preferences if available
                if (userData.notificationPreferences) {
                    setNotificationPreferences(userData.notificationPreferences);
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError(t('profile.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [user, isOnline, t]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Handle profile form input changes
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear validation errors when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Handle password form input changes
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear validation errors when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Handle notification preferences changes
    const handleNotificationChange = (e) => {
        const { name, value, checked, type } = e.target;
        setNotificationPreferences(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Enable profile editing
    const handleEnableEditing = () => {
        setEditing(true);
    };

    // Validate profile form
    const validateProfileForm = () => {
        const newErrors = {};

        if (!profile.firstName.trim()) {
            newErrors.firstName = t('validation.firstNameRequired');
        }

        if (!profile.lastName.trim()) {
            newErrors.lastName = t('validation.lastNameRequired');
        }

        if (!profile.email.trim()) {
            newErrors.email = t('validation.emailRequired');
        } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
            newErrors.email = t('validation.invalidEmail');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validate password form
    const validatePasswordForm = () => {
        const newErrors = {};

        if (!passwordForm.currentPassword) {
            newErrors.currentPassword = t('validation.currentPasswordRequired');
        }

        if (!passwordForm.newPassword) {
            newErrors.newPassword = t('validation.newPasswordRequired');
        } else if (passwordForm.newPassword.length < 8) {
            newErrors.newPassword = t('validation.passwordTooShort');
        }

        if (!passwordForm.confirmPassword) {
            newErrors.confirmPassword = t('validation.confirmPasswordRequired');
        } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            newErrors.confirmPassword = t('validation.passwordsDoNotMatch');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit profile form
    const handleSubmitProfile = async (e) => {
        e.preventDefault();

        if (!isOnline) {
            setError(t('common.offlineError'));
            return;
        }

        if (!validateProfileForm()) {
            return;
        }

        setLoadingProfile(true);
        setError('');
        setSuccess('');

        try {
            // Prepare profile data
            const profileData = {
                userId: user.id,
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                phoneNumber: profile.phoneNumber,
            };

            // Add role-specific data
            if (user.role === 'Lawyer') {
                profileData.title = profile.title;
                profileData.biography = profile.biography;
                profileData.barNumber = profile.barNumber;
                profileData.specializations = profile.specializations;
            } else if (user.role === 'Secretary' || user.role === 'Admin') {
                profileData.position = profile.position;
            }

            // Update profile
            await userService.updateUserProfile(user.id, profileData);

            // Update local user context
            updateUser({
                ...user,
                name: `${profile.firstName} ${profile.lastName}`,
                email: profile.email
            });

            setSuccess(t('profile.updateSuccess'));
            setEditing(false);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(t('profile.updateError'));
        } finally {
            setLoadingProfile(false);
        }
    };

    // Submit password form
    const handleSubmitPassword = async (e) => {
        e.preventDefault();

        if (!isOnline) {
            setError(t('common.offlineError'));
            return;
        }

        if (!validatePasswordForm()) {
            return;
        }

        setLoadingPassword(true);
        setError('');
        setSuccess('');

        try {
            // Change password
            await userService.changePassword(user.id, {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });

            setSuccess(t('profile.passwordChangeSuccess'));
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (err) {
            console.error('Error changing password:', err);
            setError(err.message || t('profile.passwordChangeError'));
        } finally {
            setLoadingPassword(false);
        }
    };

    // Submit notification preferences
    const handleSubmitNotifications = async (e) => {
        e.preventDefault();

        if (!isOnline) {
            setError(t('common.offlineError'));
            return;
        }

        setLoadingNotifications(true);
        setError('');
        setSuccess('');

        try {
            // Update notification preferences
            await userService.updateNotificationPreferences(user.id, notificationPreferences);
            setSuccess(t('profile.notificationPrefsUpdated'));
        } catch (err) {
            console.error('Error updating notification preferences:', err);
            setError(t('profile.notificationUpdateError'));
        } finally {
            setLoadingNotifications(false);
        }
    };

    // Loading indicator
    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    // User avatar and name display
    const getInitials = () => {
        return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
    };

    const getUserAvatar = () => {
        // This could be replaced with an actual avatar URL if available
        return null;
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={t('profile.myProfile')}
                subtitle={t('profile.manageYourAccount')}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('profile.profile') }
                ]}
            />

            {/* Error or success message */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Main content */}
            <Paper sx={{ mb: 4, overflow: 'hidden' }}>
                {/* Profile header */}
                <Box
                    sx={{
                        p: 3,
                        background: theme.palette.primary.main,
                        color: 'white',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'center' : 'flex-start',
                        gap: 3
                    }}
                >
                    <Avatar
                        src={getUserAvatar()}
                        sx={{
                            width: 100,
                            height: 100,
                            bgcolor: theme.palette.secondary.main,
                            fontSize: '2rem'
                        }}
                    >
                        {getInitials()}
                    </Avatar>

                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 500 }}>
                            {profile.firstName} {profile.lastName}
                        </Typography>
                        <Typography variant="subtitle1">
                            {profile.email}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                            {user?.role === 'Lawyer' ? profile.title : profile.position}
                        </Typography>
                    </Box>
                </Box>

                {/* Tabs */}
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant={isMobile ? "fullWidth" : "standard"}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab
                        icon={<AccountCircleIcon />}
                        label={t('profile.personalInfo')}
                        id="profile-tab-0"
                        aria-controls="profile-tabpanel-0"
                    />
                    <Tab
                        icon={<VpnKeyIcon />}
                        label={t('profile.changePassword')}
                        id="profile-tab-1"
                        aria-controls="profile-tabpanel-1"
                    />
                    <Tab
                        icon={<NotificationsIcon />}
                        label={t('profile.notifications')}
                        id="profile-tab-2"
                        aria-controls="profile-tabpanel-2"
                    />
                </Tabs>

                {/* Personal Info Tab */}
                <TabPanel value={tabValue} index={0}>
                    <form onSubmit={handleSubmitProfile}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('profile.firstName')}
                                    name="firstName"
                                    value={profile.firstName}
                                    onChange={handleProfileChange}
                                    required
                                    error={!!errors.firstName}
                                    helperText={errors.firstName}
                                    disabled={!editing}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('profile.lastName')}
                                    name="lastName"
                                    value={profile.lastName}
                                    onChange={handleProfileChange}
                                    required
                                    error={!!errors.lastName}
                                    helperText={errors.lastName}
                                    disabled={!editing}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('profile.email')}
                                    name="email"
                                    type="email"
                                    value={profile.email}
                                    onChange={handleProfileChange}
                                    required
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    disabled={!editing}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('profile.phoneNumber')}
                                    name="phoneNumber"
                                    value={profile.phoneNumber}
                                    onChange={handleProfileChange}
                                    disabled={!editing}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('profile.username')}
                                    name="username"
                                    value={profile.username}
                                    disabled={true} // Username cannot be changed
                                />
                            </Grid>

                            {/* Role-specific fields */}
                            {user?.role === 'Lawyer' && (
                                <>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label={t('profile.title')}
                                            name="title"
                                            value={profile.title}
                                            onChange={handleProfileChange}
                                            disabled={!editing}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label={t('profile.barNumber')}
                                            name="barNumber"
                                            value={profile.barNumber}
                                            onChange={handleProfileChange}
                                            disabled={!editing}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label={t('profile.specializations')}
                                            name="specializations"
                                            value={profile.specializations}
                                            onChange={handleProfileChange}
                                            disabled={!editing}
                                            helperText={t('profile.specializationsHelp')}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label={t('profile.biography')}
                                            name="biography"
                                            value={profile.biography}
                                            onChange={handleProfileChange}
                                            multiline
                                            rows={4}
                                            disabled={!editing}
                                        />
                                    </Grid>
                                </>
                            )}

                            {(user?.role === 'Secretary' || user?.role === 'Admin') && (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label={t('profile.position')}
                                        name="position"
                                        value={profile.position}
                                        onChange={handleProfileChange}
                                        disabled={!editing}
                                    />
                                </Grid>
                            )}

                            {/* Action buttons */}
                            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2}>
                                {!editing ? (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<EditIcon />}
                                        onClick={handleEnableEditing}
                                    >
                                        {t('profile.editProfile')}
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setEditing(false)}
                                            disabled={loadingProfile}
                                        >
                                            {t('common.cancel')}
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            color="primary"
                                            startIcon={loadingProfile ? <CircularProgress size={20} /> : <SaveIcon />}
                                            disabled={loadingProfile || !isOnline}
                                        >
                                            {loadingProfile ? t('common.saving') : t('common.save')}
                                        </Button>
                                    </>
                                )}
                            </Grid>
                        </Grid>
                    </form>
                </TabPanel>

                {/* Change Password Tab */}
                <TabPanel value={tabValue} index={1}>
                    <form onSubmit={handleSubmitPassword}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('profile.currentPassword')}
                                    name="currentPassword"
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    error={!!errors.currentPassword}
                                    helperText={errors.currentPassword}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('profile.newPassword')}
                                    name="newPassword"
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    error={!!errors.newPassword}
                                    helperText={errors.newPassword || t('profile.passwordRequirements')}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('profile.confirmPassword')}
                                    name="confirmPassword"
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    error={!!errors.confirmPassword}
                                    helperText={errors.confirmPassword}
                                />
                            </Grid>

                            {/* Action button */}
                            <Grid item xs={12} display="flex" justifyContent="flex-end">
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    startIcon={loadingPassword ? <CircularProgress size={20} /> : <SaveIcon />}
                                    disabled={loadingPassword || !isOnline}
                                >
                                    {loadingPassword ? t('common.updating') : t('profile.changePassword')}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </TabPanel>

                {/* Notification Settings Tab */}
                <TabPanel value={tabValue} index={2}>
                    <form onSubmit={handleSubmitNotifications}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    {t('profile.notificationChannels')}
                                </Typography>
                            </Grid>

                            {/* Notification preferences would be implemented here */}
                            {/* This is a placeholder for future implementation */}
                            <Grid item xs={12}>
                                <Alert severity="info">
                                    {t('profile.notificationSettingsFeature')}
                                </Alert>
                            </Grid>

                            {/* Action button */}
                            <Grid item xs={12} display="flex" justifyContent="flex-end">
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    startIcon={loadingNotifications ? <CircularProgress size={20} /> : <SaveIcon />}
                                    disabled={loadingNotifications || !isOnline}
                                >
                                    {loadingNotifications ? t('common.saving') : t('common.saveChanges')}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </TabPanel>
            </Paper>

            {/* Success notification */}
            <Snackbar
                open={!!success}
                autoHideDuration={5000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
                    {success}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ProfilePage;