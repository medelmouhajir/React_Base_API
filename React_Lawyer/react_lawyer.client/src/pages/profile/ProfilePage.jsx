import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    Grid,
    TextField,
    Button,
    Typography,
    Divider,
    CircularProgress,
    Alert,
    Snackbar,
    Avatar
} from '@mui/material';
import {
    Save as SaveIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const isOnline = useOnlineStatus();

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        username: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // UI state
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    // Fetch profile data
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                const response = await fetch(`/api/Users/${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch profile data');
                }

                const userData = await response.json();

                setFormData({
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email || '',
                    phoneNumber: userData.phoneNumber || '',
                    username: userData.username || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } catch (err) {
                setError('Failed to load profile. Please try again later.');
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [user]);

    // Handle form changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear validation errors as user types
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};

        // Basic validation for required fields
        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
        if (!formData.email.trim()) errors.email = 'Email is required';
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Password validation (only if user is trying to change password)
        if (formData.newPassword) {
            if (!formData.currentPassword) {
                errors.currentPassword = 'Current password is required to set new password';
            }
            if (formData.newPassword.length < 6) {
                errors.newPassword = 'Password must be at least 6 characters';
            }
            if (formData.newPassword !== formData.confirmPassword) {
                errors.confirmPassword = 'Passwords do not match';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isOnline) {
            setError('You are offline. Please check your connection and try again.');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        setError('');

        try {
            // Prepare data for API
            const updateData = {
                userId: user.id,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                username: formData.username,
                // Only include password fields if user is changing password
                ...(formData.newPassword && {
                    passwordHash: formData.newPassword // Backend will hash this
                })
            };

            const response = await fetch(`/api/Users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            setSuccess('Profile updated successfully!');

            // Clear password fields
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <PageHeader
                title="My Profile"
                subtitle="View and update your account information"
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Profile' }
                ]}
            />

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Card sx={{ p: 3, mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar
                            sx={{ width: 80, height: 80, mr: 2, bgcolor: 'primary.main' }}
                        >
                            <PersonIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h5">
                                {formData.firstName} {formData.lastName}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {user?.role || 'User'}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Personal Information
                                </Typography>
                            </Grid>

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
                                    disabled={saving}
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
                                    disabled={saving}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    error={!!validationErrors.email}
                                    helperText={validationErrors.email}
                                    disabled={saving}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    disabled={true} // Username typically can't be changed
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Change Password
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Leave blank to keep your current password
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Current Password"
                                    name="currentPassword"
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    error={!!validationErrors.currentPassword}
                                    helperText={validationErrors.currentPassword}
                                    disabled={saving}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="New Password"
                                    name="newPassword"
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    error={!!validationErrors.newPassword}
                                    helperText={validationErrors.newPassword}
                                    disabled={saving}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Confirm New Password"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    error={!!validationErrors.confirmPassword}
                                    helperText={validationErrors.confirmPassword}
                                    disabled={saving}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        disabled={saving || !isOnline}
                                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Card>
            )}

            {/* Success message */}
            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            </Snackbar>

            {/* Error message */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="error" onClose={() => setError('')}>
                    {error}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ProfilePage;