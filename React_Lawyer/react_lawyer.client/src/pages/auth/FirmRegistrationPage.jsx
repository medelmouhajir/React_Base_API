// src/pages/auth/FirmRegistrationPage.jsx
import React, { useState } from 'react';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Stepper,
    Step,
    StepLabel,
    Paper,
    Grid,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Snackbar,
    Alert,
    CircularProgress,
    IconButton,
    InputAdornment,
    Avatar
} from '@mui/material';
import {
    BusinessCenter as BusinessIcon,
    Person as PersonIcon,
    Add as AddIcon,
    Gavel as LawyerIcon,
    AssignmentInd as SecretaryIcon,
    Delete as DeleteIcon,
    Visibility,
    VisibilityOff,
    ArrowForward as NextIcon,
    ArrowBack as BackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
// No longer using MUI date pickers
import firmRegistrationService from '../../services/firmRegistrationService';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const steps = ['Firm Information', 'Admin Account', 'Add Staff (Optional)', 'Confirm Registration'];

const defaultLawyer = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    barNumber: '',
    title: 'Associate',
    specializations: '',
    hourlyRate: 150
};

const defaultSecretary = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    position: 'Legal Secretary',
    canManageClients: true,
    canScheduleAppointments: true,
    canUploadDocuments: true,
    canManageBilling: false
};

const FirmRegistrationPage = () => {
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();

    // State for multi-step form
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // State for form data
    const [firmData, setFirmData] = useState({
        firmName: '',
        firmAddress: '',
        firmPhone: '',
        firmEmail: '',
        firmWebsite: '',
        firmTaxId: '',
        foundedDate: new Date().toISOString().split('T')[0] // Format as YYYY-MM-DD for input type="date"
    });

    const [adminData, setAdminData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: ''
    });

    const [lawyers, setLawyers] = useState([]);
    const [secretaries, setSecretaries] = useState([]);

    // Password visibility state
    const [showPassword, setShowPassword] = useState({
        admin: false,
        lawyers: {},
        secretaries: {}
    });

    // Validation state
    const [validationErrors, setValidationErrors] = useState({
        firm: {},
        admin: {},
        lawyers: [],
        secretaries: []
    });

    // Handle form field changes
    const handleFirmChange = (e) => {
        const { name, value } = e.target;
        setFirmData({ ...firmData, [name]: value });

        if (submitAttempted) {
            validateFirmField(name, value);
        }
    };

    const handleAdminChange = (e) => {
        const { name, value } = e.target;
        setAdminData({ ...adminData, [name]: value });

        if (submitAttempted) {
            validateAdminField(name, value);
        }
    };

    const handleDateChange = (e) => {
        setFirmData({ ...firmData, foundedDate: e.target.value });
    };

    const handleLawyerChange = (index, field, value) => {
        const updatedLawyers = [...lawyers];
        updatedLawyers[index] = { ...updatedLawyers[index], [field]: value };
        setLawyers(updatedLawyers);

        if (submitAttempted) {
            validateLawyerField(index, field, value);
        }
    };

    const handleSecretaryChange = (index, field, value) => {
        const updatedSecretaries = [...secretaries];
        updatedSecretaries[index] = { ...updatedSecretaries[index], [field]: value };
        setSecretaries(updatedSecretaries);

        if (submitAttempted) {
            validateSecretaryField(index, field, value);
        }
    };

    // Toggle password visibility
    const togglePasswordVisibility = (type, index = -1) => {
        if (type === 'admin') {
            setShowPassword({ ...showPassword, admin: !showPassword.admin });
        } else if (type === 'lawyer') {
            setShowPassword({
                ...showPassword,
                lawyers: { ...showPassword.lawyers, [index]: !showPassword.lawyers[index] }
            });
        } else if (type === 'secretary') {
            setShowPassword({
                ...showPassword,
                secretaries: { ...showPassword.secretaries, [index]: !showPassword.secretaries[index] }
            });
        }
    };

    // Add/remove lawyers and secretaries
    const addLawyer = () => {
        setLawyers([...lawyers, { ...defaultLawyer }]);
        setValidationErrors({
            ...validationErrors,
            lawyers: [...validationErrors.lawyers, {}]
        });
    };

    const removeLawyer = (index) => {
        const updatedLawyers = [...lawyers];
        updatedLawyers.splice(index, 1);
        setLawyers(updatedLawyers);

        const updatedErrors = [...validationErrors.lawyers];
        updatedErrors.splice(index, 1);
        setValidationErrors({
            ...validationErrors,
            lawyers: updatedErrors
        });
    };

    const addSecretary = () => {
        setSecretaries([...secretaries, { ...defaultSecretary }]);
        setValidationErrors({
            ...validationErrors,
            secretaries: [...validationErrors.secretaries, {}]
        });
    };

    const removeSecretary = (index) => {
        const updatedSecretaries = [...secretaries];
        updatedSecretaries.splice(index, 1);
        setSecretaries(updatedSecretaries);

        const updatedErrors = [...validationErrors.secretaries];
        updatedErrors.splice(index, 1);
        setValidationErrors({
            ...validationErrors,
            secretaries: updatedErrors
        });
    };

    // Validation functions
    const validateFirmField = (field, value) => {
        let error = '';

        switch (field) {
            case 'firmName':
                if (!value.trim()) {
                    error = 'Firm name is required';
                }
                break;
            case 'firmEmail':
                if (!value.trim()) {
                    error = 'Email is required';
                } else if (!/\S+@\S+\.\S+/.test(value)) {
                    error = 'Please enter a valid email address';
                }
                break;
            default:
                break;
        }

        setValidationErrors({
            ...validationErrors,
            firm: { ...validationErrors.firm, [field]: error }
        });

        return !error;
    };

    const validateAdminField = (field, value) => {
        let error = '';

        switch (field) {
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
                } else if (value !== adminData.password) {
                    error = 'Passwords do not match';
                }
                break;
            case 'firstName':
            case 'lastName':
                if (!value.trim()) {
                    error = `${field === 'firstName' ? 'First' : 'Last'} name is required`;
                }
                break;
            default:
                break;
        }

        setValidationErrors({
            ...validationErrors,
            admin: { ...validationErrors.admin, [field]: error }
        });

        return !error;
    };

    const validateLawyerField = (index, field, value) => {
        let error = '';

        switch (field) {
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
            case 'firstName':
            case 'lastName':
                if (!value.trim()) {
                    error = `${field === 'firstName' ? 'First' : 'Last'} name is required`;
                }
                break;
            default:
                break;
        }

        const updatedErrors = [...validationErrors.lawyers];
        updatedErrors[index] = { ...updatedErrors[index], [field]: error };

        setValidationErrors({
            ...validationErrors,
            lawyers: updatedErrors
        });

        return !error;
    };

    const validateSecretaryField = (index, field, value) => {
        let error = '';

        switch (field) {
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
            case 'firstName':
            case 'lastName':
                if (!value.trim()) {
                    error = `${field === 'firstName' ? 'First' : 'Last'} name is required`;
                }
                break;
            default:
                break;
        }

        const updatedErrors = [...validationErrors.secretaries];
        updatedErrors[index] = { ...updatedErrors[index], [field]: error };

        setValidationErrors({
            ...validationErrors,
            secretaries: updatedErrors
        });

        return !error;
    };

    // Validate each step
    const validateFirmStep = () => {
        const fields = ['firmName', 'firmEmail'];
        let isValid = true;

        fields.forEach(field => {
            const fieldIsValid = validateFirmField(field, firmData[field]);
            isValid = isValid && fieldIsValid;
        });

        return isValid;
    };

    const validateAdminStep = () => {
        const fields = ['username', 'email', 'password', 'confirmPassword', 'firstName', 'lastName'];
        let isValid = true;

        fields.forEach(field => {
            const fieldIsValid = validateAdminField(field, adminData[field]);
            isValid = isValid && fieldIsValid;
        });

        return isValid;
    };

    const validateStaffStep = () => {
        let isValid = true;

        // If there are lawyers, validate them
        if (lawyers.length > 0) {
            lawyers.forEach((lawyer, index) => {
                const requiredFields = ['username', 'email', 'password', 'firstName', 'lastName'];

                requiredFields.forEach(field => {
                    const fieldIsValid = validateLawyerField(index, field, lawyer[field]);
                    isValid = isValid && fieldIsValid;
                });
            });
        }

        // If there are secretaries, validate them
        if (secretaries.length > 0) {
            secretaries.forEach((secretary, index) => {
                const requiredFields = ['username', 'email', 'password', 'firstName', 'lastName'];

                requiredFields.forEach(field => {
                    const fieldIsValid = validateSecretaryField(index, field, secretary[field]);
                    isValid = isValid && fieldIsValid;
                });
            });
        }

        return isValid;
    };

    // Step navigation
    const handleNext = () => {
        setSubmitAttempted(true);

        let isValid = true;

        // Validate current step
        if (activeStep === 0) {
            isValid = validateFirmStep();
        } else if (activeStep === 1) {
            isValid = validateAdminStep();
        } else if (activeStep === 2) {
            isValid = validateStaffStep();
        }

        if (isValid) {
            setActiveStep(prevStep => prevStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep(prevStep => prevStep - 1);
    };

    // Final submission
    const handleSubmit = async () => {
        if (!isOnline) {
            setError('You are offline. Please check your internet connection and try again.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Prepare registration data
            const registrationData = {
                // Firm data
                firmName: firmData.firmName,
                firmAddress: firmData.firmAddress,
                firmPhone: firmData.firmPhone,
                firmEmail: firmData.firmEmail,
                firmWebsite: firmData.firmWebsite,
                firmTaxId: firmData.firmTaxId,
                foundedDate: firmData.foundedDate,
                // Admin data
                adminUsername: adminData.username,
                adminEmail: adminData.email,
                adminPassword: adminData.password,
                adminFirstName: adminData.firstName,
                adminLastName: adminData.lastName,
                adminPhone: adminData.phone,
                // Additional data
                subscriptionPlan: "Trial",
                subscriptionDuration: 2, // 2 months
                // Staff data
                lawyers: lawyers.map(lawyer => ({
                    username: lawyer.username,
                    email: lawyer.email,
                    password: lawyer.password,
                    firstName: lawyer.firstName,
                    lastName: lawyer.lastName,
                    phone: lawyer.phone,
                    barNumber: lawyer.barNumber,
                    title: lawyer.title,
                    specializations: lawyer.specializations,
                    hourlyRate: parseFloat(lawyer.hourlyRate)
                })),
                secretaries: secretaries.map(secretary => ({
                    username: secretary.username,
                    email: secretary.email,
                    password: secretary.password,
                    firstName: secretary.firstName,
                    lastName: secretary.lastName,
                    phone: secretary.phone,
                    position: secretary.position,
                    canManageClients: secretary.canManageClients,
                    canScheduleAppointments: secretary.canScheduleAppointments,
                    canUploadDocuments: secretary.canUploadDocuments,
                    canManageBilling: secretary.canManageBilling
                }))
            };

            // Call registration service
            const response = await firmRegistrationService.registerFirm(registrationData);

            setSuccess('Registration successful! You can now login with your admin account.');

            // Redirect to login after a delay
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Render form steps
    const renderFirmInfoStep = () => (
        <Box component="form" noValidate sx={{ mt: 3 }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Firm Information
                    </Typography>
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        required
                        fullWidth
                        id="firmName"
                        label="Firm Name"
                        name="firmName"
                        value={firmData.firmName}
                        onChange={handleFirmChange}
                        error={!!validationErrors.firm.firmName}
                        helperText={validationErrors.firm.firmName}
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        id="firmAddress"
                        label="Address"
                        name="firmAddress"
                        value={firmData.firmAddress}
                        onChange={handleFirmChange}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        id="firmPhone"
                        label="Phone Number"
                        name="firmPhone"
                        value={firmData.firmPhone}
                        onChange={handleFirmChange}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        fullWidth
                        id="firmEmail"
                        label="Email Address"
                        name="firmEmail"
                        type="email"
                        value={firmData.firmEmail}
                        onChange={handleFirmChange}
                        error={!!validationErrors.firm.firmEmail}
                        helperText={validationErrors.firm.firmEmail}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        id="firmWebsite"
                        label="Website"
                        name="firmWebsite"
                        placeholder="https://yourfirm.com"
                        value={firmData.firmWebsite}
                        onChange={handleFirmChange}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        id="firmTaxId"
                        label="Tax ID / EIN"
                        name="firmTaxId"
                        value={firmData.firmTaxId}
                        onChange={handleFirmChange}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        id="foundedDate"
                        label="Founded Date"
                        name="foundedDate"
                        type="date"
                        value={firmData.foundedDate}
                        onChange={handleDateChange}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<NextIcon />}
                >
                    Next
                </Button>
            </Box>
        </Box>
    );

    const renderAdminAccountStep = () => (
        <Box component="form" noValidate sx={{ mt: 3 }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Admin Account
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Create an administrator account for your law firm. This account will have full access to manage your firm.
                    </Typography>
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        value={adminData.username}
                        onChange={handleAdminChange}
                        error={!!validationErrors.admin.username}
                        helperText={validationErrors.admin.username}
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={adminData.email}
                        onChange={handleAdminChange}
                        error={!!validationErrors.admin.email}
                        helperText={validationErrors.admin.email}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type={showPassword.admin ? 'text' : 'password'}
                        id="password"
                        autoComplete="new-password"
                        value={adminData.password}
                        onChange={handleAdminChange}
                        error={!!validationErrors.admin.password}
                        helperText={validationErrors.admin.password}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => togglePasswordVisibility('admin')}
                                        edge="end"
                                    >
                                        {showPassword.admin ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirm Password"
                        type={showPassword.admin ? 'text' : 'password'}
                        id="confirmPassword"
                        autoComplete="new-password"
                        value={adminData.confirmPassword}
                        onChange={handleAdminChange}
                        error={!!validationErrors.admin.confirmPassword}
                        helperText={validationErrors.admin.confirmPassword}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => togglePasswordVisibility('admin')}
                                        edge="end"
                                    >
                                        {showPassword.admin ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        fullWidth
                        id="firstName"
                        label="First Name"
                        name="firstName"
                        autoComplete="given-name"
                        value={adminData.firstName}
                        onChange={handleAdminChange}
                        error={!!validationErrors.admin.firstName}
                        helperText={validationErrors.admin.firstName}
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
                        value={adminData.lastName}
                        onChange={handleAdminChange}
                        error={!!validationErrors.admin.lastName}
                        helperText={validationErrors.admin.lastName}
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        id="phone"
                        label="Phone Number"
                        name="phone"
                        autoComplete="tel"
                        value={adminData.phone}
                        onChange={handleAdminChange}
                    />
                </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    variant="outlined"
                    onClick={handleBack}
                    startIcon={<BackIcon />}
                >
                    Back
                </Button>
                <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<NextIcon />}
                >
                    Next
                </Button>
            </Box>
        </Box>
    );

    const renderStaffStep = () => (
        <Box component="form" noValidate sx={{ mt: 3 }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Add Staff Members (Optional)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Add lawyers and secretaries to your firm. You can also add them later after registration.
                    </Typography>
                </Grid>

                {/* Lawyers Section */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <LawyerIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Lawyers</Typography>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={addLawyer}
                            sx={{ ml: 'auto' }}
                            size="small"
                        >
                            Add Lawyer
                        </Button>
                    </Box>

                    {lawyers.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ my: 2, fontStyle: 'italic' }}>
                            No lawyers added yet.
                        </Typography>
                    ) : (
                        lawyers.map((lawyer, index) => (
                            <Paper key={index} sx={{ p: 2, mb: 3, position: 'relative' }}>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => removeLawyer(index)}
                                    sx={{ position: 'absolute', top: 8, right: 8 }}
                                >
                                    <DeleteIcon />
                                </IconButton>

                                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                    Lawyer #{index + 1}
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Username"
                                            value={lawyer.username}
                                            onChange={(e) => handleLawyerChange(index, 'username', e.target.value)}
                                            error={!!(validationErrors.lawyers[index]?.username)}
                                            helperText={validationErrors.lawyers[index]?.username}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Email"
                                            type="email"
                                            value={lawyer.email}
                                            onChange={(e) => handleLawyerChange(index, 'email', e.target.value)}
                                            error={!!(validationErrors.lawyers[index]?.email)}
                                            helperText={validationErrors.lawyers[index]?.email}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Password"
                                            type={showPassword.lawyers[index] ? 'text' : 'password'}
                                            value={lawyer.password}
                                            onChange={(e) => handleLawyerChange(index, 'password', e.target.value)}
                                            error={!!(validationErrors.lawyers[index]?.password)}
                                            helperText={validationErrors.lawyers[index]?.password}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            onClick={() => togglePasswordVisibility('lawyer', index)}
                                                            edge="end"
                                                        >
                                                            {showPassword.lawyers[index] ? <VisibilityOff /> : <Visibility />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="First Name"
                                            value={lawyer.firstName}
                                            onChange={(e) => handleLawyerChange(index, 'firstName', e.target.value)}
                                            error={!!(validationErrors.lawyers[index]?.firstName)}
                                            helperText={validationErrors.lawyers[index]?.firstName}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Last Name"
                                            value={lawyer.lastName}
                                            onChange={(e) => handleLawyerChange(index, 'lastName', e.target.value)}
                                            error={!!(validationErrors.lawyers[index]?.lastName)}
                                            helperText={validationErrors.lawyers[index]?.lastName}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Phone"
                                            value={lawyer.phone}
                                            onChange={(e) => handleLawyerChange(index, 'phone', e.target.value)}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Bar Number"
                                            value={lawyer.barNumber}
                                            onChange={(e) => handleLawyerChange(index, 'barNumber', e.target.value)}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Title"
                                            value={lawyer.title}
                                            onChange={(e) => handleLawyerChange(index, 'title', e.target.value)}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Hourly Rate ($)"
                                            type="number"
                                            value={lawyer.hourlyRate}
                                            onChange={(e) => handleLawyerChange(index, 'hourlyRate', e.target.value)}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Specializations"
                                            placeholder="e.g., Family Law, Criminal Defense, Corporate Law"
                                            value={lawyer.specializations}
                                            onChange={(e) => handleLawyerChange(index, 'specializations', e.target.value)}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))
                    )}
                </Grid>

                <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                </Grid>

                {/* Secretaries Section */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <SecretaryIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Secretaries</Typography>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={addSecretary}
                            sx={{ ml: 'auto' }}
                            size="small"
                        >
                            Add Secretary
                        </Button>
                    </Box>

                    {secretaries.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ my: 2, fontStyle: 'italic' }}>
                            No secretaries added yet.
                        </Typography>
                    ) : (
                        secretaries.map((secretary, index) => (
                            <Paper key={index} sx={{ p: 2, mb: 3, position: 'relative' }}>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => removeSecretary(index)}
                                    sx={{ position: 'absolute', top: 8, right: 8 }}
                                >
                                    <DeleteIcon />
                                </IconButton>

                                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                    Secretary #{index + 1}
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Username"
                                            value={secretary.username}
                                            onChange={(e) => handleSecretaryChange(index, 'username', e.target.value)}
                                            error={!!(validationErrors.secretaries[index]?.username)}
                                            helperText={validationErrors.secretaries[index]?.username}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Email"
                                            type="email"
                                            value={secretary.email}
                                            onChange={(e) => handleSecretaryChange(index, 'email', e.target.value)}
                                            error={!!(validationErrors.secretaries[index]?.email)}
                                            helperText={validationErrors.secretaries[index]?.email}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Password"
                                            type={showPassword.secretaries[index] ? 'text' : 'password'}
                                            value={secretary.password}
                                            onChange={(e) => handleSecretaryChange(index, 'password', e.target.value)}
                                            error={!!(validationErrors.secretaries[index]?.password)}
                                            helperText={validationErrors.secretaries[index]?.password}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            onClick={() => togglePasswordVisibility('secretary', index)}
                                                            edge="end"
                                                        >
                                                            {showPassword.secretaries[index] ? <VisibilityOff /> : <Visibility />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="First Name"
                                            value={secretary.firstName}
                                            onChange={(e) => handleSecretaryChange(index, 'firstName', e.target.value)}
                                            error={!!(validationErrors.secretaries[index]?.firstName)}
                                            helperText={validationErrors.secretaries[index]?.firstName}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Last Name"
                                            value={secretary.lastName}
                                            onChange={(e) => handleSecretaryChange(index, 'lastName', e.target.value)}
                                            error={!!(validationErrors.secretaries[index]?.lastName)}
                                            helperText={validationErrors.secretaries[index]?.lastName}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Phone"
                                            value={secretary.phone}
                                            onChange={(e) => handleSecretaryChange(index, 'phone', e.target.value)}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Position"
                                            value={secretary.position}
                                            onChange={(e) => handleSecretaryChange(index, 'position', e.target.value)}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))
                    )}
                </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    variant="outlined"
                    onClick={handleBack}
                    startIcon={<BackIcon />}
                >
                    Back
                </Button>
                <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<NextIcon />}
                >
                    Next
                </Button>
            </Box>
        </Box>
    );

    const renderConfirmationStep = () => (
        <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                        Review Your Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Please review the information you provided. Once you submit, your law firm will be registered with a trial subscription.
                    </Typography>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Firm Information
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Firm Name
                                </Typography>
                                <Typography variant="body1">
                                    {firmData.firmName}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Email
                                </Typography>
                                <Typography variant="body1">
                                    {firmData.firmEmail}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Phone
                                </Typography>
                                <Typography variant="body1">
                                    {firmData.firmPhone || 'Not provided'}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Subscription
                                </Typography>
                                <Typography variant="body1">
                                    Trial (2 months)
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Admin Account
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Name
                                </Typography>
                                <Typography variant="body1">
                                    {adminData.firstName} {adminData.lastName}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Username
                                </Typography>
                                <Typography variant="body1">
                                    {adminData.username}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Email
                                </Typography>
                                <Typography variant="body1">
                                    {adminData.email}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {lawyers.length > 0 && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                <LawyerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Lawyers
                            </Typography>
                            <Grid container spacing={2}>
                                {lawyers.map((lawyer, index) => (
                                    <Grid item xs={12} key={index}>
                                        <Typography variant="body2" color="text.secondary">
                                            Lawyer #{index + 1}
                                        </Typography>
                                        <Typography variant="body1">
                                            {lawyer.firstName} {lawyer.lastName} ({lawyer.email})
                                        </Typography>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Grid>
                )}

                {secretaries.length > 0 && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                <SecretaryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Secretaries
                            </Typography>
                            <Grid container spacing={2}>
                                {secretaries.map((secretary, index) => (
                                    <Grid item xs={12} key={index}>
                                        <Typography variant="body2" color="text.secondary">
                                            Secretary #{index + 1}
                                        </Typography>
                                        <Typography variant="body1">
                                            {secretary.firstName} {secretary.lastName} ({secretary.email})
                                        </Typography>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    variant="outlined"
                    onClick={handleBack}
                    startIcon={<BackIcon />}
                >
                    Back
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                >
                    {loading ? <CircularProgress size={24} /> : 'Register Firm'}
                </Button>
            </Box>
        </Box>
    );

    // Render the appropriate step
    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return renderFirmInfoStep();
            case 1:
                return renderAdminAccountStep();
            case 2:
                return renderStaffStep();
            case 3:
                return renderConfirmationStep();
            default:
                return 'Unknown step';
        }
    };

    return (
        <Container component="main" maxWidth="md">
            <Paper
                elevation={3}
                sx={{
                    mt: 8,
                    mb: 4,
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: '#f9f9f9'
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56 }}>
                    <BusinessIcon sx={{ fontSize: 32 }} />
                </Avatar>

                <Typography component="h1" variant="h4" gutterBottom>
                    Law Firm Registration
                </Typography>

                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Register your law firm and start managing your cases, clients, and staff
                </Typography>

                <Stepper activeStep={activeStep} alternativeLabel sx={{ width: '100%', mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {getStepContent(activeStep)}
            </Paper>

            {/* Display alert messages */}
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

export default FirmRegistrationPage;