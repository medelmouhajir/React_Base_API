// src/pages/firms/FirmDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    Grid,
    Typography,
    Divider,
    Button,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Paper,
    Link
} from '@mui/material';
import {
    Business as BusinessIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Web as WebIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
    SupervisorAccount as AdminIcon,
    PermIdentity as SecretaryIcon,
    Gavel as LawyerIcon,
    Assignment as CaseIcon,
    People as ClientIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Event as EventIcon,
    CalendarToday as CalendarIcon,
    ReceiptLong as InvoiceIcon
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DashboardCard from '../../pages/dashboard/DashboardCard';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import firmsService from '../../services/firmsService';

// TabPanel component for tabbed content
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
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const FirmDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasRole } = useAuth();
    const isOnline = useOnlineStatus();
    const isAdmin = hasRole('Admin');

    // State variables
    const [firmDetails, setFirmDetails] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    // Fetch firm details and statistics
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [detailsData, statsData] = await Promise.all([
                    firmsService.getLawFirmDetails(id),
                    firmsService.getLawFirmStatistics(id)
                ]);
                setFirmDetails(detailsData);
                setStatistics(statsData);
            } catch (error) {
                console.error('Error fetching firm data:', error);
                setError(error.message || 'Failed to fetch firm data');
            } finally {
                setLoading(false);
            }
        };

        if (isOnline && id) {
            fetchData();
        } else if (!isOnline) {
            setError('You are offline. Connect to the internet to view firm details.');
            setLoading(false);
        }
    }, [id, isOnline]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Handle edit firm
    const handleEditFirm = () => {
        navigate(`/firms/${id}/edit`);
    };

    // Handle delete firm
    const handleDeleteFirm = async () => {
        if (window.confirm('Are you sure you want to delete this firm? This action cannot be undone.')) {
            try {
                await firmsService.deleteLawFirm(id);
                navigate('/firms');
            } catch (error) {
                console.error('Error deleting firm:', error);
                setError(error.message || 'Failed to delete firm');
            }
        }
    };

    // Handle add lawyer
    const handleAddLawyer = () => {
        navigate(`/firms/${id}/lawyers/new`);
    };

    // Handle add secretary
    const handleAddSecretary = () => {
        navigate(`/firms/${id}/secretaries/new`);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    }

    if (!firmDetails) {
        return <Alert severity="warning" sx={{ m: 2 }}>Firm not found</Alert>;
    }

    const { lawFirm, lawyers, secretaries, clientCount, caseCount, recentClients, activeCases } = firmDetails;

    return (
        <>
            <PageHeader
                title={lawFirm.name}
                subtitle="Law Firm Details"
                action={isAdmin}
                actionText="Edit Firm"
                actionIcon={<EditIcon />}
                onActionClick={handleEditFirm}
                breadcrumbs={[
                    { text: 'Dashboard', link: '/' },
                    { text: 'Law Firms', link: '/firms' },
                    { text: lawFirm.name }
                ]}
            />

            {/* Firm Information Card */}
            <Card sx={{ mb: 3, p: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <Avatar
                                sx={{
                                    width: 60,
                                    height: 60,
                                    bgcolor: 'primary.main',
                                    mr: 2
                                }}
                            >
                                <BusinessIcon sx={{ fontSize: 32 }} />
                            </Avatar>
                            <Box>
                                <Typography variant="h5" component="h2" gutterBottom>
                                    {lawFirm.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Established: {new Date(lawFirm.foundedDate).toLocaleDateString()}
                                </Typography>
                            </Box>
                        </Box>

                        <List sx={{ my: 2 }}>
                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar>
                                        <LocationIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary="Address"
                                    secondary={lawFirm.address || 'Not specified'}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar>
                                        <PhoneIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary="Phone"
                                    secondary={
                                        lawFirm.phoneNumber ? (
                                            <Link href={`tel:${lawFirm.phoneNumber}`} color="inherit">
                                                {lawFirm.phoneNumber}
                                            </Link>
                                        ) : 'Not specified'
                                    }
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar>
                                        <EmailIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary="Email"
                                    secondary={
                                        lawFirm.email ? (
                                            <Link href={`mailto:${lawFirm.email}`} color="inherit">
                                                {lawFirm.email}
                                            </Link>
                                        ) : 'Not specified'
                                    }
                                />
                            </ListItem>
                            {lawFirm.website && (
                                <ListItem>
                                    <ListItemAvatar>
                                        <Avatar>
                                            <WebIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary="Website"
                                        secondary={
                                            <Link
                                                href={lawFirm.website.startsWith('http') ? lawFirm.website : `https://${lawFirm.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                color="inherit"
                                            >
                                                {lawFirm.website}
                                            </Link>
                                        }
                                    />
                                </ListItem>
                            )}
                        </List>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper' }}>
                            <Typography variant="h6" gutterBottom>
                                Subscription Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Plan</Typography>
                                    <Chip
                                        label={lawFirm.subscriptionPlan || 'Standard'}
                                        color="primary"
                                        sx={{ mt: 1 }}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                    <Chip
                                        label={lawFirm.isActive ? 'Active' : 'Inactive'}
                                        color={lawFirm.isActive ? 'success' : 'error'}
                                        sx={{ mt: 1 }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Expiry Date</Typography>
                                    <Typography variant="body1">
                                        {lawFirm.subscriptionExpiryDate ?
                                            new Date(lawFirm.subscriptionExpiryDate).toLocaleDateString() :
                                            'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Billing Contact</Typography>
                                    <Typography variant="body1">{lawFirm.billingContact || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Billing Address</Typography>
                                    <Typography variant="body1">{lawFirm.billingAddress || 'Same as office address'}</Typography>
                                </Grid>
                            </Grid>

                            {isAdmin && (
                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<EditIcon />}
                                        onClick={handleEditFirm}
                                        sx={{ mr: 1 }}
                                    >
                                        Edit Details
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={handleDeleteFirm}
                                    >
                                        Delete Firm
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Card>

            {/* Statistics Cards */}
            {statistics && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Active Cases"
                            value={statistics.activeCases}
                            icon={<CaseIcon />}
                            color="primary"
                            subtitle={`${statistics.closedCases} closed cases`}
                            onClick={() => navigate('/cases')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Active Clients"
                            value={statistics.activeClients}
                            icon={<ClientIcon />}
                            color="secondary"
                            subtitle={`${statistics.totalClients} total clients`}
                            onClick={() => navigate('/clients')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Upcoming Appointments"
                            value={statistics.upcomingAppointments}
                            icon={<EventIcon />}
                            color="warning"
                            onClick={() => navigate('/appointments')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Outstanding Invoices"
                            value={statistics.outstandingInvoices}
                            icon={<InvoiceIcon />}
                            color="error"
                            subtitle={`${statistics.totalInvoices} total invoices`}
                            onClick={() => navigate('/billing')}
                        />
                    </Grid>
                </Grid>
            )}

            {/* Tabbed Content */}
            <Card sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Lawyers" icon={<LawyerIcon />} iconPosition="start" />
                    <Tab label="Secretaries" icon={<SecretaryIcon />} iconPosition="start" />
                    <Tab label="Active Cases" icon={<CaseIcon />} iconPosition="start" />
                    <Tab label="Recent Clients" icon={<ClientIcon />} iconPosition="start" />
                </Tabs>

                {/* Lawyers Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" component="h2">
                            Lawyers ({lawyers.length})
                        </Typography>
                        {isAdmin && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={handleAddLawyer}
                            >
                                Add Lawyer
                            </Button>
                        )}
                    </Box>

                    {lawyers.length === 0 ? (
                        <Alert severity="info">No lawyers found for this firm</Alert>
                    ) : (
                        <Grid container spacing={2}>
                            {lawyers.map(lawyer => (
                                <Grid item xs={12} sm={6} md={4} key={lawyer.lawyerId}>
                                    <Card sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                                                <LawyerIcon />
                                            </Avatar>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="h6" component="h3">
                                                    {lawyer.user.firstName} {lawyer.user.lastName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {lawyer.title || 'Attorney at Law'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="body2">
                                                <strong>Bar #:</strong> {lawyer.barNumber || 'N/A'}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Email:</strong> {lawyer.user.email}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Hourly Rate:</strong> ${lawyer.hourlyRate}
                                            </Typography>
                                            {lawyer.specializations && (
                                                <Box sx={{ mt: 1 }}>
                                                    {lawyer.specializations.split(',').map((spec, index) => (
                                                        <Chip
                                                            key={index}
                                                            label={spec.trim()}
                                                            size="small"
                                                            sx={{ mr: 0.5, mb: 0.5 }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                        {isAdmin && (
                                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => navigate(`/lawyers/${lawyer.lawyerId}`)}
                                                >
                                                    <PersonIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => navigate(`/lawyers/${lawyer.lawyerId}/edit`)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </TabPanel>

                {/* Secretaries Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" component="h2">
                            Secretaries ({secretaries.length})
                        </Typography>
                        {isAdmin && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={handleAddSecretary}
                            >
                                Add Secretary
                            </Button>
                        )}
                    </Box>

                    {secretaries.length === 0 ? (
                        <Alert severity="info">No secretaries found for this firm</Alert>
                    ) : (
                        <Grid container spacing={2}>
                            {secretaries.map(secretary => (
                                <Grid item xs={12} sm={6} md={4} key={secretary.secretaryId}>
                                    <Card sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                                                <SecretaryIcon />
                                            </Avatar>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="h6" component="h3">
                                                    {secretary.user.firstName} {secretary.user.lastName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {secretary.position || 'Legal Secretary'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="body2">
                                                <strong>Email:</strong> {secretary.user.email}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Joined:</strong> {new Date(secretary.joinDate).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="body2"><strong>Permissions:</strong></Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                {secretary.canManageClients && (
                                                    <Chip label="Manage Clients" size="small" color="info" />
                                                )}
                                                {secretary.canScheduleAppointments && (
                                                    <Chip label="Schedule Appointments" size="small" color="info" />
                                                )}
                                                {secretary.canUploadDocuments && (
                                                    <Chip label="Upload Documents" size="small" color="info" />
                                                )}
                                                {secretary.canManageBilling && (
                                                    <Chip label="Manage Billing" size="small" color="info" />
                                                )}
                                            </Box>
                                        </Box>
                                        {isAdmin && (
                                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => navigate(`/secretaries/${secretary.secretaryId}`)}
                                                >
                                                    <PersonIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => navigate(`/secretaries/${secretary.secretaryId}/edit`)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </TabPanel>

                {/* Active Cases Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" component="h2">
                            Active Cases
                        </Typography>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => navigate('/cases')}
                        >
                            View All Cases
                        </Button>
                    </Box>

                    {activeCases.length === 0 ? (
                        <Alert severity="info">No active cases found for this firm</Alert>
                    ) : (
                        <Grid container spacing={2}>
                            {activeCases.map(caseItem => (
                                <Grid item xs={12} key={caseItem.caseId}>
                                    <Card
                                        sx={{
                                            p: 2,
                                            cursor: 'pointer',
                                            '&:hover': { boxShadow: 4 }
                                        }}
                                        onClick={() => navigate(`/cases/${caseItem.caseId}`)}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                                                <CaseIcon />
                                            </Avatar>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="h6" component="h3">
                                                    {caseItem.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Case #: {caseItem.caseNumber} | Status: <Chip
                                                        label={caseItem.status}
                                                        size="small"
                                                        color={
                                                            caseItem.status === 'Intake' ? 'default' :
                                                                caseItem.status === 'Active' ? 'primary' :
                                                                    caseItem.status === 'Pending' ? 'warning' :
                                                                        'default'
                                                        }
                                                    />
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" display="block" textAlign="right">
                                                    Opened: {new Date(caseItem.openDate).toLocaleDateString()}
                                                </Typography>
                                                {caseItem.nextHearingDate && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                        <CalendarIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                        <Typography variant="caption">
                                                            Next Hearing: {new Date(caseItem.nextHearingDate).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </TabPanel>

                {/* Recent Clients Tab */}
                <TabPanel value={tabValue} index={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" component="h2">
                            Recent Clients
                        </Typography>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => navigate('/clients')}
                        >
                            View All Clients
                        </Button>
                    </Box>

                    {recentClients.length === 0 ? (
                        <Alert severity="info">No clients found for this firm</Alert>
                    ) : (
                        <Grid container spacing={2}>
                            {recentClients.map(client => (
                                <Grid item xs={12} sm={6} key={client.clientId}>
                                    <Card
                                        sx={{
                                            p: 2,
                                            cursor: 'pointer',
                                            '&:hover': { boxShadow: 4 }
                                        }}
                                        onClick={() => navigate(`/clients/${client.clientId}`)}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                                                <ClientIcon />
                                            </Avatar>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="h6" component="h3">
                                                    {client.firstName} {client.lastName}
                                                </Typography>
                                                {client.companyName && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {client.companyName}
                                                    </Typography>
                                                )}
                                                <Box sx={{ display: 'flex', mt: 1 }}>
                                                    {client.email && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                                            <EmailIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                            <Typography variant="body2">{client.email}</Typography>
                                                        </Box>
                                                    )}
                                                    {client.phoneNumber && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <PhoneIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                            <Typography variant="body2">{client.phoneNumber}</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                            <Chip
                                                label={client.type || 'Individual'}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </TabPanel>
            </Card>
        </>
    );
};

export default FirmDetailsPage;