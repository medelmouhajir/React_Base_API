// src/pages/firms/FirmDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    Paper,
    Tab,
    Tabs,
    TextField,
    Typography,
    Chip,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    Snackbar,
    Alert,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Business as BusinessIcon,
    PersonAdd as PersonAddIcon,
    Gavel as LawyerIcon,
    AssignmentInd as SecretaryIcon,
    SupervisorAccount as AdminIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Language as WebsiteIcon,
    Description as TaxIdIcon,
    LocationOn as LocationIcon,
    CalendarToday as CalendarIcon,
    Receipt as BillingIcon
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import firmsService from '../../services/firmsService';
import secretaryService from '../../services/secretaryService';
import lawyerService from '../../services/lawyerService';

// TabPanel component for tab content
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`firm-tabpanel-${index}`}
            aria-labelledby={`firm-tab-${index}`}
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

const FirmDetailsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const firmId = parseInt(queryParams.get('id')) || 1;

    // State management
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [tabValue, setTabValue] = useState(0);

    // Firm data state
    const [firm, setFirm] = useState(null);
    const [firmDetails, setFirmDetails] = useState(null);
    const [statistics, setStatistics] = useState(null);

    // Edit mode state
    const [editMode, setEditMode] = useState(false);
    const [editedFirm, setEditedFirm] = useState(null);

    // Staff management state
    const [lawyers, setLawyers] = useState([]);
    const [secretaries, setSecretaries] = useState([]);
    const [staffDialogOpen, setStaffDialogOpen] = useState({ type: '', open: false });
    const [newStaffMember, setNewStaffMember] = useState({});
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState({ type: '', data: null });

    // Load data on mount and when firm ID changes
    useEffect(() => {
        fetchFirmData();
    }, [firmId, location.search]);

    // Fetch all firm data
    const fetchFirmData = async () => {
        setLoading(true);
        setError('');

        try {
            // Get basic firm info
            const firmData = await firmsService.getLawFirmById(firmId);
            setFirm(firmData);
            setEditedFirm({ ...firmData });

            // Try to get detailed firm info, but continue if it fails
            try {
                const details = await firmsService.getLawFirmDetails(firmId);
                setFirmDetails(details);
                setLawyers(details.lawyers || []);
                setSecretaries(details.secretaries || []);
            } catch (detailsErr) {
                console.error('Error fetching firm details:', detailsErr);
                // We'll continue without details
            }

            // Try to get statistics, but continue if it fails
            try {
                const stats = await firmsService.getLawFirmStatistics(firmId);
                setStatistics(stats);
            } catch (statsErr) {
                console.error('Error fetching statistics:', statsErr);
                // We'll continue without statistics
            }

        } catch (err) {
            console.error('Error fetching firm data:', err);
            setError('Failed to load firm information. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Tab navigation
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Edit mode toggle
    const handleEditToggle = () => {
        if (editMode) {
            // Cancel edit
            setEditedFirm({ ...firm });
        }
        setEditMode(!editMode);
    };

    // Update form values
    const handleFirmChange = (e) => {
        const { name, value } = e.target;
        setEditedFirm(prev => ({ ...prev, [name]: value }));
    };

    // Save firm changes
    const handleSaveFirm = async () => {
        try {
            await firmsService.updateLawFirm(firmId, editedFirm);
            setFirm(editedFirm);
            setEditMode(false);
            showNotification('Firm information updated successfully', 'success');
        } catch (err) {
            console.error('Error updating firm:', err);
            showNotification('Failed to update firm information', 'error');
        }
    };

    // Staff dialog management
    const openStaffDialog = (type) => {
        // Initialize new staff member based on type
        if (type === 'lawyer') {
            setNewStaffMember({
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
            });
        } else if (type === 'secretary') {
            setNewStaffMember({
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
            });
        }
        setStaffDialogOpen({ type, open: true });
    };

    const closeStaffDialog = () => {
        setStaffDialogOpen({ type: '', open: false });
    };

    // Handle staff form changes
    const handleStaffChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewStaffMember(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Add staff member
    const handleAddStaff = async () => {
        try {
            if (staffDialogOpen.type === 'lawyer') {
                await firmsService.addLawyer(firmId, newStaffMember);
                showNotification('Lawyer added successfully', 'success');
            } else if (staffDialogOpen.type === 'secretary') {
                await firmsService.addSecretary(firmId, newStaffMember);
                showNotification('Secretary added successfully', 'success');
            }

            closeStaffDialog();
            fetchFirmData(); // Refresh data
        } catch (err) {
            console.error(`Error adding ${staffDialogOpen.type}:`, err);
            showNotification(`Failed to add ${staffDialogOpen.type}: ${err.message || ''}`, 'error');
        }
    };

    // Delete staff member
    const openDeleteDialog = (type, user) => {
        setUserToDelete({ type, data: user });
        setDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setUserToDelete({ type: '', data: null });
    };

    const handleDeleteStaff = async () => {
        try {
            if (userToDelete.type === 'lawyer') {
                await lawyerService.deleteLawyer(userToDelete.data.lawyerId);
                setLawyers(lawyers.filter(l => l.lawyerId !== userToDelete.data.lawyerId));
            } else if (userToDelete.type === 'secretary') {
                await secretaryService.deleteSecretary(userToDelete.data.secretaryId);
                setSecretaries(secretaries.filter(s => s.secretaryId !== userToDelete.data.secretaryId));
            }

            showNotification(`${userToDelete.type} deleted successfully`, 'success');
        } catch (err) {
            console.error(`Error deleting ${userToDelete.type}:`, err);
            showNotification(`Failed to delete ${userToDelete.type}`, 'error');
        } finally {
            closeDeleteDialog();
        }
    };

    // Notification helper
    const showNotification = (message, severity) => {
        setNotification({ open: true, message, severity });
    };

    const closeNotification = () => {
        setNotification({ ...notification, open: false });
    };

    // Navigation
    const handleBackToList = () => {
        navigate('/firm');
    };

    // Render loading state
    if (loading && !firm) {
        return (
            <Container maxWidth="lg">
                <PageHeader
                    title="Firm Details"
                    subtitle="Loading firm information..."
                    breadcrumbs={[
                        { text: 'Dashboard', link: '/' },
                        { text: 'Firm Management', link: '/firm' },
                        { text: 'Firm Details' }
                    ]}
                />
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    // Render error state
    if (error) {
        return (
            <Container maxWidth="lg">
                <PageHeader
                    title="Firm Details"
                    subtitle="Error loading firm information"
                    breadcrumbs={[
                        { text: 'Dashboard', link: '/' },
                        { text: 'Firm Management', link: '/firm' },
                        { text: 'Firm Details' }
                    ]}
                    action="Back to List"
                    onActionClick={handleBackToList}
                />
                <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{error}</Alert>
                <Button variant="contained" onClick={fetchFirmData}>Try Again</Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={firm?.name || 'Firm Details'}
                subtitle="View and manage firm information"
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Firm Management', link: '/firm' },
                    { text: firm?.name || 'Firm Details' }
                ]}
                action={editMode ? "Cancel" : "Edit Firm"}
                actionIcon={editMode ? <CancelIcon /> : <EditIcon />}
                onActionClick={handleEditToggle}
            />

            {/* Status indicator and save button */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                    label={firm?.isActive ? 'Active' : 'Inactive'}
                    color={firm?.isActive ? 'success' : 'error'}
                    variant="outlined"
                    sx={{ fontSize: '1rem', px: 1 }}
                />
                {editMode && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveFirm}
                    >
                        Save Changes
                    </Button>
                )}
            </Box>

            {/* Tabs Navigation */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab label="Firm Information" id="firm-tab-0" />
                    <Tab label="Staff" id="firm-tab-1" />
                    <Tab label="Statistics" id="firm-tab-2" />
                </Tabs>
            </Paper>

            {/* Firm Information Tab */}
            <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                    {/* General Information */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <BusinessIcon sx={{ mr: 1 }} />
                                    General Information
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        {editMode ? (
                                            <TextField
                                                fullWidth
                                                label="Firm Name"
                                                name="name"
                                                value={editedFirm.name || ''}
                                                onChange={handleFirmChange}
                                                margin="normal"
                                            />
                                        ) : (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" color="text.secondary">Firm Name</Typography>
                                                <Typography variant="body1">{firm?.name}</Typography>
                                            </Box>
                                        )}
                                    </Grid>

                                    <Grid item xs={12}>
                                        {editMode ? (
                                            <TextField
                                                fullWidth
                                                label="Address"
                                                name="address"
                                                value={editedFirm.address || ''}
                                                onChange={handleFirmChange}
                                                margin="normal"
                                            />
                                        ) : (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <LocationIcon fontSize="small" sx={{ mr: 0.5 }} /> Address
                                                </Typography>
                                                <Typography variant="body1">{firm?.address || 'No address provided'}</Typography>
                                            </Box>
                                        )}
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        {editMode ? (
                                            <TextField
                                                fullWidth
                                                label="Email"
                                                name="email"
                                                type="email"
                                                value={editedFirm.email || ''}
                                                onChange={handleFirmChange}
                                                margin="normal"
                                            />
                                        ) : (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <EmailIcon fontSize="small" sx={{ mr: 0.5 }} /> Email
                                                </Typography>
                                                <Typography variant="body1">{firm?.email || 'No email provided'}</Typography>
                                            </Box>
                                        )}
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        {editMode ? (
                                            <TextField
                                                fullWidth
                                                label="Phone Number"
                                                name="phoneNumber"
                                                value={editedFirm.phoneNumber || ''}
                                                onChange={handleFirmChange}
                                                margin="normal"
                                            />
                                        ) : (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <PhoneIcon fontSize="small" sx={{ mr: 0.5 }} /> Phone
                                                </Typography>
                                                <Typography variant="body1">{firm?.phoneNumber || 'No phone provided'}</Typography>
                                            </Box>
                                        )}
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        {editMode ? (
                                            <TextField
                                                fullWidth
                                                label="Website"
                                                name="website"
                                                value={editedFirm.website || ''}
                                                onChange={handleFirmChange}
                                                margin="normal"
                                            />
                                        ) : (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <WebsiteIcon fontSize="small" sx={{ mr: 0.5 }} /> Website
                                                </Typography>
                                                <Typography variant="body1">
                                                    {firm?.website ? (
                                                        <a href={firm.website} target="_blank" rel="noopener noreferrer">
                                                            {firm.website}
                                                        </a>
                                                    ) : (
                                                        'No website provided'
                                                    )}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        {editMode ? (
                                            <TextField
                                                fullWidth
                                                label="Tax ID"
                                                name="taxId"
                                                value={editedFirm.taxId || ''}
                                                onChange={handleFirmChange}
                                                margin="normal"
                                            />
                                        ) : (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <TaxIdIcon fontSize="small" sx={{ mr: 0.5 }} /> Tax ID
                                                </Typography>
                                                <Typography variant="body1">{firm?.taxId || 'No Tax ID provided'}</Typography>
                                            </Box>
                                        )}
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CalendarIcon fontSize="small" sx={{ mr: 0.5 }} /> Founded Date
                                            </Typography>
                                            <Typography variant="body1">
                                                {firm?.foundedDate ? new Date(firm.foundedDate).toLocaleDateString() : 'Not specified'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Subscription & Billing */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <BillingIcon sx={{ mr: 1 }} />
                                    Subscription & Billing
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary">Subscription Plan</Typography>
                                            <Box sx={{ mt: 0.5 }}>
                                                <Chip
                                                    label={firm?.subscriptionPlan || 'Trial'}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary">Expiry Date</Typography>
                                            <Typography variant="body1">
                                                {firm?.subscriptionExpiryDate
                                                    ? new Date(firm.subscriptionExpiryDate).toLocaleDateString()
                                                    : 'Not specified'}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12}>
                                        {editMode ? (
                                            <TextField
                                                fullWidth
                                                label="Billing Address"
                                                name="billingAddress"
                                                value={editedFirm.billingAddress || ''}
                                                onChange={handleFirmChange}
                                                margin="normal"
                                                multiline
                                                rows={2}
                                            />
                                        ) : (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" color="text.secondary">Billing Address</Typography>
                                                <Typography variant="body1">{firm?.billingAddress || 'Same as firm address'}</Typography>
                                            </Box>
                                        )}
                                    </Grid>

                                    <Grid item xs={12}>
                                        {editMode ? (
                                            <TextField
                                                fullWidth
                                                label="Billing Contact"
                                                name="billingContact"
                                                value={editedFirm.billingContact || ''}
                                                onChange={handleFirmChange}
                                                margin="normal"
                                            />
                                        ) : (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" color="text.secondary">Billing Contact</Typography>
                                                <Typography variant="body1">{firm?.billingContact || 'Not specified'}</Typography>
                                            </Box>
                                        )}
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* System Information */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>System Information</Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary">Created At</Typography>
                                            <Typography variant="body1">
                                                {firm?.createdAt
                                                    ? new Date(firm.createdAt).toLocaleString()
                                                    : 'Not available'}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary">Firm ID</Typography>
                                            <Typography variant="body1">{firm?.lawFirmId}</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            {/* Staff Tab */}
            <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                    {!firmDetails ? (
                        <Grid item xs={12}>
                            <Alert severity="warning" sx={{ mb: 3 }}>
                                Unable to load staff information. The server may be experiencing issues.
                            </Alert>
                        </Grid>
                    ) : (
                        <>
                            {/* Lawyers */}
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                                <LawyerIcon sx={{ mr: 1 }} />
                                                Lawyers ({lawyers?.length || 0})
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                startIcon={<PersonAddIcon />}
                                                onClick={() => openStaffDialog('lawyer')}
                                                size="small"
                                            >
                                                Add Lawyer
                                            </Button>
                                        </Box>
                                        <Divider sx={{ mb: 2 }} />

                                        {lawyers?.length > 0 ? (
                                            <List>
                                                {lawyers.map((lawyer) => (
                                                    <ListItem key={lawyer.lawyerId} divider>
                                                        <ListItemAvatar>
                                                            <Avatar>
                                                                <LawyerIcon />
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary={`${lawyer.firstName} ${lawyer.lastName}`}
                                                            secondary={
                                                                <>
                                                                    <Typography component="span" variant="body2" color="text.primary">
                                                                        {lawyer.title || 'Lawyer'}
                                                                    </Typography>
                                                                    {lawyer.barNumber && (
                                                                        <Typography component="span" variant="body2" display="block">
                                                                            Bar #: {lawyer.barNumber}
                                                                        </Typography>
                                                                    )}
                                                                    <Typography component="span" variant="body2" display="block">
                                                                        {lawyer.email}
                                                                    </Typography>
                                                                </>
                                                            }
                                                        />
                                                        <ListItemSecondaryAction>
                                                            <IconButton
                                                                edge="end"
                                                                aria-label="delete"
                                                                onClick={() => openDeleteDialog('lawyer', lawyer)}
                                                                color="error"
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </ListItemSecondaryAction>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                                                No lawyers added to this firm yet
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Secretaries */}
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                                <SecretaryIcon sx={{ mr: 1 }} />
                                                Secretaries ({secretaries?.length || 0})
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                startIcon={<PersonAddIcon />}
                                                onClick={() => openStaffDialog('secretary')}
                                                size="small"
                                            >
                                                Add Secretary
                                            </Button>
                                        </Box>
                                        <Divider sx={{ mb: 2 }} />

                                        {secretaries?.length > 0 ? (
                                            <List>
                                                {secretaries.map((secretary) => (
                                                    <ListItem key={secretary.secretaryId} divider>
                                                        <ListItemAvatar>
                                                            <Avatar>
                                                                <SecretaryIcon />
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary={`${secretary.firstName} ${secretary.lastName}`}
                                                            secondary={
                                                                <>
                                                                    <Typography component="span" variant="body2" color="text.primary">
                                                                        {secretary.position || 'Secretary'}
                                                                    </Typography>
                                                                    <Typography component="span" variant="body2" display="block">
                                                                        {secretary.email}
                                                                    </Typography>
                                                                </>
                                                            }
                                                        />
                                                        <ListItemSecondaryAction>
                                                            <IconButton
                                                                edge="end"
                                                                aria-label="delete"
                                                                onClick={() => openDeleteDialog('secretary', secretary)}
                                                                color="error"
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </ListItemSecondaryAction>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                                                No secretaries added to this firm yet
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Administrators Card */}
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                            <AdminIcon sx={{ mr: 1 }} />
                                            Administrators
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />

                                        <Typography variant="body2" color="text.secondary">
                                            System administrators with access to this firm can be managed by the system administrator.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </>
                    )}
                </Grid>
            </TabPanel>

            {/* Statistics Tab */}
            <TabPanel value={tabValue} index={2}>
                {!statistics ? (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        Unable to load statistics. The server may be experiencing issues.
                    </Alert>
                ) : (
                    <Grid container spacing={3}>
                        {/* Cases Stats */}
                        <Grid item xs={12} md={4}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Cases</Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Total Cases:</Typography>
                                        <Typography variant="body1">{statistics?.totalCases || 0}</Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Active Cases:</Typography>
                                        <Typography variant="body1">{statistics?.activeCases || 0}</Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Closed Cases:</Typography>
                                        <Typography variant="body1">{statistics?.closedCases || 0}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Clients Stats */}
                        <Grid item xs={12} md={4}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Clients</Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Total Clients:</Typography>
                                        <Typography variant="body1">{statistics?.totalClients || 0}</Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Active Clients:</Typography>
                                        <Typography variant="body1">{statistics?.activeClients || 0}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Staff Stats */}
                        <Grid item xs={12} md={4}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Staff</Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Lawyers:</Typography>
                                        <Typography variant="body1">{statistics?.lawyerCount || 0}</Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Secretaries:</Typography>
                                        <Typography variant="body1">{statistics?.secretaryCount || 0}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Additional Stats */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Other Statistics</Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <Grid container spacing={3}>
                                        <Grid item xs={6} md={3}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2" color="text.secondary">Upcoming Appointments:</Typography>
                                                <Typography variant="body1">{statistics?.upcomingAppointments || 0}</Typography>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={6} md={3}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2" color="text.secondary">Total Documents:</Typography>
                                                <Typography variant="body1">{statistics?.totalDocuments || 0}</Typography>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={6} md={3}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2" color="text.secondary">Total Invoices:</Typography>
                                                <Typography variant="body1">{statistics?.totalInvoices || 0}</Typography>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={6} md={3}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2" color="text.secondary">Outstanding Invoices:</Typography>
                                                <Typography variant="body1">{statistics?.outstandingInvoices || 0}</Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}
            </TabPanel>

            {/* Add Staff Dialog */}
            <Dialog
                open={staffDialogOpen.open}
                onClose={closeStaffDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {staffDialogOpen.type === 'lawyer' ? 'Add New Lawyer' : 'Add New Secretary'}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Username"
                                name="username"
                                value={newStaffMember.username || ''}
                                onChange={handleStaffChange}
                                fullWidth
                                required
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Email"
                                name="email"
                                type="email"
                                value={newStaffMember.email || ''}
                                onChange={handleStaffChange}
                                fullWidth
                                required
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Password"
                                name="password"
                                type="password"
                                value={newStaffMember.password || ''}
                                onChange={handleStaffChange}
                                fullWidth
                                required
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="First Name"
                                name="firstName"
                                value={newStaffMember.firstName || ''}
                                onChange={handleStaffChange}
                                fullWidth
                                required
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Last Name"
                                name="lastName"
                                value={newStaffMember.lastName || ''}
                                onChange={handleStaffChange}
                                fullWidth
                                required
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Phone"
                                name="phone"
                                value={newStaffMember.phone || ''}
                                onChange={handleStaffChange}
                                fullWidth
                                margin="normal"
                            />
                        </Grid>

                        {/* Lawyer-specific fields */}
                        {staffDialogOpen.type === 'lawyer' && (
                            <>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Bar Number"
                                        name="barNumber"
                                        value={newStaffMember.barNumber || ''}
                                        onChange={handleStaffChange}
                                        fullWidth
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Title"
                                        name="title"
                                        value={newStaffMember.title || ''}
                                        onChange={handleStaffChange}
                                        fullWidth
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Hourly Rate ($)"
                                        name="hourlyRate"
                                        type="number"
                                        value={newStaffMember.hourlyRate || ''}
                                        onChange={handleStaffChange}
                                        fullWidth
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Specializations"
                                        name="specializations"
                                        value={newStaffMember.specializations || ''}
                                        onChange={handleStaffChange}
                                        fullWidth
                                        margin="normal"
                                        placeholder="e.g., Family Law, Criminal Defense"
                                    />
                                </Grid>
                            </>
                        )}

                        {/* Secretary-specific fields */}
                        {staffDialogOpen.type === 'secretary' && (
                            <>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Position"
                                        name="position"
                                        value={newStaffMember.position || ''}
                                        onChange={handleStaffChange}
                                        fullWidth
                                        margin="normal"
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeStaffDialog}>Cancel</Button>
                    <Button
                        onClick={handleAddStaff}
                        variant="contained"
                        color="primary"
                        disabled={!newStaffMember.username || !newStaffMember.email || !newStaffMember.password || !newStaffMember.firstName || !newStaffMember.lastName}
                    >
                        Add {staffDialogOpen.type === 'lawyer' ? 'Lawyer' : 'Secretary'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={closeDeleteDialog}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this {userToDelete.type}? Their user account will be deactivated.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDeleteDialog}>Cancel</Button>
                    <Button onClick={handleDeleteStaff} color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={closeNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={closeNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default FirmDetailsPage;